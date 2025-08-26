import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { updateGameStats, updatePlayerRank } from "@/lib/firebase";
import { calculateMMRChange, getRankFromMMR } from "@/lib/gameLogic";
import type { GameState } from "@shared/schema";
import { Trophy, RotateCcw, User, Bot, Clock, Zap, Crown } from "lucide-react";

interface GameResultScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  gameState: GameState;
  gameMode: '1v1' | '2v2';
  isRanked: boolean;
}

export function GameResultScreen({ onNavigate, gameState, gameMode, isRanked }: GameResultScreenProps) {
  const { user, playerSeason, refreshPlayerSeason } = useAuth();

  const player = gameState.players.find(p => p.id === 'player');
  const opponents = gameState.players.filter(p => p.id !== 'player');

  // Determine if player won
  const playerWon = (() => {
    if (gameMode === '1v1') {
      const opponent = opponents[0];
      return player && opponent && player.score > opponent.score;
    } else {
      // 2v2 mode - compare team scores
      const team1Players = gameState.players.filter(p => p.team === 1);
      const team2Players = gameState.players.filter(p => p.team === 2);
      
      const team1Score = team1Players.reduce((sum, p) => sum + p.score, 0);
      const team2Score = team2Players.reduce((sum, p) => sum + p.score, 0);
      
      const playerTeam = player?.team;
      return playerTeam === 1 ? team1Score > team2Score : team2Score > team1Score;
    }
  })();

  // Calculate match duration (mock for now)
  const matchDuration = "4:32";
  const powerUpsUsed = player?.hand.filter(card => card.type === 'powerup').length || 0;
  const highestCardValue = Math.max(...gameState.roundResults.map(round => 
    Math.max(...Object.values(round.scores))
  ));

  useEffect(() => {
    // Update player stats and rankings
    const updateStats = async () => {
      if (!user || !player) return;

      try {
        // Update general game stats
        await updateGameStats(user.id, playerWon || false);

        // Update ranked stats if this was a ranked match
        if (isRanked && playerSeason) {
          const currentRank = playerSeason.ranks[gameMode];
          const opponentMMR = currentRank.mmr + Math.floor(Math.random() * 200 - 100); // Simulate opponent MMR
          const mmrChange = calculateMMRChange(currentRank.mmr, opponentMMR, playerWon || false);
          
          const newMMR = Math.max(0, currentRank.mmr + mmrChange);
          const newRankInfo = getRankFromMMR(newMMR);
          
          await updatePlayerRank(user.id, gameMode, {
            mmr: newMMR,
            rank: newRankInfo.rank as "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Champion" | "Grand Champion",
            division: newRankInfo.division,
            placementMatches: currentRank.placementMatches < 5 ? currentRank.placementMatches + 1 : 5,
            gamesPlayed: currentRank.gamesPlayed + 1,
            wins: currentRank.wins + (playerWon ? 1 : 0),
          });

          // Refresh player season data
          await refreshPlayerSeason();
        }
      } catch (error) {
        console.error("Error updating player stats:", error);
      }
    };

    updateStats();
  }, [user, player, playerWon, isRanked, gameMode, playerSeason, refreshPlayerSeason]);

  const getRankChange = () => {
    if (!isRanked || !playerSeason) return null;
    
    const currentRank = playerSeason.ranks[gameMode];
    const opponentMMR = currentRank.mmr + Math.floor(Math.random() * 200 - 100);
    const mmrChange = calculateMMRChange(currentRank.mmr, opponentMMR, playerWon || false);
    
    const previousRank = getRankFromMMR(currentRank.mmr);
    const newMMR = Math.max(0, currentRank.mmr + mmrChange);
    const newRank = getRankFromMMR(newMMR);
    
    return {
      previous: `${previousRank.rank} ${previousRank.division > 1 ? previousRank.division : ''}`.trim(),
      new: `${newRank.rank} ${newRank.division > 1 ? newRank.division : ''}`.trim(),
      mmrChange: mmrChange,
    };
  };

  const rankChange = getRankChange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Victory/Defeat Header */}
        <div className="mb-8">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            playerWon ? 'bg-green-500/20' : 'bg-red-500/20'
          }`} data-testid="result-icon">
            <Trophy className={`text-4xl ${playerWon ? 'text-green-500' : 'text-red-500'}`} size={48} />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="result-title">
            {playerWon ? 'Victory!' : 'Defeat'}
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="result-subtitle">
            {playerWon 
              ? 'Great job! You outplayed your opponent.' 
              : 'Better luck next time! Keep practicing.'
            }
          </p>
        </div>

        {/* Match Summary */}
        <Card className="bg-card border border-border mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6" data-testid="title-match-summary">
              Match Summary
            </h3>
            
            {/* Final Scores */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <User className="text-primary text-xl" size={24} />
                </div>
                <p className="font-medium text-foreground" data-testid="final-player-name">
                  {player?.username}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid="final-player-score">
                  {player?.score} pts
                </p>
                <p className="text-sm text-muted-foreground">
                  <span data-testid="final-player-rounds">{player?.roundsWon}</span> rounds won
                </p>
              </div>
              
              {gameMode === '1v1' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Bot className="text-red-500 text-xl" size={24} />
                  </div>
                  <p className="font-medium text-foreground" data-testid="final-opponent-name">
                    {opponents[0]?.username}
                  </p>
                  <p className="text-2xl font-bold text-foreground" data-testid="final-opponent-score">
                    {opponents[0]?.score} pts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span data-testid="final-opponent-rounds">{opponents[0]?.roundsWon}</span> rounds won
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Crown className="text-blue-500 text-xl" size={24} />
                  </div>
                  <p className="font-medium text-foreground">Team vs Team</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {opponents.map((opponent) => (
                      <div key={opponent.id}>
                        {opponent.username}: {opponent.score} pts
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rank Change (for ranked games) */}
            {isRanked && rankChange && (
              <Card className={`${
                playerWon ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
              } mb-6`} data-testid="rank-change">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Previous Rank</p>
                      <p className="font-bold text-foreground" data-testid="rank-previous">
                        {rankChange.previous}
                      </p>
                    </div>
                    <div className={`text-xl ${playerWon ? 'text-green-500' : 'text-red-500'}`}>
                      {playerWon ? '→' : '→'}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">New Rank</p>
                      <p className="font-bold text-foreground" data-testid="rank-new">
                        {rankChange.new}
                      </p>
                    </div>
                  </div>
                  <p className={`text-center font-medium mt-2 ${
                    rankChange.mmrChange > 0 ? 'text-green-500' : 'text-red-500'
                  }`} data-testid="mmr-change">
                    {rankChange.mmrChange > 0 ? '+' : ''}{rankChange.mmrChange} MMR
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Match Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Clock className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground" data-testid="stat-duration">
                  {matchDuration}
                </p>
                <p className="text-sm text-muted-foreground">Match Duration</p>
              </div>
              <div>
                <Zap className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground" data-testid="stat-powerups">
                  {2 - powerUpsUsed}
                </p>
                <p className="text-sm text-muted-foreground">Power-ups Used</p>
              </div>
              <div>
                <Crown className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground" data-testid="stat-highest-score">
                  {highestCardValue}
                </p>
                <p className="text-sm text-muted-foreground">Highest Round Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => onNavigate('game-mode-selection', { isRanked })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            data-testid="button-play-again"
          >
            <RotateCcw className="mr-2" size={18} />
            Play Again
          </Button>
          <Button 
            variant="secondary"
            onClick={() => onNavigate('menu')}
            className="font-medium"
            data-testid="button-back-menu"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
