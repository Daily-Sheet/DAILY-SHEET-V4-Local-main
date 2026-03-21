import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Calendar as CalendarIcon, ArrowLeft, Settings, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/NotificationBell";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { useAuth } from "@/hooks/use-auth";

const ADMIN_ROLES = ["owner", "manager", "admin"];

export function AppHeader({
  showBack = false,
  children,
  actions,
}: {
  showBack?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const { user } = useAuth();
  const isManager = user?.role === "manager" || user?.role === "owner";
  const isAdmin = ADMIN_ROLES.includes(user?.role || "");
  const [location, setLocation] = useLocation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm print:static print:border-none print:hidden">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Home/Logo Button: Calendar icon + Daily Sheet text */}
            <button
              className="flex items-center gap-2 h-9 sm:h-10 px-3 rounded-lg shadow-lg transition-transform cursor-pointer hover-elevate active-elevate-2 bg-primary shadow-primary/25 flex-shrink-0 hover:bg-primary/80 focus:bg-primary/90 active:bg-primary/70"
              data-testid="button-header-home"
              onClick={() => {
                if (location === "/shows") {
                  window.history.length > 1 ? window.history.back() : setLocation("/");
                } else {
                  setLocation("/shows");
                }
              }}
            >
              <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              <h1 className="text-sm sm:text-xl font-display uppercase tracking-wide text-foreground truncate cursor-pointer transition-colors hover:text-foreground/80 focus:text-foreground/70 active:text-foreground/60">Daily Sheet</h1>
            </button>
            {/* ShowSwitcher or children go here */}
            {children}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 print:hidden flex-shrink-0 ml-auto">
            {/* All right-aligned actions go here */}
            {actions}
            {/* Community Map button can stay if needed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/map">
                  <Button variant="outline" size="icon" className="hidden sm:flex bg-card/50 backdrop-blur-sm border-border/30">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Community Map</TooltipContent>
            </Tooltip>
            {/* NotificationBell and Admin will be moved into HeaderUserMenu */}
            <HeaderUserMenu showAdmin={isManager || isAdmin} showNotifications={true} />
          </div>
        </div>
      </div>
    </header>
  );
}
