import React, { lazy, Suspense, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import AdminDevTools from "./components/AdminDevTools";
import OfflineSplash from "./components/OfflineSplash";
import { initializeTheme } from "./utils/themeManager";

// 🚀 Critical pages loaded immediately (NO lazy loading for main flow)
import HomePage from "./pages/HomePage";
import ChapterSelection from "./pages/ChapterSelection";
import QuizPage from "./pages/QuizPage";
import ResultPage from "./pages/ResultPage";
import AdminLogin from "./pages/AdminLogin"; // Load immediately for testing

// 🔄 Admin pages lazy loaded (less frequently used)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const DatabaseManagerPage = lazy(() => import("./pages/DatabaseManagerPage"));
const WordMeaningChapters = lazy(() => import("./pages/WordMeaningChapters"));
const WordMeaningPageSelection = lazy(() => import("./pages/WordMeaningPageSelection"));
const WordMeaningAdmin = lazy(() => import("./pages/WordMeaningAdmin"));
const GitAutoPush = lazy(() => import("./pages/GitAutoPush"));

// Loading component with beautiful spinner
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// 🚀 Prefetch component to preload next pages on hover/mount
const RoutesPrefetch = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Prefetch based on current route
    const prefetchMap = {
      '/': ['/chapters', '/quiz'],
      '/chapters': ['/quiz'],
      '/quiz': ['/result'],
    };
    
    const currentPath = location.pathname;
    const pathKey = Object.keys(prefetchMap).find(key => currentPath.includes(key));
    
    if (pathKey && prefetchMap[pathKey]) {
      // Prefetch next likely routes
      prefetchMap[pathKey].forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'document';
        link.href = route;
        document.head.appendChild(link);
      });
    }
  }, [location]);
  
  return null;
};

function App() {
  // Initialize theme on app load
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <div className="App">
      <OfflineSplash />
      <BrowserRouter>
        <RoutesPrefetch />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main flow - NO lazy loading for instant navigation */}
            <Route path="/" element={<HomePage />} />
            <Route path="/chapters/:subjectId" element={<ChapterSelection />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/result" element={<ResultPage />} />
            
            {/* Word Meaning - Lazy loaded */}
            <Route path="/word-meaning/chapters/:subjectId" element={<WordMeaningChapters />} />
            <Route path="/word-meaning/pages/:chapterId" element={<WordMeaningPageSelection />} />
            
            {/* Admin - Lazy loaded */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/database" element={<DatabaseManagerPage />} />
            <Route path="/admin/word-meaning" element={<WordMeaningAdmin />} />
            <Route path="/admin/push" element={<GitAutoPush />} />
            
            {/* 404 Catch-all: Redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        {/* Admin Dev Tools - Only visible to logged in admins */}
        <AdminDevTools />
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
