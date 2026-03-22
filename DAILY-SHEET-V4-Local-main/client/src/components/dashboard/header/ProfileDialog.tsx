import { useState, useEffect, useRef } from "react";
import { DEPARTMENTS } from "@shared/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Camera, Loader2, X } from "lucide-react";

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState((user as any)?.department || "");

  useEffect(() => {
    if (open) {
      setPhone(user?.phone || "");
      setDepartment((user as any)?.department || "");
    }
  }, [open, user]);

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/auth/profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
      toast({ title: "Photo Updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeImage = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/auth/profile-image");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bootstrap"] });
      toast({ title: "Photo Removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove photo.", variant: "destructive" });
    },
  });

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

  const userInitials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] font-body max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-primary">My Profile</DialogTitle>
          <DialogDescription className="sr-only">View and update your profile information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImage.isPending}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadImage.isPending ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              {user?.profileImageUrl && (
                <button
                  type="button"
                  onClick={() => removeImage.mutate()}
                  disabled={removeImage.isPending}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadImage.mutate(file);
                    e.target.value = "";
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-profile-name">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-profile-email">{user?.email}</p>
            </div>
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
