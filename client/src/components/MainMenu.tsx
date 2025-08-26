import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getSeasonCountdown, getRankFromMMR } from "@/lib/gameLogic";
import { Trophy, Gamepad2, Users, GraduationCap, Package, BarChart3, Settings, Crown } from "lucide-react";

interface MainMenuProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  const { user, playerSeason, signOut } = useAuth();
  const [countdown, setCountdown] = useState(getSeasonCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getSeasonCountdown());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const get1v1Rank = () => {
    if (!playerSeason?.ranks['1v1']) return { rank: 'Unranked', mmr: 0, gamesPlayed: 0 };
    const rank = playerSeason.ranks['1v1'];
    const rankInfo = getRankFromMMR(rank.mmr);
    return {
      rank: `${rankInfo.rank} ${rankInfo.division > 1 ? rankInfo.division : ''}`.trim(),
      mmr: rank.mmr,
      gamesPlayed: rank.gamesPlayed,
    };
  };

  const get2v2Rank = () => {
    if (!playerSeason?.ranks['2v2']) return { rank: 'Unranked', mmr: 0, gamesPlayed: 0 };
    const rank = playerSeason.ranks['2v2'];
    const rankInfo = getRankFromMMR(rank.mmr);
    return {
      rank: `${rankInfo.rank} ${rankInfo.division > 1 ? rankInfo.division : ''}`.trim(),
      mmr: rank.mmr,
      gamesPlayed: rank.gamesPlayed,
    };
  };

  const rank1v1 = get1v1Rank();
  const rank2v2 = get2v2Rank();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-black text-primary" data-testid="logo-header">HighCard</h1>
              <div className="hidden sm:block">
                <span className="text-sm text-muted-foreground">Season Pre-Season</span>
              </div>
            </div>
            
            {/* Season Countdown */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Season 1 starts in</p>
                <p className="text-lg font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent" data-testid="season-countdown">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m
                </p>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground" data-testid="user-username">
                    {user?.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Level <span data-testid="user-level">{user?.level}</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-full"></div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  data-testid="button-signout"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Game Mode Buttons */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="title-game-modes">
            Choose Your Game Mode
          </h2>
          <p className="text-lg text-muted-foreground">
            Test your skills in casual matches or climb the ranked ladder
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Casual Mode */}
          <Card className="bg-card border border-border card-hover cursor-pointer" onClick={() => onNavigate('game-mode-selection', { isRanked: false })}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Gamepad2 className="text-2xl text-accent" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="mode-casual-title">Casual</h3>
              <p className="text-muted-foreground mb-6">Practice your skills in relaxed matches</p>
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
                data-testid="button-casual"
              >
                Play Casual
              </Button>
            </CardContent>
          </Card>

          {/* Ranked Mode */}
          <Card className="bg-card border border-border card-hover cursor-pointer" onClick={() => onNavigate('game-mode-selection', { isRanked: true })}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Trophy className="text-2xl text-primary" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="mode-ranked-title">Ranked</h3>
              <p className="text-muted-foreground mb-6">Compete for glory and climb the ladder</p>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                data-testid="button-ranked"
              >
                Play Ranked
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Ranks Display */}
        <Card className="bg-card border border-border mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-4" data-testid="title-current-rankings">Current Rankings</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* 1v1 Rank */}
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">1v1 Ranked</span>
                  <span className="text-xs text-muted-foreground" data-testid="rank-1v1-games">
                    {rank1v1.gamesPlayed} games
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-primary to-primary/80 w-8 h-8 rounded-full flex items-center justify-center">
                    <Trophy className="text-xs text-primary-foreground" size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground" data-testid="rank-1v1-title">
                      {rank1v1.rank}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span data-testid="rank-1v1-mmr">{rank1v1.mmr}</span> MMR
                    </p>
                  </div>
                </div>
              </div>

              {/* 2v2 Rank */}
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">2v2 Ranked</span>
                  <span className="text-xs text-muted-foreground" data-testid="rank-2v2-games">
                    {rank2v2.gamesPlayed} games
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center">
                    <Users className="text-xs text-white" size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground" data-testid="rank-2v2-title">
                      {rank2v2.rank}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span data-testid="rank-2v2-mmr">{rank2v2.mmr}</span> MMR
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="secondary" 
            className="py-8 flex flex-col items-center space-y-2"
            data-testid="button-tutorial"
          >
            <GraduationCap size={24} />
            <span className="text-sm font-medium">Tutorial</span>
          </Button>
          
          <Button 
            variant="secondary" 
            className="py-8 flex flex-col items-center space-y-2 opacity-50 cursor-not-allowed"
            disabled
            data-testid="button-inventory"
          >
            <Package size={24} />
            <span className="text-sm font-medium">Inventory</span>
            <span className="text-xs text-muted-foreground">(Coming Soon)</span>
          </Button>
          
          <Button 
            variant="secondary" 
            className="py-8 flex flex-col items-center space-y-2"
            data-testid="button-stats"
          >
            <BarChart3 size={24} />
            <span className="text-sm font-medium">Stats</span>
          </Button>
          
          <Button 
            variant="secondary" 
            className="py-8 flex flex-col items-center space-y-2"
            data-testid="button-settings"
          >
            <Settings size={24} />
            <span className="text-sm font-medium">Settings</span>
          </Button>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="secondary" 
            className="opacity-50 cursor-not-allowed"
            disabled
            data-testid="button-leaderboards"
          >
            <Crown className="mr-2" size={18} />
            Leaderboards (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
