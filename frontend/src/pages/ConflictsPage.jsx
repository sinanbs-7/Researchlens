import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function ConflictsPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/conflicts', {
        workspaceId
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to analyze agreements and disagreements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, [workspaceId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Agreement & Potential Disagreement Analysis"
        description="Identifies consensus patterns, equivocal evidence, and potential scholarly disagreements with contextual variables (population, geography, measurement)."
        badge={<Badge variant="primary">Nuanced Synthesis</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={Scale}
            loading={loading}
            onClick={handleAnalyze}
          >
            Re-analyze Literature
          </Button>
        }
      />

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <LoadingSpinner text="Evaluating scientific consensus and conflicting evidence..." size="lg" />
          <p className="text-xs text-slate-400 mt-2">Checking differences in population, methodology, and measurement.</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-8 animate-fade-in">
          {/* 1. Areas of Agreement */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Robust Consensus & Areas of Agreement ({data.agreements?.length || 0})
              </h3>
            </div>

            {(!data.agreements || data.agreements.length === 0) ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No unanimous consensus claims detected across current papers.
              </p>
            ) : (
              <div className="space-y-3">
                {data.agreements.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-2">
                    <p className="font-bold text-emerald-950 text-sm">{item.claim}</p>
                    {item.evidence && item.evidence.length > 0 && (
                      <div className="space-y-1">
                        {item.evidence.map((ev, eIdx) => (
                          <blockquote key={eIdx} className="text-slate-700 italic border-l-2 border-emerald-400 pl-3 text-xs">
                            "{ev}"
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Mixed / Equivocal Evidence */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Mixed Evidence & Equivocal Outcomes ({data.mixedEvidence?.length || 0})
              </h3>
            </div>

            {(!data.mixedEvidence || data.mixedEvidence.length === 0) ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No mixed evidence topics currently flagged.
              </p>
            ) : (
              <div className="space-y-3">
                {data.mixedEvidence.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 text-xs space-y-1.5">
                    <span className="font-bold text-amber-950 text-sm block">{m.topic}</span>
                    <p className="text-slate-700 leading-relaxed font-medium">{m.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Potential Disagreements Detected */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Potential Disagreements Detected ({data.potentialDisagreements?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated with contextual variables rather than absolute contradictions.
                </p>
              </div>
            </div>

            {(!data.potentialDisagreements || data.potentialDisagreements.length === 0) ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No significant contradictory findings identified in available studies.
              </p>
            ) : (
              <div className="space-y-6">
                {data.potentialDisagreements.map((conf, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-sm text-slate-900">Topic: {conf.topic}</span>
                      <Badge variant="warning">Potential Disagreement Detected</Badge>
                    </div>

                    {/* Side-by-side studies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          Study A Finding
                        </span>
                        <p className="font-bold text-slate-900">{conf.sourceA?.finding}</p>
                        <blockquote className="text-slate-600 italic border-l-2 border-blue-400 pl-2 text-[11px]">
                          "{conf.sourceA?.evidence}"
                        </blockquote>
                      </div>

                      <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                          Study B Finding
                        </span>
                        <p className="font-bold text-slate-900">{conf.sourceB?.finding}</p>
                        <blockquote className="text-slate-600 italic border-l-2 border-rose-400 pl-2 text-[11px]">
                          "{conf.sourceB?.evidence}"
                        </blockquote>
                      </div>
                    </div>

                    {/* Contextual explanations */}
                    {conf.possibleContextualDifferences && conf.possibleContextualDifferences.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                        <span className="font-bold text-blue-900 text-[11px] block">
                          Plausible Contextual Discrepancies:
                        </span>
                        <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5">
                          {conf.possibleContextualDifferences.map((diff, dIdx) => (
                            <li key={dIdx}>{diff}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
