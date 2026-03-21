import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ColorSchemeProvider } from "@/components/ColorSchemeProvider";
import { EventSelectionProvider } from "@/contexts/EventSelectionContext";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import AdminLogin from "@/pages/AdminLogin";
import OrgSelectorPage from "@/pages/OrgSelectorPage";
import ResetPassword from "@/pages/ResetPassword";
import CalendarPage from "@/pages/CalendarPage";
import ProjectPage from "@/pages/ProjectPage";
import AccessPage from "@/pages/AccessPage";
import MapPage from "@/pages/MapPage";
import NotFound from "@/pages/not-found";
import { Loader2, LayoutDashboard, CalendarDays, Settings2, Map } from "lucide-react";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { cn } from "@/lib/utils";


import Shows from "@/pages/Shows";
const ADMIN_ROLES = ["owner", "manager", "admin"];

function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user?.workspaceId) return null;

  const isAdmin = ADMIN_ROLES.includes(user?.role || "");
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/map", label: "Map", icon: Map },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Settings2 }] : []),
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 print:hidden border-t border-border/40 bg-card/70 backdrop-blur-xl safe-area-pb">
      <div className="flex items-stretch">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location === "/" : location.startsWith(to);
          return (
            <Link key={to} to={to} className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}>
              <Icon className={cn("w-5 h-5", active && "fill-primary/10")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AdminRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!["owner", "manager", "admin"].includes(user?.role || "")) {
    return <Redirect to="/" />;
  }
  return <Admin />;
}

function AuthenticatedRouter() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  if (!user?.workspaceId && location !== "/select-org") {
    return <Redirect to="/select-org" />;
  }

  return (
    <Switch>
      <Route path="/select-org" component={OrgSelectorPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/shows" component={Shows} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/project/:id" component={ProjectPage} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ColorSchemeProvider>
          <EventSelectionProvider>
          <TooltipProvider>
            <OfflineIndicator />
            <Toaster />
            <MobileNav />
            <Switch>
            <Route path="/register" component={Register} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/admin-login" component={AdminLogin} />
            <Route path="/access/:token" component={AccessPage} />

            <Route>{() => <AuthenticatedRouter />}</Route>
            </Switch>
          </TooltipProvider>
          </EventSelectionProvider>
        </ColorSchemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
