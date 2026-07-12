import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
  KeyboardEvent,
  useLayoutEffect,
} from "react";
import ReactDOM from "react-dom";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

// Context for DropdownMenu
interface DropdownMenuContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  closeOnAction: boolean;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps | undefined>(
  undefined,
);

function useDropdownMenuContext(): DropdownMenuContextProps {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(
      "DropdownMenu components must be used within a DropdownMenu.",
    );
  }
  return context;
}

// DropdownMenu wrapper component
interface DropdownMenuProps {
  children: ReactNode;
  closeOnAction?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

/**
 * DropdownMenu component that provides context and manages dropdown state.
 *
 * @param {ReactNode} children - The content of the dropdown menu (trigger, content, items, etc.).
 * @param {boolean} [closeOnAction=true] - Whether to close the dropdown when an item is clicked.
 * @param {(isOpen: boolean) => void} [onOpenChange] - Callback for when the dropdown's open state changes.
 * @param {string} [className] - Additional class name for the outer container of the dropdown.
 */
export function DropdownMenu({
  children,
  closeOnAction = true,
  onOpenChange,
  className,
}: DropdownMenuProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleKeyDown: EventListener = (event) => {
    const keyboardEvent = event as unknown as KeyboardEvent;
    if (!isOpen) return;

    const items = Array.from(
      contentRef.current?.querySelectorAll<HTMLDivElement>(
        "[role='menuitem']",
      ) || [],
    );
    const itemCount = items.length;

    if (itemCount === 0) return;

    switch (keyboardEvent.key) {
      case "ArrowDown":
        setActiveIndex((prev) => {
          const nextIndex = (prev + 1) % itemCount;
          items[nextIndex]?.focus();
          return nextIndex;
        });
        keyboardEvent.preventDefault();
        break;

      case "ArrowUp":
        setActiveIndex((prev) => {
          const prevIndex = prev === 0 ? itemCount - 1 : prev - 1;
          items[prevIndex]?.focus();
          return prevIndex;
        });
        keyboardEvent.preventDefault();
        break;

      case "Enter":
      case " ":
        if (activeIndex >= 0) {
          items[activeIndex]?.click();
          if (closeOnAction) {
            setIsOpen(false);
            setActiveIndex(-1);
          }
        }
        keyboardEvent.preventDefault();
        break;

      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        keyboardEvent.preventDefault();
        event.stopPropagation();
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown as EventListener);
    } else {
      document.removeEventListener("keydown", handleKeyDown as EventListener);
    }

    if (onOpenChange) {
      onOpenChange(isOpen);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [isOpen, activeIndex, onOpenChange]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerRef,
        contentRef,
        activeIndex,
        setActiveIndex,
        closeOnAction,
      }}
    >
      <div className={className}>{children}</div>
    </DropdownMenuContext.Provider>
  );
}

// DropdownMenuTrigger
interface DropdownMenuTriggerProps {
  children: ReactNode;
  className?: string;
}

/**
 * DropdownMenuTrigger component that toggles the dropdown menu's open state.
 *
 * @param {ReactNode} children - The trigger element (e.g., a button or icon).
 * @param {string} [className] - Additional class name for the trigger element.
 */
export function DropdownMenuTrigger({
  children,
  className,
}: DropdownMenuTriggerProps): React.ReactNode {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenuContext();

  return (
    <div
      ref={triggerRef}
      onClick={() => setIsOpen(!isOpen)}
      className={cn("w-fit", className)}
    >
      {children}
    </div>
  );
}

// DropdownMenuContent
interface DropdownMenuContentProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

/**
 * DropdownMenuContent component for rendering the dropdown menu's items.
 * Now supports fixed header/footer layout with scrollable content.
 *
 * @param {ReactNode} children - The content inside the dropdown menu.
 * @param {string} [className] - Additional class name for the dropdown menu content.
 * @param {"left" | "right" | "center"} [align="left"] - Alignment of the dropdown menu relative to the trigger.
 */
export function DropdownMenuContent({
  children,
  className,
  align = "left",
}: DropdownMenuContentProps): React.ReactNode | null {
  const { isOpen, contentRef, triggerRef } = useDropdownMenuContext();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentWidth = contentRef.current.offsetWidth;
      const viewportWidth = window.innerWidth;

      let calculatedLeft = triggerRect.left + window.scrollX;
      let newAlign = align;

      if (
        align === "right" ||
        (align === "left" && triggerRect.right + contentWidth > viewportWidth)
      ) {
        newAlign = "right";
        calculatedLeft = triggerRect.right + window.scrollX - contentWidth;
      }

      if (align === "center" || newAlign === "center") {
        calculatedLeft =
          triggerRect.left +
          window.scrollX +
          triggerRect.width / 2 -
          contentWidth / 2;

        if (calculatedLeft < 0) {
          calculatedLeft = 0;
        } else if (calculatedLeft + contentWidth > viewportWidth) {
          calculatedLeft = viewportWidth - contentWidth;
        }
      }

      setPosition({
        top: triggerRect.bottom + window.scrollY,
        left: calculatedLeft,
      });

      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [isOpen, triggerRef, contentRef, align]);

  // Separate children into labels, items, and actions
  const labels: ReactNode[] = [];
  const items: ReactNode[] = [];
  const actions: ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === DropdownMenuLabel) {
        labels.push(child);
      } else if (child.type === DropdownMenuAction) {
        actions.push(child);
      } else {
        items.push(child);
      }
    }
  });

  return ReactDOM.createPortal(
    <div
      ref={contentRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        visibility: isReady ? "visible" : "hidden",
      }}
      className={cn(
        "absolute z-50 mt-2 flex max-h-60 min-w-[160px] flex-col border border-gray-300 bg-gray-100 shadow-md",
        className,
      )}
      role="menu"
    >
      {/* Fixed header with labels */}
      {labels.length > 0 && (
        <div className="shrink-0 border-b border-gray-300">{labels}</div>
      )}

      {/* Scrollable content area */}
      <div className="thin-scrollbar flex-1 overflow-auto">{items}</div>

      {/* Fixed footer with actions */}
      {actions.length > 0 && (
        <div className="shrink-0 border-t border-gray-300">{actions}</div>
      )}
    </div>,
    document.body,
  );
}

// DropdownMenuItem
interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * DropdownMenuItem component for an interactive item inside the dropdown menu.
 *
 * @param {ReactNode} children - The content of the dropdown item (e.g., text or icons).
 * @param {() => void} [onClick] - Callback for when the item is clicked.
 * @param {string} [className] - Additional class name for the dropdown menu item.
 */
export function DropdownMenuItem({
  children,
  onClick,
  className,
}: DropdownMenuItemProps): React.ReactNode {
  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "hover:outline-primary focus:outline-primary cursor-pointer border-b border-b-gray-300 bg-gray-100 px-2 py-1 text-sm last:border-none hover:bg-gray-200 hover:outline-2 hover:-outline-offset-2 hover:outline-none focus:bg-gray-300 focus:outline-1 focus:-outline-offset-1 focus:outline-none active:bg-gray-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

// DropdownMenuLabel
interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * DropdownMenuLabel component for rendering a non-interactive label in the dropdown menu.
 * This will be fixed at the top of the dropdown.
 *
 * @param {ReactNode} children - The content of the label.
 * @param {string} [className] - Additional class name for the dropdown menu label.
 */
export function DropdownMenuLabel({
  children,
  className,
}: DropdownMenuLabelProps): React.ReactNode {
  return (
    <div
      className={cn(
        "bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-500",
        className,
      )}
    >
      {children}
    </div>
  );
}

// DropdownMenuAction
interface DropdownMenuActionProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * DropdownMenuAction component for rendering an action button at the bottom of the dropdown menu.
 * This will be fixed at the bottom of the dropdown.
 *
 * @param {ReactNode} children - The content of the action button.
 * @param {() => void} [onClick] - Callback for when the action is clicked.
 * @param {string} [className] - Additional class name for the dropdown menu action.
 */
export function DropdownMenuAction({
  children,
  onClick,
  className,
}: DropdownMenuActionProps): React.ReactNode {
  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "hover:outline-primary focus:outline-primary cursor-pointer bg-gray-50 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:outline-2 hover:-outline-offset-2 hover:outline-none focus:bg-gray-200 focus:outline-1 focus:-outline-offset-1 focus:outline-none active:bg-gray-200",
        className,
      )}
    >
      {children}
    </div>
  );
}
