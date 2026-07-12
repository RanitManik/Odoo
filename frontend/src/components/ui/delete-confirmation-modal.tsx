"use client";

import React, { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import Button from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  /** The type label shown in the title, e.g. "Asset" → "Delete Asset" */
  type: string;
  /** The name of the item being deleted, shown in the confirm button */
  name: string;
  /** A descriptive message explaining the consequences of deletion */
  description: string;
  /** Called when the user confirms deletion */
  onConfirm: () => void;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called with false to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Pass true while the delete mutation is pending to show loading state */
  deleting?: boolean;
}

/**
 * DeleteConfirmationModal
 *
 * A simple confirmation dialog for destructive delete actions.
 * Adapted from Busiman's delete-confirmation-modal-2 pattern.
 * Shows a warning banner and Cancel + Delete buttons.
 *
 * Usage:
 * ```tsx
 * <DeleteConfirmationModal
 *   type="Asset"
 *   name={asset.name}
 *   description="This will permanently remove the asset and all its data."
 *   isOpen={deleteOpen}
 *   onOpenChange={setDeleteOpen}
 *   onConfirm={() => deleteMutation.mutate(asset.id)}
 *   deleting={deleteMutation.isPending}
 * />
 * ```
 */
export default function DeleteConfirmationModal({
  type,
  name,
  description,
  onConfirm,
  isOpen,
  onOpenChange,
  deleting = false,
}: DeleteConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the confirm button when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 110);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  function handleClose() {
    onOpenChange(false);
  }

  function handleDelete() {
    onConfirm();
    handleClose();
  }

  return (
    <Modal width="sm" isOpen={isOpen} onClose={handleClose}>
      <ModalHeader className="flex flex-col items-start">
        <ModalTitle title={`Delete ${type}`} />
      </ModalHeader>

      <ModalBody className="space-y-3">
        {/* Warning banner */}
        <div className="flex w-full items-center gap-2 border border-yellow-500 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          <TriangleAlert size={16} className="shrink-0 text-yellow-600" />
          <span>
            Unexpected bad things will happen if you don&apos;t read this!
          </span>
        </div>

        <ModalDescription>{description}</ModalDescription>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="secondary-light"
          type="button"
          onClick={handleClose}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          ref={confirmButtonRef}
          variant="secondary"
          type="button"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? `Deleting ${name}…` : `Delete ${name}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
