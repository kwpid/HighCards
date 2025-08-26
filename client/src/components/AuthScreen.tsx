import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { InsertUser } from "@shared/schema";

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const email = formData.get('email') as string;

    try {
      if (isSignUp) {
        const userData: InsertUser = {
          username: username.trim(),
          password,
          email: email?.trim() || undefined,
        };
        await signUp(userData);
        toast({
          title: "Account created successfully!",
          description: "Welcome to HighCard!",
        });
      } else {
        await signIn(username.trim(), password);
        toast({
          title: "Signed in successfully!",
          description: `Welcome back, ${username}!`,
        });
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Signup failed" : "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Game Logo */}
        <div className="text-center">
          <h1 className="text-6xl font-black text-primary mb-2" data-testid="logo-title">HighCard</h1>
          <p className="text-muted-foreground text-lg" data-testid="logo-subtitle">Competitive Card Gaming</p>
        </div>

        {/* Auth Form */}
        <Card className="bg-card border border-border shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid={isSignUp ? "signup-form" : "login-form"}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground" data-testid="form-title">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-muted-foreground" data-testid="form-subtitle">
                  {isSignUp ? "Join the HighCard community" : "Sign in to your account"}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                    Username
                  </Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9]+"
                    className="w-full"
                    placeholder={isSignUp ? "3-20 characters, English only" : "Enter your username"}
                    data-testid="input-username"
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No spaces allowed, must be unique
                    </p>
                  )}
                </div>
                
                {isSignUp && (
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full"
                      placeholder="your.email@example.com"
                      data-testid="input-email"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full"
                    placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={loading}
                data-testid={isSignUp ? "button-signup" : "button-signin"}
              >
                {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary/80 text-sm"
                  data-testid="button-toggle-auth"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
