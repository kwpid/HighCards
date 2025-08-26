import { z } from "zod";

// User authentication and profile schema
export const insertUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9]+$/, "Username must contain only English characters and numbers, no spaces"),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().optional(),
  level: z.number().default(1),
  totalGames: z.number().default(0),
  totalWins: z.number().default(0),
  createdAt: z.string(),
});

// Rank system schema
export const rankSchema = z.object({
  mmr: z.number().default(0),
  rank: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion']).default('Bronze'),
  division: z.number().min(1).max(3).default(1),
  placementMatches: z.number().default(0),
  gamesPlayed: z.number().default(0),
  wins: z.number().default(0),
});

// Card schema
export const cardSchema = z.object({
  id: z.string(),
  type: z.enum(['regular', 'powerup']),
  value: z.string().optional(), // For regular cards: '2', '3', ..., 'K', 'A'
  suit: z.enum(['♠', '♥', '♦', '♣']).optional(), // For regular cards
  powerType: z.enum(['BOOST', 'DOUBLE', 'STEAL', 'SHIELD']).optional(), // For power-up cards
  powerValue: z.number().optional(), // Power-up effect value
});

// Game state schema
export const gameStateSchema = z.object({
  id: z.string(),
  mode: z.enum(['1v1', '2v2']),
  isRanked: z.boolean(),
  players: z.array(z.object({
    id: z.string(),
    username: z.string(),
    isAI: z.boolean(),
    team: z.number().optional(), // For 2v2: 1 or 2
    score: z.number().default(0),
    roundsWon: z.number().default(0),
    hand: z.array(cardSchema),
  })),
  currentRound: z.number().default(1),
  maxRounds: z.number().default(10),
  playedCards: z.record(z.string(), cardSchema), // playerId -> card
  roundResults: z.array(z.object({
    round: z.number(),
    winner: z.string().nullable(), // playerId or 'tie'
    scores: z.record(z.string(), z.number()), // playerId -> round score
  })),
  gameStatus: z.enum(['waiting', 'playing', 'finished']).default('waiting'),
  createdAt: z.string(),
});

// Season schema
export const seasonSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
});

// Player season data
export const playerSeasonSchema = z.object({
  userId: z.string(),
  seasonId: z.string(),
  ranks: z.record(z.string(), rankSchema), // gameMode -> rank data
  seasonRewards: z.object({
    wins: z.record(z.string(), z.number()), // gameMode -> wins
    rewardsEarned: z.array(z.string()), // reward IDs
  }),
});

// AI opponent names
export const aiNamesSchema = z.object({
  regular: z.array(z.string()),
  highRanked: z.array(z.string()),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;
export type Rank = z.infer<typeof rankSchema>;
export type Card = z.infer<typeof cardSchema>;
export type GameState = z.infer<typeof gameStateSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type PlayerSeason = z.infer<typeof playerSeasonSchema>;
export type AINames = z.infer<typeof aiNamesSchema>;
