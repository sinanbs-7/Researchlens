import * as paperService from '../services/paperService.js';

export async function getPapers(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId;
    const papers = await paperService.getPapersByWorkspace(req.user.id, workspaceId);
    res.status(200).json({
      success: true,
      data: { papers }
    });
  } catch (error) {
    next(error);
  }
}

export async function savePaper(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId;
    const paper = await paperService.savePaperToWorkspace(req.user.id, workspaceId, req.body);
    res.status(201).json({
      success: true,
      data: { paper }
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaper(req, res, next) {
  try {
    const paper = await paperService.getPaperById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: { paper }
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePaper(req, res, next) {
  try {
    const paper = await paperService.updatePaper(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: { paper }
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePaper(req, res, next) {
  try {
    const result = await paperService.deletePaper(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const result = await paperService.updatePaperStatus(req.user.id, req.params.id, req.body.status);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function addTag(req, res, next) {
  try {
    const tag = await paperService.addTagToPaper(req.user.id, req.params.id, req.body.name);
    res.status(201).json({
      success: true,
      data: { tag }
    });
  } catch (error) {
    next(error);
  }
}

export async function removeTag(req, res, next) {
  try {
    const result = await paperService.removeTagFromPaper(req.user.id, req.params.id, req.params.tagId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
