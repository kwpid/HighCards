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
import { AppInitializer } from "@/components/AppInitializer";

type ScreenName = 'auth' | 'menu' | 'game-mode-selection' | 'queue' | 'game' | 'result';

interface NavigationState {
  screen: ScreenName;
  data?: any;
}

interface ComponentNavigationProps {
  onNavigate: (screen: string, data?: any) => void;
}

function AppContent() {
  const { user } = useAuth();
  const [navigation, setNavigation] = useState<NavigationState>({ 
    screen: 'auth'
  });

  const navigate = React.useCallback((screen: ScreenName, data?: any) => {
    setNavigation({ screen, data });
  }, []);

  // Update navigation when user state changes
  React.useEffect(() => {
    const targetScreen = user ? 'menu' : 'auth';
    setNavigation(prev => prev.screen !== targetScreen ? { screen: targetScreen } : prev);
  }, [user]);

  // Early return for unauthenticated users
  if (!user) {
    return <AuthScreen />;
  }

  // Safe render function with error handling
  const renderScreen = React.useCallback(() => {
    try {
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
    } catch (error) {
      console.error('Error rendering screen:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">Error Loading Screen</h1>
            <p className="text-muted-foreground mb-4">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
  }, [navigation, navigate, user]);

  return renderScreen();
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="highcard-theme">
          <TooltipProvider>
            <AuthProvider>
              <AppInitializer>
                <AppContent />
                <Toaster />
              </AppInitializer>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
