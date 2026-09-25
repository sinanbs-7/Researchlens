import React from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, CheckCircle, ShieldAlert, BookOpen, Layers, ArrowLeft } from 'lucide-react';
import { Button } from '../components/shared/Button.jsx';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900 font-bold">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <span>ResearchLens</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>Back to Home</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 space-y-12">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Scientific Integrity</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Evidence-First AI Architecture
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            ResearchLens was conceived to bridge the dangerous gap between rapid generative AI tools and rigorous scientific inquiry.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="p-6 rounded-2xl bg-blue-50/70 border border-blue-200 text-slate-800">
          <div className="font-semibold text-blue-900 mb-1 text-sm uppercase tracking-wider">Core Mission Directive</div>
          <blockquote className="text-lg md:text-xl font-medium text-slate-900 italic mt-2">
            "Do not merely give the researcher an AI-generated answer. Help the researcher discover, organize, inspect, compare, and trace the evidence behind that answer."
          </blockquote>
        </div>

        {/* 4 Pillars */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Foundational Architectural Principles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Zero Fake Data Guarantee</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All scholarly literature is sourced directly from OpenAlex and Crossref APIs. We never generate fictitious citations, fabricated DOIs, or placeholder authors.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>Source Grounding Over Free Generation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When answering research questions, Gemini operates directly over your workspace papers and uploaded document passages. Unsupported claims are classified explicitly as missing evidence.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                <span>Preservation of Uncertainty</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Divergent findings across papers are analyzed with contextual nuance (sample variations, instrumentation discrepancies) rather than arbitrarily declared contradictions.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span>Strict User Isolation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every workspace, paper, document, and note is secured by PostgreSQL relational constraints and authenticated JWT validation. No cross-user leakage is permitted.
              </p>
            </div>
          </div>
        </div>

        {/* Scholarly Index Sources */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Scholarly Databases Integrated</h2>
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>OpenAlex:</strong> An open catalog of 250M+ scholarly works, authors, institutions, and concepts. We reconstruct complete inverted index abstracts to provide verified context.
            </p>
            <p>
              <strong>Crossref:</strong> The official digital object identifier (DOI) registration agency for academic publishers worldwide, providing cross-publisher metadata and open access validation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
