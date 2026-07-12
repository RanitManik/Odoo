import React, {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  KeyboardEvent,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

// Context for Tabs
interface TabsContextProps {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

function useTabsContext(): TabsContextProps {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider.");
  }
  return context;
}

// Tabs wrapper component
interface TabsProps {
  children: ReactNode;
  initialIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
}

/**
 * Tabs component to manage tab state and provide context.
 *
 * @param {ReactNode} children - The tab list and tab panels.
 * @param {number} [initialIndex=0] - The initial active tab index.
 * @param {(index: number) => void} [onTabChange] - Callback for when the active tab changes.
 * @param {string} [className] - Additional class name for the tabs wrapper.
 */
export function Tabs({
  children,
  initialIndex = 0,
  onTabChange,
  className,
}: TabsProps): React.ReactNode {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeIndex);
    }
  }, [activeIndex, onTabChange]);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      <div className={cn("md:flex md:gap-10", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// TabList component
interface TabListProps {
  children: ReactNode;
  className?: string;
}

/**
 * TabList component to render the tab buttons.
 *
 * @param {ReactNode} children - The tab buttons.
 * @param {string} [className] - Additional class name for the tab list.
 */
export function TabList({
  children,
  className,
}: TabListProps): React.ReactNode {
  const { activeIndex, setActiveIndex } = useTabsContext();
  const tabRefs = useRef<HTMLButtonElement[]>([]);

  const handleKeyDown = (event: KeyboardEvent) => {
    const count = React.Children.count(children);

    switch (event.key) {
      case "ArrowRight": {
        const nextIndex = (activeIndex + 1) % count;
        setActiveIndex(nextIndex);
        tabRefs.current[nextIndex]?.focus();
        break;
      }
      case "ArrowLeft": {
        const prevIndex = (activeIndex - 1 + count) % count;
        setActiveIndex(prevIndex);
        tabRefs.current[prevIndex]?.focus();
        break;
      }
      case "Home": {
        setActiveIndex(0);
        tabRefs.current[0]?.focus();
        break;
      }
      case "End": {
        setActiveIndex(count - 1);
        tabRefs.current[count - 1]?.focus();
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-row gap-2 overflow-auto pb-2 md:min-w-52 md:flex-col md:pb-0",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {React.Children.map(children, (child, index) =>
        React.cloneElement(
          child as React.ReactElement,
          {
            ref: (el: HTMLButtonElement) => (tabRefs.current[index] = el),
            isActive: activeIndex === index,
            onClick: () => setActiveIndex(index),
          } as any,
        ),
      )}
    </div>
  );
}

interface TabProps {
  children: ReactNode;
  additionalJsx?: ReactNode; // Additional JSX to render alongside the tab name
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Tab component representing a single tab button.
 *
 * @param {ReactNode} children - The tab button content.
 * @param {ReactNode} [additionalJsx] - Additional JSX to render alongside the tab name.
 * @param {boolean} [isActive=false] - Whether the tab is currently active.
 * @param {() => void} [onClick] - Callback for when the tab is clicked.
 * @param {string} [className] - Additional class name for the tab button.
 */
export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ children, additionalJsx, isActive = false, onClick, className }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center",
          isActive
            ? "border-primary text-primary border-b-2 bg-white"
            : "text-gray-500",
        )}
      >
        <button
          ref={ref}
          role="tab"
          aria-selected={isActive}
          onClick={onClick}
          className={cn(
            "flex w-full items-center space-x-2 px-4 py-2 text-sm font-medium transition-all hover:bg-gray-200 hover:text-black",
            className,
          )}
        >
          {children}
        </button>
        {additionalJsx && (
          <span className="text-gray-600">{additionalJsx}</span>
        )}
      </div>
    );
  },
);

Tab.displayName = "Tab";

// TabPanel component
interface TabPanelProps {
  children: ReactNode;
  index: number;
  className?: string;
}

/**
 * TabPanel component for rendering content of the active tab.
 *
 * @param {ReactNode} children - The content of the tab panel.
 * @param {number} index - The index of the tab panel corresponding to the tab.
 * @param {string} [className] - Additional class name for the tab panel.
 */
export function TabPanel({
  children,
  index,
  className,
}: TabPanelProps): React.ReactNode | null {
  const { activeIndex } = useTabsContext();

  return activeIndex === index ? (
    <div role="tabpanel" className={cn("mt-4 w-full md:mt-0", className)}>
      {children}
    </div>
  ) : null;
}
