import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Public Pages
import { HomePage } from './pages/HomePage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';

// Authenticated Pages
import { DashboardPage } from './pages/DashboardPage.jsx';
import { NewWorkspacePage } from './pages/NewWorkspacePage.jsx';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage.jsx';
import { DiscoverPage } from './pages/DiscoverPage.jsx';
import { LibraryPage } from './pages/LibraryPage.jsx';
import { PaperDetailPage } from './pages/PaperDetailPage.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { EvidencePage } from './pages/EvidencePage.jsx';
import { AskQaPage } from './pages/AskQaPage.jsx';
import { ComparePage } from './pages/ComparePage.jsx';
import { ConflictsPage } from './pages/ConflictsPage.jsx';
import { GapsPage } from './pages/GapsPage.jsx';
import { ResearchMapPage } from './pages/ResearchMapPage.jsx';
import { TimelinePage } from './pages/TimelinePage.jsx';
import { NotesPage } from './pages/NotesPage.jsx';
import { LiteratureReviewPage } from './pages/LiteratureReviewPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspaces" element={<Navigate to="/dashboard" replace />} />
              <Route path="/workspaces/new" element={<NewWorkspacePage />} />

              {/* Workspace Specific Feature Routes */}
              <Route path="/workspaces/:workspaceId" element={<WorkspaceOverviewPage />} />
              <Route path="/workspaces/:workspaceId/discover" element={<DiscoverPage />} />
              <Route path="/workspaces/:workspaceId/library" element={<LibraryPage />} />
              <Route path="/workspaces/:workspaceId/paper/:paperId" element={<PaperDetailPage />} />
              <Route path="/workspaces/:workspaceId/documents" element={<DocumentsPage />} />
              <Route path="/workspaces/:workspaceId/evidence" element={<EvidencePage />} />
              <Route path="/workspaces/:workspaceId/ask" element={<AskQaPage />} />
              <Route path="/workspaces/:workspaceId/compare" element={<ComparePage />} />
              <Route path="/workspaces/:workspaceId/conflicts" element={<ConflictsPage />} />
              <Route path="/workspaces/:workspaceId/gaps" element={<GapsPage />} />
              <Route path="/workspaces/:workspaceId/map" element={<ResearchMapPage />} />
              <Route path="/workspaces/:workspaceId/timeline" element={<TimelinePage />} />
              <Route path="/workspaces/:workspaceId/notes" element={<NotesPage />} />
              <Route path="/workspaces/:workspaceId/literature-review" element={<LiteratureReviewPage />} />

              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
