import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  Search,
  Filter,
  BookmarkPlus,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
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

export function DiscoverPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace, refreshCurrentWorkspace } = useWorkspace();

  const [query, setQuery] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [openAccess, setOpenAccess] = useState(false);
  const [sourceType, setSourceType] = useState('');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);

  const [savedPaperIds, setSavedPaperIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // Preload saved papers to know what is already in this workspace
  useEffect(() => {
    async function loadSavedPapers() {
      try {
        const data = await api.get(`/workspaces/${workspaceId}/papers`);
        const savedIds = new Set(
          (data?.papers || []).map(p => p.external_id || p.doi || p.title)
        );
        setSavedPaperIds(savedIds);
      } catch (err) {
        console.error('Failed to load saved papers:', err);
      }
    }
    loadSavedPapers();
  }, [workspaceId]);

  // Initial search from workspace question if empty
  useEffect(() => {
    if (currentWorkspace?.research_question && !query) {
      // Extract key terms
      const cleanQ = currentWorkspace.research_question.replace(/[?.,]/g, '');
      setQuery(cleanQ);
      performSearch(cleanQ, 1);
    }
  }, [currentWorkspace]);

  const performSearch = async (searchQuery, pageNum = 1) => {
    if (!searchQuery || !searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        query: searchQuery.trim(),
        page: String(pageNum),
        perPage: '12',
        sort
      });

      if (yearFrom) params.set('yearFrom', yearFrom);
      if (yearTo) params.set('yearTo', yearTo);
      if (openAccess) params.set('openAccess', 'true');
      if (sourceType) params.set('sourceType', sourceType);

      const data = await api.get(`/research/search?${params.toString()}`);
      setResults(data?.results || []);
      setTotalCount(data?.totalCount || 0);
      setTotalPages(data?.totalPages || 0);
      setPage(data?.page || pageNum);
    } catch (err) {
      setError(err.message || 'Scholarly database query failed. Please verify your query.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(query, 1);
  };

  const handleSavePaper = async (paper) => {
    setSavingId(paper.externalId || paper.doi || paper.title);
    try {
      await api.post(`/workspaces/${workspaceId}/papers`, {
        externalId: paper.externalId,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        publicationYear: paper.publicationYear,
        journalName: paper.journalName,
        conferenceName: paper.conferenceName,
        doi: paper.doi,
        sourceUrl: paper.sourceUrl,
        openAccessUrl: paper.openAccessUrl,
        sourceType: paper.sourceType,
        metadata: {
          ...paper.metadata,
          concepts: paper.concepts,
          citedByCount: paper.citedByCount
        }
      });

      setSavedPaperIds(prev => new Set([...prev, paper.externalId || paper.doi || paper.title]));
      await refreshCurrentWorkspace();
    } catch (err) {
      alert(`Could not save paper: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarly Research Discovery"
        description="Search real academic literature directly from OpenAlex and Crossref scholarly databases without fabricated citations."
        badge={<Badge variant="primary">Real Scholarly APIs</Badge>}
        actions={
          <Link to={`/workspaces/${workspaceId}/library`}>
            <Button variant="outline" size="sm" icon={BookOpen}>
              View Saved Library
            </Button>
          </Link>
        }
      />

      {/* Search & Filters Card */}
      <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, hypothesis, methodology, keywords, or title..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <Button type="submit" variant="primary" loading={loading} icon={Search} className="px-6 shrink-0">
            Search Literature
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Year From</label>
            <input
              type="number"
              min="1900"
              max="2030"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="e.g. 2018"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Year To</label>
            <input
              type="number"
              min="1900"
              max="2030"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="e.g. 2026"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="article">Journal Article</option>
              <option value="book-chapter">Book Chapter</option>
              <option value="proceedings-article">Conference Paper</option>
              <option value="preprint">Preprint</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                performSearch(query, 1);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="relevance">Relevance Score</option>
              <option value="cited_by_count">Most Cited First</option>
              <option value="publication_date">Newest Publication</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
              <input
                type="checkbox"
                checked={openAccess}
                onChange={(e) => setOpenAccess(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Open Access Only</span>
            </label>
          </div>
        </div>
      </form>

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Results Header */}
      {!loading && results.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Found <strong>{totalCount.toLocaleString()}</strong> scholarly works (Page {page} of {totalPages})</span>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <LoadingSpinner text="Querying scholarly database index..." />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Scholarly Results"
          description="Enter a search query above or adjust filters to discover academic research."
        />
      ) : (
        <div className="space-y-4">
          {results.map((paper, idx) => {
            const paperIdentifier = paper.externalId || paper.doi || paper.title;
            const isAlreadySaved = savedPaperIds.has(paperIdentifier);
            const isSaving = savingId === paperIdentifier;

            const authorsStr = (paper.authors || []).map(a => a.name || a).join(', ');

            return (
              <div
                key={paper.externalId || idx}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:border-blue-300 transition"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {paper.isOpenAccess && (
                        <Badge variant="success">Open Access</Badge>
                      )}
                      <Badge variant="default">{paper.sourceType || 'Article'}</Badge>
                      {paper.publicationYear && (
                        <span className="text-xs text-slate-500 font-medium">
                          {paper.publicationYear}
                        </span>
                      )}
                      {paper.citedByCount !== undefined && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          {paper.citedByCount} citations
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {paper.sourceUrl ? (
                        <a
                          href={paper.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition inline-flex items-center gap-1.5"
                        >
                          {paper.title}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </a>
                      ) : (
                        paper.title
                      )}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
                      {authorsStr || 'Authors not indexed'}
                    </p>

                    {paper.journalName && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">
                        {paper.journalName}
                      </p>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="shrink-0">
                    {isAlreadySaved ? (
                      <Button variant="outline" size="sm" disabled className="bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default">
                        <Check className="w-4 h-4 mr-1 text-emerald-600" />
                        Saved in Workspace
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={BookmarkPlus}
                        loading={isSaving}
                        onClick={() => handleSavePaper(paper)}
                      >
                        Save to Workspace
                      </Button>
                    )}
                  </div>
                </div>

                {/* Abstract */}
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 mt-3">
                  <p className="line-clamp-3 hover:line-clamp-none transition-all">
                    {paper.abstract}
                  </p>
                </div>

                {/* Concepts Tags */}
                {paper.concepts && paper.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {paper.concepts.slice(0, 5).map((c, cIdx) => (
                      <span key={cIdx} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {c.name || c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => performSearch(query, page - 1)}
              >
                Previous Page
              </Button>

              <span className="text-xs text-slate-500 font-medium">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={page >= totalPages}
                onClick={() => performSearch(query, page + 1)}
              >
                Next Page
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
