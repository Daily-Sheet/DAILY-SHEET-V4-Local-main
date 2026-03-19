import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowRight, LogIn, Shield, AlertCircle } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { resetBootstrap } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DEPARTMENTS } from "@shared/constants";

export default function Register() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const inviteEmail = params.get("email") || "";
  const inviteToken = params.get("token") || "";

  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: setupStatus } = useQuery<{ needsSetup: boolean }>({
    queryKey: ["/api/auth/check-setup"],
    queryFn: async () => {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/auth/check-setup");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: emailCheck } = useQuery<{ exists: boolean }>({
    queryKey: ["/api/auth/check-email", inviteEmail],
    queryFn: async () => {
      if (!inviteEmail) return { exists: false };
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + `/api/auth/check-email?email=${encodeURIComponent(inviteEmail)}`);
      return res.json();
    },
    enabled: !!inviteEmail,
  });

  const { data: inviteStatus } = useQuery<{ valid: boolean; email?: string; role?: string }>({
    queryKey: ["/api/auth/check-invite", inviteToken],
    queryFn: async () => {
      if (!inviteToken) return { valid: false };
      const res = await fetch(`/api/auth/check-invite?token=${inviteToken}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!inviteToken,
  });

  const isFirstUser = setupStatus?.needsSetup === true;
  const hasValidInvite = inviteStatus?.valid === true;
  const hasWorkspaceInvite = !!inviteEmail && !inviteToken;
  const isStandaloneSignup = !isFirstUser && !hasValidInvite && !hasWorkspaceInvite;
  const canRegister = true;

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
    if (inviteStatus?.email && !email) {
      setEmail(inviteStatus.email);
    }
  }, [inviteEmail, inviteStatus?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) {
      toast({ title: "Error", description: "Please select a department", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL ?? "") + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          department,
          token: inviteToken || undefined,
          ...(isStandaloneSignup ? { standaloneSignup: true } : {}),
          ...(isFirstUser ? { organizationName: organizationName || undefined } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Something went wrong", variant: "destructive" });
        return;
      }

      resetBootstrap();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsPending(false);
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

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-md">
          {emailCheck?.exists ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <LogIn className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display uppercase tracking-wide">You're already in</CardTitle>
                <CardDescription>
                  An account already exists for <strong>{inviteEmail}</strong>. You've been added to the workspace — just log in to access it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/">
                  <Button className="w-full">
                    <LogIn className="mr-2 h-4 w-4" /> Log In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : !canRegister ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-2">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-2xl font-display uppercase tracking-wide">
                  Invitation Required
                </CardTitle>
                <CardDescription>
                  Registration is by invitation only. Please contact your admin to receive an invitation link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button variant="outline" className="w-full" data-testid="button-back-to-login">
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back to Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                {isFirstUser && (
                  <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                )}
                <CardTitle className="text-2xl font-display uppercase tracking-wide">
                  {isFirstUser ? "Create Admin Account" : "Create Your Account"}
                </CardTitle>
                <CardDescription>
                  {isFirstUser
                    ? "Set up the first admin account to create your organization and get started."
                    : hasValidInvite
                      ? `You've been invited to join Daily Sheet as ${inviteStatus?.role === "admin" ? "an admin" : "a user"}. Create your account below.`
                      : hasWorkspaceInvite
                        ? "You've been invited to join a crew on Daily Sheet. Create your account to get started."
                        : "Create your free account to track your personal events and schedule."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isFirstUser && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Organization Name</label>
                      <Input
                        placeholder="e.g. Sound Image SFO"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                        data-testid="input-register-org-name"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <Input
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        data-testid="input-register-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <Input
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        data-testid="input-register-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      data-testid="input-register-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Department</label>
                    <Select value={department} onValueChange={setDepartment} required>
                      <SelectTrigger data-testid="select-register-department">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} data-testid={`option-register-department-${dept.toLowerCase()}`}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      readOnly={!!inviteEmail || hasValidInvite}
                      className={(inviteEmail || hasValidInvite) ? "bg-muted" : ""}
                      data-testid="input-register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-register-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending} data-testid="button-register-submit">
                    {isPending ? (
                      "Creating account..."
                    ) : isFirstUser ? (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" /> Create Admin Account
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" /> Create Account
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/" className="text-primary font-medium hover:underline" data-testid="link-register-to-login">
                      Sign in <ArrowRight className="inline h-3 w-3" />
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
