import { useState } from "react";
import { Sun, Moon, Eye, LogOut, Check, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { useColorScheme, PALETTES, type PaletteName } from "@/components/ColorSchemeProvider";
import { ProfileDialog } from "./ProfileDialog";
import { CrewDirectoryDialog } from "@/components/dashboard/crew/CrewDirectoryDialog";
import type { Contact } from "@shared/schema";

export function HeaderUserMenu({ contacts, canEdit, allEventAssignments }: { contacts: Contact[]; canEdit: boolean; allEventAssignments: any[] }) {
  const { user, logout } = useAuth();
  const { palette, setPalette, colors } = useColorScheme();
  const { theme, toggleTheme } = useTheme();
  const isColorblind = palette === "colorblind";
  const [priorPalette, setPriorPalette] = useState<PaletteName>("default");
  const [profileOpen, setProfileOpen] = useState(false);

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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-1">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-[10px]" data-testid="badge-user-role">{user?.workspaceRole || user?.role}</Badge>
            </div>
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
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
