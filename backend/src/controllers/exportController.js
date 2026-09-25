import * as exportService from '../services/exports/exportService.js';

export async function exportSummary(req, res, next) {
  try {
    const format = req.query.format || 'markdown';
    const content = await exportService.exportWorkspaceSummary(req.user.id, req.params.workspaceId, format);

    if (format === 'json') {
      res.status(200).json({ success: true, data: content });
    } else {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="research_summary_${req.params.workspaceId.slice(0, 8)}.md"`);
      res.send(content);
    }
  } catch (error) {
    next(error);
  }
}

export async function exportEvidence(req, res, next) {
  try {
    const format = req.query.format || 'csv';
    const content = await exportService.exportEvidenceTable(req.user.id, req.params.workspaceId, format);

    if (format === 'json') {
      res.status(200).json({ success: true, data: content });
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="evidence_table_${req.params.workspaceId.slice(0, 8)}.csv"`);
      res.send(content);
    } else {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="evidence_table_${req.params.workspaceId.slice(0, 8)}.md"`);
      res.send(content);
    }
  } catch (error) {
    next(error);
  }
}

export async function exportGaps(req, res, next) {
  try {
    const format = req.query.format || 'markdown';
    const content = await exportService.exportResearchGaps(req.user.id, req.params.workspaceId, format);

    if (format === 'json') {
      res.status(200).json({ success: true, data: content });
    } else {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="research_gaps_${req.params.workspaceId.slice(0, 8)}.md"`);
      res.send(content);
    }
  } catch (error) {
    next(error);
  }
}

export async function exportLiteratureReview(req, res, next) {
  try {
    const format = req.query.format || 'markdown';
    const content = await exportService.exportLiteratureReview(req.user.id, req.params.workspaceId, format);

    if (format === 'json') {
      res.status(200).json({ success: true, data: content });
    } else {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="literature_review_${req.params.workspaceId.slice(0, 8)}.md"`);
      res.send(content);
    }
  } catch (error) {
    next(error);
  }
}
