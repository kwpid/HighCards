import type { Card, GameState } from "@shared/schema";
import { nanoid } from "nanoid";

// AI opponent names
const AI_NAMES = {
  regular: [
    "CyberNinja", "QuantumBot", "DataMancer", "CodeBreaker", "SyntaxKing",
    "ByteBeast", "PixelPilot", "LogicLord", "CipherSage", "BinaryBard",
    "TechTitan", "DigitalDuke", "NetNomad", "CryptoChamp", "VirtualViper"
  ],
  highRanked: [
    "AlgoMaster", "QuantumQueen", "CodeColossus", "DataDeity", "SyntaxSovereign",
    "ByteEmperor", "PixelPharaoh", "LogicLegend", "CipherCzar", "BinaryBoss",
    "TechTyrant", "DigitalDynasty", "NetNinja", "CryptoKing", "VirtualVanguard"
  ]
};

// Card values for comparison (higher index = higher value)
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'] as const;

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  
  // Generate regular cards
  for (const suit of SUITS) {
    for (const value of CARD_VALUES) {
      deck.push({
        id: nanoid(),
        type: 'regular',
        value,
        suit,
      });
    }
  }
  
  return shuffleArray(deck);
}

export function generateHand(deck: Card[]): { hand: Card[], remainingDeck: Card[] } {
  const hand: Card[] = [];
  const remainingDeck = [...deck];
  
  // Draw 8 regular cards
  for (let i = 0; i < 8; i++) {
    hand.push(remainingDeck.pop()!);
  }
  
  // Add 2 power-up cards
  const powerTypes = ['BOOST', 'DOUBLE', 'STEAL', 'SHIELD'] as const;
  for (let i = 0; i < 2; i++) {
    const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
    hand.push({
      id: nanoid(),
      type: 'powerup',
      powerType,
      powerValue: powerType === 'BOOST' ? 3 : powerType === 'DOUBLE' ? 2 : 1,
    });
  }
  
  return { hand, remainingDeck };
}

export function getCardNumericValue(card: Card): number {
  if (card.type === 'regular' && card.value) {
    return CARD_VALUES.indexOf(card.value) + 2; // 2-14 range
  }
  return 0;
}

export function applyPowerUp(baseValue: number, powerCard: Card): number {
  if (powerCard.type !== 'powerup') return baseValue;
  
  switch (powerCard.powerType) {
    case 'BOOST':
      return baseValue + (powerCard.powerValue || 3);
    case 'DOUBLE':
      return baseValue * (powerCard.powerValue || 2);
    default:
      return baseValue;
  }
}

export function calculateRoundWinner(playedCards: Record<string, Card>, playerIds: string[]): string | null {
  let highestValue = -1;
  let winner = null;
  
  for (const playerId of playerIds) {
    const card = playedCards[playerId];
    if (card) {
      const cardValue = getCardNumericValue(card);
      const finalValue = card.type === 'powerup' ? 
        applyPowerUp(0, card) : cardValue;
      
      if (finalValue > highestValue) {
        highestValue = finalValue;
        winner = playerId;
      }
    }
  }
  
  return winner;
}

export function calculateTeamScore(playedCards: Record<string, Card>, team1Ids: string[], team2Ids: string[]): { team1: number, team2: number } {
  const team1Score = team1Ids.reduce((sum, playerId) => {
    const card = playedCards[playerId];
    return sum + (card ? getCardNumericValue(card) : 0);
  }, 0);
  
  const team2Score = team2Ids.reduce((sum, playerId) => {
    const card = playedCards[playerId];
    return sum + (card ? getCardNumericValue(card) : 0);
  }, 0);
  
  return { team1: team1Score, team2: team2Score };
}

export function getAIName(mmr: number): string {
  const isHighRanked = mmr > 600; // Gold+ MMR
  const names = isHighRanked ? AI_NAMES.highRanked : AI_NAMES.regular;
  return names[Math.floor(Math.random() * names.length)];
}

export function calculateMMRChange(playerMMR: number, opponentMMR: number, won: boolean): number {
  const kFactor = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  const actualScore = won ? 1 : 0;
  
  return Math.round(kFactor * (actualScore - expectedScore));
}

export function getQueueTime(mmr: number): number {
  // Higher MMR = longer queue time (3-20 seconds)
  const baseTime = 3000; // 3 seconds
  const maxExtraTime = 17000; // 17 additional seconds
  const mmrFactor = Math.min(mmr / 1000, 1); // Cap at 1000 MMR for max queue time
  
  return baseTime + (maxExtraTime * mmrFactor);
}

export function getRankFromMMR(mmr: number): { rank: string, division: number } {
  if (mmr < 100) return { rank: 'Bronze', division: 1 };
  if (mmr < 200) return { rank: 'Bronze', division: 2 };
  if (mmr < 300) return { rank: 'Bronze', division: 3 };
  if (mmr < 400) return { rank: 'Silver', division: 1 };
  if (mmr < 500) return { rank: 'Silver', division: 2 };
  if (mmr < 600) return { rank: 'Silver', division: 3 };
  if (mmr < 700) return { rank: 'Gold', division: 1 };
  if (mmr < 800) return { rank: 'Gold', division: 2 };
  if (mmr < 900) return { rank: 'Gold', division: 3 };
  if (mmr < 1000) return { rank: 'Platinum', division: 1 };
  if (mmr < 1100) return { rank: 'Platinum', division: 2 };
  if (mmr < 1200) return { rank: 'Platinum', division: 3 };
  if (mmr < 1300) return { rank: 'Diamond', division: 1 };
  if (mmr < 1400) return { rank: 'Diamond', division: 2 };
  if (mmr < 1500) return { rank: 'Diamond', division: 3 };
  if (mmr < 1600) return { rank: 'Champion', division: 1 };
  if (mmr < 1700) return { rank: 'Champion', division: 2 };
  if (mmr < 1800) return { rank: 'Champion', division: 3 };
  return { rank: 'Grand Champion', division: 1 };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getSeasonCountdown(): { days: number, hours: number, minutes: number } {
  const seasonStart = new Date('2025-09-01T00:00:00Z');
  const now = new Date();
  const diff = seasonStart.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}
