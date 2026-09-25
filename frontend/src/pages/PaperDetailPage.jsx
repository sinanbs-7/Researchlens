import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  FileText,
  BookOpen,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';

export function PaperDetailPage() {
  const { workspaceId, paperId } = useParams();
  const { currentWorkspace, refreshCurrentWorkspace } = useWorkspace();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluatingRelevance, setEvaluatingRelevance] = useState(false);
  const [relevance, setRelevance] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const loadPaper = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/papers/${paperId}`);
      if (data?.paper) {
        setPaper(data.paper);
        if (data.paper.relevance_analysis) {
          const parsedRel = typeof data.paper.relevance_analysis === 'string'
            ? JSON.parse(data.paper.relevance_analysis)
            : data.paper.relevance_analysis;
          setRelevance(parsedRel);
        }
        if (data.paper.analyses && data.paper.analyses.length > 0) {
          setAnalysis(data.paper.analyses[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load paper details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaper();
  }, [paperId]);

  const handleEvaluateRelevance = async () => {
    setEvaluatingRelevance(true);
    setError(null);
    try {
      const data = await api.post('/ai/relevance', {
        workspaceId,
        paperId
      });
      setRelevance(data?.relevance);
      await refreshCurrentWorkspace();
    } catch (err) {
      setError(err.message || 'Relevance evaluation failed.');
    } finally {
      setEvaluatingRelevance(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await api.post('/ai/analyze', {
        workspaceId,
        paperId
      });
      setAnalysis(data?.analysis);
      await loadPaper();
      await refreshCurrentWorkspace();
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading paper metadata and evidence..." size="lg" />;
  }

  if (!paper) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Paper not found or access denied.</p>
        <Link to={`/workspaces/${workspaceId}/library`} className="text-blue-600 font-semibold mt-2 inline-block">
          Return to Library
        </Link>
      </div>
    );
  }

  let authorsStr = 'Unknown Author';
  try {
    const parsed = typeof paper.authors === 'string' ? JSON.parse(paper.authors) : paper.authors;
    authorsStr = parsed.map(a => a.name || a).join(', ');
  } catch (e) {}

  let evidenceItems = [];
  if (analysis?.evidence) {
    try {
      evidenceItems = typeof analysis.evidence === 'string' ? JSON.parse(analysis.evidence) : analysis.evidence;
    } catch (e) {}
  }

  let keyConcepts = [];
  if (analysis?.key_concepts) {
    try {
      keyConcepts = typeof analysis.key_concepts === 'string' ? JSON.parse(analysis.key_concepts) : analysis.key_concepts;
    } catch (e) {}
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Navigation */}
      <div>
        <Link
          to={`/workspaces/${workspaceId}/library`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
      </div>

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Main Paper Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={paper.status === 'analyzed' ? 'success' : 'primary'}>
            Status: {paper.status || 'to_read'}
          </Badge>
          {paper.publication_year && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Year {paper.publication_year}
            </span>
          )}
          {paper.source_type && (
            <Badge variant="default">{paper.source_type}</Badge>
          )}
          {paper.open_access_url && (
            <Badge variant="success">Open Access Available</Badge>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {paper.title}
        </h1>

        <p className="text-sm font-medium text-slate-700 mt-2">
          {authorsStr}
        </p>

        {paper.journal_name && (
          <p className="text-xs text-slate-500 mt-1 italic">
            Published in: {paper.journal_name}
          </p>
        )}

        {/* Links and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-100">
          {paper.doi && (
            <a
              href={paper.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
            >
              <span>View Source DOI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {paper.open_access_url && (
            <a
              href={paper.open_access_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
            >
              <span>Download Open Access PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            loading={evaluatingRelevance}
            onClick={handleEvaluateRelevance}
          >
            Assess Relevance
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={ShieldCheck}
            loading={analyzing}
            onClick={handleRunAnalysis}
          >
            {analysis ? 'Re-run AI Analysis' : 'Run Structured AI Analysis'}
          </Button>
        </div>
      </div>

      {/* Relevance Evaluation Banner */}
      {relevance && (
        <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] text-blue-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              AI-Estimated Relevance Assessment
            </span>
            <Badge
              variant={
                relevance.relevanceLevel === 'high' ? 'success' :
                relevance.relevanceLevel === 'medium' ? 'primary' :
                relevance.relevanceLevel === 'low' ? 'warning' : 'default'
              }
            >
              {relevance.relevanceLevel.toUpperCase()} RELEVANCE
            </Badge>
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">{relevance.reason}</p>
          {relevance.matchingConcepts && relevance.matchingConcepts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-slate-500 font-medium">Matching concepts:</span>
              {relevance.matchingConcepts.map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200 text-[11px] font-semibold">
                  {c}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 italic">
            *AI-estimated assessment based on workspace research question, not objective scientific score.
          </p>
        </div>
      )}

      {/* Abstract */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Scholarly Abstract</h3>
        <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
          {paper.abstract || 'No abstract available for this study.'}
        </p>
      </div>

      {/* Structured AI Analysis Section */}
      {analysis ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Evidence-Grounded Extraction
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Structured Paper Analysis</h2>
            </div>
            <span className="text-xs text-slate-400">
              Analyzed {new Date(analysis.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Research Question */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Investigated Question
              </h4>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {analysis.research_question || 'Not found in the available document.'}
              </p>
            </div>

            {/* Methodology */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Methodological Approach
              </h4>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {analysis.methodology || 'Not found in the available document.'}
              </p>
            </div>

            {/* Dataset / Sample */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Dataset & Cohort Sample
              </h4>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {analysis.dataset_sample || 'Not found in the available document.'}
              </p>
            </div>

            {/* Research Area */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Research Field / Area
              </h4>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {analysis.research_area || 'General Research'}
              </p>
            </div>
          </div>

          {/* Main Findings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Primary Empirical Findings
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {analysis.findings || 'Not found in the available document.'}
            </div>
          </div>

          {/* Traceable Key Evidence */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Traceable Key Evidence ({evidenceItems.length})
            </h4>

            {evidenceItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                Evidence snippets detailed in the document body.
              </p>
            ) : (
              <div className="space-y-3">
                {evidenceItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-emerald-900">{item.claim}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                        {item.section || 'General'} {item.pageNumber ? `(p. ${item.pageNumber})` : ''}
                      </span>
                    </div>
                    <blockquote className="text-slate-700 italic border-l-2 border-emerald-400 pl-3 my-1">
                      "{item.evidence}"
                    </blockquote>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Limitations & Future Work */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1.5">
                Reported Limitations
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {analysis.limitations || 'Not found in the available document.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1.5">
                Suggested Future Directions
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {analysis.future_work || 'Not found in the available document.'}
              </p>
            </div>
          </div>

          {/* Key Concepts */}
          {keyConcepts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Extracted Concepts
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {keyConcepts.map((c, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {typeof c === 'string' ? c : c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Paper Not Yet Analyzed</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Run an AI evidence analysis to extract structured findings, methodologies, sample sizes, and traceable evidence snippets from this study.
          </p>
          <Button variant="primary" icon={ShieldCheck} loading={analyzing} onClick={handleRunAnalysis}>
            Run Structured AI Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
