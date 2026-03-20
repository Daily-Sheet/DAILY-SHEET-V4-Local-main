import { useState } from "react";
import { Sun, Moon, Eye, LogOut, Check, Users, Building2, ArrowRightLeft, Loader2, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth, resetBootstrap } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { useColorScheme, PALETTES, type PaletteName } from "@/components/ColorSchemeProvider";
import { ProfileDialog } from "./ProfileDialog";
import { CrewDirectoryDialog } from "@/components/dashboard/crew/CrewDirectoryDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

export function HeaderUserMenu({ contacts = [], canEdit = false, allEventAssignments = [] }: { contacts?: Contact[]; canEdit?: boolean; allEventAssignments?: any[] }) {
  const { user, logout } = useAuth();
  const { palette, setPalette, colors } = useColorScheme();
  const { theme, toggleTheme } = useTheme();
  const isColorblind = palette === "colorblind";
  const [priorPalette, setPriorPalette] = useState<PaletteName>("default");
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const queryClient = useQueryClient();

  const { data: userWorkspaces = [] } = useQuery<{ id: number; name: string; role: string }[]>({
    queryKey: ["/api/workspaces"],
  });

  const switchOrgMutation = useMutation({
    mutationFn: async (workspaceId: number) => {
      const res = await apiRequest("PATCH", "/api/auth/workspace", { workspaceId });
      return res.json();
    },
    onSuccess: () => {
      resetBootstrap();
      queryClient.clear();
      window.location.reload();
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/workspaces", { name });
      return res.json();
    },
    onSuccess: (workspace) => {
      switchOrgMutation.mutate(workspace.id);
    },
  });

  const handleColorblindToggle = () => {
    if (isColorblind) {
      setPalette(priorPalette);
    } else {
      setPriorPalette(palette);
      setPalette("colorblind");
    }
  };

  const userInitials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <>
      <div className="flex items-center gap-0.5">
        {/* Always-visible logout button in the header */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
          onClick={() => logout()}
          title="Log Out"
          data-testid="button-logout-header"
        >
          <LogOut className="h-4 w-4" />
        </Button>

        <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 max-h-[80vh] overflow-y-auto" align="end">
          <div className="space-y-1">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-[10px]" data-testid="badge-user-role">{user?.workspaceRole || user?.role}</Badge>
            </div>
            <Separator />
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-destructive hover-elevate cursor-pointer"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
            <Separator />
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover-elevate cursor-pointer"
              onClick={() => setProfileOpen(true)}
              data-testid="button-open-profile"
            >
              <Users className="h-4 w-4" />
              My Profile
            </button>
            <CrewDirectoryDialog contacts={contacts} canEdit={canEdit} allEventAssignments={allEventAssignments} />
            <>
              <Separator />
              <div className="px-2 py-1">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Organizations
                </p>
                <div className="space-y-0.5">
                  {userWorkspaces.map((ws) => {
                    const isCurrent = ws.id === user?.workspaceId;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        disabled={isCurrent || switchOrgMutation.isPending}
                        onClick={() => !isCurrent && switchOrgMutation.mutate(ws.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-1.5 py-1.5 rounded-md text-xs transition-colors",
                          isCurrent ? "bg-primary/10 font-medium cursor-default" : "hover-elevate cursor-pointer",
                        )}
                      >
                        <span className="truncate">{ws.name}</span>
                        {isCurrent
                          ? <Check className="h-3 w-3 shrink-0 text-primary" />
                          : switchOrgMutation.isPending && switchOrgMutation.variables === ws.id
                            ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                            : <ArrowRightLeft className="h-3 w-3 shrink-0 text-muted-foreground" />
                        }
                      </button>
                    );
                  })}
                </div>
                {createOrgOpen ? (
                  <form
                    className="mt-1.5 flex gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newOrgName.trim()) return;
                      createOrgMutation.mutate(newOrgName.trim());
                    }}
                  >
                    <input
                      autoFocus
                      className="flex-1 min-w-0 text-xs rounded-md border border-border bg-background px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Organization name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                    <button type="submit" disabled={createOrgMutation.isPending} className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                      {createOrgMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                    </button>
                    <button type="button" onClick={() => { setCreateOrgOpen(false); setNewOrgName(""); }} className="text-xs px-1.5 py-1 rounded-md hover:bg-muted">
                      <X className="h-3 w-3" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreateOrgOpen(true)}
                    className="mt-1 w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-xs text-muted-foreground hover-elevate cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Create organization
                  </button>
                )}
              </div>
            </>
            <Separator />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm hover-elevate cursor-pointer"
              data-testid="button-theme-toggle"
            >
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={handleColorblindToggle}
              className={cn(
                "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                isColorblind ? "bg-primary/10" : "hover-elevate",
              )}
              data-testid="toggle-colorblind-mode"
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Colorblind Mode</span>
              </div>
              <div className={cn(
                "w-7 h-3.5 rounded-full transition-colors relative",
                isColorblind ? "bg-primary" : "bg-muted",
              )}>
                <div className={cn(
                  "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform",
                  isColorblind ? "translate-x-3.5" : "translate-x-0.5",
                )} />
              </div>
            </button>
            <div className="px-2 py-1">
              <p className="text-[10px] text-muted-foreground mb-1">Color Palette</p>
              <div className="space-y-0.5">
                {(Object.entries(PALETTES) as [PaletteName, typeof PALETTES[PaletteName]][]).map(([key, { label, colors: palColors }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPalette(key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-1.5 py-1 rounded-md text-xs transition-colors",
                      palette === key ? "bg-primary/10 font-medium" : "hover-elevate",
                    )}
                    data-testid={`color-scheme-${key}`}
                  >
                    <div className="flex gap-0.5">
                      {palColors.slice(0, 4).map((c, i) => (
                        <div key={i} className={cn("w-2.5 h-2.5 rounded-full", c.bar)} />
                      ))}
                    </div>
                    <span>{label}</span>
                    {palette === key && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-destructive hover-elevate cursor-pointer"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </PopoverContent>
      </Popover>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
