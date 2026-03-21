import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KeyRound, CheckCircle2, ArrowRight } from "lucide-react";
import { Link, useSearch } from "wouter";
import { buildApiUrl } from "@/lib/api";

export default function ResetPassword() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <h1 className="text-xl font-display uppercase tracking-wide text-foreground">Daily Sheet</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-md">
          {!token ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-display uppercase tracking-wide">Invalid Link</CardTitle>
                <CardDescription>This reset link is missing or malformed.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back to Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : done ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-display uppercase tracking-wide">Password Updated</CardTitle>
                <CardDescription>Your password has been reset. You can now sign in.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display uppercase tracking-wide">New Password</CardTitle>
                <CardDescription>Enter a new password for your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <Input
                      type="password"
                      placeholder="Repeat your new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Updating..." : "Set New Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
