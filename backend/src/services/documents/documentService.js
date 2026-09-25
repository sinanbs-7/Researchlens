import fs from 'fs';
import { extractText, getDocumentProxy } from 'unpdf';
import { getDb } from '../../config/db.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import { chunkDocumentText } from '../../utils/textChunker.js';

export async function processAndSaveDocument(userId, workspaceId, file, paperId = null) {
  const db = getDb();

  // 1. Verify workspace ownership
  const ws = await db.query('SELECT id, research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  // 2. Validate file presence and non-zero size
  if (!file || !fs.existsSync(file.path)) {
    throw new AppError('No document file was received.', 400, 'FILE_MISSING');
  }

  const stats = fs.statSync(file.path);
  if (stats.size === 0) {
    fs.unlinkSync(file.path);
    throw new AppError('The uploaded PDF file is empty (0 bytes).', 400, 'EMPTY_FILE');
  }

  // 3. Create initial document record with status = 'processing'
  const docInsert = await db.query(
    `INSERT INTO documents (
      workspace_id, paper_id, filename, storage_location, 
      mime_type, file_size, processing_status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'processing')
    RETURNING *`,
    [
      workspaceId,
      paperId || null,
      file.originalname,
      file.path,
      file.mimetype,
      file.size
    ]
  );
  const document = docInsert.rows[0];

  try {
    // 4. Read PDF buffer and parse text via modern unpdf
    const fileBuffer = fs.readFileSync(file.path);
    const pdfProxy = await getDocumentProxy(new Uint8Array(fileBuffer));
    const numPages = pdfProxy.numPages || 1;

    const { text: rawExtracted } = await extractText(pdfProxy, { mergePages: true });
    const extractedText = (rawExtracted || '').trim();

    if (extractedText.length < 30) {
      throw new Error('Extracted text is too short. The PDF may be an image-only scanned document without embedded text.');
    }

    // 5. Chunk text
    const chunks = chunkDocumentText(extractedText, numPages);

    // 6. Update document record with extracted text and status 'completed'
    await db.query(
      `UPDATE documents 
       SET extracted_text = $1, processing_status = 'completed', updated_at = NOW()
       WHERE id = $2`,
      [extractedText, document.id]
    );

    // 7. Insert chunks into document_chunks
    for (const chunk of chunks) {
      await db.query(
        `INSERT INTO document_chunks (
          document_id, chunk_index, content, page_number, section_name
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          document.id,
          chunk.chunkIndex,
          chunk.content,
          chunk.pageNumber,
          chunk.sectionName
        ]
      );
    }

    logger.info(`Successfully processed PDF ${file.originalname}: ${numPages} pages, ${chunks.length} chunks.`);

    return {
      ...document,
      processing_status: 'completed',
      numPages,
      chunks_count: chunks.length,
      extracted_length: extractedText.length
    };
  } catch (err) {
    logger.error(`Failed to process PDF ${file.originalname}: ${err.message}`);
    await db.query(
      `UPDATE documents 
       SET processing_status = 'failed', processing_error = $1, updated_at = NOW()
       WHERE id = $2`,
      [err.message, document.id]
    );
    throw new AppError(`PDF Processing Failed: ${err.message}`, 422, 'PDF_PROCESSING_FAILED');
  }
}

export async function getDocumentById(userId, documentId) {
  const db = getDb();
  const query = `
    SELECT 
      d.*,
      p.title as paper_title,
      COUNT(dc.id) as chunks_count
    FROM documents d
    JOIN workspaces w ON w.id = d.workspace_id
    LEFT JOIN papers p ON p.id = d.paper_id
    LEFT JOIN document_chunks dc ON dc.document_id = d.id
    WHERE d.id = $1 AND w.user_id = $2
    GROUP BY d.id, p.title
  `;
  const result = await db.query(query, [documentId, userId]);
  if (result.rows.length === 0) {
    throw new AppError('Document not found or access denied.', 404, 'DOCUMENT_NOT_FOUND');
  }

  const doc = result.rows[0];
  return {
    ...doc,
    chunks_count: parseInt(doc.chunks_count || 0, 10)
  };
}

export async function getDocumentsByWorkspace(userId, workspaceId) {
  const db = getDb();
  const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
  if (ws.rows.length === 0) {
    throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
  }

  const query = `
    SELECT 
      d.*,
      p.title as paper_title,
      COUNT(dc.id) as chunks_count,
      COUNT(a.id) as analyses_count
    FROM documents d
    LEFT JOIN papers p ON p.id = d.paper_id
    LEFT JOIN document_chunks dc ON dc.document_id = d.id
    LEFT JOIN analyses a ON a.document_id = d.id
    WHERE d.workspace_id = $1
    GROUP BY d.id, p.title
    ORDER BY d.created_at DESC
  `;

  const result = await db.query(query, [workspaceId]);
  return result.rows.map(d => ({
    ...d,
    chunks_count: parseInt(d.chunks_count || 0, 10),
    analyses_count: parseInt(d.analyses_count || 0, 10)
  }));
}

export async function getDocumentChunks(userId, documentId) {
  const db = getDb();
  const check = await db.query(
    'SELECT d.id FROM documents d JOIN workspaces w ON w.id = d.workspace_id WHERE d.id = $1 AND w.user_id = $2',
    [documentId, userId]
  );
  if (check.rows.length === 0) {
    throw new AppError('Document not found or access denied.', 404, 'DOCUMENT_NOT_FOUND');
  }

  const result = await db.query(
    'SELECT id, document_id, chunk_index, content, page_number, section_name FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC',
    [documentId]
  );
  return result.rows;
}

export async function deleteDocument(userId, documentId) {
  const db = getDb();
  const check = await db.query(
    'SELECT d.id, d.storage_location FROM documents d JOIN workspaces w ON w.id = d.workspace_id WHERE d.id = $1 AND w.user_id = $2',
    [documentId, userId]
  );
  if (check.rows.length === 0) {
    throw new AppError('Document not found or access denied.', 404, 'DOCUMENT_NOT_FOUND');
  }

  const doc = check.rows[0];
  if (doc.storage_location && fs.existsSync(doc.storage_location)) {
    try {
      fs.unlinkSync(doc.storage_location);
    } catch (e) {
      logger.warn(`Could not delete file ${doc.storage_location}: ${e.message}`);
    }
  }

  await db.query('DELETE FROM documents WHERE id = $1', [documentId]);
  return { deleted: true, id: documentId };
}
