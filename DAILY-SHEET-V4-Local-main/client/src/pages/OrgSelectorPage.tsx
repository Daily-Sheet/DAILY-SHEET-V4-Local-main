import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, resetBootstrap } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Building2, CheckCircle2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workspace {
  id: number;
  name: string;
  ownerId: string;
}

export default function OrgSelectorPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newOrgName, setNewOrgName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: workspaces = [], isLoading: wsLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/workspaces", { name });
      return res.json();
    },
    onSuccess: (workspace: Workspace) => {
      switchMutation.mutate(workspace.id);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create organization", description: err.message, variant: "destructive" });
    },
  });

  const switchMutation = useMutation({
    mutationFn: async (workspaceId: number) => {
      const res = await apiRequest("PATCH", "/api/auth/workspace", { workspaceId });
      return res.json();
    },
    onSuccess: () => {
      resetBootstrap();
      queryClient.clear();
      setLocation("/");
    },
    onError: (err: any) => {
      toast({ title: "Failed to switch organization", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!wsLoading && workspaces.length === 1) {
      if (user?.workspaceId === workspaces[0].id) {
        setLocation("/");
      } else if (!switchMutation.isPending) {
        switchMutation.mutate(workspaces[0].id);
      }
    }
  }, [workspaces, wsLoading, user?.workspaceId]);

  if (isLoading || wsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>Set up your organization to get started, or wait for an invite from an existing org.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showCreateForm ? (
              <Button className="w-full" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Organization
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Organization name..."
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newOrgName.trim()) createOrgMutation.mutate(newOrgName.trim());
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!newOrgName.trim() || createOrgMutation.isPending || switchMutation.isPending}
                    onClick={() => createOrgMutation.mutate(newOrgName.trim())}
                  >
                    {(createOrgMutation.isPending || switchMutation.isPending) ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                    ) : "Create"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowCreateForm(false); setNewOrgName(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-primary mb-3" />
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-select-org-title">Select Organization</h1>
          <p className="text-muted-foreground mt-1">Choose the organization you want to work in.</p>
        </div>
        <div className="space-y-3">
          {workspaces.map((ws) => {
            const isCurrent = ws.id === user?.workspaceId;
            return (
              <Card
                key={ws.id}
                data-testid={`card-org-${ws.id}`}
                className={`cursor-pointer border-2 transition-colors hover:border-primary ${isCurrent ? "border-primary bg-primary/5" : "border-border"}`}
                onClick={() => !switchMutation.isPending && switchMutation.mutate(ws.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium" data-testid={`text-org-name-${ws.id}`}>{ws.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrent && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    {switchMutation.isPending && switchMutation.variables === ws.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {workspaces.length > 1 && user?.workspaceId && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="button-continue-current-org">
              Continue with current organization
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
