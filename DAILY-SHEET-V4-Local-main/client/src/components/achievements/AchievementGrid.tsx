import { useState } from "react";
import { useAchievementCatalog, type CatalogAchievement } from "@/hooks/use-achievements";
import { ACHIEVEMENT_CATEGORIES, type AchievementCategory } from "@shared/achievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy, Lock } from "lucide-react";

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: CatalogAchievement }) {
  const isLocked = achievement.secret && !achievement.unlocked;
  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex gap-3 items-start transition-all",
        achievement.unlocked
          ? "border-primary/30 bg-primary/5"
          : isLocked
          ? "border-border/20 bg-muted/30 opacity-60"
          : "border-border/30 bg-card/50"
      )}
    >
      <div className={cn("text-2xl flex-shrink-0", !achievement.unlocked && !isLocked && "grayscale opacity-50")}>
        {isLocked ? <Lock className="w-6 h-6 text-muted-foreground" /> : achievement.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-semibold text-sm", achievement.unlocked && "text-primary")}>
            {achievement.name}
          </span>
          {achievement.secret && achievement.unlocked && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-500">Secret</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
        {!achievement.unlocked && !isLocked && (
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar value={achievement.progress} max={achievement.threshold} />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {achievement.progress}/{achievement.threshold}
            </span>
          </div>
        )}
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export function AchievementGrid() {
  const { data: catalog, isLoading } = useAchievementCatalog();
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | "all">("all");
  const [showFilter, setShowFilter] = useState<"all" | "unlocked" | "locked">("all");

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading achievements...</div>;
  }

  if (!catalog?.length) {
    return <div className="p-8 text-center text-muted-foreground">No achievements yet. Start working to earn some!</div>;
  }

  const unlockedCount = catalog.filter(a => a.unlocked).length;
  const filtered = catalog.filter(a => {
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (showFilter === "unlocked" && !a.unlocked) return false;
    if (showFilter === "locked" && a.unlocked) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-display text-lg uppercase tracking-wide">Achievements</span>
        </div>
        <Badge variant="secondary">{unlockedCount}/{catalog.length} unlocked</Badge>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          size="sm"
          className="text-xs h-7"
          onClick={() => setCategoryFilter("all")}
        >
          All
        </Button>
        {ACHIEVEMENT_CATEGORIES.map(cat => {
          const count = catalog.filter(a => a.category === cat.key && a.unlocked).length;
          const total = catalog.filter(a => a.category === cat.key).length;
          return (
            <Button
              key={cat.key}
              variant={categoryFilter === cat.key ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setCategoryFilter(cat.key)}
            >
              {cat.label} <span className="ml-1 opacity-60">{count}/{total}</span>
            </Button>
          );
        })}
      </div>

      <div className="flex gap-1 rounded-lg border p-1 h-fit w-fit">
        {([
          { value: "all" as const, label: "All" },
          { value: "unlocked" as const, label: "Unlocked" },
          { value: "locked" as const, label: "Locked" },
        ]).map(opt => (
          <Button
            key={opt.value}
            variant={showFilter === opt.value ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setShowFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(a => (
          <AchievementCard key={a.key} achievement={a} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">No achievements match your filters.</div>
      )}
    </div>
  );
}
