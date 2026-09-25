import { getDb } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getPapersByWorkspace(userId, workspaceId) {
  const db = getDb();
  
  // Verify workspace ownership
  const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const query = `
    SELECT 
      p.*,
      COALESCE(ps.status, 'to_read') as status,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL), '[]'::json
      ) as tags,
      COUNT(DISTINCT d.id) as documents_count,
      COUNT(DISTINCT a.id) as analyses_count,
      COUNT(DISTINCT n.id) as notes_count
    FROM papers p
    LEFT JOIN paper_status ps ON ps.paper_id = p.id
    LEFT JOIN paper_tags pt ON pt.paper_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    LEFT JOIN documents d ON d.paper_id = p.id
    LEFT JOIN analyses a ON a.paper_id = p.id
    LEFT JOIN notes n ON n.paper_id = p.id
    WHERE p.workspace_id = $1
    GROUP BY p.id, ps.status
    ORDER BY p.created_at DESC
  `;

  const result = await db.query(query, [workspaceId]);
  return result.rows.map(row => ({
    ...row,
    documents_count: parseInt(row.documents_count || 0, 10),
    analyses_count: parseInt(row.analyses_count || 0, 10),
    notes_count: parseInt(row.notes_count || 0, 10)
  }));
}

export async function savePaperToWorkspace(userId, workspaceId, paperData) {
  const db = getDb();

  const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  // Check if paper already saved in workspace
  if (paperData.externalId || paperData.doi) {
    const existing = await db.query(
      `SELECT id FROM papers 
       WHERE workspace_id = $1 AND (
         (external_id IS NOT NULL AND external_id = $2) OR
         (doi IS NOT NULL AND doi = $3)
       )`,
      [workspaceId, paperData.externalId || null, paperData.doi || null]
    );

    if (existing.rows.length > 0) {
      throw new AppError('This paper is already saved in this workspace.', 409, 'PAPER_ALREADY_SAVED');
    }
  }

  const result = await db.query(
    `INSERT INTO papers (
      workspace_id, external_id, title, authors, abstract, 
      publication_year, journal_name, conference_name, doi, 
      source_url, open_access_url, source_type, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      workspaceId,
      paperData.externalId || null,
      paperData.title,
      JSON.stringify(paperData.authors || []),
      paperData.abstract || '',
      paperData.publicationYear || null,
      paperData.journalName || null,
      paperData.conferenceName || null,
      paperData.doi || null,
      paperData.sourceUrl || null,
      paperData.openAccessUrl || null,
      paperData.sourceType || 'journal-article',
      JSON.stringify(paperData.metadata || {})
    ]
  );

  const paper = result.rows[0];

  // Initialize status to 'to_read'
  await db.query(
    `INSERT INTO paper_status (paper_id, status) VALUES ($1, 'to_read')
     ON CONFLICT (paper_id) DO NOTHING`,
    [paper.id]
  );

  return { ...paper, status: 'to_read', tags: [] };
}

export async function getPaperById(userId, paperId) {
  const db = getDb();
  const query = `
    SELECT 
      p.*,
      w.user_id,
      w.title as workspace_title,
      COALESCE(ps.status, 'to_read') as status,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL), '[]'::json
      ) as tags
    FROM papers p
    JOIN workspaces w ON w.id = p.workspace_id
    LEFT JOIN paper_status ps ON ps.paper_id = p.id
    LEFT JOIN paper_tags pt ON pt.paper_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.id = $1 AND w.user_id = $2
    GROUP BY p.id, w.id, ps.status
  `;

  const result = await db.query(query, [paperId, userId]);
  if (result.rows.length === 0) {
    throw new AppError('Paper not found or access denied.', 404, 'PAPER_NOT_FOUND');
  }

  const paper = result.rows[0];

  // Get associated documents
  const docs = await db.query(
    'SELECT id, filename, file_size, processing_status, created_at FROM documents WHERE paper_id = $1 ORDER BY created_at DESC',
    [paperId]
  );

  // Get associated analyses
  const analyses = await db.query(
    'SELECT * FROM analyses WHERE paper_id = $1 ORDER BY created_at DESC',
    [paperId]
  );

  // Get associated notes
  const notes = await db.query(
    'SELECT * FROM notes WHERE paper_id = $1 ORDER BY created_at DESC',
    [paperId]
  );

  return {
    ...paper,
    documents: docs.rows,
    analyses: analyses.rows,
    notes: notes.rows
  };
}

export async function updatePaper(userId, paperId, data) {
  const db = getDb();
  // Verify access
  const check = await db.query(
    'SELECT p.id FROM papers p JOIN workspaces w ON w.id = p.workspace_id WHERE p.id = $1 AND w.user_id = $2',
    [paperId, userId]
  );
  if (check.rows.length === 0) {
    throw new AppError('Paper not found or access denied.', 404, 'PAPER_NOT_FOUND');
  }

  const updates = [];
  const values = [paperId];
  let paramIdx = 2;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIdx++}`);
    values.push(data.title);
  }
  if (data.abstract !== undefined) {
    updates.push(`abstract = $${paramIdx++}`);
    values.push(data.abstract);
  }
  if (data.journalName !== undefined) {
    updates.push(`journal_name = $${paramIdx++}`);
    values.push(data.journalName);
  }
  if (data.publicationYear !== undefined) {
    updates.push(`publication_year = $${paramIdx++}`);
    values.push(data.publicationYear);
  }

  updates.push('updated_at = NOW()');

  const result = await db.query(
    `UPDATE papers SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  return result.rows[0];
}

export async function deletePaper(userId, paperId) {
  const db = getDb();
  const check = await db.query(
    'SELECT p.id FROM papers p JOIN workspaces w ON w.id = p.workspace_id WHERE p.id = $1 AND w.user_id = $2',
    [paperId, userId]
  );
  if (check.rows.length === 0) {
    throw new AppError('Paper not found or access denied.', 404, 'PAPER_NOT_FOUND');
  }

  await db.query('DELETE FROM papers WHERE id = $1', [paperId]);
  return { deleted: true, id: paperId };
}

export async function updatePaperStatus(userId, paperId, status) {
  const db = getDb();
  const check = await db.query(
    'SELECT p.id FROM papers p JOIN workspaces w ON w.id = p.workspace_id WHERE p.id = $1 AND w.user_id = $2',
    [paperId, userId]
  );
  if (check.rows.length === 0) {
    throw new AppError('Paper not found or access denied.', 404, 'PAPER_NOT_FOUND');
  }

  await db.query(
    `INSERT INTO paper_status (paper_id, status)
     VALUES ($1, $2)
     ON CONFLICT (paper_id) DO UPDATE SET status = EXCLUDED.status`,
    [paperId, status]
  );

  return { paperId, status };
}

export async function addTagToPaper(userId, paperId, tagName) {
  const db = getDb();
  const paper = await db.query(
    'SELECT p.id, p.workspace_id FROM papers p JOIN workspaces w ON w.id = p.workspace_id WHERE p.id = $1 AND w.user_id = $2',
    [paperId, userId]
  );
  if (paper.rows.length === 0) {
    throw new AppError('Paper not found or access denied.', 404, 'PAPER_NOT_FOUND');
  }

  const workspaceId = paper.rows[0].workspace_id;

  // Insert or get tag
  const tagRes = await db.query(
    `INSERT INTO tags (workspace_id, name)
     VALUES ($1, $2)
     ON CONFLICT (workspace_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [workspaceId, tagName.trim()]
  );
  const tag = tagRes.rows[0];

  // Associate tag with paper
  await db.query(
    `INSERT INTO paper_tags (paper_id, tag_id)
     VALUES ($1, $2)
     ON CONFLICT (paper_id, tag_id) DO NOTHING`,
    [paperId, tag.id]
  );

  return tag;
}

export async function removeTagFromPaper(userId, paperId, tagId) {
  const db = getDb();
  const paper = await db.query(
    'SELECT p.id FROM papers p JOIN workspaces w ON w.id = p.workspace_id WHERE p.id = $1 AND w.user_id = $2',
    [paperId, userId]
  );
  if (paper.rows.length === 0) {
    throw new AppError('Paper not found or access denied.', 404, 'PAPER_NOT_FOUND');
  }

  await db.query('DELETE FROM paper_tags WHERE paper_id = $1 AND tag_id = $2', [paperId, tagId]);
  return { removed: true, tagId };
}
