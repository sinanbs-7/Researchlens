import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import { FlaskConical, ArrowLeft, Plus, X, Layers, HelpCircle } from 'lucide-react';
import { Button } from '../components/shared/Button.jsx';
import { ErrorAlert } from '../components/shared/ErrorAlert.jsx';

export function NewWorkspacePage() {
  const [title, setTitle] = useState('');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [researchField, setResearchField] = useState('Computer Science');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [selectedSources, setSelectedSources] = useState(['Journal Article', 'Conference Paper']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { fetchWorkspaces, selectWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const sourceTypes = [
    'Journal Article',
    'Conference Paper',
    'Review',
    'Preprint',
    'Book Chapter',
    'Dataset'
  ];

  const handleAddKeyword = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
      e.preventDefault();
      const clean = keywordInput.trim().replace(/,/g, '');
      if (clean && !keywords.includes(clean)) {
        setKeywords([...keywords, clean]);
      }
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (tag) => {
    setKeywords(keywords.filter(k => k !== tag));
  };

  const toggleSourceType = (st) => {
    if (selectedSources.includes(st)) {
      setSelectedSources(selectedSources.filter(s => s !== st));
    } else {
      setSelectedSources([...selectedSources, st]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !researchQuestion.trim()) {
      setError('Both Workspace Title and Research Question are required.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/workspaces', {
        title: title.trim(),
        researchQuestion: researchQuestion.trim(),
        description: description.trim(),
        researchField: researchField.trim(),
        keywords,
        preferredSourceTypes: selectedSources
      });

      if (data?.workspace) {
        await fetchWorkspaces();
        await selectWorkspace(data.workspace.id);
        navigate(`/workspaces/${data.workspace.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create research workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-3">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Research Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">
          Establish an isolated, evidence-traceable workspace for your research inquiry.
        </p>
      </div>

      <ErrorAlert message={error} onClose={() => setError(null)} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {/* Workspace Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Workspace Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI-Based Adaptive Tutoring in Higher Education"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <p className="text-[11px] text-slate-400 mt-1">A descriptive title for your research project or manuscript.</p>
        </div>

        {/* Central Research Question */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Central Research Question <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="e.g. How does AI-driven real-time feedback impact knowledge retention and cognitive load in university STEM cohorts?"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            This inquiry serves as the grounding anchor for all relevance evaluations, gap analyses, and evidence extraction.
          </p>
        </div>

        {/* Research Field & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Research Discipline / Field
            </label>
            <input
              type="text"
              value={researchField}
              onChange={(e) => setResearchField(e.target.value)}
              placeholder="e.g. Computer Science, Public Health, Economics"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Brief Project Scope / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Systematic review targeting peer-reviewed studies 2020-2026"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Target Keywords & Concepts
          </label>
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-lg border border-slate-200 min-h-[44px] bg-slate-50/50">
            {keywords.map((kw, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium">
                {kw}
                <button type="button" onClick={() => handleRemoveKeyword(kw)} className="hover:text-blue-900 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleAddKeyword}
              placeholder="Type keyword and press Enter..."
              className="text-xs border-none focus:outline-none bg-transparent flex-1 min-w-[160px] py-1"
            />
          </div>
          <p className="text-[11px] text-slate-400">Used to fine-tune scholarly discovery queries and concept mapping.</p>
        </div>

        {/* Preferred Source Types */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Preferred Scholarly Source Types
          </label>
          <div className="flex flex-wrap gap-2">
            {sourceTypes.map((st) => {
              const active = selectedSources.includes(st);
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => toggleSourceType(st)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium cursor-pointer ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link to="/dashboard">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading} icon={Plus}>
            Initialize Workspace
          </Button>
        </div>
      </form>
    </div>
  );
}
