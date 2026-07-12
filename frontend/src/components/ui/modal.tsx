import React, { FC, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button";

// Main Modal Component
interface ModalProps {
  isOpen: boolean; // Controls whether the modal is visible
  onClose: () => void; // Callback for closing the modal
  onOpen?: () => void;
  width?: "sm" | "md" | "lg" | "xl" | "full"; // Width of the modal
  className?: string; // Additional class names
  containerClassName?: string; // Additional class names for the modal container
  children: React.ReactNode; // Modal content
  setIsArrowBusy?: (isArrowBusy: boolean) => void;
  disableAnimation?: boolean;
  closeButton?: boolean;
  modalProps?: React.HTMLAttributes<HTMLDivElement>; // Additional props for the modal overlay
}

/**
 * Modal component for displaying content in an overlay dialog.
 *
 * @param {boolean} isOpen - Controls whether the modal is visible.
 * @param {() => void} onClose - Callback function to close the modal.
 * @param onOpen  - Callback function after opening the modal.
 * @param {"sm" | "md" | "lg" | "xl"} [width="md"] - Width of the modal (small, medium, large, or extra-large).
 * @param {string} [className] - Additional class names for the modal container.
 * @param {string} [containerClassName] - Additional class names specifically for the modal container (useful for customizing duration, inset, etc.).
 * @param {React.ReactNode} children - The content of the modal.
 * @param setIsArrowBusy - optional Callback for making the vertical arrow keys busy when select dropdown is open
 * @param {React.HTMLAttributes<HTMLDivElement>} [modalProps] - Additional props to spread to the modal overlay div.
 */
const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  onOpen,
  width = "md",
  className = "",
  containerClassName = "",
  children,
  setIsArrowBusy,
  disableAnimation = false,
  closeButton = true,
  modalProps = {},
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const widthClass = {
    sm: "md:max-w-screen-sm",
    md: "md:max-w-screen-md",
    lg: "md:max-w-screen-lg",
    xl: "md:max-w-screen-xl",
    full: "md:w-[-webkit-fill-available] md:h-[-webkit-fill-available]",
  }[width];

  useEffect(() => {
    if (isOpen && onOpen) onOpen();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        e.stopPropagation();
      } else if (e.key === "Tab") {
        // Focus trapping logic
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const focusable = Array.from(focusableElements) as HTMLElement[];
        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          // Shift + Tab: Move focus to the last element
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          // Tab: Move focus to the first element
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     if (isOpen && closeButtonRef.current) {
  //       closeButtonRef.current.focus();
  //     }
  //   }, 100);
  //   return () => clearTimeout(timeout);
  // }, [isOpen]);

  // effect to sync the isArrowBusy with the open state
  useEffect(() => {
    setIsArrowBusy?.(isOpen);
  }, [isOpen, setIsArrowBusy]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/30",
        isOpen ? "visible opacity-100" : "invisible opacity-0",
        disableAnimation ? "" : "transition-opacity duration-200",
        containerClassName,
      )}
      onClick={handleOverlayClick}
      {...modalProps}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative grid h-full w-full transform grid-rows-[auto,1fr,auto] bg-white shadow-lg md:h-auto",
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
          widthClass,
          className,
          disableAnimation ? "" : "transition-all duration-300 ease-in-out",
        )}
      >
        {closeButton && (
          <Button
            ref={closeButtonRef}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onClose();
              }
            }}
            variant="destructive"
            className="absolute top-0 right-0 z-10 flex items-center gap-x-1.5"
            aria-label="Close"
          >
            <X size={20} /> Close
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};

// Modal Header Component
interface ModalHeaderProps {
  className?: string; // Additional class names for the header
  children: React.ReactNode; // Header content
}

/**
 * ModalHeader component for displaying the header section of the modal.
 *
 * @param {string} [className] - Additional class names for the header.
 * @param {React.ReactNode} children - The content of the header.
 */
const ModalHeader: FC<ModalHeaderProps> = ({ children, className = "" }) => (
  <div className={cn(`flex items-center p-4 ${className}`)}>{children}</div>
);

// Modal Title Component
interface ModalTitleProps {
  title: string; // Text for the title
  className?: string; // Additional class names for the title
}

/**
 * ModalTitle component for displaying the title in the modal header.
 *
 * @param {string} title - The text to display as the modal title.
 * @param {string} [className] - Additional class names for the title.
 */
const ModalTitle: FC<ModalTitleProps> = ({ title, className = "" }) => (
  <h3 className={cn("text-lg md:text-lg", className)}>{title}</h3>
);

// Modal Body Component
interface ModalBodyProps {
  className?: string; // Additional class names for the body
  children: React.ReactNode; // Body content
}

/**
 * ModalBody component for displaying the main content section of the modal.
 *
 * @param {string} [className] - Additional class names for the body.
 * @param {React.ReactNode} children - The content of the modal body.
 */
const ModalBody: FC<ModalBodyProps> = ({ children, className = "" }) => (
  <div className={cn(`px-4 ${className}`)}>{children}</div>
);

/**
 * ModalDescription component for displaying additional descriptive text in the modal.
 *
 * @param {string} [className] - Additional class names for the description.
 * @param {React.ReactNode} children - The content of the modal description.
 */
const ModalDescription: FC<ModalBodyProps> = ({ children, className = "" }) => (
  <div className={`text-sm text-gray-600 ${className}`}>{children}</div>
);

// Modal Footer Component
interface ModalFooterProps {
  className?: string; // Additional class names for the footer
  children: React.ReactNode; // Footer content
}

/**
 * ModalFooter component for displaying the footer section of the modal.
 *
 * @param {string} [className] - Additional class names for the footer.
 * @param {React.ReactNode} children - The content of the footer.
 */
const ModalFooter: FC<ModalFooterProps> = ({ children, className = "" }) => (
  <div
    className={cn(
      "mt-2 flex w-full items-end gap-px self-end border-t-2 border-white *:flex-1",
      className,
    )}
  >
    {children}
  </div>
);

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalDescription,
  ModalFooter,
};
