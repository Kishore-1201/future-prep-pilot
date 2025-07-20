
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthForm } from './components/AuthForm';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import { Brain } from 'lucide-react';

const queryClient = new QueryClient();

const App = () => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [authKey, setAuthKey] = useState(0);

  const handleAuthSuccess = () => {
    setAuthKey(prev => prev + 1);
  };

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!isAuthenticated ? (
          <AuthForm key={authKey} onAuthSuccess={handleAuthSuccess} />
        ) : (
          <Dashboard userProfile={profile} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
