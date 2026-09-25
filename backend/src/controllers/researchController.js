import * as researchService from '../services/research/researchService.js';

export async function search(req, res, next) {
  try {
    const results = await researchService.searchScholarlyWorks(req.query);
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaperDetails(req, res, next) {
  try {
    const paper = await researchService.getPaperByExternalId(req.params.externalId);
    res.status(200).json({
      success: true,
      data: { paper }
    });
  } catch (error) {
    next(error);
  }
}
