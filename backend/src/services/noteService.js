import { getDb } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getNotesByWorkspace(userId, workspaceId) {
  const db = getDb();
  // Verify access
  const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const query = `
    SELECT 
      n.*,
      p.title as paper_title,
      d.filename as document_filename,
      g.title as gap_title
    FROM notes n
    LEFT JOIN papers p ON p.id = n.paper_id
    LEFT JOIN documents d ON d.id = n.document_id
    LEFT JOIN research_gaps g ON g.id = n.research_gap_id
    WHERE n.workspace_id = $1 AND n.user_id = $2
    ORDER BY n.updated_at DESC
  `;

  const result = await db.query(query, [workspaceId, userId]);
  return result.rows;
}

export async function createNote(userId, workspaceId, data) {
  const db = getDb();
  const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const result = await db.query(
    `INSERT INTO notes (
      user_id, workspace_id, paper_id, document_id, evidence_id, research_gap_id, content
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      userId,
      workspaceId,
      data.paperId || null,
      data.documentId || null,
      data.evidenceId || null,
      data.researchGapId || null,
      data.content
    ]
  );

  return result.rows[0];
}

export async function updateNote(userId, noteId, content) {
  const db = getDb();
  const result = await db.query(
    `UPDATE notes 
     SET content = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [content, noteId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Note not found or access denied.', 404, 'NOTE_NOT_FOUND');
  }

  return result.rows[0];
}

export async function deleteNote(userId, noteId) {
  const db = getDb();
  const result = await db.query(
    'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
    [noteId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Note not found or access denied.', 404, 'NOTE_NOT_FOUND');
  }

  return { deleted: true, id: noteId };
}
