import * as workspaceService from '../services/workspaceService.js';

export async function getWorkspaces(req, res, next) {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.user.id);
    res.status(200).json({
      success: true,
      data: { workspaces }
    });
  } catch (error) {
    next(error);
  }
}

export async function createWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.createWorkspace(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.updateWorkspace(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkspace(req, res, next) {
  try {
    const result = await workspaceService.deleteWorkspace(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.archiveWorkspace(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
}
