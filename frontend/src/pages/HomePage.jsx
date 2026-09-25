import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FlaskConical,
  Search,
  FileText,
  ShieldCheck,
  GitCompare,
  Sparkles,
  ArrowRight,
  BookOpen,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/shared/Button.jsx';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">ResearchLens</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition hidden sm:inline-block">
            About & Methodology
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">Go to Workspaces</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Evidence-First AI Research Workspace</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight max-w-4xl mb-6">
          Don't just get an AI answer. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Trace the evidence behind it.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
          ChatGPT gives you an answer. ResearchLens helps you discover real scholarly literature, inspect extracted evidence, compare studies, detect research gaps, and build literature reviews.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link to={isAuthenticated ? "/dashboard" : "/register"} className="w-full sm:w-auto">
            <Button size="lg" variant="primary" icon={ArrowRight} className="w-full sm:w-auto px-8">
              {isAuthenticated ? "Enter Workspace" : "Start Researching Free"}
            </Button>
          </Link>
          <Link to="/about" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn the Principles
            </Button>
          </Link>
        </div>

        {/* Core Differentiation Banner */}
        <div className="mt-16 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-3xl w-full text-left">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">The ResearchLens Paradigm</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <div className="font-semibold text-slate-800 mb-1 text-sm">Generic AI Chatbot</div>
              <p className="font-mono text-slate-500">Prompt &rarr; AI-Generated Guess</p>
              <p className="mt-2 text-slate-500">Prone to hallucinations, unverified citations, fabricated authors, and ephemeral context.</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
              <div className="font-semibold text-blue-900 mb-1 text-sm">ResearchLens Architecture</div>
              <p className="font-mono font-semibold text-blue-700">Sources &rarr; Evidence &rarr; Connections &rarr; Synthesis &rarr; Gaps</p>
              <p className="mt-2 text-blue-800">Persistent scholarly workspaces, real OpenAlex & Crossref literature, verifiable page snippets, and grounded Q&A.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Workflow Section */}
      <section className="bg-white border-y border-slate-200 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              The Complete Academic Research Pipeline
            </h2>
            <p className="text-slate-500 text-sm">
              Replace fragmented tools: search engines, PDF readers, spreadsheets, and chat bots consolidated into one rigorous system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">1. Real Scholarly Discovery</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect directly to millions of peer-reviewed papers via OpenAlex and Crossref. Filter by open access, year, and source type without fake results.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">2. PDF Ingestion & Chunking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload research PDFs. The extraction pipeline validates files, parses text, indexes section headers, and breaks documents into traceable chunks.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">3. Evidence Extraction</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extract methodologies, datasets, sample sizes, and main findings. Every claim points to its source document and page number where available.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">4. Paper Comparison Matrix</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compare multiple studies side-by-side across methodologies, findings, and limitations. Missing information is marked "Not available", never fabricated.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">5. Research Gap Finder</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Identify under-studied populations, geographic voids, methodological limitations, and conflicting findings grounded in your workspace papers.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">6. Relationship Map & Review</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explore real citation and conceptual links between authors and topics, then compile a structured, editable 8-section literature review outline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            <span>ResearchLens</span>
          </div>
          <div>
            Built with React, Express, PostgreSQL & Google Gemini AI. Dedicated to scholarly integrity.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-white transition">About</Link>
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
