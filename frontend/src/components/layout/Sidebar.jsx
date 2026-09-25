import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { WorkspaceSelector } from './WorkspaceSelector.jsx';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  FileText,
  ShieldCheck,
  MessageSquare,
  GitCompare,
  Scale,
  Sparkles,
  Share2,
  Clock,
  StickyNote,
  BookMarked,
  Settings,
  HelpCircle,
  FlaskConical
} from 'lucide-react';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { currentWorkspace } = useWorkspace();
  const params = useParams();
  const wsId = currentWorkspace?.id || params.workspaceId;

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Workspace Overview', icon: LayoutDashboard, path: wsId ? `/workspaces/${wsId}` : '/dashboard', exact: true }
      ]
    },
    {
      title: 'SOURCES & EVIDENCE',
      items: [
        { label: 'Discover Sources', icon: Compass, path: wsId ? `/workspaces/${wsId}/discover` : '/dashboard' },
        { label: 'Research Library', icon: BookOpen, path: wsId ? `/workspaces/${wsId}/library` : '/dashboard' },
        { label: 'PDF Documents', icon: FileText, path: wsId ? `/workspaces/${wsId}/documents` : '/dashboard' },
        { label: 'Evidence System', icon: ShieldCheck, path: wsId ? `/workspaces/${wsId}/evidence` : '/dashboard' }
      ]
    },
    {
      title: 'AI SYNTHESIS & ANALYSIS',
      items: [
        { label: 'Grounded Q&A', icon: MessageSquare, path: wsId ? `/workspaces/${wsId}/ask` : '/dashboard' },
        { label: 'Paper Comparison', icon: GitCompare, path: wsId ? `/workspaces/${wsId}/compare` : '/dashboard' },
        { label: 'Agreement / Conflicts', icon: Scale, path: wsId ? `/workspaces/${wsId}/conflicts` : '/dashboard' },
        { label: 'Research Gap Finder', icon: Sparkles, path: wsId ? `/workspaces/${wsId}/gaps` : '/dashboard' }
      ]
    },
    {
      title: 'CONNECTIONS',
      items: [
        { label: 'Research Map', icon: Share2, path: wsId ? `/workspaces/${wsId}/map` : '/dashboard' },
        { label: 'Research Timeline', icon: Clock, path: wsId ? `/workspaces/${wsId}/timeline` : '/dashboard' }
      ]
    },
    {
      title: 'WRITING & EXPORT',
      items: [
        { label: 'Workspace Notes', icon: StickyNote, path: wsId ? `/workspaces/${wsId}/notes` : '/dashboard' },
        { label: 'Literature Review', icon: BookMarked, path: wsId ? `/workspaces/${wsId}/literature-review` : '/dashboard' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
              ResearchLens
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">PRO</span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Evidence-First AI Workspace</p>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="pt-3">
          <WorkspaceSelector />
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={iIdx}
                      to={item.path}
                      end={item.exact}
                      onClick={() => setMobileOpen && setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & API Keys</span>
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Methodology & Help</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
