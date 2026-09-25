import * as mapService from '../services/mapService.js';

export async function getResearchMap(req, res, next) {
  try {
    const data = await mapService.getWorkspaceResearchMap(req.user.id, req.params.workspaceId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

export async function getTimeline(req, res, next) {
  try {
    const data = await mapService.getWorkspaceTimeline(req.user.id, req.params.workspaceId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}
