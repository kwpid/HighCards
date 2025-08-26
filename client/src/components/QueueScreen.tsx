import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getQueueTime, getRankFromMMR } from "@/lib/gameLogic";
import { Search } from "lucide-react";

interface QueueScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  gameMode: '1v1' | '2v2';
  isRanked: boolean;
}

export function QueueScreen({ onNavigate, gameMode, isRanked }: QueueScreenProps) {
  const { user, playerSeason } = useAuth();
  const [queueTime, setQueueTime] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState("");

  useEffect(() => {
    // Get player's MMR for this game mode
    const playerMMR = playerSeason?.ranks[gameMode]?.mmr || 0;
    const estimatedMs = getQueueTime(playerMMR);
    
    setEstimatedWait(estimatedMs > 15000 ? "15-20 seconds" : "3-10 seconds");
    
    // Start queue timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setQueueTime(Math.floor(elapsed / 1000));
    }, 1000);

    // Simulate finding a match
    const matchTimer = setTimeout(() => {
      onNavigate('game', { 
        gameMode, 
        isRanked,
        playerName: user?.username || 'Player'
      });
    }, estimatedMs);

    return () => {
      clearInterval(timer);
      clearTimeout(matchTimer);
    };
  }, [gameMode, isRanked, playerSeason, user, onNavigate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlayerRank = () => {
    if (!isRanked || !playerSeason?.ranks[gameMode]) return "Unranked";
    
    const rank = playerSeason.ranks[gameMode];
    const rankInfo = getRankFromMMR(rank.mmr);
    return `${rankInfo.rank} ${rankInfo.division > 1 ? rankInfo.division : ''}`.trim();
  };

  const handleCancel = () => {
    onNavigate('game-mode-selection', { isRanked });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 animate-pulse" data-testid="queue-animation">
            <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
              <Search className="text-3xl text-primary" size={40} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="title-finding-match">
            Finding Match
          </h2>
          <p className="text-muted-foreground mb-4">Searching for opponents...</p>
          <div className="text-lg font-medium text-primary" data-testid="queue-time">
            {formatTime(queueTime)}
          </div>
        </div>

        {/* Queue Status */}
        <Card className="bg-card border border-border mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Game Mode:</span>
                <span className="text-foreground font-medium" data-testid="queue-mode">
                  {gameMode} {isRanked ? 'Ranked' : 'Casual'}
                </span>
              </div>
              
              {isRanked && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Rank:</span>
                  <span className="text-foreground font-medium" data-testid="queue-rank">
                    {getPlayerRank()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Time:</span>
                <span className="text-foreground font-medium" data-testid="queue-estimated-time">
                  {estimatedWait}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="destructive"
          onClick={handleCancel}
          data-testid="button-cancel-queue"
        >
          Cancel Queue
        </Button>
      </div>
    </div>
  );
}
