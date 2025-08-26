import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { auth, signUpUser, signInUser, signOutUser, getUserData, getPlayerSeasonData } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import type { User, PlayerSeason, InsertUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  playerSeason: PlayerSeason | null;
  loading: boolean;
  initialized: boolean;
  signUp: (userData: InsertUser) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshPlayerSeason: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [playerSeason, setPlayerSeason] = useState<PlayerSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;
      
      try {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser.uid);
          const seasonData = await getPlayerSeasonData(firebaseUser.uid);
          
          if (isMounted) {
            setUser(userData);
            setPlayerSeason(seasonData);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setPlayerSeason(null);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setUser(null);
          setPlayerSeason(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (userData: InsertUser) => {
    try {
      const newUser = await signUpUser(userData);
      const seasonData = await getPlayerSeasonData(newUser.id);
      setUser(newUser);
      setPlayerSeason(seasonData);
    } catch (error: any) {
      throw new Error(error.message || "Failed to create account");
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const userData = await signInUser(username, password);
      const seasonData = await getPlayerSeasonData(userData.id);
      setUser(userData);
      setPlayerSeason(seasonData);
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign in");
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setPlayerSeason(null);
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign out");
    }
  };

  const refreshPlayerSeason = async () => {
    if (user) {
      const seasonData = await getPlayerSeasonData(user.id);
      setPlayerSeason(seasonData);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      playerSeason,
      loading,
      initialized,
      signUp,
      signIn,
      signOut,
      refreshPlayerSeason,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // Additional safety check to ensure the hook is fully initialized
  if (!context.initialized && context.loading) {
    // Return a safe default state while initializing
    return {
      user: null,
      playerSeason: null,
      loading: true,
      initialized: false,
      signUp: async () => { throw new Error("Auth not initialized"); },
      signIn: async () => { throw new Error("Auth not initialized"); },
      signOut: async () => { throw new Error("Auth not initialized"); },
      refreshPlayerSeason: async () => { throw new Error("Auth not initialized"); },
    };
  }
  
  return context;
}
