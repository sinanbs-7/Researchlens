import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function TimelinePage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        const res = await api.get(`/workspaces/${workspaceId}/timeline`);
        setData(res);
      } catch (err) {
        console.error('Failed to load timeline:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, [workspaceId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Chronological Research Progression"
        description="Trace the temporal evolution of literature in your workspace. Understand how hypotheses, methodologies, and concept clusters developed over time."
        badge={<Badge variant="primary">{data?.totalPapers || 0} Studies Mapped</Badge>}
      />

      {loading ? (
        <LoadingSpinner text="Computing chronological timeline..." />
      ) : (!data?.timeline || data.timeline.length === 0) ? (
        <EmptyState
          icon={Clock}
          title="No Timeline Data Available"
          description="Save papers into this workspace to visualize their publication timeline."
        />
      ) : (
        <div className="relative pl-6 md:pl-8 border-l-2 border-blue-500/30 space-y-12 my-8 ml-4">
          {data.timeline.map((group, gIdx) => (
            <div key={gIdx} className="relative group">
              {/* Year Pin Marker */}
              <div className="absolute -left-[35px] md:-left-[43px] top-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/30 ring-4 ring-slate-50">
                <Calendar className="w-3.5 h-3.5" />
              </div>

              {/* Year Heading & Stats */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {group.year}
                  </h3>
                  <Badge variant="primary">
                    {group.papersCount} {group.papersCount === 1 ? 'Publication' : 'Publications'}
                  </Badge>
                </div>

                {/* Concepts for this year */}
                {group.concepts && group.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center">
                      Key Themes:
                    </span>
                    {group.concepts.map((c, cIdx) => (
                      <span key={cIdx} className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Papers in this Year */}
              <div className="space-y-3">
                {group.papers.map((p) => {
                  const authorsStr = (p.authors || []).map(a => a.name || a).join(', ');

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-400 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to={`/workspaces/${workspaceId}/paper/${p.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 transition block leading-snug"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
                            {authorsStr}
                          </p>
                          {p.journalName && (
                            <p className="text-[11px] text-slate-400 mt-0.5 italic">
                              {p.journalName}
                            </p>
                          )}
                        </div>

                        <Link to={`/workspaces/${workspaceId}/paper/${p.id}`} className="shrink-0">
                          <Button size="sm" variant="outline" className="text-xs">
                            Inspect
                          </Button>
                        </Link>
                      </div>

                      {p.findings && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2 mt-3 font-medium">
                          {p.findings}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
