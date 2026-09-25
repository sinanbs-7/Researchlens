import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  GitCompare,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle,
  Download,
  BookOpen,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function ComparePage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [papers, setPapers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPapers() {
      try {
        setLoading(true);
        const data = await api.get(`/workspaces/${workspaceId}/papers`);
        const pList = data?.papers || [];
        setPapers(pList);
        // Pre-select first two papers if available
        if (pList.length >= 2) {
          setSelectedIds([pList[0].id, pList[1].id]);
        }
      } catch (err) {
        console.error('Failed to load papers for comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, [workspaceId]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      if (selectedIds.length >= 5) {
        alert('You can select up to 5 papers to compare simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 papers from your library to compare.');
      return;
    }

    setError(null);
    setComparing(true);

    try {
      const data = await api.post('/ai/compare', {
        workspaceId,
        paperIds: selectedIds
      });

      setComparisonResult(data);
    } catch (err) {
      setError(err.message || 'Paper comparison analysis failed.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarly Paper Comparison"
        description="Select studies to generate side-by-side matrices across methodologies, sample sizes, empirical findings, and limitations. Missing data is rendered as 'Not available' rather than invented."
        badge={<Badge variant="primary">{selectedIds.length} Selected</Badge>}
      />

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Paper Selection Carousel / List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Papers to Compare (Choose 2 to 5)
          </h3>
          <Button
            variant="primary"
            size="sm"
            icon={GitCompare}
            loading={comparing}
            disabled={selectedIds.length < 2}
            onClick={handleCompare}
          >
            Compare Selected ({selectedIds.length})
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading workspace papers..." size="sm" />
        ) : papers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No papers in workspace. Discover and save papers first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {papers.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition select-none flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-medium'
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="pt-0.5 shrink-0 text-blue-600">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="truncate flex-1">
                    <p className="font-bold truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {p.publication_year || 'Unknown year'} &bull; {p.source_type || 'Article'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Loading */}
      {comparing && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <LoadingSpinner text="Synthesizing multi-paper comparative matrix..." size="lg" />
          <p className="text-xs text-slate-400 mt-2">Harmonizing methodologies, sample cohorts, and findings across studies.</p>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && !comparing && (
        <div className="space-y-6 animate-fade-in">
          {/* Comparative Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Side-by-Side Comparison Matrix</h3>
                <p className="text-xs text-slate-400">Harmonized evaluation across academic criteria</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="px-5 py-3 w-48 border-r border-slate-200">Evaluation Criterion</th>
                    {comparisonResult.papers?.map((p) => (
                      <th key={p.id} className="px-5 py-3 min-w-[220px] max-w-[300px]">
                        <span className="line-clamp-2 font-bold text-slate-900">{p.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">({p.publication_year || 'n.d.'})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonResult.comparison?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/40 align-top">
                        {row.criterion}
                      </td>
                      {row.papers?.map((cell, cIdx) => (
                        <td key={cIdx} className="px-5 py-4 text-slate-700 leading-relaxed align-top">
                          {cell.value === 'Not available' ? (
                            <span className="text-slate-400 italic">Not available in document</span>
                          ) : (
                            <p className="whitespace-pre-line">{cell.value}</p>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Similarities & Differences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Key Shared Similarities
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
                {comparisonResult.similarities?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-indigo-600" />
                Key Discrepancies & Divergences
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
                {comparisonResult.differences?.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
