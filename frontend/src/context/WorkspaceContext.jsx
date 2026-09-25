import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/workspaces');
      const list = data?.workspaces || [];
      setWorkspaces(list);

      // If current workspace is set, refresh its data
      if (currentWorkspace) {
        const updated = list.find(w => w.id === currentWorkspace.id);
        if (updated) setCurrentWorkspace(updated);
      } else if (list.length > 0) {
        // Default to first active workspace
        setCurrentWorkspace(list[0]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentWorkspace]);

  useEffect(() => {
    fetchWorkspaces();
  }, [isAuthenticated]);

  const selectWorkspace = useCallback(async (workspaceId) => {
    if (!workspaceId) return null;
    try {
      setLoading(true);
      const data = await api.get(`/workspaces/${workspaceId}`);
      if (data?.workspace) {
        setCurrentWorkspace(data.workspace);
        return data.workspace;
      }
    } catch (err) {
      console.error('Failed to select workspace:', err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  const refreshCurrentWorkspace = useCallback(async () => {
    if (currentWorkspace?.id) {
      await selectWorkspace(currentWorkspace.id);
      // Also refresh list
      const data = await api.get('/workspaces');
      if (data?.workspaces) setWorkspaces(data.workspaces);
    }
  }, [currentWorkspace, selectWorkspace]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      loading,
      fetchWorkspaces,
      selectWorkspace,
      setCurrentWorkspace,
      refreshCurrentWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
