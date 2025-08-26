import { useState, useCallback } from "react";
import type { GameState, Card } from "@shared/schema";
import { generateDeck, generateHand, calculateRoundWinner, calculateTeamScore, getAIName } from "@/lib/gameLogic";
import { nanoid } from "nanoid";

interface UseGameReturn {
  gameState: GameState | null;
  initializeGame: (mode: '1v1' | '2v2', isRanked: boolean, playerName: string) => GameState;
  playCard: (playerId: string, card: Card) => void;
  nextRound: () => void;
  isRoundComplete: () => boolean;
  getCurrentRoundWinner: () => string | null;
  isGameComplete: () => boolean;
  getFinalScores: () => Record<string, number>;
  resetGame: () => void;
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initializeGame = useCallback((mode: '1v1' | '2v2', isRanked: boolean, playerName: string): GameState => {
    const gameId = nanoid();
    const deck = generateDeck();
    let remainingDeck = [...deck];
    
    const players = [];
    
    // Add human player
    const { hand: playerHand, remainingDeck: deckAfterPlayer } = generateHand(remainingDeck);
    remainingDeck = deckAfterPlayer;
    
    players.push({
      id: 'player',
      username: playerName,
      isAI: false,
      team: mode === '2v2' ? 1 : undefined,
      score: 0,
      roundsWon: 0,
      hand: playerHand,
    });

    if (mode === '1v1') {
      // Add one AI opponent
      const { hand: aiHand } = generateHand(remainingDeck);
      players.push({
        id: 'ai1',
        username: getAIName(600), // Default MMR for AI
        isAI: true,
        score: 0,
        roundsWon: 0,
        hand: aiHand,
      });
    } else {
      // Add AI teammate and two AI opponents
      const { hand: teammateHand, remainingDeck: deckAfterTeammate } = generateHand(remainingDeck);
      remainingDeck = deckAfterTeammate;
      
      players.push({
        id: 'ai_teammate',
        username: getAIName(500),
        isAI: true,
        team: 1,
        score: 0,
        roundsWon: 0,
        hand: teammateHand,
      });

      // Add two opponent AI players
      for (let i = 0; i < 2; i++) {
        const { hand: opponentHand, remainingDeck: deckAfterOpponent } = generateHand(remainingDeck);
        remainingDeck = deckAfterOpponent;
        
        players.push({
          id: `ai_opponent_${i + 1}`,
          username: getAIName(550 + i * 50),
          isAI: true,
          team: 2,
          score: 0,
          roundsWon: 0,
          hand: opponentHand,
        });
      }
    }

    const newGameState: GameState = {
      id: gameId,
      mode,
      isRanked,
      players,
      currentRound: 1,
      maxRounds: 10,
      playedCards: {},
      roundResults: [],
      gameStatus: 'playing',
      createdAt: new Date().toISOString(),
    };

    setGameState(newGameState);
    return newGameState;
  }, []);

  const playCard = useCallback((playerId: string, card: Card) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;
      
      const newPlayedCards = { ...prev.playedCards };
      newPlayedCards[playerId] = card;

      // Remove card from player's hand
      const updatedPlayers = prev.players.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            hand: player.hand.filter(c => c.id !== card.id)
          };
        }
        return player;
      });

      return {
        ...prev,
        players: updatedPlayers,
        playedCards: newPlayedCards,
      };
    });
  }, [gameState]);

  const isRoundComplete = useCallback(() => {
    if (!gameState) return false;
    return Object.keys(gameState.playedCards).length === gameState.players.length;
  }, [gameState]);

  const getCurrentRoundWinner = useCallback(() => {
    if (!gameState || !isRoundComplete()) return null;

    if (gameState.mode === '1v1') {
      const playerIds = gameState.players.map(p => p.id);
      return calculateRoundWinner(gameState.playedCards, playerIds);
    } else {
      // 2v2 mode - compare team totals
      const team1Players = gameState.players.filter(p => p.team === 1).map(p => p.id);
      const team2Players = gameState.players.filter(p => p.team === 2).map(p => p.id);
      const teamScores = calculateTeamScore(gameState.playedCards, team1Players, team2Players);
      
      if (teamScores.team1 > teamScores.team2) {
        return 'team1';
      } else if (teamScores.team2 > teamScores.team1) {
        return 'team2';
      }
      return null; // tie
    }
  }, [gameState, isRoundComplete]);

  const nextRound = useCallback(() => {
    if (!gameState || !isRoundComplete()) return;

    const roundWinner = getCurrentRoundWinner();
    
    setGameState(prev => {
      if (!prev) return null;

      // Calculate round scores
      const roundScores: Record<string, number> = {};
      
      if (prev.mode === '1v1') {
        prev.players.forEach(player => {
          if (roundWinner === player.id) {
            roundScores[player.id] = 2; // Win = +2 points
          } else {
            roundScores[player.id] = -1; // Loss = -1 point
          }
        });
      } else {
        // 2v2 scoring
        prev.players.forEach(player => {
          const playerTeam = `team${player.team}`;
          if (roundWinner === playerTeam) {
            roundScores[player.id] = 2;
          } else if (roundWinner === null) {
            roundScores[player.id] = 0; // Tie = 0 points
          } else {
            roundScores[player.id] = -1;
          }
        });
      }

      // Update player scores and rounds won
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        score: player.score + (roundScores[player.id] || 0),
        roundsWon: roundWinner && 
          (prev.mode === '1v1' ? roundWinner === player.id : 
           roundWinner === `team${player.team}`) 
          ? player.roundsWon + 1 : player.roundsWon,
      }));

      const newRoundResult = {
        round: prev.currentRound,
        winner: roundWinner,
        scores: roundScores,
      };

      const isGameFinished = prev.currentRound >= prev.maxRounds;

      return {
        ...prev,
        players: updatedPlayers,
        roundResults: [...prev.roundResults, newRoundResult],
        currentRound: prev.currentRound + 1,
        playedCards: {},
        gameStatus: isGameFinished ? 'finished' : 'playing',
      };
    });
  }, [gameState, isRoundComplete, getCurrentRoundWinner]);

  const isGameComplete = useCallback(() => {
    return gameState?.gameStatus === 'finished' || gameState?.currentRound > gameState?.maxRounds;
  }, [gameState]);

  const getFinalScores = useCallback(() => {
    if (!gameState) return {};
    
    const scores: Record<string, number> = {};
    gameState.players.forEach(player => {
      scores[player.id] = player.score;
    });
    return scores;
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(null);
  }, []);

  return {
    gameState,
    initializeGame,
    playCard,
    nextRound,
    isRoundComplete,
    getCurrentRoundWinner,
    isGameComplete,
    getFinalScores,
    resetGame,
  };
}
