import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Tag,
  ExternalLink,
  ShieldCheck,
  Compass,
  FileText,
  X
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx';

export function LibraryPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace, refreshCurrentWorkspace } = useWorkspace();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTagInput, setNewTagInput] = useState({});

  const loadPapers = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/workspaces/${workspaceId}/papers`);
      setPapers(data?.papers || []);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [workspaceId]);

  const handleStatusChange = async (paperId, newStatus) => {
    try {
      await api.post(`/papers/${paperId}/status`, { status: newStatus });
      setPapers(prev => prev.map(p => p.id === paperId ? { ...p, status: newStatus } : p));
      await refreshCurrentWorkspace();
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleAddTag = async (paperId) => {
    const tagName = newTagInput[paperId]?.trim();
    if (!tagName) return;

    try {
      const data = await api.post(`/papers/${paperId}/tags`, { name: tagName });
      if (data?.tag) {
        setPapers(prev => prev.map(p => {
          if (p.id === paperId) {
            const currentTags = p.tags || [];
            return { ...p, tags: [...currentTags, data.tag] };
          }
          return p;
        }));
      }
      setNewTagInput({ ...newTagInput, [paperId]: '' });
    } catch (err) {
      alert(`Could not add tag: ${err.message}`);
    }
  };

  const handleRemoveTag = async (paperId, tagId) => {
    try {
      await api.delete(`/papers/${paperId}/tags/${tagId}`);
      setPapers(prev => prev.map(p => {
        if (p.id === paperId) {
          return { ...p, tags: (p.tags || []).filter(t => t.id !== tagId) };
        }
        return p;
      }));
    } catch (err) {
      alert(`Could not remove tag: ${err.message}`);
    }
  };

  const handleDeletePaper = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/papers/${deleteTarget.id}`);
      setPapers(prev => prev.filter(p => p.id !== deleteTarget.id));
      await refreshCurrentWorkspace();
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete paper: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPapers = papers.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.abstract && p.abstract.toLowerCase().includes(search.toLowerCase())) ||
      (p.journal_name && p.journal_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Library"
        description="Manage saved scholarly sources, monitor reading statuses, categorize with custom tags, and trigger document analysis."
        badge={<Badge variant="primary">{papers.length} Studies</Badge>}
        actions={
          <Link to={`/workspaces/${workspaceId}/discover`}>
            <Button variant="primary" size="sm" icon={Compass}>
              Discover More Papers
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved papers by title, abstract, or journal..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Reading Statuses</option>
            <option value="to_read">To Read</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
            <option value="analyzed">Analyzed</option>
          </select>
        </div>
      </div>

      {/* Papers Table */}
      {loading ? (
        <LoadingSpinner text="Loading saved research papers..." />
      ) : filteredPapers.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "No matching papers found" : "Your Library is Empty"}
          description={
            search
              ? "Try adjusting your search keywords or status filter."
              : "Discover real peer-reviewed papers using OpenAlex or upload research PDFs."
          }
          actionText={search ? "Clear Search" : "Search Literature"}
          onAction={search ? () => setSearch('') : () => window.location.href = `/workspaces/${workspaceId}/discover`}
        />
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => {
            let authorsStr = 'Unknown Author';
            try {
              const parsed = typeof paper.authors === 'string' ? JSON.parse(paper.authors) : paper.authors;
              authorsStr = parsed.map(a => a.name || a).join(', ');
            } catch (e) {}

            const currentTags = paper.tags || [];

            return (
              <div
                key={paper.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Status Select */}
                        <select
                          value={paper.status || 'to_read'}
                          onChange={(e) => handleStatusChange(paper.id, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="to_read">To Read</option>
                          <option value="reading">Reading</option>
                          <option value="read">Read</option>
                          <option value="analyzed">Analyzed</option>
                        </select>

                        {paper.publication_year && (
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                            {paper.publication_year}
                          </span>
                        )}

                        {paper.source_type && (
                          <Badge variant="default">{paper.source_type}</Badge>
                        )}

                        {paper.analyses_count > 0 && (
                          <Badge variant="success">Analyzed with AI</Badge>
                        )}
                      </div>

                      <Link
                        to={`/workspaces/${workspaceId}/paper/${paper.id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition block leading-snug"
                      >
                        {paper.title}
                      </Link>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
                        {authorsStr}
                      </p>

                      {paper.journal_name && (
                        <p className="text-[11px] text-slate-400 mt-0.5 italic">
                          {paper.journal_name}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {paper.doi && (
                        <a
                          href={paper.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
                          title="Open DOI Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <Link to={`/workspaces/${workspaceId}/paper/${paper.id}`}>
                        <Button size="sm" variant="outline" icon={FileText}>
                          Inspect & Analyze
                        </Button>
                      </Link>

                      <button
                        onClick={() => setDeleteTarget(paper)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Delete from workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Abstract Preview */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2 mt-2">
                    {paper.abstract || 'No abstract available.'}
                  </p>
                </div>

                {/* Tags Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Tags:
                  </span>

                  {currentTags.map(t => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200"
                    >
                      {t.name}
                      <button
                        onClick={() => handleRemoveTag(paper.id, t.id)}
                        className="hover:text-blue-900 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="+ tag"
                      value={newTagInput[paper.id] || ''}
                      onChange={(e) => setNewTagInput({ ...newTagInput, [paper.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(paper.id)}
                      className="text-[11px] px-2 py-0.5 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 w-20"
                    />
                    <button
                      onClick={() => handleAddTag(paper.id)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePaper}
        title="Remove Paper from Workspace"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from this workspace? Associated extracted evidence and notes will also be unlinked.`}
        confirmText="Remove Paper"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
