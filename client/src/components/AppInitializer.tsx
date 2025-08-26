import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { loading, initialized } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only mark as ready when both loading is false and auth is initialized
    if (!loading && initialized) {
      // Add a small delay to ensure all components are properly mounted
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, initialized]);

  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <p className="text-foreground font-medium">Initializing HighCard...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {loading ? 'Loading authentication...' : 'Setting up application...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
