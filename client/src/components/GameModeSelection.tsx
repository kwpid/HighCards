import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users, UserCheck, Info } from "lucide-react";

interface GameModeSelectionProps {
  onNavigate: (screen: string, data?: any) => void;
  isRanked: boolean;
}

export function GameModeSelection({ onNavigate, isRanked }: GameModeSelectionProps) {
  const { playerSeason } = useAuth();

  const getPlacementInfo = (mode: '1v1' | '2v2') => {
    if (!isRanked || !playerSeason) return null;
    
    const rank = playerSeason.ranks[mode];
    if (rank && rank.placementMatches < 5) {
      return {
        remaining: 5 - rank.placementMatches,
        completed: rank.placementMatches,
        progress: (rank.placementMatches / 5) * 100,
      };
    }
    return null;
  };

  const placement1v1 = getPlacementInfo('1v1');
  const placement2v2 = getPlacementInfo('2v2');
  const showPlacementInfo = placement1v1 || placement2v2;

  const handleModeSelect = (mode: '1v1' | '2v2') => {
    onNavigate('queue', { mode, isRanked });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('menu')}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            <ArrowLeft size={18} />
            <span>Back to Menu</span>
          </Button>
          <h1 className="text-3xl font-bold text-foreground" data-testid="title-select-mode">
            Select Game Mode
          </h1>
          <div></div>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 1v1 Mode */}
          <Card className="bg-card border border-border card-hover cursor-pointer" onClick={() => handleModeSelect('1v1')}>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserCheck className="text-3xl text-accent" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="mode-1v1-title">1v1</h3>
                <p className="text-muted-foreground">Face off against a single AI opponent</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Players:</span>
                  <span className="text-foreground">You vs AI</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cards per player:</span>
                  <span className="text-foreground">8 + 2 Power-ups</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rounds:</span>
                  <span className="text-foreground">10</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
                data-testid="button-queue-1v1"
              >
                Find Match
              </Button>
            </CardContent>
          </Card>

          {/* 2v2 Mode */}
          <Card className="bg-card border border-border card-hover cursor-pointer" onClick={() => handleModeSelect('2v2')}>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-3xl text-primary" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="mode-2v2-title">2v2</h3>
                <p className="text-muted-foreground">Team up with AI against two opponents</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Players:</span>
                  <span className="text-foreground">You + AI vs AI + AI</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cards per player:</span>
                  <span className="text-foreground">8 + 2 Power-ups</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scoring:</span>
                  <span className="text-foreground">Team totals</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                data-testid="button-queue-2v2"
              >
                Find Match
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Placement Matches Info (for ranked) */}
        {showPlacementInfo && (
          <Card className="bg-accent/10 border border-accent/20 mt-8" data-testid="placement-info">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Info className="text-accent mt-1" size={20} />
                <div className="flex-1">
                  <h4 className="font-bold text-accent mb-2">Placement Matches</h4>
                  {placement1v1 && (
                    <div className="mb-4">
                      <p className="text-accent-foreground/80 text-sm mb-3">
                        <strong>1v1:</strong> Complete <strong data-testid="placement-1v1-remaining">{placement1v1.remaining}</strong> more placement matches to receive your initial rank.
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-accent-foreground/80">Progress:</span>
                        <div className="flex-1 bg-accent/20 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${placement1v1.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-accent" data-testid="placement-1v1-progress">
                          {placement1v1.completed}/5
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {placement2v2 && (
                    <div>
                      <p className="text-accent-foreground/80 text-sm mb-3">
                        <strong>2v2:</strong> Complete <strong data-testid="placement-2v2-remaining">{placement2v2.remaining}</strong> more placement matches to receive your initial rank.
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-accent-foreground/80">Progress:</span>
                        <div className="flex-1 bg-accent/20 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${placement2v2.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-accent" data-testid="placement-2v2-progress">
                          {placement2v2.completed}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
