import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGame } from "@/hooks/useGame";
import { useAuth } from "@/hooks/useAuth";
import { getCardNumericValue } from "@/lib/gameLogic";
import type { Card as GameCard } from "@shared/schema";
import { Menu, User, Bot, Crown } from "lucide-react";

interface GameScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  gameMode: '1v1' | '2v2';
  isRanked: boolean;
  playerName: string;
}

export function GameScreen({ onNavigate, gameMode, isRanked, playerName }: GameScreenProps) {
  const { user } = useAuth();
  const { gameState, initializeGame, playCard, nextRound, isRoundComplete, getCurrentRoundWinner, isGameComplete } = useGame();
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [roundResult, setRoundResult] = useState<{ winner: string | null, message: string } | null>(null);
  const [waitingForAI, setWaitingForAI] = useState(false);

  useEffect(() => {
    // Initialize the game when component mounts
    if (!gameState) {
      initializeGame(gameMode, isRanked, user?.username || playerName);
    }
  }, [gameMode, isRanked, playerName, user, gameState, initializeGame]);

  useEffect(() => {
    // Handle AI turns and round completion
    if (gameState && !isGameComplete() && !waitingForAI && gameState.currentRound <= gameState.maxRounds) {
      // Debug log to help identify issues
      console.log('GameScreen useEffect:', {
        currentRound: gameState.currentRound,
        maxRounds: gameState.maxRounds,
        isGameComplete: isGameComplete(),
        waitingForAI,
        hasPlayerPlayed,
        playedCards: Object.keys(gameState.playedCards).length,
        totalPlayers: gameState.players.length
      });
      
      if (isRoundComplete()) {
        // Show round result
        const winner = getCurrentRoundWinner();
        let message = "";
        
        if (gameMode === '1v1') {
          if (winner === 'player') {
            message = "You won this round! +2 points";
          } else if (winner) {
            message = "You lost this round. -1 point";
          } else {
            message = "Round tied!";
          }
        } else {
          // 2v2 mode
          const player = gameState.players.find(p => p.id === 'player');
          if (player && winner === `team${player.team}`) {
            message = "Your team won this round! +2 points";
          } else if (winner) {
            message = "Your team lost this round. -1 point";
          } else {
            message = "Round tied!";
          }
        }
        
        setRoundResult({ winner, message });
      } else if (!hasPlayerPlayed) {
        // Only let AI players make their moves if the player hasn't played yet
        const aiPlayers = gameState.players.filter(p => p.isAI && !gameState.playedCards[p.id]);
        if (aiPlayers.length > 0 && gameState.currentRound <= gameState.maxRounds) {
          // Prevent AI from moving if game is complete or if we're already waiting
          if (isGameComplete() || waitingForAI) {
            return;
          }
          
          // Check if AI players actually have cards to play
          const aiPlayersWithCards = aiPlayers.filter(aiPlayer => 
            aiPlayer.hand.filter(card => card.type === 'regular').length > 0
          );
          
          if (aiPlayersWithCards.length === 0) {
            console.log('AI players have no cards to play');
            return;
          }
          
          console.log('AI is making moves:', aiPlayersWithCards.map(p => p.id));
          setWaitingForAI(true);
          
          // Simulate AI thinking time
          setTimeout(() => {
            // Double-check that game is still active before AI moves
            if (!isGameComplete() && gameState.currentRound <= gameState.maxRounds) {
              aiPlayersWithCards.forEach((aiPlayer) => {
                // AI selects a random card from their hand
                const availableCards = aiPlayer.hand.filter(card => card.type === 'regular');
                if (availableCards.length > 0) {
                  const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
                  playCard(aiPlayer.id, randomCard);
                }
              });
            }
            setWaitingForAI(false);
          }, 1500);
        }
      }
    }
  }, [gameState, isRoundComplete, getCurrentRoundWinner, isGameComplete, gameMode, playCard, waitingForAI, hasPlayerPlayed]);

  if (!gameState) {
    return <div className="min-h-screen flex items-center justify-center">Loading game...</div>;
  }

  const player = gameState.players.find(p => p.id === 'player');
  const opponents = gameState.players.filter(p => p.id !== 'player');
  const hasPlayerPlayed = gameState.playedCards['player'] !== undefined;

  useEffect(() => {
    // Navigate to results screen when game is complete
    if (isGameComplete()) {
      setTimeout(() => {
        onNavigate('result', { 
          gameState,
          gameMode,
          isRanked 
        });
      }, 2000);
    }
  }, [isGameComplete, onNavigate, gameState, gameMode, isRanked]);

  const handleCardSelect = (card: GameCard) => {
    if (hasPlayerPlayed || waitingForAI) return;
    
    setSelectedCard(card);
    playCard('player', card);
  };

  const handleNextRound = () => {
    nextRound();
    setRoundResult(null);
    setSelectedCard(null);
  };

  const getCardDisplay = (card: GameCard) => {
    if (card.type === 'regular') {
      return { value: card.value, suit: card.suit };
    } else {
      return { 
        value: card.powerType === 'BOOST' ? '+3' : 
               card.powerType === 'DOUBLE' ? '×2' :
               card.powerType === 'STEAL' ? 'ST' : 'SH',
        name: card.powerType 
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Game Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground" data-testid="logo-game">HighCard</h1>
              <span className="text-sm text-muted-foreground" data-testid="game-mode-display">
                {gameMode} {isRanked ? 'Ranked' : 'Casual'}
              </span>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Round</p>
              <p className="text-2xl font-bold text-primary" data-testid="current-round">
                {gameState.currentRound}/{gameState.maxRounds}
              </p>
            </div>
            
            <Button variant="ghost" size="sm" data-testid="button-game-menu">
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Player Info Bar */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Player */}
          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid="player-name">
                      {player?.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span data-testid="player-score">{player?.score}</span> pts
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground" data-testid="player-rounds-won">
                    {player?.roundsWon}
                  </p>
                  <p className="text-xs text-muted-foreground">Rounds Won</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opponent(s) */}
          {opponents.map((opponent, index) => (
            <Card key={opponent.id} className="bg-card border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Bot className="text-red-500" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`opponent-${index}-name`}>
                        {opponent.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {gameMode === '2v2' && opponent.team === player?.team ? 'Teammate' : 'Opponent'} • 
                        <span data-testid={`opponent-${index}-score`}> {opponent.score}</span> pts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground" data-testid={`opponent-${index}-rounds-won`}>
                      {opponent.roundsWon}
                    </p>
                    <p className="text-xs text-muted-foreground">Rounds Won</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Game Board */}
        <Card className="bg-card border border-border mb-8">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-2" data-testid="round-title">
                Round {gameState.currentRound}
              </h3>
              {!isRoundComplete() && !hasPlayerPlayed && (
                <p className="text-muted-foreground">Select a card to play this round</p>
              )}
              {waitingForAI && (
                <p className="text-muted-foreground">AI players are making their moves...</p>
              )}
            </div>

            {/* Played Cards Area */}
            {isRoundComplete() && (
              <div className={`grid ${gameMode === '1v1' ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-8 max-w-2xl mx-auto`}>
                {gameState.players.map((gamePlayer) => {
                  const playedCard = gameState.playedCards[gamePlayer.id];
                  const cardDisplay = playedCard ? getCardDisplay(playedCard) : null;
                  
                  return (
                    <div key={gamePlayer.id} className="text-center">
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`played-card-label-${gamePlayer.id}`}>
                        {gamePlayer.id === 'player' ? 'Your Card' : gamePlayer.username}
                      </p>
                      <div className={`w-16 h-20 rounded-lg flex items-center justify-center mx-auto ${
                        playedCard?.type === 'powerup' 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                          : 'bg-secondary border border-border text-foreground'
                      }`}>
                        {cardDisplay && (
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid={`played-card-value-${gamePlayer.id}`}>
                              {cardDisplay.value}
                            </div>
                            {cardDisplay.suit && (
                              <div className="text-sm" data-testid={`played-card-suit-${gamePlayer.id}`}>
                                {cardDisplay.suit}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Round Result */}
            {roundResult && (
              <div className="text-center mb-6">
                <Card className={`inline-block ${
                  roundResult.winner === 'player' || (gameMode === '2v2' && roundResult.winner === `team${player?.team}`)
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <CardContent className="p-3">
                    <p className={`font-medium ${
                      roundResult.winner === 'player' || (gameMode === '2v2' && roundResult.winner === `team${player?.team}`)
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`} data-testid="round-result">
                      {roundResult.message}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Button */}
            {isRoundComplete() && !isGameComplete() && (
              <div className="text-center">
                <Button 
                  onClick={handleNextRound}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  data-testid="button-next-round"
                >
                  Next Round
                </Button>
              </div>
            )}

            {isGameComplete() && (
              <div className="text-center">
                <p className="text-lg font-bold text-primary">Game Complete! Calculating results...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player Hand */}
        {player && !isGameComplete() && (
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <h4 className="text-lg font-bold text-foreground mb-4" data-testid="title-your-hand">Your Hand</h4>
              
              {/* Regular Cards */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">Regular Cards</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {player.hand.filter(card => card.type === 'regular').map((card) => {
                    const cardDisplay = getCardDisplay(card);
                    const isSelected = selectedCard?.id === card.id;
                    
                    return (
                      <div
                        key={card.id}
                        className={`w-16 h-20 rounded-lg flex items-center justify-center cursor-pointer card-hover border ${
                          isSelected 
                            ? 'bg-primary/20 border-primary' 
                            : hasPlayerPlayed || waitingForAI
                              ? 'bg-secondary/50 border-border opacity-50 cursor-not-allowed'
                              : 'bg-secondary border-border hover:border-primary/50'
                        }`}
                        onClick={() => !hasPlayerPlayed && !waitingForAI && handleCardSelect(card)}
                        data-testid={`card-regular-${card.id}`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">{cardDisplay.value}</div>
                          <div className="text-xs text-muted-foreground">{cardDisplay.suit}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Power-Up Cards */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Power-Up Cards</p>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  {player.hand.filter(card => card.type === 'powerup').map((card) => {
                    const cardDisplay = getCardDisplay(card);
                    const isSelected = selectedCard?.id === card.id;
                    
                    return (
                      <div
                        key={card.id}
                        className={`w-20 h-24 rounded-lg flex items-center justify-center cursor-pointer card-hover ${
                          isSelected 
                            ? 'bg-primary border-2 border-primary/50' 
                            : hasPlayerPlayed || waitingForAI
                              ? 'bg-primary/50 opacity-50 cursor-not-allowed'
                              : 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
                        } text-primary-foreground`}
                        onClick={() => !hasPlayerPlayed && !waitingForAI && handleCardSelect(card)}
                        data-testid={`card-powerup-${card.id}`}
                      >
                        <div className="text-center">
                          <div className="text-sm font-bold">{cardDisplay.value}</div>
                          <div className="text-xs opacity-80">{cardDisplay.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
