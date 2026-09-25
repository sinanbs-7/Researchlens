import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';

export function AskQaPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const promptSuggestions = [
    "What do these studies agree on?",
    "Which methodologies appear repeatedly across these papers?",
    "What key limitations are documented by the authors?",
    "What conflicting findings exist in this workspace collection?",
    "What under-studied populations or research gaps remain?"
  ];

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setError(null);
    setAsking(true);
    setQuestion(q);

    try {
      const data = await api.post('/ai/ask', {
        workspaceId,
        question: q
      });

      setResponse(data);
      setHistory(prev => [{ question: q, data, timestamp: new Date() }, ...prev]);
    } catch (err) {
      setError(err.message || 'Failed to generate source-grounded response.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Source-Grounded Research Q&A"
        description="Ask questions against your saved studies and uploaded PDFs. Every answer traces directly to supplied evidence with strict separation of facts vs AI interpretations."
        badge={<Badge variant="primary">Strict Evidence Grounding</Badge>}
      />

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Query Console Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask an evidence question (e.g. 'What sample sizes were investigated and what limitations were identified?')..."
              className="w-full p-4 pr-12 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="absolute right-3 bottom-4 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition cursor-pointer shadow-xs"
              title="Submit Inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Suggested Inquiries:
            </span>
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(s)}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 rounded-md transition cursor-pointer border border-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Loading State */}
      {asking && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <LoadingSpinner text="Retrieving workspace passages and synthesizing evidence..." size="lg" />
          <p className="text-xs text-slate-400 mt-2">Checking claims against saved literature and uploaded PDFs.</p>
        </div>
      )}

      {/* Answer Output Display */}
      {response && !asking && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
          {/* Main Answer Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Synthesized Answer
              </span>
              {response.metadata && (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  {response.metadata.engine}
                </span>
              )}
            </div>
            <div className="text-sm md:text-base font-medium text-slate-900 leading-relaxed whitespace-pre-line bg-slate-50/60 p-5 rounded-xl border border-slate-100">
              {response.answer}
            </div>
          </div>

          {/* Section 1: Source-Supported Points */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Source-Supported Information ({response.sourceSupportedPoints?.length || 0})
            </h4>

            {(!response.sourceSupportedPoints || response.sourceSupportedPoints.length === 0) ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No direct source-supported claims retrieved for this query.
              </p>
            ) : (
              <div className="space-y-3">
                {response.sourceSupportedPoints.map((pt, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-emerald-950">{pt.claim}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                        {pt.section || 'Passage'} {pt.pageNumber ? `(p. ${pt.pageNumber})` : ''}
                      </span>
                    </div>
                    <blockquote className="text-slate-700 italic border-l-2 border-emerald-400 pl-3 my-1">
                      "{pt.evidence}"
                    </blockquote>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: AI Interpretation */}
          {response.aiInterpretation && response.aiInterpretation.length > 0 && (
            <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-blue-950">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                2. AI Synthesis & Interpretation
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed font-medium">
                {response.aiInterpretation.map((interp, idx) => (
                  <li key={idx}>{interp}</li>
                ))}
              </ul>
              <p className="text-[10px] text-blue-600 mt-2 italic">
                *Note: Interpretations represent analytical synthesis from provided texts, not primary empirical data.
              </p>
            </div>
          )}

          {/* Section 3: Missing Evidence Notice */}
          {response.missingEvidence && response.missingEvidence.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                3. Identified Evidence Gaps & Missing Information
              </h4>
              <ul className="list-disc list-inside space-y-1 text-amber-900 leading-relaxed font-medium">
                {response.missingEvidence.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Workspace Inquiries
          </h3>
          <div className="space-y-2">
            {history.slice(1, 4).map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuestion(h.question);
                  setResponse(h.data);
                }}
                className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-xs font-medium text-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span className="truncate pr-2">"{h.question}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
