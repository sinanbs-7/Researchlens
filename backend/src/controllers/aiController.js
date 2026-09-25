import { getDb } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import * as geminiService from '../services/ai/geminiService.js';

export async function analyze(req, res, next) {
  try {
    const { workspaceId, documentId, paperId } = req.body;
    const db = getDb();

    // Verify workspace access
    const ws = await db.query('SELECT id, research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) {
      throw new AppError('Workspace not found or access denied.', 404, 'WORKSPACE_NOT_FOUND');
    }

    let documentText = '';
    let paperTitle = '';
    let paperAbstract = '';

    if (documentId) {
      const docRes = await db.query('SELECT id, filename, extracted_text, paper_id FROM documents WHERE id = $1 AND workspace_id = $2', [documentId, workspaceId]);
      if (docRes.rows.length === 0) throw new AppError('Document not found in workspace.', 404, 'DOCUMENT_NOT_FOUND');
      documentText = docRes.rows[0].extracted_text || '';
      paperTitle = docRes.rows[0].filename;
    }

    if (paperId) {
      const paperRes = await db.query('SELECT id, title, abstract FROM papers WHERE id = $1 AND workspace_id = $2', [paperId, workspaceId]);
      if (paperRes.rows.length === 0) throw new AppError('Paper not found in workspace.', 404, 'PAPER_NOT_FOUND');
      paperTitle = paperRes.rows[0].title;
      paperAbstract = paperRes.rows[0].abstract || '';
    }

    const { data: analysis, metadata } = await geminiService.analyzeDocumentOrPaper({
      documentText,
      paperTitle,
      paperAbstract,
      workspaceQuestion: ws.rows[0].research_question,
      docId: documentId,
      paperId
    });

    // Save to analyses table
    const insertRes = await db.query(
      `INSERT INTO analyses (
        workspace_id, document_id, paper_id, research_question, 
        summary, methodology, dataset_sample, findings, limitations, 
        future_work, key_concepts, research_area, evidence, raw_ai_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        workspaceId,
        documentId || null,
        paperId || null,
        analysis.researchQuestion,
        (analysis.mainFindings || []).join('; '),
        analysis.methodology,
        analysis.datasetSample,
        (analysis.mainFindings || []).join('\n\n'),
        (analysis.limitations || []).join('\n\n'),
        (analysis.futureWork || []).join('\n\n'),
        JSON.stringify(analysis.keyConcepts || []),
        analysis.researchArea,
        JSON.stringify(analysis.keyEvidence || []),
        JSON.stringify(metadata)
      ]
    );

    // If paperId provided, update status to analyzed
    if (paperId) {
      await db.query(
        `INSERT INTO paper_status (paper_id, status) VALUES ($1, 'analyzed')
         ON CONFLICT (paper_id) DO UPDATE SET status = 'analyzed'`,
        [paperId]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        analysis: insertRes.rows[0],
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalysis(req, res, next) {
  try {
    const db = getDb();
    const result = await db.query(
      `SELECT a.*, p.title as paper_title, d.filename as document_filename
       FROM analyses a
       JOIN workspaces w ON w.id = a.workspace_id
       LEFT JOIN papers p ON p.id = a.paper_id
       LEFT JOIN documents d ON d.id = a.document_id
       WHERE a.id = $1 AND w.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Analysis not found or access denied.', 404, 'ANALYSIS_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: { analysis: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
}

export async function checkRelevance(req, res, next) {
  try {
    const { workspaceId, paperId } = req.body;
    const db = getDb();

    const ws = await db.query('SELECT research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const paper = await db.query('SELECT title, abstract FROM papers WHERE id = $1 AND workspace_id = $2', [paperId, workspaceId]);
    if (paper.rows.length === 0) throw new AppError('Paper not found in workspace.', 404, 'PAPER_NOT_FOUND');

    const { data: relevance, metadata } = await geminiService.calculatePaperRelevance({
      paperTitle: paper.rows[0].title,
      paperAbstract: paper.rows[0].abstract,
      workspaceQuestion: ws.rows[0].research_question
    });

    // Update paper with relevance analysis
    await db.query(
      'UPDATE papers SET relevance_analysis = $1 WHERE id = $2',
      [JSON.stringify(relevance), paperId]
    );

    res.status(200).json({
      success: true,
      data: { relevance, metadata }
    });
  } catch (error) {
    next(error);
  }
}

export async function askQuestion(req, res, next) {
  try {
    const { workspaceId, question } = req.body;
    const db = getDb();

    const ws = await db.query('SELECT research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    // Retrieve papers in this workspace
    const papers = (await db.query('SELECT id, title, abstract, publication_year FROM papers WHERE workspace_id = $1 LIMIT 15', [workspaceId])).rows;

    // Retrieve relevant chunks from documents in this workspace
    const chunks = (await db.query(
      `SELECT dc.id, dc.document_id, dc.content, dc.page_number, dc.section_name 
       FROM document_chunks dc
       JOIN documents d ON d.id = dc.document_id
       WHERE d.workspace_id = $1
       ORDER BY dc.created_at ASC
       LIMIT 10`,
      [workspaceId]
    )).rows;

    const { data: answerData, metadata } = await geminiService.answerSourceGroundedQuestion({
      question,
      workspaceQuestion: ws.rows[0].research_question,
      sources: papers,
      contextChunks: chunks
    });

    // Store in ai_queries
    const insertQuery = await db.query(
      `INSERT INTO ai_queries (
        user_id, workspace_id, question, answer, sources, 
        source_supported_points, ai_interpretation, missing_evidence, response_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.user.id,
        workspaceId,
        question,
        answerData.answer,
        JSON.stringify(papers.map(p => ({ id: p.id, title: p.title }))),
        JSON.stringify(answerData.sourceSupportedPoints || []),
        JSON.stringify(answerData.aiInterpretation || []),
        JSON.stringify(answerData.missingEvidence || []),
        'source_grounded_qa'
      ]
    );

    res.status(200).json({
      success: true,
      data: {
        ...answerData,
        queryRecord: insertQuery.rows[0],
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function compare(req, res, next) {
  try {
    const { workspaceId, paperIds } = req.body;
    const db = getDb();

    const ws = await db.query('SELECT research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const papersRes = await db.query(
      'SELECT id, title, abstract, publication_year, journal_name, source_type FROM papers WHERE id = ANY($1) AND workspace_id = $2',
      [paperIds, workspaceId]
    );

    if (papersRes.rows.length < 2) {
      throw new AppError('Select at least 2 valid papers from your workspace to compare.', 400, 'INSUFFICIENT_PAPERS');
    }

    const { data: comparisonData, metadata } = await geminiService.comparePapers({
      papers: papersRes.rows,
      workspaceQuestion: ws.rows[0].research_question
    });

    res.status(200).json({
      success: true,
      data: {
        ...comparisonData,
        papers: papersRes.rows,
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function conflicts(req, res, next) {
  try {
    const { workspaceId, paperIds } = req.body;
    const db = getDb();

    const ws = await db.query('SELECT research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    let papersQuery = 'SELECT id, title, abstract, publication_year, source_type FROM papers WHERE workspace_id = $1';
    let queryParams = [workspaceId];

    if (paperIds && paperIds.length > 0) {
      papersQuery += ' AND id = ANY($2)';
      queryParams.push(paperIds);
    }
    papersQuery += ' LIMIT 10';

    const papers = (await db.query(papersQuery, queryParams)).rows;
    if (papers.length === 0) {
      throw new AppError('No papers available in workspace to analyze for agreement or conflicts.', 400, 'NO_PAPERS');
    }

    const { data: conflictData, metadata } = await geminiService.analyzeAgreementAndConflicts({
      papers,
      workspaceQuestion: ws.rows[0].research_question
    });

    res.status(200).json({
      success: true,
      data: {
        ...conflictData,
        papersCount: papers.length,
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function gaps(req, res, next) {
  try {
    const { workspaceId } = req.body;
    const db = getDb();

    const ws = await db.query('SELECT research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const papers = (await db.query('SELECT id, title, abstract, publication_year FROM papers WHERE workspace_id = $1 LIMIT 15', [workspaceId])).rows;
    if (papers.length === 0) {
      throw new AppError('Save at least one paper or document to your workspace to detect research gaps.', 400, 'NO_SOURCES');
    }

    const { data: gapsData, metadata } = await geminiService.detectResearchGaps({
      papers,
      workspaceQuestion: ws.rows[0].research_question
    });

    // Save gaps to research_gaps table
    const savedGaps = [];
    for (const g of gapsData.gaps) {
      const resGap = await db.query(
        `INSERT INTO research_gaps (
          workspace_id, title, description, category, supporting_sources, confidence_context, reasoning
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          workspaceId,
          g.title,
          g.description,
          g.category,
          JSON.stringify(g.supportingSourceIds || []),
          g.confidenceContext || 'AI-identified potential research gap.',
          g.reasoning || ''
        ]
      );
      savedGaps.push(resGap.rows[0]);
    }

    res.status(200).json({
      success: true,
      data: {
        gaps: savedGaps,
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function literatureOutline(req, res, next) {
  try {
    const { workspaceId } = req.body;
    const db = getDb();

    const ws = await db.query('SELECT research_question FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const papers = (await db.query('SELECT id, title, publication_year FROM papers WHERE workspace_id = $1', [workspaceId])).rows;
    const gaps = (await db.query('SELECT id, title, description FROM research_gaps WHERE workspace_id = $1', [workspaceId])).rows;

    const { data: outlineData, metadata } = await geminiService.generateLiteratureReviewOutline({
      workspaceQuestion: ws.rows[0].research_question,
      papers,
      gaps
    });

    // Save or update in literature_reviews table
    const reviewRes = await db.query(
      `INSERT INTO literature_reviews (workspace_id, title, outline)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        workspaceId,
        outlineData.title,
        JSON.stringify(outlineData.sections)
      ]
    );

    res.status(200).json({
      success: true,
      data: {
        review: reviewRes.rows[0],
        sections: outlineData.sections,
        title: outlineData.title,
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getExistingGaps(req, res, next) {
  try {
    const db = getDb();
    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [req.params.workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const gaps = (await db.query('SELECT * FROM research_gaps WHERE workspace_id = $1 ORDER BY created_at DESC', [req.params.workspaceId])).rows;
    res.status(200).json({
      success: true,
      data: { gaps }
    });
  } catch (error) {
    next(error);
  }
}

export async function getExistingLiteratureReview(req, res, next) {
  try {
    const db = getDb();
    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [req.params.workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const reviewRes = await db.query('SELECT * FROM literature_reviews WHERE workspace_id = $1 ORDER BY updated_at DESC LIMIT 1', [req.params.workspaceId]);
    if (reviewRes.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { review: null }
      });
    }

    const review = reviewRes.rows[0];
    res.status(200).json({
      success: true,
      data: {
        review: {
          ...review,
          outline: typeof review.outline === 'string' ? JSON.parse(review.outline) : review.outline
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLiteratureReview(req, res, next) {
  try {
    const db = getDb();
    const { title, outline } = req.body;
    const ws = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [req.params.workspaceId, req.user.id]);
    if (ws.rows.length === 0) throw new AppError('Workspace not found.', 404, 'WORKSPACE_NOT_FOUND');

    const reviewRes = await db.query(
      `UPDATE literature_reviews
       SET title = $1, outline = $2, updated_at = NOW()
       WHERE workspace_id = $3
       RETURNING *`,
      [title, JSON.stringify(outline), req.params.workspaceId]
    );

    res.status(200).json({
      success: true,
      data: { review: reviewRes.rows[0] }
    });
  } catch (error) {
    next(error);
  }
}
