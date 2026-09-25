import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { ChevronDown, Plus, Layers, Check } from 'lucide-react';

export function WorkspaceSelector() {
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ws) => {
    selectWorkspace(ws.id);
    setIsOpen(false);
    // Keep user in current tab or go to overview
    const currentPath = window.location.pathname;
    const tabMatch = currentPath.match(/\/workspaces\/[^/]+(\/[a-z-]+)?/);
    const subRoute = tabMatch && tabMatch[1] ? tabMatch[1] : '';
    navigate(`/workspaces/${ws.id}${subRoute}`);
  };

  return (
    <div className="relative mb-4 px-3" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition text-left shadow-2xs cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {currentWorkspace ? currentWorkspace.title : 'Select Workspace'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentWorkspace ? currentWorkspace.research_question : 'No workspace selected'}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-3 right-3 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fade-in max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Your Workspaces
          </div>
          {workspaces.map((ws) => {
            const isSelected = currentWorkspace?.id === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer ${
                  isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="truncate pr-2">
                  <p className="truncate font-medium">{ws.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ws.research_field || 'General'}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/workspaces/new');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
