
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthForm } from './components/AuthForm';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { CollegeAdminDashboard } from './pages/CollegeAdminDashboard';
import { CollegeAdminRegistration } from './pages/CollegeAdminRegistration';
import { PendingApproval } from './pages/PendingApproval';
import { Brain } from 'lucide-react';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requiredRole?: string;
  allowPending?: boolean;
}> = ({ children, requiredRole, allowPending = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">CampusConnect</p>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.pending_approval && !allowPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, profile } = useAuth();

  const getDashboardRoute = () => {
    if (!profile) return '/login';
    
    // Super Admin (admin with no college_id)
    if (profile.role === 'admin' && !profile.college_id) {
      return '/super-admin';
    }
    
    // College Admin (admin with college_id)
    if (profile.role === 'admin' && profile.college_id) {
      return '/college-admin';
    }
    
    // Regular users (students, teachers)
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to={getDashboardRoute()} replace /> : <AuthForm onAuthSuccess={() => {}} />
        } 
      />
      <Route path="/register-college-admin" element={<CollegeAdminRegistration />} />
      
      {/* Protected Routes */}
      <Route 
        path="/pending-approval" 
        element={
          <ProtectedRoute allowPending>
            <PendingApproval />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            {profile?.college_id ? <Navigate to="/college-admin" replace /> : <SuperAdminDashboard />}
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/college-admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            {!profile?.college_id ? <Navigate to="/super-admin" replace /> : <CollegeAdminDashboard />}
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard userProfile={profile} />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to={getDashboardRoute()} replace /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
