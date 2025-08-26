import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { auth, signUpUser, signInUser, signOutUser, getUserData, getPlayerSeasonData } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import type { User, PlayerSeason, InsertUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  playerSeason: PlayerSeason | null;
  loading: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          const seasonData = await getPlayerSeasonData(firebaseUser.uid);
          setUser(userData);
          setPlayerSeason(seasonData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setPlayerSeason(null);
        }
      } else {
        setUser(null);
        setPlayerSeason(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
  return context;
}
