import { useState } from "react";
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

type ScreenName = 'auth' | 'menu' | 'game-mode-selection' | 'queue' | 'game' | 'result';

interface NavigationState {
  screen: ScreenName;
  data?: any;
}

interface ComponentNavigationProps {
  onNavigate: (screen: string, data?: any) => void;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [navigation, setNavigation] = useState<NavigationState>({ 
    screen: user ? 'menu' : 'auth' 
  });

  const navigate = (screen: ScreenName, data?: any) => {
    setNavigation({ screen, data });
  };

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

  if (!user) {
    return <AuthScreen />;
  }

  switch (navigation.screen) {
    case 'menu':
      return <MainMenu onNavigate={navigate as ComponentNavigationProps['onNavigate']} />;
    
    case 'game-mode-selection':
      return (
        <GameModeSelection 
          onNavigate={navigate as ComponentNavigationProps['onNavigate']}
          isRanked={navigation.data?.isRanked || false}
        />
      );
    
    case 'queue':
      return (
        <QueueScreen 
          onNavigate={navigate as ComponentNavigationProps['onNavigate']}
          gameMode={navigation.data?.mode || '1v1'}
          isRanked={navigation.data?.isRanked || false}
        />
      );
    
    case 'game':
      return (
        <GameScreen 
          onNavigate={navigate as ComponentNavigationProps['onNavigate']}
          gameMode={navigation.data?.gameMode || '1v1'}
          isRanked={navigation.data?.isRanked || false}
          playerName={navigation.data?.playerName || user.username}
        />
      );
    
    case 'result':
      return (
        <GameResultScreen 
          onNavigate={navigate as ComponentNavigationProps['onNavigate']}
          gameState={navigation.data?.gameState}
          gameMode={navigation.data?.gameMode || '1v1'}
          isRanked={navigation.data?.isRanked || false}
        />
      );
    
    default:
      return <MainMenu onNavigate={navigate as ComponentNavigationProps['onNavigate']} />;
  }
}

function App() {
  return (
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
  );
}

export default App;
