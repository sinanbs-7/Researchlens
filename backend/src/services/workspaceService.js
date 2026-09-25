import { getDb } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getUserWorkspaces(userId) {
  const db = getDb();
  const query = `
    SELECT 
      w.*,
      COUNT(DISTINCT p.id) as papers_count,
      COUNT(DISTINCT d.id) as documents_count,
      COUNT(DISTINCT n.id) as notes_count,
      COUNT(DISTINCT g.id) as gaps_count
    FROM workspaces w
    LEFT JOIN papers p ON p.workspace_id = w.id
    LEFT JOIN documents d ON d.workspace_id = w.id
    LEFT JOIN notes n ON n.workspace_id = w.id
    LEFT JOIN research_gaps g ON g.workspace_id = w.id
    WHERE w.user_id = $1
    GROUP BY w.id
    ORDER BY w.updated_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows.map(w => ({
    ...w,
    papers_count: parseInt(w.papers_count || 0, 10),
    documents_count: parseInt(w.documents_count || 0, 10),
    notes_count: parseInt(w.notes_count || 0, 10),
    gaps_count: parseInt(w.gaps_count || 0, 10)
  }));
}

export async function createWorkspace(userId, data) {
  const db = getDb();
  const { title, researchQuestion, description, researchField, keywords, preferredSourceTypes } = data;

  const result = await db.query(
    `INSERT INTO workspaces (user_id, title, research_question, description, research_field, keywords, preferred_source_types)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      title,
      researchQuestion,
      description || '',
      researchField || '',
      JSON.stringify(keywords || []),
      JSON.stringify(preferredSourceTypes || [])
    ]
  );

  return result.rows[0];
}

export async function getWorkspaceById(userId, workspaceId) {
  const db = getDb();
  const result = await db.query(
    `SELECT 
      w.*,
      COUNT(DISTINCT p.id) as papers_count,
      COUNT(DISTINCT d.id) as documents_count,
      COUNT(DISTINCT n.id) as notes_count,
      COUNT(DISTINCT g.id) as gaps_count,
      COUNT(DISTINCT a.id) as analyses_count
     FROM workspaces w
     LEFT JOIN papers p ON p.workspace_id = w.id
     LEFT JOIN documents d ON d.workspace_id = w.id
     LEFT JOIN notes n ON n.workspace_id = w.id
     LEFT JOIN research_gaps g ON g.workspace_id = w.id
     LEFT JOIN analyses a ON a.workspace_id = w.id
     WHERE w.id = $1 AND w.user_id = $2
     GROUP BY w.id`,
    [workspaceId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const w = result.rows[0];
  return {
    ...w,
    papers_count: parseInt(w.papers_count || 0, 10),
    documents_count: parseInt(w.documents_count || 0, 10),
    notes_count: parseInt(w.notes_count || 0, 10),
    gaps_count: parseInt(w.gaps_count || 0, 10),
    analyses_count: parseInt(w.analyses_count || 0, 10)
  };
}

export async function updateWorkspace(userId, workspaceId, data) {
  const db = getDb();

  // First verify ownership
  const existing = await db.query(
    'SELECT id FROM workspaces WHERE id = $1 AND user_id = $2',
    [workspaceId, userId]
  );

  if (existing.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const updates = [];
  const values = [workspaceId, userId];
  let paramIdx = 3;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIdx++}`);
    values.push(data.title);
  }
  if (data.researchQuestion !== undefined) {
    updates.push(`research_question = $${paramIdx++}`);
    values.push(data.researchQuestion);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIdx++}`);
    values.push(data.description);
  }
  if (data.researchField !== undefined) {
    updates.push(`research_field = $${paramIdx++}`);
    values.push(data.researchField);
  }
  if (data.keywords !== undefined) {
    updates.push(`keywords = $${paramIdx++}`);
    values.push(JSON.stringify(data.keywords));
  }
  if (data.preferredSourceTypes !== undefined) {
    updates.push(`preferred_source_types = $${paramIdx++}`);
    values.push(JSON.stringify(data.preferredSourceTypes));
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIdx++}`);
    values.push(data.status);
  }

  updates.push(`updated_at = NOW()`);

  const query = `
    UPDATE workspaces
    SET ${updates.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

export async function deleteWorkspace(userId, workspaceId) {
  const db = getDb();
  const result = await db.query(
    'DELETE FROM workspaces WHERE id = $1 AND user_id = $2 RETURNING id',
    [workspaceId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  return { deleted: true, id: workspaceId };
}

export async function archiveWorkspace(userId, workspaceId) {
  return updateWorkspace(userId, workspaceId, { status: 'archived' });
}
