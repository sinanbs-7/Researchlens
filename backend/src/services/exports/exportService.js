import { getDb } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function exportWorkspaceSummary(userId, workspaceId, format = 'markdown') {
  const db = getDb();
  const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (wsRes.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const workspace = wsRes.rows[0];
  const papers = (await db.query('SELECT * FROM papers WHERE workspace_id = $1 ORDER BY publication_year DESC NULLS LAST', [workspaceId])).rows;
  const analyses = (await db.query('SELECT * FROM analyses WHERE workspace_id = $1', [workspaceId])).rows;
  const gaps = (await db.query('SELECT * FROM research_gaps WHERE workspace_id = $1', [workspaceId])).rows;

  if (format === 'json') {
    return {
      workspace,
      papers,
      analyses,
      gaps,
      exportedAt: new Date().toISOString()
    };
  }

  // Markdown format
  let md = `# RESEARCH SUMMARY: ${workspace.title}\n\n`;
  md += `**Research Question:** ${workspace.research_question}\n\n`;
  if (workspace.description) md += `**Description:** ${workspace.description}\n\n`;
  if (workspace.research_field) md += `**Field:** ${workspace.research_field}\n\n`;
  md += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;
  md += `---\n\n`;

  md += `## 1. Saved Scholarly Literature (${papers.length} Sources)\n\n`;
  papers.forEach((p, idx) => {
    let authors = 'Unknown Author';
    try {
      const parsed = typeof p.authors === 'string' ? JSON.parse(p.authors) : p.authors;
      authors = parsed.map(a => a.name || a).join(', ');
    } catch (e) {}

    md += `### ${idx + 1}. ${p.title} (${p.publication_year || 'n.d.'})\n`;
    md += `- **Authors:** ${authors}\n`;
    if (p.journal_name) md += `- **Venue:** ${p.journal_name}\n`;
    if (p.doi) md += `- **DOI:** [${p.doi}](${p.doi})\n`;
    md += `- **Abstract:** ${p.abstract || 'No abstract available.'}\n\n`;
  });

  md += `## 2. Identified Potential Research Gaps (${gaps.length})\n\n`;
  if (gaps.length === 0) {
    md += `*No research gaps generated yet.*\n\n`;
  } else {
    gaps.forEach((g, idx) => {
      md += `### Gap ${idx + 1}: ${g.title}\n`;
      md += `- **Category:** ${g.category || 'General'}\n`;
      md += `- **Description:** ${g.description}\n`;
      if (g.reasoning) md += `- **Reasoning:** ${g.reasoning}\n`;
      md += `- **Context:** ${g.confidence_context || 'AI-identified gap from workspace sources.'}\n\n`;
    });
  }

  return md;
}

export async function exportEvidenceTable(userId, workspaceId, format = 'csv') {
  const db = getDb();
  const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (wsRes.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const analysesRes = await db.query(
    `SELECT a.*, p.title as paper_title, p.publication_year, d.filename as doc_filename
     FROM analyses a
     LEFT JOIN papers p ON p.id = a.paper_id
     LEFT JOIN documents d ON d.id = a.document_id
     WHERE a.workspace_id = $1`,
    [workspaceId]
  );

  const evidenceRows = [];
  for (const a of analysesRes.rows) {
    let evidenceItems = [];
    try {
      evidenceItems = typeof a.evidence === 'string' ? JSON.parse(a.evidence) : (a.evidence || []);
    } catch (e) {}

    if (evidenceItems.length === 0 && a.findings) {
      evidenceRows.push({
        paper: a.paper_title || a.doc_filename || 'Workspace Document',
        year: a.publication_year || 'N/A',
        claim: a.findings.slice(0, 150),
        evidenceSnippet: a.findings,
        pageNumber: 'N/A',
        section: 'Findings'
      });
    }

    for (const item of evidenceItems) {
      evidenceRows.push({
        paper: a.paper_title || a.doc_filename || 'Workspace Document',
        year: a.publication_year || 'N/A',
        claim: item.claim || 'Research Finding',
        evidenceSnippet: item.evidence || '',
        pageNumber: item.pageNumber ?? 'N/A',
        section: item.section || 'General'
      });
    }
  }

  if (format === 'json') {
    return evidenceRows;
  }

  if (format === 'csv') {
    const headers = ['Source Document', 'Year', 'Claim', 'Evidence Snippet', 'Page Number', 'Section'];
    const rows = evidenceRows.map(r => [
      `"${(r.paper || '').replace(/"/g, '""')}"`,
      `"${r.year}"`,
      `"${(r.claim || '').replace(/"/g, '""')}"`,
      `"${(r.evidenceSnippet || '').replace(/"/g, '""')}"`,
      `"${r.pageNumber}"`,
      `"${(r.section || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Markdown format
  let md = `# EVIDENCE TABLE: ${wsRes.rows[0].title}\n\n`;
  md += `| Source Paper | Year | Claim | Supporting Evidence | Page | Section |\n`;
  md += `| --- | --- | --- | --- | --- | --- |\n`;
  for (const r of evidenceRows) {
    md += `| ${r.paper.replace(/\|/g, '-')} | ${r.year} | ${r.claim.replace(/\|/g, '-')} | ${r.evidenceSnippet.replace(/\|/g, '-')} | ${r.pageNumber} | ${r.section} |\n`;
  }
  return md;
}

export async function exportResearchGaps(userId, workspaceId, format = 'markdown') {
  const db = getDb();
  const wsRes = await db.query('SELECT title FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (wsRes.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const gaps = (await db.query('SELECT * FROM research_gaps WHERE workspace_id = $1 ORDER BY created_at DESC', [workspaceId])).rows;

  if (format === 'json') return gaps;

  let md = `# RESEARCH GAPS REPORT: ${wsRes.rows[0].title}\n\n`;
  md += `*Generated by ResearchLens AI Evidence Engine*\n\n---\n\n`;

  if (gaps.length === 0) {
    md += `No research gaps detected yet in this workspace.\n`;
  } else {
    gaps.forEach((g, idx) => {
      md += `### ${idx + 1}. ${g.title}\n`;
      md += `- **Classification:** ${g.category.toUpperCase()}\n`;
      md += `- **Description:** ${g.description}\n`;
      if (g.reasoning) md += `- **Supporting Reasoning:** ${g.reasoning}\n`;
      md += `- **Evidence Context:** ${g.confidence_context || 'AI-identified potential research gap.'}\n\n`;
    });
  }
  return md;
}

export async function exportLiteratureReview(userId, workspaceId, format = 'markdown') {
  const db = getDb();
  const wsRes = await db.query('SELECT title, research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (wsRes.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const litRes = await db.query('SELECT * FROM literature_reviews WHERE workspace_id = $1 ORDER BY updated_at DESC LIMIT 1', [workspaceId]);
  if (litRes.rows.length === 0) {
    return `# LITERATURE REVIEW OUTLINE: ${wsRes.rows[0].title}\n\n*No outline generated yet.*`;
  }

  const review = litRes.rows[0];
  let sections = [];
  try {
    sections = typeof review.outline === 'string' ? JSON.parse(review.outline) : (review.outline || []);
  } catch (e) {}

  if (format === 'json') return review;

  let md = `# ${review.title || 'LITERATURE REVIEW OUTLINE'}\n\n`;
  md += `**Focus:** ${wsRes.rows[0].research_question}\n\n---\n\n`;

  sections.forEach((sec, idx) => {
    md += `## ${sec.heading || `Section ${idx + 1}`}\n\n`;
    if (sec.description) md += `${sec.description}\n\n`;
    if (sec.keyPoints && sec.keyPoints.length > 0) {
      md += `**Key Points:**\n`;
      sec.keyPoints.forEach(pt => {
        md += `- ${pt}\n`;
      });
      md += `\n`;
    }
  });

  return md;
}
