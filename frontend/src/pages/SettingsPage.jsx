import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  Settings,
  User,
  Shield,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('/health');
        setHealth(res);
      } catch (e) {
        setHealth({ status: 'offline', error: e.message });
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Settings & Environment"
        description="Manage your researcher profile, inspect database integrity, and verify Gemini AI service configuration."
      />

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Account Identifier
            </span>
            <span className="font-mono text-slate-700">{user?.id}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Member Since
            </span>
            <span className="font-medium text-slate-700">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Researcher'}
            </span>
          </div>
        </div>
      </div>

      {/* System & AI Engine Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">System Architecture & AI Configuration</h3>
          </div>
          <Badge variant={health?.status === 'online' ? 'success' : 'danger'}>
            API {health?.status === 'online' ? 'ONLINE' : 'UNREACHABLE'}
          </Badge>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 text-sm">PostgreSQL Relational Storage</p>
              <p className="text-slate-600 mt-0.5">
                All research workspaces, papers, documents, chunks, and evidence are persistently stored in PostgreSQL with strict user-level authorization isolation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Scholarly Discovery Services</p>
              <p className="text-slate-600 mt-0.5">
                Active real-time API integrations with <strong>OpenAlex</strong> (250M+ scholarly works) and <strong>Crossref</strong> (DOI registry).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
            <Key className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-bold text-blue-950 text-sm">Google Gemini AI Engine (@google/genai)</p>
              <p className="text-blue-900 leading-relaxed">
                ResearchLens utilizes official server-side Gemini 2.5 Flash for grounded analysis and research gap detection.
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-blue-200 font-mono text-[11px] text-slate-700">
                To connect your live Gemini key, add to your <code>backend/.env</code>: <br />
                <span className="font-bold text-blue-700">GEMINI_API_KEY=AIzaSy...</span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                *When no key is configured or offline, ResearchLens automatically falls back to deterministic text-parsing heuristics so research workflows are never blocked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 md:p-8 shadow-2xs flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-red-900">Sign Out of Session</h4>
          <p className="text-xs text-slate-500 mt-0.5">End your current session and clear local authorization credentials.</p>
        </div>
        <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
