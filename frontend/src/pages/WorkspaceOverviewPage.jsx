import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  Compass,
  FileText,
  ShieldCheck,
  MessageSquare,
  GitCompare,
  Sparkles,
  Download,
  BookOpen,
  ArrowRight,
  Share2,
  Clock,
  BookMarked,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';

export function WorkspaceOverviewPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace, selectWorkspace, refreshCurrentWorkspace } = useWorkspace();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
          await selectWorkspace(workspaceId);
        }
        const pData = await api.get(`/workspaces/${workspaceId}/papers`);
        setPapers(pData?.papers || []);
      } catch (err) {
        console.error('Failed to load workspace overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceId, selectWorkspace]);

  const handleExport = async (type, format) => {
    try {
      setExporting(true);
      const filename = `${currentWorkspace?.title?.slice(0, 20).replace(/\s+/g, '_')}_${type}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'md'}`;
      await api.download(`/workspaces/${workspaceId}/export/${type}?format=${format}`, filename);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !currentWorkspace) {
    return <LoadingSpinner text="Loading research workspace..." size="lg" />;
  }

  const ws = currentWorkspace;

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title={ws?.title || 'Research Workspace'}
        description={ws?.description || 'Active scholarly workspace'}
        badge={<Badge variant="primary">{ws?.research_field || 'Research'}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            {/* Export Dropdown Trigger */}
            <div className="relative group">
              <Button variant="outline" size="sm" icon={Download} loading={exporting}>
                Export Research
              </Button>
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 hidden group-hover:block z-50 animate-fade-in text-xs">
                <div className="px-3 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  Select Export Format
                </div>
                <button
                  onClick={() => handleExport('summary', 'markdown')}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium cursor-pointer"
                >
                  Workspace Summary (Markdown)
                </button>
                <button
                  onClick={() => handleExport('evidence', 'csv')}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium cursor-pointer"
                >
                  Evidence Table (CSV)
                </button>
                <button
                  onClick={() => handleExport('gaps', 'markdown')}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium cursor-pointer"
                >
                  Research Gaps Report (Markdown)
                </button>
                <button
                  onClick={() => handleExport('literature-review', 'markdown')}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition font-medium cursor-pointer"
                >
                  Literature Review (Markdown)
                </button>
              </div>
            </div>

            <Link to={`/workspaces/${workspaceId}/discover`}>
              <Button variant="primary" size="sm" icon={Compass}>
                Discover Sources
              </Button>
            </Link>
          </div>
        }
      />

      {/* Focus Research Question Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Central Research Inquiry</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold leading-relaxed tracking-tight text-white">
          "{ws?.research_question}"
        </h2>
        {ws?.keywords && ws.keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-blue-800/60">
            <span className="text-[11px] text-blue-300 font-medium">Keywords:</span>
            {ws.keywords.map((kw, idx) => (
              <span key={idx} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-100 font-medium">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Papers</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{ws?.papers_count || papers.length}</p>
          <span className="text-[11px] text-slate-400">Scholarly works saved</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">PDFs</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{ws?.documents_count || 0}</p>
          <span className="text-[11px] text-slate-400">Parsed & chunked</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Analyses</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{ws?.analyses_count || 0}</p>
          <span className="text-[11px] text-slate-400">Structured extractions</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gaps</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{ws?.gaps_count || 0}</p>
          <span className="text-[11px] text-slate-400">Identified literature gaps</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Notes</span>
            <BookMarked className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{ws?.notes_count || 0}</p>
          <span className="text-[11px] text-slate-400">Annotated records</span>
        </div>
      </div>

      {/* Quick Action Navigator */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-4">Workspace Investigation Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to={`/workspaces/${workspaceId}/discover`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                Discover Scholarly Sources
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Search OpenAlex & Crossref for peer-reviewed studies and save directly to this workspace.
              </p>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/documents`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                Upload & Chunk PDFs
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ingest PDF papers, extract text with section identification, and index passage chunks.
              </p>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/ask`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition">
                Source-Grounded Q&A
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ask questions against workspace literature with explicit citations and missing evidence warnings.
              </p>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/compare`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition">
                Compare Studies Side-by-Side
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Generate comparison matrices across methodologies, sample sizes, findings, and limitations.
              </p>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/gaps`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition">
                Research Gap Finder
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Detect unstudied populations, geographical gaps, and conflicting findings in saved sources.
              </p>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/literature-review`}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md transition flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-cyan-600 transition">
                Literature Review Builder
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Synthesize a structured, source-backed 8-section review outline ready for publication.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Workspace Papers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Saved Papers in this Workspace</h3>
            <p className="text-xs text-slate-500">Manage literature and launch structured AI analyses</p>
          </div>
          <Link to={`/workspaces/${workspaceId}/library`}>
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              View All ({papers.length})
            </Button>
          </Link>
        </div>

        {papers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p>No papers saved in this workspace yet.</p>
            <Link to={`/workspaces/${workspaceId}/discover`} className="mt-2 inline-block">
              <Button size="sm" variant="outline" icon={Compass}>
                Search Scholarly Literature
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-3">Paper Title & Authors</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Reading Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {papers.slice(0, 5).map((paper) => {
                  let authorsStr = 'Unknown Author';
                  try {
                    const parsed = typeof paper.authors === 'string' ? JSON.parse(paper.authors) : paper.authors;
                    authorsStr = parsed.map(a => a.name || a).join(', ');
                  } catch (e) {}

                  return (
                    <tr key={paper.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-3.5">
                        <Link
                          to={`/workspaces/${workspaceId}/paper/${paper.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition block line-clamp-1"
                        >
                          {paper.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{authorsStr}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {paper.publication_year || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            paper.status === 'analyzed' ? 'success' :
                            paper.status === 'read' ? 'purple' :
                            paper.status === 'reading' ? 'warning' : 'default'
                          }
                        >
                          {paper.status || 'to_read'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={`/workspaces/${workspaceId}/paper/${paper.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
