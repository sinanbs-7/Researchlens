import { getDb } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getWorkspaceResearchMap(userId, workspaceId) {
  const db = getDb();

  // Verify access
  const ws = await db.query('SELECT id, title FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  // Fetch papers with concepts and analyses
  const papersRes = await db.query(
    `SELECT 
      p.id, p.title, p.authors, p.publication_year, p.journal_name, p.source_type, p.metadata,
      a.key_concepts, a.research_area
     FROM papers p
     LEFT JOIN analyses a ON a.paper_id = p.id
     WHERE p.workspace_id = $1`,
    [workspaceId]
  );

  const papers = papersRes.rows;
  const nodes = [];
  const links = [];
  const nodeMap = new Set();

  const addNode = (node) => {
    if (!nodeMap.has(node.id)) {
      nodeMap.add(node.id);
      nodes.push(node);
    }
  };

  const authorMap = new Map(); // authorName -> array of paperIds
  const conceptMap = new Map(); // conceptName -> array of paperIds

  // 1. Create Paper Nodes
  for (const p of papers) {
    addNode({
      id: `paper-${p.id}`,
      originalId: p.id,
      label: p.title.length > 45 ? `${p.title.slice(0, 42)}...` : p.title,
      fullTitle: p.title,
      type: 'paper',
      year: p.publication_year,
      journal: p.journal_name,
      sourceType: p.source_type
    });

    // Parse authors
    let authors = [];
    try {
      authors = typeof p.authors === 'string' ? JSON.parse(p.authors) : (p.authors || []);
    } catch (e) {
      authors = [];
    }

    for (const a of authors.slice(0, 3)) { // Top 3 authors
      const aName = typeof a === 'string' ? a : (a.name || 'Unknown');
      if (aName && aName !== 'Unknown Author') {
        const authorId = `author-${aName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        addNode({
          id: authorId,
          label: aName,
          type: 'author'
        });

        links.push({
          source: `paper-${p.id}`,
          target: authorId,
          type: 'authored_by',
          label: 'Authored by'
        });

        if (!authorMap.has(aName)) authorMap.set(aName, []);
        authorMap.get(aName).push(p.id);
      }
    }

    // Parse concepts from analysis or paper metadata
    let concepts = [];
    if (p.key_concepts) {
      try {
        concepts = typeof p.key_concepts === 'string' ? JSON.parse(p.key_concepts) : p.key_concepts;
      } catch (e) {}
    } else if (p.metadata?.concepts) {
      concepts = p.metadata.concepts.map(c => c.name || c);
    }

    for (const c of (concepts || []).slice(0, 4)) {
      const cName = typeof c === 'string' ? c : (c.name || '');
      if (cName && cName.length > 2) {
        const conceptId = `concept-${cName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        addNode({
          id: conceptId,
          label: cName,
          type: 'concept'
        });

        links.push({
          source: `paper-${p.id}`,
          target: conceptId,
          type: 'explores_concept',
          label: 'Explores'
        });

        if (!conceptMap.has(cName)) conceptMap.set(cName, []);
        conceptMap.get(cName).push(p.id);
      }
    }
  }

  // 2. Real Paper-to-Paper Connections via Shared Concepts (>= 2 shared concepts)
  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const p1 = papers[i];
      const p2 = papers[j];

      // Check co-authorship or shared concepts
      const p1Concepts = new Set(
        ((p1.metadata?.concepts || []).map(c => c.name || c)).concat(p1.key_concepts || [])
      );
      const sharedConcepts = ((p2.metadata?.concepts || []).map(c => c.name || c))
        .concat(p2.key_concepts || [])
        .filter(c => p1Concepts.has(c));

      if (sharedConcepts.length > 0) {
        links.push({
          source: `paper-${p1.id}`,
          target: `paper-${p2.id}`,
          type: 'shared_concepts',
          label: `Shares ${sharedConcepts.length} concept(s)`
        });
      }
    }
  }

  return {
    nodes,
    links,
    stats: {
      papersCount: papers.length,
      authorsCount: authorMap.size,
      conceptsCount: conceptMap.size,
      relationshipsCount: links.length
    }
  };
}

export async function getWorkspaceTimeline(userId, workspaceId) {
  const db = getDb();

  // Verify access
  const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const result = await db.query(
    `SELECT 
      p.id, p.title, p.authors, p.publication_year, p.journal_name, p.source_type, p.doi,
      p.metadata, a.research_area, a.key_concepts, a.findings
     FROM papers p
     LEFT JOIN analyses a ON a.paper_id = p.id
     WHERE p.workspace_id = $1
     ORDER BY p.publication_year ASC NULLS LAST, p.created_at ASC`,
    [workspaceId]
  );

  const papers = result.rows;
  const yearGroups = {};

  for (const p of papers) {
    const year = p.publication_year || 'Unknown';
    if (!yearGroups[year]) {
      yearGroups[year] = {
        year,
        papers: [],
        concepts: new Set()
      };
    }

    yearGroups[year].papers.push({
      id: p.id,
      title: p.title,
      authors: typeof p.authors === 'string' ? JSON.parse(p.authors) : (p.authors || []),
      journalName: p.journal_name,
      sourceType: p.source_type,
      doi: p.doi,
      findings: p.findings
    });

    // Add concepts if present
    if (p.key_concepts) {
      try {
        const kc = typeof p.key_concepts === 'string' ? JSON.parse(p.key_concepts) : p.key_concepts;
        kc.forEach(c => yearGroups[year].concepts.add(typeof c === 'string' ? c : c.name));
      } catch (e) {}
    } else if (p.metadata?.concepts) {
      p.metadata.concepts.forEach(c => yearGroups[year].concepts.add(c.name || c));
    }
  }

  const timeline = Object.values(yearGroups).map(group => ({
    year: group.year,
    papersCount: group.papers.length,
    papers: group.papers,
    concepts: Array.from(group.concepts).slice(0, 6)
  }));

  // Sort chronological
  timeline.sort((a, b) => {
    if (a.year === 'Unknown') return 1;
    if (b.year === 'Unknown') return -1;
    return parseInt(a.year, 10) - parseInt(b.year, 10);
  });

  return {
    totalPapers: papers.length,
    yearSpan: timeline.filter(t => t.year !== 'Unknown').map(t => t.year),
    timeline
  };
}
