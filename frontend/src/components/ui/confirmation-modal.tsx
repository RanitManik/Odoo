import React, { useEffect, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import Button from "@/components/ui/button";

interface ConfirmationProps {
  title: string;
  description: string | React.ReactNode;
  action: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  disabled?: boolean;
  onClose?: () => void;
}

export default function ConfirmationModal({
  title,
  description,
  action,
  isOpen,
  onOpenChange,
  disabled = false,
  onClose,
}: ConfirmationProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 110);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "ArrowRight") {
        if (document.activeElement === cancelButtonRef.current) {
          confirmButtonRef.current?.focus();
        }
      } else if (event.key === "ArrowLeft") {
        if (document.activeElement === confirmButtonRef.current) {
          cancelButtonRef.current?.focus();
        }
      } else if (event.key === "Enter") {
        if (document.activeElement === confirmButtonRef.current) {
          action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, action]);

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Modal width="sm" isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle title={title} />
      </ModalHeader>
      <ModalBody>
        <ModalDescription>{description}</ModalDescription>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="secondary-light"
          onClick={handleClose}
          disabled={disabled}
          type="button"
          ref={cancelButtonRef}
        >
          Cancel
        </Button>
        <Button
          ref={confirmButtonRef}
          onClick={action}
          disabled={disabled}
          type="button"
        >
          Confirm
        </Button>
      </ModalFooter>
    </Modal>
  );
}
