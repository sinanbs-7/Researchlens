import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  BookMarked,
  Sparkles,
  Download,
  Save,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function LiteratureReviewPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const loadReview = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/ai/literature-review/${workspaceId}`);
      if (data?.review?.outline) {
        setTitle(data.review.title || `Literature Review: ${currentWorkspace?.title || ''}`);
        setSections(data.review.outline || []);
      }
    } catch (err) {
      console.error('Failed to load literature review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReview();
  }, [workspaceId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post('/ai/literature-outline', { workspaceId });
      setTitle(data.title || `Literature Review: ${currentWorkspace?.title || ''}`);
      setSections(data.sections || []);
    } catch (err) {
      setError(err.message || 'Failed to synthesize literature review outline.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/ai/literature-review/${workspaceId}`, {
        title,
        outline: sections
      });
      alert('Literature review outline saved successfully.');
    } catch (err) {
      alert(`Could not save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format = 'markdown') => {
    try {
      setExporting(true);
      const filename = `literature_review_${workspaceId.slice(0, 8)}.${format === 'json' ? 'json' : 'md'}`;
      await api.download(`/workspaces/${workspaceId}/export/literature-review?format=${format}`, filename);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const updateSection = (index, field, value) => {
    setSections(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addKeyPoint = (sectionIndex) => {
    setSections(prev => {
      const next = [...prev];
      const pts = next[sectionIndex].keyPoints || [];
      next[sectionIndex] = { ...next[sectionIndex], keyPoints: [...pts, 'New evidence point'] };
      return next;
    });
  };

  const removeKeyPoint = (sectionIndex, pointIndex) => {
    setSections(prev => {
      const next = [...prev];
      const pts = (next[sectionIndex].keyPoints || []).filter((_, idx) => idx !== pointIndex);
      next[sectionIndex] = { ...next[sectionIndex], keyPoints: pts };
      return next;
    });
  };

  const updateKeyPoint = (sectionIndex, pointIndex, text) => {
    setSections(prev => {
      const next = [...prev];
      const pts = [...(next[sectionIndex].keyPoints || [])];
      pts[pointIndex] = text;
      next[sectionIndex] = { ...next[sectionIndex], keyPoints: pts };
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Literature Review Builder"
        description="Generates an editable, source-backed 8-section review outline grounded in your workspace papers, extracted evidence, and identified research gaps."
        badge={<Badge variant="primary">{sections.length} Academic Sections</Badge>}
        actions={
          <div className="flex items-center gap-2">
            {sections.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Save}
                  loading={saving}
                  onClick={handleSave}
                >
                  Save Edits
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
              </>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              loading={generating}
              onClick={handleGenerate}
            >
              {sections.length > 0 ? 'Regenerate Outline' : 'Generate Review Outline'}
            </Button>
          </div>
        }
      />

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {loading || generating ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <LoadingSpinner text="Synthesizing source-grounded literature review outline..." size="lg" />
          <p className="text-xs text-slate-400 mt-2">Integrating background, findings, agreements, conflicts, and gaps.</p>
        </div>
      ) : sections.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No Literature Review Outline Synthesized"
          description="Click 'Generate Review Outline' to assemble your saved literature into a coherent academic review structure."
          actionText="Generate Review Outline"
          onAction={handleGenerate}
        />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Review Title Input */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Manuscript / Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg md:text-xl font-bold text-slate-900 border-b border-slate-200 focus:outline-none focus:border-blue-600 pb-2 bg-transparent"
            />
          </div>

          {/* 8 Sections List */}
          <div className="space-y-4">
            {sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4"
              >
                {/* Heading */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => updateSection(sIdx, 'heading', e.target.value)}
                    className="font-bold text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 w-full max-w-lg bg-transparent"
                  />
                  <span className="text-[11px] font-semibold text-slate-400">
                    Section {sIdx + 1} of {sections.length}
                  </span>
                </div>

                {/* Section Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Section Narrative / Synthesis Scope:
                  </label>
                  <textarea
                    rows={2}
                    value={section.description}
                    onChange={(e) => updateSection(sIdx, 'description', e.target.value)}
                    className="w-full p-2.5 text-xs text-slate-700 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed bg-slate-50/50"
                  />
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Key Source-Backed Points:
                    </label>
                    <button
                      type="button"
                      onClick={() => addKeyPoint(sIdx)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Point
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(section.keyPoints || []).map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <input
                          type="text"
                          value={pt}
                          onChange={(e) => updateKeyPoint(sIdx, pIdx, e.target.value)}
                          className="flex-1 text-xs text-slate-800 bg-white border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-1 transition"
                        />
                        <button
                          type="button"
                          onClick={() => removeKeyPoint(sIdx, pIdx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                          title="Remove point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
