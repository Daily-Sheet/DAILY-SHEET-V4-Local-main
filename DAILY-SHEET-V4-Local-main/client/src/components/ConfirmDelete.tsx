import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteProps {
  onConfirm: () => void;
  title?: string;
  description?: string;
  triggerLabel?: React.ReactNode;
  triggerVariant?: "ghost" | "outline" | "destructive" | "default";
  triggerSize?: "icon" | "sm" | "default";
  triggerClassName?: string;
  "data-testid"?: string;
}

export function ConfirmDelete({
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  triggerLabel,
  triggerVariant = "ghost",
  triggerSize = "icon",
  triggerClassName = "",
  "data-testid": testId,
}: ConfirmDeleteProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          data-testid={testId}
        >
          {triggerLabel || <Trash2 className="w-4 h-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-confirm-cancel">No</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            data-testid="button-confirm-delete"
          >
            Yes, delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
