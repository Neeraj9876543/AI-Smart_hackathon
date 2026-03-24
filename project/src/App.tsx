import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SignupPage from "./pages/SignupPage";
import AuthSuccess from "./pages/AuthSuccess";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentMyUploads from "./pages/StudentMyUploads";
import DocumentRepository from "./pages/DocumentRepository";
import AchievementHistory from "./pages/AchievementHistory";
import AchievementUpload from "./pages/AchievementUpload";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSearch from "./pages/AdminSearch";
import AdminVerification from "./pages/AdminVerification";
import AdminAnalytics from "./pages/AdminAnalytics";
import StudentUploadsView from "./pages/StudentUploadsView";
import ResumeAI from "./pages/ResumeAI";
import ProjectUpload from "./pages/ProjectUpload";
import AdminProjects from "./pages/AdminProjects";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <RegisterPage />} />
      <Route path="/signup" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <SignupPage />} />
      <Route path="/auth-success" element={<AuthSuccess />} />
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
      <Route path="/my-uploads" element={<ProtectedRoute requiredRole="student"><StudentMyUploads /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute requiredRole="student"><DocumentRepository /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute requiredRole="student"><AchievementHistory /></ProtectedRoute>} />
      <Route path="/achievement-upload" element={<ProtectedRoute requiredRole="student"><AchievementUpload /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute requiredRole="student"><ProjectUpload /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute requiredRole="student"><ResumeAI /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/search" element={<ProtectedRoute requiredRole="admin"><AdminSearch /></ProtectedRoute>} />
      <Route path="/admin/student/:studentId" element={<ProtectedRoute requiredRole="admin"><StudentUploadsView /></ProtectedRoute>} />
      <Route path="/admin/verify" element={<ProtectedRoute requiredRole="admin"><AdminVerification /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute requiredRole="admin"><AdminProjects /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
