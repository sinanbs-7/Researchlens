import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { Modal } from '../components/shared/Modal.jsx';
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx';

export function DocumentsPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace, refreshCurrentWorkspace } = useWorkspace();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/workspaces/${workspaceId}/documents`);
      setDocuments(data?.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [workspaceId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only valid PDF documents (.pdf) are supported.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB maximum limit.');
      return;
    }

    if (file.size === 0) {
      setError('Selected PDF file is empty (0 bytes).');
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);

    try {
      await api.post('/documents/upload', formData);
      await loadDocuments();
      await refreshCurrentWorkspace();
    } catch (err) {
      setError(err.message || 'PDF processing failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleViewChunks = async (doc) => {
    setSelectedDoc(doc);
    setLoadingChunks(true);
    try {
      const data = await api.get(`/documents/${doc.id}/chunks`);
      setChunks(data?.chunks || []);
    } catch (err) {
      alert(`Could not load chunks: ${err.message}`);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
      await refreshCurrentWorkspace();
      setDeleteTarget(null);
    } catch (err) {
      alert(`Could not delete document: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnalyzeDocument = async (docId) => {
    try {
      await api.post('/ai/analyze', {
        workspaceId,
        documentId: docId
      });
      await loadDocuments();
      await refreshCurrentWorkspace();
      alert('Document analyzed successfully! View findings in the Evidence tab.');
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PDF Document Ingestion"
        description="Upload research PDFs. The backend text processing pipeline validates, extracts text, detects section headers, and generates searchable chunks."
        badge={<Badge variant="primary">{documents.length} Uploaded</Badge>}
      />

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition cursor-pointer text-center group flex flex-col items-center justify-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          {uploading ? 'Processing & Chunking PDF...' : 'Click or Drag PDF to Ingest'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-3">
          Upload peer-reviewed manuscripts, preprints, or technical reports (up to 20MB).
        </p>

        <Button
          variant="outline"
          size="sm"
          loading={uploading}
          className="pointer-events-none"
        >
          Select PDF File
        </Button>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Ingested Documents</h3>
          <span className="text-xs text-slate-400 font-medium">
            {documents.length} document(s) in workspace
          </span>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading documents..." />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Documents Uploaded"
            description="Upload research PDF papers above to start extracting grounded evidence."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-3">Filename</th>
                  <th className="px-4 py-3">File Size</th>
                  <th className="px-4 py-3">Extraction Status</th>
                  <th className="px-4 py-3">Chunks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const sizeMb = (doc.file_size / (1024 * 1024)).toFixed(2);
                  const isCompleted = doc.processing_status === 'completed';
                  const isFailed = doc.processing_status === 'failed';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="line-clamp-1">{doc.filename}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {sizeMb} MB
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={isCompleted ? 'success' : isFailed ? 'danger' : 'warning'}>
                          {doc.processing_status.toUpperCase()}
                        </Badge>
                        {doc.processing_error && (
                          <p className="text-[10px] text-red-500 mt-0.5 line-clamp-1">
                            {doc.processing_error}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {doc.chunks_count || 0} chunks
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {isCompleted && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={Eye}
                              onClick={() => handleViewChunks(doc)}
                            >
                              Inspect Chunks
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              icon={Sparkles}
                              onClick={() => handleAnalyzeDocument(doc.id)}
                            >
                              Analyze
                            </Button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Chunks Modal */}
      <Modal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={`Indexed Chunks: ${selectedDoc?.filename}`}
        maxWidth="max-w-4xl"
      >
        {loadingChunks ? (
          <LoadingSpinner text="Retrieving text chunks..." />
        ) : chunks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No chunks found for this document.</p>
        ) : (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            {chunks.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-slate-500 font-semibold">
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                    Chunk #{c.chunk_index + 1}
                  </span>
                  <span>Section: <strong>{c.section_name || 'General'}</strong></span>
                  <span>Page ~{c.page_number || 1}</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.filename}"? All stored text chunks and extracted evidence from this file will be permanently removed.`}
        confirmText="Delete Document"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
