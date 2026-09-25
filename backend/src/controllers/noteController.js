import * as noteService from '../services/noteService.js';

export async function getNotes(req, res, next) {
  try {
    const notes = await noteService.getNotesByWorkspace(req.user.id, req.params.workspaceId);
    res.status(200).json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    next(error);
  }
}

export async function createNote(req, res, next) {
  try {
    const note = await noteService.createNote(req.user.id, req.params.workspaceId, req.body);
    res.status(201).json({
      success: true,
      data: { note }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNote(req, res, next) {
  try {
    const note = await noteService.updateNote(req.user.id, req.params.id, req.body.content);
    res.status(200).json({
      success: true,
      data: { note }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNote(req, res, next) {
  try {
    const result = await noteService.deleteNote(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
