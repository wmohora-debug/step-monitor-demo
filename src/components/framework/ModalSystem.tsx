"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Info, Trash2 } from "lucide-react";
import { Modal, Button } from "../ui";
import { cn } from "../../core/utils/cn";

// ----------------------------------------------------
// 1. CONFIRM DELETE MODAL
// ----------------------------------------------------
export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record",
  itemName = "this record",
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </>
      }
    >
      <div className="flex gap-4.5 py-1">
        <div className="p-3 h-11 w-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-foreground">Are you absolutely sure?</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This action will permanently delete <strong className="text-foreground">{itemName}</strong> from the database registries. This operation cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------
// 2. STATUS DIALOG MODAL (SUCCESS, WARNING, ERROR, INFO)
// ----------------------------------------------------
export type StatusDialogType = "success" | "warning" | "error" | "info";

export interface StatusDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StatusDialogType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function StatusDialogModal({
  isOpen,
  onClose,
  type,
  title,
  description,
  actionLabel = "Acknowledge",
  onAction,
}: StatusDialogModalProps) {
  let icon: React.ReactNode = <Info className="h-6 w-6" />;
  let iconColor = "bg-blue-500/10 text-blue-500 dark:text-blue-400";

  switch (type) {
    case "success":
      icon = <CheckCircle2 className="h-6 w-6" />;
      iconColor = "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400";
      break;
    case "warning":
      icon = <AlertTriangle className="h-6 w-6" />;
      iconColor = "bg-amber-500/10 text-amber-500 dark:text-amber-400";
      break;
    case "error":
      icon = <XCircle className="h-6 w-6" />;
      iconColor = "bg-rose-500/10 text-rose-500 dark:text-rose-400";
      break;
    case "info":
    default:
      icon = <Info className="h-6 w-6" />;
      iconColor = "bg-blue-500/10 text-blue-500 dark:text-blue-400";
      break;
  }

  const handleAction = () => {
    if (onAction) onAction();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <Button onClick={handleAction} className="w-full h-9 rounded-lg">
          {actionLabel}
        </Button>
      }
    >
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className={cn("p-4.5 rounded-2xl shrink-0 shadow-sm", iconColor)}>
          {icon}
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
            {description}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------
// 3. FORM MODAL WRAPPER
// ----------------------------------------------------
export interface FormModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isSubmitting?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}

export function FormModalWrapper({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  size = "md",
  isSubmitting = false,
  submitLabel = "Save Changes",
  children,
}: FormModalWrapperProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="modal-form" size="sm" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="modal-form" onSubmit={onSubmit} className="space-y-5 py-1">
        {children}
      </form>
    </Modal>
  );
}
