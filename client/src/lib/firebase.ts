import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import type { User, InsertUser, Rank, PlayerSeason } from "@shared/schema";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBeBwMZF6UbvnwH8GqUZc-1sGN773h0D4M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "highcardsv2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "highcardsv2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "highcardsv2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "534921064111",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:534921064111:web:6444794522d94cc60aee5a",
  measurementId: "G-VQKNXCBN0W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export async function signUpUser(userData: InsertUser): Promise<User> {
  // Check username uniqueness
  const usernameQuery = query(collection(db, 'users'), where('username', '==', userData.username));
  const querySnapshot = await getDocs(usernameQuery);
  
  if (!querySnapshot.empty) {
    throw new Error('Username already taken');
  }

  // Create auth user
  const email = userData.email || `${userData.username}@highcard.local`;
  const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
  const firebaseUser = userCredential.user;

  // Initialize user data
  const newUser: User = {
    id: firebaseUser.uid,
    username: userData.username,
    email: userData.email,
    level: 1,
    totalGames: 0,
    totalWins: 0,
    createdAt: new Date().toISOString(),
  };

  // Save to Firestore
  await setDoc(doc(db, 'users', firebaseUser.uid), {
    ...newUser,
    createdAt: serverTimestamp(),
  });

  // Initialize player season data for current season
  await initializePlayerSeasonData(firebaseUser.uid);

  return newUser;
}

export async function signInUser(username: string, password: string): Promise<User> {
  // Find user by username
  const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
  const querySnapshot = await getDocs(usernameQuery);
  
  if (querySnapshot.empty) {
    throw new Error('Username not found');
  }

  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data() as User;
  
  // Sign in with Firebase Auth
  const email = userData.email || `${username}@highcard.local`;
  await signInWithEmailAndPassword(auth, email, password);
  
  return userData;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserData(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  
  return userDoc.data() as User;
}

export async function getPlayerSeasonData(uid: string, seasonId: string = 'pre-season'): Promise<PlayerSeason | null> {
  const seasonDoc = await getDoc(doc(db, 'playerSeasons', `${uid}_${seasonId}`));
  if (!seasonDoc.exists()) return null;
  
  return seasonDoc.data() as PlayerSeason;
}

async function initializePlayerSeasonData(uid: string, seasonId: string = 'pre-season'): Promise<void> {
  const initialRank: Rank = {
    mmr: 0,
    rank: 'Bronze',
    division: 1,
    placementMatches: 0,
    gamesPlayed: 0,
    wins: 0,
  };

  const playerSeasonData: PlayerSeason = {
    userId: uid,
    seasonId,
    ranks: {
      '1v1': initialRank,
      '2v2': initialRank,
    },
    seasonRewards: {
      wins: {
        '1v1': 0,
        '2v2': 0,
      },
      rewardsEarned: [],
    },
  };

  await setDoc(doc(db, 'playerSeasons', `${uid}_${seasonId}`), playerSeasonData);
}

export async function updatePlayerRank(uid: string, gameMode: string, rankUpdate: Partial<Rank>, seasonId: string = 'pre-season'): Promise<void> {
  const docRef = doc(db, 'playerSeasons', `${uid}_${seasonId}`);
  await updateDoc(docRef, {
    [`ranks.${gameMode}`]: rankUpdate,
  });
}

export async function updateGameStats(uid: string, won: boolean): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userData = await getUserData(uid);
  
  if (userData) {
    await updateDoc(userRef, {
      totalGames: userData.totalGames + 1,
      totalWins: userData.totalWins + (won ? 1 : 0),
    });
  }
}
