import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/errorHandler.js';

/**
 * Reconstructs continuous text from OpenAlex inverted index abstract
 */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return null;
  try {
    const wordList = [];
    for (const [word, indices] of Object.entries(invertedIndex)) {
      if (Array.isArray(indices)) {
        for (const idx of indices) {
          wordList[idx] = word;
        }
      }
    }
    return wordList.filter(Boolean).join(' ');
  } catch (e) {
    logger.warn('Failed to reconstruct abstract from inverted index', e);
    return null;
  }
}

/**
 * Normalizes OpenAlex work object to ResearchLens paper schema
 */
function normalizeOpenAlexWork(work) {
  const authors = (work.authorships || []).map(a => ({
    name: a.author?.display_name || 'Unknown Author',
    institution: a.institutions?.[0]?.display_name || null,
    orcid: a.author?.orcid || null
  }));

  const abstract = reconstructAbstract(work.abstract_inverted_index) || null;

  const concepts = (work.concepts || []).map(c => ({
    name: c.display_name,
    score: c.score,
    level: c.level
  }));

  const primaryLoc = work.primary_location || {};
  const source = primaryLoc.source || {};

  return {
    externalId: work.id || null,
    doi: work.doi || null,
    title: work.title || 'Untitled Research Paper',
    authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
    abstract: abstract || 'No abstract available from scholarly index.',
    publicationYear: work.publication_year || null,
    publicationDate: work.publication_date || null,
    journalName: source.display_name || null,
    conferenceName: work.type === 'proceedings-article' ? source.display_name : null,
    sourceUrl: work.doi || primaryLoc.landing_page_url || (work.id ? `https://openalex.org/${work.id}` : null),
    openAccessUrl: work.open_access?.oa_url || (work.open_access?.is_oa ? primaryLoc.pdf_url : null) || null,
    isOpenAccess: Boolean(work.open_access?.is_oa),
    sourceType: work.type || 'journal-article',
    citedByCount: work.cited_by_count || 0,
    concepts: concepts.slice(0, 8),
    metadata: {
      openalexId: work.id,
      magId: work.ids?.mag,
      pmid: work.ids?.pmid,
      language: work.language,
      fwci: work.fwci
    }
  };
}

/**
 * Searches real scholarly research via OpenAlex API with Crossref fallback
 */
export async function searchScholarlyWorks(params) {
  const { query, yearFrom, yearTo, author, openAccess, sourceType, sort, page = 1, perPage = 15 } = params;

  try {
    const url = new URL(`${config.OPENALEX_API_URL}/works`);
    url.searchParams.set('search', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per-page', String(perPage));

    // Construct OpenAlex filters
    const filters = [];
    if (yearFrom && yearTo) {
      filters.push(`publication_year:${yearFrom}-${yearTo}`);
    } else if (yearFrom) {
      filters.push(`publication_year:>${yearFrom - 1}`);
    } else if (yearTo) {
      filters.push(`publication_year:<${yearTo + 1}`);
    }

    if (openAccess === true) {
      filters.push('is_oa:true');
    }

    if (sourceType) {
      filters.push(`type:${sourceType}`);
    }

    if (author) {
      url.searchParams.set('filter', `default.search:${author}`);
    }

    if (filters.length > 0) {
      url.searchParams.set('filter', filters.join(','));
    }

    // Sort order
    if (sort === 'cited_by_count') {
      url.searchParams.set('sort', 'cited_by_count:desc');
    } else if (sort === 'publication_date' || sort === 'year_desc') {
      url.searchParams.set('sort', 'publication_date:desc');
    } else {
      url.searchParams.set('sort', 'relevance_score:desc');
    }

    // Set polite mailto parameter
    url.searchParams.set('mailto', 'researchlens@academic.org');

    logger.info(`Fetching OpenAlex search: ${url.toString()}`);
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ResearchLens/1.0 (mailto:researchlens@academic.org)'
      }
    });

    if (!response.ok) {
      logger.warn(`OpenAlex returned HTTP ${response.status}. Attempting Crossref fallback...`);
      return await searchCrossref(params);
    }

    const data = await response.json();
    const results = (data.results || []).map(normalizeOpenAlexWork);
    const meta = data.meta || {};

    return {
      source: 'OpenAlex',
      totalCount: meta.count || results.length,
      page: meta.page || page,
      perPage: meta.per_page || perPage,
      totalPages: Math.ceil((meta.count || results.length) / perPage),
      results
    };
  } catch (error) {
    logger.warn(`OpenAlex error: ${error.message}. Trying Crossref fallback...`);
    return await searchCrossref(params);
  }
}

/**
 * Crossref API fallback
 */
async function searchCrossref(params) {
  const { query, page = 1, perPage = 15 } = params;
  try {
    const offset = (page - 1) * perPage;
    const url = new URL(`${config.CROSSREF_API_URL}/works`);
    url.searchParams.set('query', query);
    url.searchParams.set('rows', String(perPage));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ResearchLens/1.0 (mailto:researchlens@academic.org)'
      }
    });

    if (!response.ok) {
      throw new AppError('Unable to retrieve scholarly sources from external databases. Please try again.', 502, 'RESEARCH_API_UNAVAILABLE');
    }

    const data = await response.json();
    const items = data.message?.items || [];
    const totalResults = data.message?.['total-results'] || items.length;

    const results = items.map(item => ({
      externalId: item.DOI ? `doi:${item.DOI}` : null,
      doi: item.DOI ? `https://doi.org/${item.DOI}` : null,
      title: item.title?.[0] || 'Untitled Research',
      authors: (item.author || []).map(a => ({
        name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown Author',
        institution: a.affiliation?.[0]?.name || null
      })),
      abstract: item.abstract ? item.abstract.replace(/<[^>]*>?/gm, '') : 'No abstract available from Crossref.',
      publicationYear: item.published?.['date-parts']?.[0]?.[0] || null,
      publicationDate: null,
      journalName: item['container-title']?.[0] || null,
      conferenceName: null,
      sourceUrl: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : null),
      openAccessUrl: null,
      isOpenAccess: false,
      sourceType: item.type || 'journal-article',
      citedByCount: item['is-referenced-by-count'] || 0,
      concepts: [],
      metadata: { crossrefScore: item.score }
    }));

    return {
      source: 'Crossref',
      totalCount: totalResults,
      page,
      perPage,
      totalPages: Math.ceil(totalResults / perPage),
      results
    };
  } catch (err) {
    logger.error('Crossref search error:', err);
    throw new AppError('External research services are currently unreachable. Please check your connection or query.', 502, 'RESEARCH_API_ERROR');
  }
}

/**
 * Fetch detailed paper info by external ID (OpenAlex ID or DOI)
 */
export async function getPaperByExternalId(externalId) {
  try {
    let cleanId = externalId;
    if (cleanId.startsWith('https://openalex.org/')) {
      cleanId = cleanId.replace('https://openalex.org/', '');
    }

    const url = `${config.OPENALEX_API_URL}/works/${encodeURIComponent(cleanId)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ResearchLens/1.0 (mailto:researchlens@academic.org)'
      }
    });

    if (!response.ok) {
      throw new AppError(`Paper with ID ${externalId} not found in scholarly index.`, 404, 'PAPER_NOT_FOUND');
    }

    const work = await response.json();
    return normalizeOpenAlexWork(work);
  } catch (error) {
    logger.error('Failed to get paper by external ID', error);
    throw error;
  }
}
