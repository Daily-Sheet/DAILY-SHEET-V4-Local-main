import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Users, MapPin, LogIn, ArrowRight, UserPlus, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { resetBootstrap } from "@/hooks/use-auth";
import { buildApiUrl } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { toast } = useToast();

  const { data: setupStatus } = useQuery<{ needsSetup: boolean }>({
    queryKey: ["/api/auth/check-setup"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/auth/check-setup"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const needsSetup = setupStatus?.needsSetup === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Something went wrong", variant: "destructive" });
        return;
      }

      resetBootstrap();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPending(true);
    try {
      await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setForgotPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display uppercase tracking-wide text-foreground">Daily Sheet</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tight text-foreground leading-tight">
                Your Crew's Command Center
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg">
                Daily Sheet keeps your entire production team on the same page. Schedules, contacts, venues, and crew details -- all in one place, ready to share.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-lg">
                <Card className="col-span-2">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display uppercase text-sm tracking-wide text-foreground">Schedules</h3>
                      <p className="text-sm text-muted-foreground">Daily timelines with load-in, sound check, and show times</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display uppercase text-sm tracking-wide text-foreground">Contacts</h3>
                      <p className="text-sm text-muted-foreground">Band, crew, and client info</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display uppercase text-sm tracking-wide text-foreground">Venues</h3>
                      <p className="text-sm text-muted-foreground">Load-in, parking, WiFi, and venue details</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-center">
              {needsSetup ? (
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-display uppercase tracking-wide">
                      Get Started
                    </CardTitle>
                    <CardDescription>
                      No accounts exist yet. Create the first admin account to set up your organization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/register">
                      <Button className="w-full" data-testid="button-setup-admin">
                        <UserPlus className="mr-2 h-4 w-4" /> Create Admin Account
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : forgotMode ? (
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    {forgotSent ? (
                      <div className="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    ) : null}
                    <CardTitle className="text-2xl font-display uppercase tracking-wide">
                      {forgotSent ? "Check Your Email" : "Forgot Password"}
                    </CardTitle>
                    <CardDescription>
                      {forgotSent
                        ? "If an account exists for that email, a reset link is on its way."
                        : "Enter your email and we'll send you a reset link."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!forgotSent && (
                      <form onSubmit={handleForgot} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Email</label>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={forgotPending}>
                          {forgotPending ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </form>
                    )}
                    <Button variant="ghost" className="w-full" onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}>
                      <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back to Sign In
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-display uppercase tracking-wide">
                      Sign In
                    </CardTitle>
                    <CardDescription>
                      Sign in to access your production dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          data-testid="input-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">Password</label>
                          <button type="button" onClick={() => { setForgotEmail(email); setForgotMode(true); }} className="text-xs text-primary hover:underline">
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          data-testid="input-password"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-auth">
                        {isPending ? (
                          "Please wait..."
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" /> Sign In
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="mt-4 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <Link href="/register?signup=admin" className="text-primary font-medium hover:underline" data-testid="link-create-org">
                          Create an organization <ArrowRight className="inline h-3 w-3" />
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Link href="/register?signup=user" className="text-primary font-medium hover:underline" data-testid="link-create-account">
                          Create an account <ArrowRight className="inline h-3 w-3" />
                        </Link>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Daily Sheet -- Live Event Production Dashboard</span>
        </div>
      </footer>
    </div>
  );
}
