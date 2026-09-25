import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  StickyNote,
  Plus,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  FileText,
  Sparkles,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { Modal } from '../components/shared/Modal.jsx';
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx';

export function NotesPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [notes, setNotes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Note editor modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [content, setContent] = useState('');
  const [attachedPaperId, setAttachedPaperId] = useState('');
  const [attachedDocId, setAttachedDocId] = useState('');
  const [attachedGapId, setAttachedGapId] = useState('');
  const [saving, setSaving] = useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesRes, papersRes, docsRes, gapsRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/notes`),
        api.get(`/workspaces/${workspaceId}/papers`),
        api.get(`/workspaces/${workspaceId}/documents`),
        api.get(`/ai/gaps/${workspaceId}`)
      ]);

      setNotes(notesRes?.notes || []);
      setPapers(papersRes?.papers || []);
      setDocuments(docsRes?.documents || []);
      setGaps(gapsRes?.gaps || []);
    } catch (err) {
      console.error('Failed to load notes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setContent('');
    setAttachedPaperId('');
    setAttachedDocId('');
    setAttachedGapId('');
    setModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setContent(note.content);
    setAttachedPaperId(note.paper_id || '');
    setAttachedDocId(note.document_id || '');
    setAttachedGapId(note.research_gap_id || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote.id}`, { content: content.trim() });
      } else {
        await api.post(`/workspaces/${workspaceId}/notes`, {
          content: content.trim(),
          paperId: attachedPaperId || undefined,
          documentId: attachedDocId || undefined,
          researchGapId: attachedGapId || undefined
        });
      }
      await loadData();
      setModalOpen(false);
    } catch (err) {
      alert(`Could not save note: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/notes/${deleteTarget.id}`);
      setNotes(prev => prev.filter(n => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete note: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    (n.paper_title && n.paper_title.toLowerCase().includes(search.toLowerCase())) ||
    (n.gap_title && n.gap_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Workspace Research Notes"
        description="Record synthetic observations, hypotheses, and critiques linked directly to papers, documents, or research gaps."
        badge={<Badge variant="primary">{notes.length} Notes</Badge>}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            New Note
          </Button>
        }
      />

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes content or linked entities..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <LoadingSpinner text="Loading workspace notes..." />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={search ? "No matching notes found" : "No Research Notes Yet"}
          description="Create structured notes attached to literature, documents, or research gaps."
          actionText="Write First Note"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Linked Entity Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {note.paper_title && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 max-w-[200px] truncate">
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span className="truncate">{note.paper_title}</span>
                    </span>
                  )}
                  {note.document_filename && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 max-w-[200px] truncate">
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="truncate">{note.document_filename}</span>
                    </span>
                  )}
                  {note.gap_title && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 max-w-[200px] truncate">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span className="truncate">{note.gap_title}</span>
                    </span>
                  )}
                  {!note.paper_title && !note.document_filename && !note.gap_title && (
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      General Note
                    </span>
                  )}
                </div>

                <p className="text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {note.content}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                    title="Edit Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(note)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNote ? 'Edit Research Note' : 'Create Research Note'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Note Content
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record your research insights, critiques, empirical questions, or synthesis observations..."
              className="w-full p-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {!editingNote && (
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Link to Saved Paper (Optional)
                </label>
                <select
                  value={attachedPaperId}
                  onChange={(e) => setAttachedPaperId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">None (General Note)</option>
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title.length > 60 ? `${p.title.slice(0, 58)}...` : p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Link to Research Gap (Optional)
                </label>
                <select
                  value={attachedGapId}
                  onChange={(e) => setAttachedGapId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">None</option>
                  {gaps.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving} icon={Save}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Research Note"
        message="Are you sure you want to permanently delete this research note?"
        confirmText="Delete Note"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
