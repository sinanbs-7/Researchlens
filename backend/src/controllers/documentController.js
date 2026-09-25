import * as documentService from '../services/documents/documentService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function uploadDocument(req, res, next) {
  try {
    const { workspaceId, paperId } = req.body;
    if (!workspaceId) {
      throw new AppError('workspaceId is required for document upload.', 400, 'VALIDATION_ERROR');
    }

    if (!req.file) {
      throw new AppError('A valid PDF file is required.', 400, 'FILE_REQUIRED');
    }

    const doc = await documentService.processAndSaveDocument(req.user.id, workspaceId, req.file, paperId);
    res.status(201).json({
      success: true,
      data: { document: doc }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req, res, next) {
  try {
    const doc = await documentService.getDocumentById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: { document: doc }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentStatus(req, res, next) {
  try {
    const doc = await documentService.getDocumentById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        processing_status: doc.processing_status,
        processing_error: doc.processing_error,
        chunks_count: doc.chunks_count
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getChunks(req, res, next) {
  try {
    const chunks = await documentService.getDocumentChunks(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: { chunks }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const result = await documentService.deleteDocument(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspaceDocuments(req, res, next) {
  try {
    const documents = await documentService.getDocumentsByWorkspace(req.user.id, req.params.workspaceId);
    res.status(200).json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    next(error);
  }
}
