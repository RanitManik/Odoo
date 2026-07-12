import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  ReactElement,
  MouseEventHandler,
} from "react";
import ReactDOM from "react-dom";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button";

interface PopoverProps {
  children: ReactNode[];
  trigger?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  titleClassName?: string;
  align?: "left" | "center" | "right";
  title?: string;
  closeOnAction?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Popover component for creating a dropdown-style menu or tooltip.
 *
 * @param {ReactNode[]} children - Array of child nodes representing dropdown menu items.
 * @param {React.ReactNode} [trigger] - The trigger element that opens the Popover (defaults to an Ellipsis icon if not provided).
 * @param {string} [className] - Additional class names for the button container.
 * @param {string} [triggerClassName] - Additional class names for the trigger button.
 * @param {string} [dropdownClassName] - Additional class names for the dropdown container.
 * @param {string} [titleClassName] - Additional class names for the title section of the dropdown.
 * @param {"left" | "center" | "right"} [align="left"] - Alignment of the dropdown relative to the trigger button.
 * @param {string} [title] - Title text displayed at the top of the dropdown.
 * @param {boolean} [closeOnAction] - Whether to close the dropdown when an action is performed (defaults to false).
 * @param {boolean} [open] - Controls the open/close state of the Popover. Use with `onOpenChange` for controlled behavior.
 * @param {(isOpen: boolean) => void} [onOpenChange] - Callback invoked when the open/close state changes.
 */
export function Popover({
  children,
  trigger,
  triggerClassName,
  className,
  dropdownClassName,
  titleClassName,
  align = "left",
  title,
  closeOnAction,
  open,
  onOpenChange,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof open === "boolean") {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        if (isOpen) {
          onOpenChange?.(false);
        }
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left:
          align === "center"
            ? rect.left + rect.width / 2
            : align === "right"
              ? rect.right
              : rect.left,
      });
    }
  }, [isOpen, align]);

  const handleKeyDown = (event: KeyboardEvent) => {
    const itemCount = itemsRef.current.length;

    if (itemCount === 0) return;

    if (event.key === "ArrowDown") {
      setActiveIndex((prev) => (prev + 1) % itemCount);
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      setActiveIndex((prev) => (prev === 0 ? itemCount - 1 : prev - 1));
      event.preventDefault();
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      activeIndex >= 0
    ) {
      itemsRef.current[activeIndex]?.click();
      if (closeOnAction) {
        setIsOpen(false);
        setActiveIndex(-1);
        onOpenChange?.(false);
      }
      event.preventDefault();
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      onOpenChange?.(false);
      event.preventDefault();
      event.stopPropagation(); // Stop the event from reaching the layout handler
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeIndex]);

  const alignmentClass = {
    left: "transform translate-x-0",
    center: "transform -translate-x-1/2",
    right: "transform -translate-x-full",
  }[align];

  // Helper type guard to check if a ReactNode is a valid ReactElement
  function isReactElement(child: ReactNode): child is ReactElement {
    return React.isValidElement(child);
  }

  return (
    <>
      <Button
        className={cn(`!p-0 ${className} ${triggerClassName}`)}
        variant="ghost"
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          const newState = !isOpen;
          setIsOpen(newState);
          onOpenChange?.(newState);
        }}
      >
        {trigger || <Ellipsis className="h-4 w-4" />}
      </Button>
      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={popoverRef}
            className={cn(
              `absolute z-50 mt-2 max-h-96 min-w-[160px] overflow-auto border border-gray-300 bg-gray-100 shadow-md ${dropdownClassName}`,
              alignmentClass,
            )}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
            }}
          >
            {title && (
              <span
                className={`block w-full px-2 py-1 text-sm text-gray-700 ${titleClassName}`}
              >
                {title}
              </span>
            )}
            {children.map((child, index) => (
              <React.Fragment key={index}>
                {isReactElement(child) ? (
                  React.cloneElement(child as React.ReactElement<any>, {
                    className: cn(
                      "flex py-0.5 px-1 cursor-pointer border-b border-b-gray-300 bg-gray-100 last:border-none hover:border-transparent hover:bg-gray-200 hover:outline-none hover:outline-2 hover:-outline-offset-2 hover:outline-primary active:bg-gray-300",
                      activeIndex === index
                        ? "bg-gray-300 outline-none outline-1 -outline-offset-1 outline-primary"
                        : "",
                      (child as React.ReactElement<any>).props.className, // Merge additional class if exists
                      dropdownClassName,
                    ),
                    ref: (el: HTMLDivElement | null) => {
                      itemsRef.current[index] = el;
                    },
                    onClick: (e: React.MouseEvent) => {
                      if (closeOnAction) {
                        setIsOpen(false);
                        onOpenChange?.(false);
                        setActiveIndex(-1);
                      }
                      if ((child as React.ReactElement<any>).props.onClick) {
                        (
                          (child as React.ReactElement<any>).props
                            .onClick as MouseEventHandler
                        )(e);
                      }
                    },
                  })
                ) : (
                  <div>{child}</div>
                )}
              </React.Fragment>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
