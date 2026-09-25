import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import {
  Menu,
  User,
  LogOut,
  Settings,
  Plus,
  HelpCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Button } from '../shared/Button.jsx';

export function TopNavigation({ setMobileOpen }) {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & Workspace Question Focus */}
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentWorkspace ? (
          <div className="hidden sm:flex items-center gap-2 truncate">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
              Focus Question:
            </span>
            <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md truncate max-w-lg border border-slate-200">
              "{currentWorkspace.research_question}"
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Select or create a research workspace to begin.</span>
          </div>
        )}
      </div>

      {/* Right: Quick Actions & User Menu */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={Plus}
          onClick={() => navigate('/workspaces/new')}
          className="hidden sm:inline-flex"
        >
          New Workspace
        </Button>

        {/* User profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden md:inline-block max-w-[120px] truncate">
              {user?.name || 'Researcher'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline-block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Workspaces Dashboard</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings & API Key</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>About & Principles</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
