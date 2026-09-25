import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Layers,
  Plus,
  BookOpen,
  FileText,
  Sparkles,
  StickyNote,
  ArrowRight,
  Search,
  Calendar,
  Trash2,
  Archive
} from 'lucide-react';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx';
import { api } from '../api/client.js';

export function DashboardPage() {
  const { workspaces, loading, fetchWorkspaces, selectWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const filteredWorkspaces = workspaces.filter(w =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.research_question.toLowerCase().includes(search.toLowerCase()) ||
    (w.research_field && w.research_field.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenWorkspace = (ws) => {
    selectWorkspace(ws.id);
    navigate(`/workspaces/${ws.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${deleteTarget.id}`);
      await fetchWorkspaces();
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete workspace: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/20">
            Research Command Center
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mt-2 tracking-tight">
            Welcome back, {user?.name || 'Researcher'}
          </h1>
          <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
            Select an active research inquiry or launch a new evidence workspace to start discovering and synthesizing literature.
          </p>
        </div>

        <Link to="/workspaces/new" className="shrink-0">
          <Button variant="outline" icon={Plus} className="bg-white text-blue-900 border-none hover:bg-blue-50 font-semibold shadow-md">
            New Workspace
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces by title, question, or field..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredWorkspaces.length} of {workspaces.length} workspace(s)
        </div>
      </div>

      {/* Workspaces Grid */}
      {loading ? (
        <LoadingSpinner text="Loading research workspaces..." />
      ) : filteredWorkspaces.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={search ? "No matching workspaces" : "No Research Workspaces Yet"}
          description={
            search
              ? "Try adjusting your search terms to find your research workspace."
              : "Create your first research workspace to organize literature, extract evidence, and identify research gaps."
          }
          actionText={search ? "Clear Search" : "Create Research Workspace"}
          onAction={search ? () => setSearch('') : () => navigate('/workspaces/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => (
            <div
              key={ws.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge variant={ws.status === 'archived' ? 'default' : 'primary'}>
                    {ws.research_field || 'General Inquiry'}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(ws);
                    }}
                    className="text-slate-300 hover:text-red-600 transition p-1 rounded cursor-pointer"
                    title="Delete Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3
                  onClick={() => handleOpenWorkspace(ws)}
                  className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition cursor-pointer mb-2 line-clamp-1"
                >
                  {ws.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Question: </span>
                  "{ws.research_question}"
                </p>

                {/* Metrics Badges */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-1 rounded bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">{ws.papers_count || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Papers</p>
                  </div>
                  <div className="p-1 rounded bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">{ws.documents_count || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">PDFs</p>
                  </div>
                  <div className="p-1 rounded bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">{ws.gaps_count || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Gaps</p>
                  </div>
                  <div className="p-1 rounded bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">{ws.notes_count || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Notes</p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(ws.updated_at || ws.created_at).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={ArrowRight}
                  onClick={() => handleOpenWorkspace(ws)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Open Workspace
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Research Workspace"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All saved papers, uploaded documents, extracted evidence, and notes in this workspace will be deleted.`}
        confirmText="Delete Workspace"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
