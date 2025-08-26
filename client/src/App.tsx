import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Components
import { AuthScreen } from "@/components/AuthScreen";
import { MainMenu } from "@/components/MainMenu";
import { GameModeSelection } from "@/components/GameModeSelection";
import { QueueScreen } from "@/components/QueueScreen";
import { GameScreen } from "@/components/GameScreen";
import { GameResultScreen } from "@/components/GameResultScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type ScreenName = 'auth' | 'menu' | 'game-mode-selection' | 'queue' | 'game' | 'result';

interface NavigationState {
  screen: ScreenName;
  data?: any;
}

interface ComponentNavigationProps {
  onNavigate: (screen: string, data?: any) => void;
}

function AppContent() {
  const { user, loading, initialized } = useAuth();
  const [navigation, setNavigation] = useState<NavigationState>({ 
    screen: 'auth'
  });

  const navigate = React.useCallback((screen: ScreenName, data?: any) => {
    setNavigation({ screen, data });
  }, []);

  // Update navigation when user state changes
  React.useEffect(() => {
    if (initialized && !loading) {
      const targetScreen = user ? 'menu' : 'auth';
      setNavigation(prev => prev.screen !== targetScreen ? { screen: targetScreen } : prev);
    }
  }, [user, loading, initialized]);

  // Early return for loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <p className="text-foreground font-medium">Loading HighCard...</p>
        </div>
      </div>
    );
  }

  // Early return for unauthenticated users
  if (!user) {
    return <AuthScreen />;
  }

  // Render the appropriate screen based on navigation state
  const renderScreen = () => {
    switch (navigation.screen) {
      case 'menu':
        return <MainMenu onNavigate={navigate} />;
      
      case 'game-mode-selection':
        return (
          <GameModeSelection 
            onNavigate={navigate}
            isRanked={navigation.data?.isRanked || false}
          />
        );
      
      case 'queue':
        return (
          <QueueScreen 
            onNavigate={navigate}
            gameMode={navigation.data?.mode || '1v1'}
            isRanked={navigation.data?.isRanked || false}
          />
        );
      
      case 'game':
        return (
          <GameScreen 
            onNavigate={navigate}
            gameMode={navigation.data?.gameMode || '1v1'}
            isRanked={navigation.data?.isRanked || false}
            playerName={navigation.data?.playerName || user.username}
          />
        );
      
      case 'result':
        return (
          <GameResultScreen 
            onNavigate={navigate}
            gameState={navigation.data?.gameState}
            gameMode={navigation.data?.gameMode || '1v1'}
            isRanked={navigation.data?.isRanked || false}
          />
        );
      
      default:
        return <MainMenu onNavigate={navigate} />;
    }
  };

  return renderScreen();
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="highcard-theme">
          <TooltipProvider>
            <AuthProvider>
              <AppContent />
              <Toaster />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
