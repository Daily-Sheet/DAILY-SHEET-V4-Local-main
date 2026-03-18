import { useState, useEffect } from "react";
import { DEPARTMENTS } from "@shared/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState((user as any)?.department || "");

  useEffect(() => {
    if (open) {
      setPhone(user?.phone || "");
      setDepartment((user as any)?.department || "");
    }
  }, [open, user]);

  const updateProfile = useMutation({
    mutationFn: async (data: { phone: string; department: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Profile Updated", description: "Your contact information has been saved." });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] font-body max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">My Profile</DialogTitle>
          <DialogDescription className="sr-only">View and update your profile information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="text-sm font-medium" data-testid="text-profile-name">{user?.firstName} {user?.lastName}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm font-medium" data-testid="text-profile-email">{user?.email}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone" className="text-sm text-muted-foreground">Phone Number</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              data-testid="input-profile-phone"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger data-testid="select-profile-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(user as any)?.eventAssignments?.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Assigned Shows</Label>
              <div className="flex flex-wrap gap-1">
                {(user as any).eventAssignments.map((name: string) => (
                  <Badge key={name} variant="secondary" data-testid={`badge-assignment-${name}`}>{name}</Badge>
                ))}
              </div>
            </div>
          )}
          <Button
            onClick={() => updateProfile.mutate({ phone, department })}
            disabled={updateProfile.isPending}
            className="w-full"
            data-testid="button-save-profile"
          >
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
