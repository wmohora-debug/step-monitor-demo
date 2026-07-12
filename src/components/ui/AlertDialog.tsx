import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";
import { cn } from "../../core/utils/cn";

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete this record.",
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false,
}: AlertDialogProps) {
  const footer = (
    <>
      <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={isDestructive ? "destructive" : "primary"}
        size="sm"
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
      className="border-destructive/30"
    >
      <div className="flex gap-3 items-start">
        <div
          className={cn(
            "p-2 rounded-full shrink-0",
            isDestructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </Modal>
  );
}
export type { AlertDialogProps as UI_AlertDialogProps };
