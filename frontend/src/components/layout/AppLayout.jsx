import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { TopNavigation } from './TopNavigation.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selectWorkspace, currentWorkspace, workspaces } = useWorkspace();
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  // Keep workspace context in sync with route param
  useEffect(() => {
    if (workspaceId && currentWorkspace?.id !== workspaceId) {
      selectWorkspace(workspaceId);
    }
  }, [workspaceId, currentWorkspace, selectWorkspace]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavigation setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
