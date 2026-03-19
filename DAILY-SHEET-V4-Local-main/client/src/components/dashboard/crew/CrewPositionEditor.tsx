import { useState, useEffect } from "react";
import { Pencil, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CrewPositionEditor({ assignmentId, currentPosition }: { assignmentId?: number; currentPosition: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentPosition);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: crewPositionPresets = [] } = useQuery<any[]>({ queryKey: ["/api/crew-positions"] });
  const saveNewPreset = async (name: string) => {
    if (!name) return;
    const exists = crewPositionPresets.some((p: any) => p.name.toLowerCase() === name.toLowerCase());
    if (!exists) {
      await apiRequest("POST", "/api/crew-positions", { name });
      queryClient.invalidateQueries({ queryKey: ["/api/crew-positions"] });
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (position: string) => {
      if (!assignmentId) return;
      const res = await apiRequest("PATCH", `/api/event-assignments/${assignmentId}`, { position });
      return res.json();
    },
    onSuccess: (_data, position) => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-assignments"] });
      setOpen(false);
      if (position) saveNewPreset(position);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    setValue(currentPosition);
  }, [currentPosition]);

  const selectedPresets = value ? value.split(" / ").filter(Boolean) : [];
  const togglePreset = (name: string) => {
    const next = selectedPresets.includes(name)
      ? selectedPresets.filter(s => s !== name)
      : [...selectedPresets, name];
    setValue(next.join(" / "));
  };

  if (!assignmentId) return null;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(currentPosition); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] text-muted-foreground gap-0.5" data-testid={`button-edit-position-${assignmentId}`}>
          <Pencil className="w-2.5 h-2.5" />
          {currentPosition ? "Edit" : "Position"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="space-y-2">
          <Label className="text-xs">Show Position</Label>
          {crewPositionPresets.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {crewPositionPresets.map((p: any) => (
                <Button
                  key={p.id}
                  variant={selectedPresets.includes(p.name) ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] px-1.5 uppercase tracking-wide"
                  onClick={() => togglePreset(p.name)}
                  data-testid={`button-preset-position-${p.id}`}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Or type custom..."
            className="text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); updateMutation.mutate(value.trim()); } }}
            data-testid={`input-position-${assignmentId}`}
          />
          <div className="flex gap-1.5 justify-end">
            {currentPosition && (
              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate("")} data-testid={`button-clear-position-${assignmentId}`}>
                Clear
              </Button>
            )}
            <Button size="sm" onClick={() => updateMutation.mutate(value.trim())} disabled={updateMutation.isPending} data-testid={`button-save-position-${assignmentId}`}>
              <Check className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
