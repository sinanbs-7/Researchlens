import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  BookOpen,
  FileText,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function EvidencePage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [evidenceList, setEvidenceList] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadEvidence() {
      try {
        setLoading(true);
        const [papersData, exportData] = await Promise.all([
          api.get(`/workspaces/${workspaceId}/papers`),
          api.get(`/workspaces/${workspaceId}/export/evidence?format=json`)
        ]);

        setPapers(papersData?.papers || []);
        setEvidenceList(exportData || []);
      } catch (err) {
        console.error('Failed to load evidence vault:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvidence();
  }, [workspaceId]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const filename = `evidence_table_${workspaceId.slice(0, 8)}.${format}`;
      await api.download(`/workspaces/${workspaceId}/export/evidence?format=${format}`, filename);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const filteredEvidence = evidenceList.filter(item => {
    const matchesSearch =
      (item.claim && item.claim.toLowerCase().includes(search.toLowerCase())) ||
      (item.evidenceSnippet && item.evidenceSnippet.toLowerCase().includes(search.toLowerCase())) ||
      (item.paper && item.paper.toLowerCase().includes(search.toLowerCase()));

    const matchesPaper = !selectedPaper || item.paper === selectedPaper;
    return matchesSearch && matchesPaper;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traceable Evidence Vault"
        description="Every important claim is grounded with its source study, section, and verbatim quotation snippet. Never fabricated."
        badge={<Badge variant="success">{evidenceList.length} Verified Evidence Snippets</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              loading={exporting}
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              loading={exporting}
              onClick={() => handleExport('markdown')}
            >
              Export Markdown
            </Button>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search evidence claims, snippets, or papers..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedPaper}
            onChange={(e) => setSelectedPaper(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Source Papers</option>
            {papers.map(p => (
              <option key={p.id} value={p.title}>
                {p.title.length > 50 ? `${p.title.slice(0, 48)}...` : p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Evidence Cards */}
      {loading ? (
        <LoadingSpinner text="Loading evidence ledger..." />
      ) : filteredEvidence.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={search ? "No matching evidence found" : "No Evidence Points Extracted Yet"}
          description={
            search
              ? "Try adjusting your search query or paper filter."
              : "Analyze papers in your Research Library or upload PDF documents to automatically extract traceable evidence claims."
          }
          actionText={search ? "Clear Search" : "Go to Library"}
          onAction={search ? () => setSearch('') : () => window.location.href = `/workspaces/${workspaceId}/library`}
        />
      ) : (
        <div className="space-y-4">
          {filteredEvidence.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-sm text-slate-900">{item.claim}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {item.section || 'General Section'}
                  </span>
                  {item.pageNumber && item.pageNumber !== 'N/A' && (
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Page {item.pageNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Snippet Blockquote */}
              <blockquote className="text-xs text-slate-700 leading-relaxed italic bg-emerald-50/40 p-3.5 rounded-lg border-l-4 border-emerald-500">
                "{item.evidenceSnippet}"
              </blockquote>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-slate-600 font-semibold truncate max-w-xl">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Source: {item.paper} ({item.year})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
