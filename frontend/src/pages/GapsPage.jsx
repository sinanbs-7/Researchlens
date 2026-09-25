import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  Sparkles,
  Download,
  Filter,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Tag,
  HelpCircle
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function GapsPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace, refreshCurrentWorkspace } = useWorkspace();

  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const loadGaps = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/ai/gaps/${workspaceId}`);
      setGaps(data?.gaps || []);
    } catch (err) {
      console.error('Failed to load gaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGaps();
  }, [workspaceId]);

  const handleGenerateGaps = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post('/ai/gaps', { workspaceId });
      setGaps(data?.gaps || []);
      await refreshCurrentWorkspace();
    } catch (err) {
      setError(err.message || 'Failed to detect research gaps.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const filename = `research_gaps_${workspaceId.slice(0, 8)}.${format === 'json' ? 'json' : 'md'}`;
      await api.download(`/workspaces/${workspaceId}/export/gaps?format=${format}`, filename);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const categories = Array.from(new Set(gaps.map(g => g.category).filter(Boolean)));

  const filteredGaps = gaps.filter(g =>
    !categoryFilter || g.category === categoryFilter
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Scholarly Research Gap Finder"
        description="Identifies under-studied populations, geographic voids, methodological limitations, and conflicting findings based on current workspace literature."
        badge={<Badge variant="primary">{gaps.length} Potential Gaps</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              loading={exporting}
              onClick={() => handleExport('markdown')}
            >
              Export Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              loading={generating}
              onClick={handleGenerateGaps}
            >
              {gaps.length > 0 ? 'Re-scan for Gaps' : 'Discover Research Gaps'}
            </Button>
          </div>
        }
      />

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Advisory Note */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Scholarly Note:</strong> Research gaps are presented as <em>AI-identified potential avenues</em> based solely on your workspace literature collection. They represent opportunities for novel empirical inquiries, grants, and dissertation chapters.
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
            Category Filter:
          </span>
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              !categoryFilter ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({gaps.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer capitalize ${
                categoryFilter === cat ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Gaps List */}
      {loading || generating ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <LoadingSpinner text="Analyzing literature boundaries to detect unexamined research gaps..." size="lg" />
        </div>
      ) : filteredGaps.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Research Gaps Detected Yet"
          description="Save papers or upload PDFs to your workspace, then trigger an AI gap analysis to reveal unexamined research territories."
          actionText="Detect Research Gaps"
          onAction={handleGenerateGaps}
        />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filteredGaps.map((gap, idx) => (
            <div
              key={gap.id || idx}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:border-amber-300 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {gap.title}
                  </h3>
                </div>

                <Badge variant="warning">
                  {gap.category ? gap.category.toUpperCase() : 'GENERAL GAP'}
                </Badge>
              </div>

              <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                {gap.description}
              </p>

              {gap.reasoning && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 text-[11px] block">
                    Underlying Academic Reasoning:
                  </span>
                  <p>{gap.reasoning}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                <span className="italic">
                  {gap.confidence_context || 'AI-identified potential research gap from workspace collection.'}
                </span>
                <Link
                  to={`/workspaces/${workspaceId}/literature-review`}
                  className="font-semibold text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1"
                >
                  <span>Incorporate in Review Outline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
