import { useState, useMemo } from "react";
import { useWorkspaceAchievements } from "@/hooks/use-achievements";
import { ACHIEVEMENT_CATEGORIES, type AchievementCategory } from "@shared/achievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Trophy, Search, Users, Lock } from "lucide-react";

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AchievementAdmin() {
  const { data, isLoading } = useWorkspaceAchievements();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | "all">("all");

  const filteredAchievements = useMemo(() => {
    if (!data) return [];
    return data.achievements.filter(a => {
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, search, categoryFilter]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading achievements...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Unable to load achievement data.</div>;
  }

  const totalUnlockedAcrossTeam = data.members.reduce((s, m) => s + m.unlockedCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-display text-lg uppercase tracking-wide">Achievements</span>
        </div>
        <Badge variant="secondary">{totalUnlockedAcrossTeam} unlocked across team</Badge>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="all">All Achievements ({data.totalAchievements})</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-3 mt-3">
          {data.members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No members found.</div>
          ) : (
            data.members.map((member, idx) => {
              const initials = member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
              return (
                <Card key={member.userId} className={cn(idx === 0 && member.unlockedCount > 0 && "border-primary/30 bg-primary/5")}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 text-sm font-bold text-muted-foreground">
                        {idx + 1}
                      </div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{member.name}</span>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            {member.unlockedCount}/{data.totalAchievements}
                          </Badge>
                        </div>
                        <ProgressBar value={member.unlockedCount} max={data.totalAchievements} />
                        {member.achievements.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {member.achievements.slice(0, 8).map((a: any) => (
                              <span key={a.key} className="text-sm" title={a.name}>{a.icon}</span>
                            ))}
                            {member.achievements.length > 8 && (
                              <span className="text-[10px] text-muted-foreground">+{member.achievements.length - 8} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search achievements..." className="pl-9 h-9" />
            </div>
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
            {ACHIEVEMENT_CATEGORIES.map(cat => (
              <Button
                key={cat.key}
                variant={categoryFilter === cat.key ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setCategoryFilter(cat.key)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAchievements.map(a => (
              <Card key={a.key} className={cn(a.holderCount > 0 && "border-primary/20")}>
                <CardContent className="p-3">
                  <div className="flex gap-3 items-start">
                    <div className="text-2xl flex-shrink-0">
                      {a.secret && a.holderCount === 0 ? <Lock className="w-6 h-6 text-muted-foreground" /> : a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-semibold text-sm", a.holderCount > 0 && "text-primary")}>
                          {a.secret && a.holderCount === 0 ? "???" : a.name}
                        </span>
                        {a.secret && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-500">Secret</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.secret && a.holderCount === 0 ? "Hidden until someone unlocks it" : a.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{a.holderCount} {a.holderCount === 1 ? "member" : "members"}</span>
                        </div>
                        {a.holderCount > 0 && (
                          <div className="flex -space-x-1.5">
                            {a.holders.slice(0, 5).map(h => {
                              const ini = h.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                              return (
                                <Avatar key={h.userId} className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src={h.profileImageUrl || undefined} />
                                  <AvatarFallback className="text-[8px]">{ini}</AvatarFallback>
                                </Avatar>
                              );
                            })}
                            {a.holders.length > 5 && (
                              <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] text-muted-foreground">
                                +{a.holders.length - 5}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No achievements match your search.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
