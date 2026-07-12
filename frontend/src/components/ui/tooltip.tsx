import React, {
  FC,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface InfoProps {
  border?: boolean;
  label?: React.ReactNode;
  details: string | React.ReactNode;
  className?: string;
  tooltipClassName?: string;
  onClick?: () => void;
  isDisabled?: boolean;
  icon?: React.ReactNode;
  id?: string;
  alignment?: "left" | "center" | "right";
  position?: "top" | "bottom";
  minWidth?: string;
}

const ToolTipInfo: FC<InfoProps> = ({
  label,
  border = true,
  details,
  className,
  tooltipClassName,
  onClick,
  isDisabled = false,
  icon,
  id,
  alignment = "left",
  position = "bottom",
  minWidth = "15em",
}) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const measureAndSetPosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;

    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8; // space between anchor and tooltip

    // ----- Vertical (top/bottom) -----
    let finalPosition: "top" | "bottom" = position;
    let top: number;

    const spaceAbove = anchorRect.top;
    const spaceBelow = viewportHeight - anchorRect.bottom;

    if (position === "bottom") {
      if (spaceBelow < tooltipRect.height && spaceAbove >= tooltipRect.height) {
        finalPosition = "top";
      }
    } else {
      if (spaceAbove < tooltipRect.height && spaceBelow >= tooltipRect.height) {
        finalPosition = "bottom";
      }
    }

    if (finalPosition === "bottom") {
      top = anchorRect.bottom + gap;
    } else {
      top = anchorRect.top - tooltipRect.height - gap;
    }

    // Clamp vertically into viewport (just in case)
    top = Math.max(
      gap,
      Math.min(top, viewportHeight - tooltipRect.height - gap),
    );

    // ----- Horizontal (left / center / right) -----
    let left: number;

    if (alignment === "center") {
      left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

      // If center goes out of bounds, fallback
      if (left < gap) {
        left = gap;
      } else if (left + tooltipRect.width > viewportWidth - gap) {
        left = viewportWidth - tooltipRect.width - gap;
      }
    } else if (alignment === "left") {
      // Tooltip right edge aligns with anchor right edge
      left = anchorRect.right - tooltipRect.width;

      if (left < gap) {
        // Not enough space on left, push to right edge
        left = anchorRect.left;
      }
    } else {
      // "right": tooltip left edge aligns with anchor left edge
      left = anchorRect.left;

      if (left + tooltipRect.width > viewportWidth - gap) {
        // Not enough space on right, push left
        left = anchorRect.right - tooltipRect.width;
      }
    }

    // Final clamp horizontally
    left = Math.max(
      gap,
      Math.min(left, viewportWidth - tooltipRect.width - gap),
    );
    setCoords({ top, left });
  }, [alignment, position]);

  // Recalculate whenever tooltip opens
  useLayoutEffect(() => {
    if (!isOpen) return;

    measureAndSetPosition();

    const handleResizeOrScroll = () => {
      measureAndSetPosition();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen, measureAndSetPosition]);

  const handleOpen = () => {
    if (isDisabled) return;
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isDisabled) return;
    setIsOpen(false);
  };

  return (
    <>
      <div
        id={id}
        ref={anchorRef}
        className={cn(
          "relative flex cursor-help items-center",
          {
            "border-l border-dotted": border,
            "h-5 rounded-none border-black": true,
            "cursor-not-allowed opacity-50": isDisabled,
          },
          className,
        )}
        onClick={isDisabled ? undefined : onClick}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        tabIndex={isDisabled ? -1 : 0}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>

      {isMounted &&
        !isDisabled &&
        isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-label="Help Details"
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              minWidth,
              visibility: coords ? "visible" : "hidden",
              zIndex: 555,
            }}
            className={cn(
              "rounded-sm border bg-white p-2 text-xs font-light shadow",
              tooltipClassName,
            )}
          >
            {details}
          </div>,
          document.body,
        )}
    </>
  );
};

export default ToolTipInfo;
