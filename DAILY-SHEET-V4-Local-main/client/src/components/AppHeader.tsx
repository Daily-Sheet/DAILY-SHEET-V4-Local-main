import { ReactNode } from "react";
import { Link } from "wouter";
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

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm print:static print:border-none print:hidden">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {showBack && (
              <button
                onClick={() => window.history.back()}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shadow-sm transition-transform cursor-pointer hover-elevate bg-muted border border-border/30 flex-shrink-0"
                data-testid="button-header-back"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            <Link href="/calendar">
              <button
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shadow-lg transition-transform cursor-pointer hover-elevate active-elevate-2 bg-primary shadow-primary/25 flex-shrink-0"
                data-testid="button-header-calendar"
              >
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </button>
            </Link>
            <div className="min-w-0">
              <Link href="/">
                <h1 className="text-sm sm:text-xl font-display uppercase tracking-wide text-foreground truncate cursor-pointer hover:text-primary transition-colors">
                  Daily Sheet
                </h1>
              </Link>
            </div>
            {children}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 print:hidden flex-shrink-0">
            {actions}
            {(isManager || isAdmin) && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="hidden sm:flex bg-card/50 backdrop-blur-sm border-border/30" data-testid="link-admin-panel">
                        <Settings className="mr-2 h-4 w-4" /> Admin
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Admin Panel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/admin">
                      <Button variant="outline" size="icon" className="sm:hidden bg-card/50 backdrop-blur-sm border-border/30" data-testid="button-admin-mobile">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Admin</TooltipContent>
                </Tooltip>
              </>
            )}
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
            <NotificationBell />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
