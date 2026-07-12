// @ts-nocheck
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";

import { Popover } from "@/components/ui/popover";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/check-box";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/input";

type SortDirection = "asc" | "desc" | null;
type Alignment = "left" | "center" | "right";

interface ActionOption {
  option: string;
  handleAction: (row: any) => void;
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  tabIndex?: number;
  formatValue?: (value: any, actualValue: any, rowIndex: number) => ReactNode;
  align?: Alignment;
  width?: number;
  minWidth?: number;
  action?: boolean;
  options?: ActionOption[];
  uppercase?: boolean;
  headerEditable?: boolean;
  onHeaderChange?: (newName: string) => void;
}

interface TableProps {
  className?: string;
  cellClassName?: string;
  initialColumns: Column[];
  currentPage: number;
  data: any[];
  getRowId?: (row: any) => string | number;
  hiddenColumns?: string[];
  preSortedCols?: { column: string; direction: SortDirection }[];
  loading?: boolean;
  onNextPage?: (lastRow?: any) => void;
  onPrevPage?: (firstRow?: any) => void;
  onRowClick?: (row: any) => void;
  selectedRows?: Set<string | number>;
  // selection is managed internally when `selectable` is true
  selectable?: boolean;
  singleSelect?: boolean;
  focusable?: boolean;
  onRowSelection?: (selectedRow: any, selectedRows: Set<any>) => void;
  pageCount?: number;
  rowClassName?: (row: any) => string;
  showFooter?: boolean;
  showColumnFilter?: boolean;
  isArrowBusy?: boolean;
  setIsArrowBusy?: (isArrowBusy: boolean) => void;
  rowsPerPage?: number;
  pagination?: boolean;
  NotFoundContent?: React.ReactNode;
  totalResults?: number;
  tableId?: string;
  onSortChange?: (column: string, direction: SortDirection) => void;
  initialSortConfig?: { column: string; direction: SortDirection }[];
  enableApiSorting?: boolean;
  getRowTooltip?: (row: any) => ReactNode | string | undefined;
  tooltipClassName?: string;
}

/**
 * Renders a customizable, interactive data table with support for pagination, sorting, column resizing, selection, and action popovers.
 *
 * The table supports keyboard navigation, dynamic column visibility, custom cell formatting, and displays loading or empty states as needed. Selection can be single or multiple, and actions can be attached to rows via popovers. Sorting and pagination are managed externally via callbacks.
 *
 * @param data - The array of row objects to display in the table.
 * @param initialColumns - The column definitions, including visibility, formatting, and action options.
 * @param NotFoundContent - Optional custom content to display when there is no data.
 * @param onRowClick - Optional callback invoked when a row is clicked or activated via keyboard.
 * @param showFooter - Whether to display the pagination and selection footer.
 * @param className - Optional additional CSS classes for the table container.
 * @param onNextPage - Callback to navigate to the next page, receiving the last row of the current page.
 * @param onPrevPage - Callback to navigate to the previous page, receiving the first row of the current page.
 * @param preSortedCols - Optional initial sort configuration.
 * @param rowClassName - Optional function to provide custom class names for rows.
 * @param cellClassName - Optional class name(s) for table cells.
 * @param pageCount - Total number of pages for pagination.
 * @param currentPage - The current page index (zero-based).
 * @param loading - Whether to display the loading state.
 * @param selectable - Enables row selection checkboxes.
 * @param singleSelect - Enables single row selection mode.
 * @param selectedRows - Set of selected row IDs.
 * @param setSelectedRows - Callback to update the selected rows.
 * @param showColumnFilter - Whether to show the column visibility popover.
 * @param getRowId - Function to extract a unique ID from a row object.
 * @param isArrowBusy - Whether keyboard navigation is currently busy (e.g., when a popover is open).
 * @param setIsArrowBusy - Callback to set the arrow busy state.
 * @param focusable - Enables keyboard focus and navigation for rows.
 * @param rowsPerPage - Number of rows to display per page.
 * @param pagination - Enables pagination controls and logic.
 * @param tableId - Optional unique identifier for the table. If more than one Table2 is rendered on the same page, provide a unique tableId for each to ensure row keys are unique and avoid React key warnings.
 * @param onSortChange - Optional callback triggered when a column is sorted.
 * @param initialSortConfig - Initial sort configuration for columns.
 * @param enableApiSorting - Whether to use server-side sorting instead of client-side sorting. Requires that onSortChange is provided.
 * @param getRowTooltip - Optional function to generate tooltips for rows.
 * @param tooltipClassName - Class name(s) for tooltips.
 * @param onRowSelection - Callback invoked when row selection changes.
 * @returns The rendered table component with all configured features.
 *
 * @remark
 * - Sorting is applied before pagination.
 * - Keyboard navigation supports arrow keys, Enter, and "/" for action popovers.
 * - Column resizing is performed via mouse drag on column edges.
 * - If no data is present, a default or custom empty state is shown.
 * - If more than one Table2 is used on the same page, you must provide a unique tableId prop to each instance to avoid duplicate row keys and React warnings.
 */
export function Table2({
  data,
  initialColumns,
  NotFoundContent,
  onRowClick,
  showFooter = true,
  className,
  onNextPage = () => {},
  onPrevPage = () => {},
  preSortedCols = [],
  rowClassName,
  cellClassName,
  pageCount = 1,
  currentPage = 0,
  loading = false,
  selectable = false,
  singleSelect = false,
  onRowSelection = () => {},
  showColumnFilter = false,
  getRowId = (row) => row.id,
  isArrowBusy = false,
  setIsArrowBusy = () => {},
  focusable = false,
  rowsPerPage = 15,
  pagination = true,
  totalResults,
  tableId = "", // Default to empty string
  onSortChange = () => {},
  initialSortConfig = [],
  enableApiSorting = false,
  getRowTooltip,
  tooltipClassName,
}: TableProps) {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const [openPopoverRowIndex, setOpenPopoverRowIndex] = useState<number | null>(
    null,
  );

  const [sortedData, setSortedData] = useState<any[]>(data);

  const startIndex = currentPage * rowsPerPage;
  const paginatedData = pagination
    ? sortedData.slice(startIndex, startIndex + rowsPerPage)
    : sortedData;

  const [isVisibleColumnPopoverOpen, setIsVisibleColumnPopoverOpen] =
    useState(false);

  const [sortConfig, setSortConfig] = useState<
    { column: string; direction: SortDirection }[]
  >(initialSortConfig.length > 0 ? initialSortConfig : preSortedCols);

  // Initialize visibleColumns based on initialColumns' visible property
  const getInitialVisibleColumns = () => {
    return initialColumns
      .filter((col) => col.visible !== false)
      .map((col) => col.key);
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    getInitialVisibleColumns(),
  );

  useEffect(() => {
    setColumns(
      initialColumns.map((col) => ({
        ...col,
        width: col.width || 150,
        minWidth: col.minWidth || 100,
      })),
    );
    // Update visibleColumns based on column.visible property
    setVisibleColumns(getInitialVisibleColumns());
  }, [initialColumns]);

  const [columns, setColumns] = useState(
    initialColumns.map((col) => ({
      ...col,
      width: col.width || 150,
      minWidth: col.minWidth || 100,
    })),
  );

  // Internal selection state when `selectable` is true (stores full row objects)
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<any>>(
    new Set(),
  );

  // Keep internal selection in sync with data (remove rows that no longer exist)
  useEffect(() => {
    if (!selectable) return;
    setInternalSelectedRows((prev) => {
      const validIds = new Set(data.map((r) => getRowId(r)));
      const next = new Set<any>();
      Array.from(prev).forEach((row) => {
        if (validIds.has(getRowId(row))) next.add(row);
      });

      // If sets are equal, return previous reference to avoid triggering state update
      if (prev.size === next.size) {
        let equal = true;
        Array.from(prev).forEach((row) => {
          let found = false;
          Array.from(next).forEach((nextRow) => {
            if (getRowId(row) === getRowId(nextRow)) {
              found = true;
            }
          });
          if (!found) {
            equal = false;
          }
        });
        if (equal) return prev;
      }

      return next;
    });
  }, [data, getRowId, selectable]);

  const [resizing, setResizing] = useState<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  // Flag to focus the first row after navigating to the next page via ArrowDown from the last row
  const focusFirstRowOnNextPageRef = useRef<boolean>(false);
  // Flag to focus the last row after navigating to the previous page via ArrowUp from the first row
  const focusLastRowOnPrevPageRef = useRef<boolean>(false);
  const [hoverTooltip, setHoverTooltip] = useState<{
    visible: boolean;
    content: ReactNode | string | undefined;
  }>({ visible: false, content: undefined });
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnIndex: number) => {
      e.preventDefault();
      const startX = e.pageX;
      const columnWidth = columns[columnIndex].width;

      setResizing({
        columnIndex,
        startX,
        startWidth: columnWidth,
      });
    },
    [columns],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.pageX - resizing.startX;
      const newWidth = Math.max(
        resizing.startWidth + diff,
        columns[resizing.columnIndex].minWidth || 100,
      );

      setColumns((prev) =>
        prev.map((col, index) =>
          index === resizing.columnIndex ? { ...col, width: newWidth } : col,
        ),
      );
    },
    [resizing, columns],
  );

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  const handleRowSelection = (rowId: string | number) => {
    const currentSelectedRows = internalSelectedRows || new Set<any>();
    const selectedRow = data.find((r) => getRowId(r) === rowId);

    if (!selectedRow) return; // Row not found in data

    if (singleSelect) {
      const newSelected = new Set<any>([selectedRow]);
      setInternalSelectedRows(newSelected);
      try {
        onRowSelection?.(selectedRow, newSelected);
      } catch (e) {
        console.error("onRowSelection error:", e);
      }
    } else {
      const newSelected = new Set<any>();
      let isRemoving = false;

      // Check if row is already selected by ID comparison
      Array.from(currentSelectedRows).forEach((row) => {
        if (getRowId(row) === rowId) {
          isRemoving = true;
        } else {
          newSelected.add(row);
        }
      });

      // If we weren't removing it, add it now
      if (!isRemoving) {
        newSelected.add(selectedRow);
      }

      setInternalSelectedRows(newSelected);
      try {
        // Pass null for selectedRow if deselecting, otherwise pass the selected row
        onRowSelection?.(isRemoving ? null : selectedRow, newSelected);
      } catch (e) {
        console.error("onRowSelection error:", e);
      }
    }
  };

  const handleSelectAll = () => {
    if (internalSelectedRows.size === data.length) {
      const cleared = new Set<any>();
      setInternalSelectedRows(cleared);
      try {
        onRowSelection?.(null, cleared);
      } catch (e) {
        console.error("onRowSelection error:", e);
      }
    } else {
      const newSelected = new Set(data);
      setInternalSelectedRows(newSelected);
      try {
        onRowSelection?.(null, newSelected);
      } catch (e) {
        console.error("onRowSelection error:", e);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!paginatedData.length || !tableRef.current || isArrowBusy) return;

      const isArrowKey = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.key);
      if (
        !isArrowKey &&
        e.key !== "Enter" &&
        e.key !== "/"
        //  && e.key !== " "
      )
        return;

      e.preventDefault();
      const rows = tableRef.current.querySelectorAll("tr[tabindex='-1']");
      if (!rows.length) return;

      if (e.key === "ArrowLeft" && currentPage > 0) {
        const firstRow = paginatedData[0];
        onPrevPage(firstRow);
        return;
      }

      if (e.key === "ArrowRight" && currentPage < pageCount - 1) {
        const lastRow = paginatedData[paginatedData.length - 1];
        onNextPage(lastRow);
        return;
      }

      let newIndex = focusedRowIndex;
      if (e.key === "ArrowUp") {
        if (focusedRowIndex === -1) {
          setFocusedRowIndex(0);
          newIndex = 0;
        } else if (focusedRowIndex === 0) {
          // At the first row of the current page: go to previous page (if available) and focus last row
          if (currentPage > 0) {
            focusLastRowOnPrevPageRef.current = true;
            const firstRow = paginatedData[0];
            onPrevPage(firstRow);
            return; // prevent wrapping within the same page
          } else {
            // No previous page: keep focus on the first row
            newIndex = 0;
          }
        } else {
          newIndex = focusedRowIndex - 1;
        }
      } else if (e.key === "ArrowDown") {
        if (focusedRowIndex === -1) {
          setFocusedRowIndex(0);
          newIndex = 0;
        } else if (focusedRowIndex === rows.length - 1) {
          // At the last row of the current page: go to next page (if available) and focus first row
          if (currentPage < pageCount - 1) {
            focusFirstRowOnNextPageRef.current = true;
            const lastRow = paginatedData[paginatedData.length - 1];
            onNextPage(lastRow);
            return; // prevent wrapping within the same page
          } else {
            // No next page: keep focus on the last row
            newIndex = rows.length - 1;
          }
        } else {
          newIndex = focusedRowIndex + 1;
        }
      }

      if (focusedRowIndex === -1) {
        return;
      }

      if (e.key === "Enter" && onRowClick) {
        onRowClick(paginatedData[newIndex]);
      }

      if (e.key === "/" && onRowClick) {
        setOpenPopoverRowIndex((prevIndex) => {
          if (prevIndex === focusedRowIndex) {
            setIsArrowBusy(false);
            return null;
          } else {
            setIsArrowBusy(true);
            return focusedRowIndex;
          }
        });
      }

      // if (e.key === " " && selectable && focusedRowIndex >= 0) {
      //   handleRowSelection(paginatedData[newIndex].id);
      // }

      setFocusedRowIndex(newIndex);
      const rowToFocus = rows[newIndex] as HTMLTableRowElement;
      rowToFocus?.focus();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setFocusedRowIndex(-1);
        setOpenPopoverRowIndex(null);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(e.relatedTarget as Node)
      ) {
        setFocusedRowIndex(-1);
        setOpenPopoverRowIndex(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [
    focusedRowIndex,
    data,
    onRowClick,
    selectable,
    getRowId,
    handleRowSelection,
    isArrowBusy,
    setIsArrowBusy,
    currentPage,
    pageCount,
    onNextPage,
    onPrevPage,
  ]);

  // When a page change was triggered by ArrowDown at last row or ArrowUp at first row,
  // focus the appropriate row after the DOM has painted.
  useEffect(() => {
    if (!tableRef.current) return;

    const focusAfterPaint = () => {
      const rows = tableRef.current?.querySelectorAll("tr[tabindex='-1']");
      if (!rows || !rows.length) return;

      if (focusFirstRowOnNextPageRef.current) {
        focusFirstRowOnNextPageRef.current = false;
        setFocusedRowIndex(0);
        const firstRow = rows[0] as HTMLTableRowElement;
        firstRow?.focus();
        firstRow?.scrollIntoView({ block: "nearest" });
        return;
      }

      if (focusLastRowOnPrevPageRef.current) {
        focusLastRowOnPrevPageRef.current = false;
        const lastIndex = rows.length - 1;
        setFocusedRowIndex(lastIndex);
        const lastRow = rows[lastIndex] as HTMLTableRowElement;
        lastRow?.focus();
        lastRow?.scrollIntoView({ block: "nearest" });
        return;
      }
    };

    // Ensure focus runs after layout/paint
    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      requestAnimationFrame(focusAfterPaint);
    } else {
      setTimeout(focusAfterPaint, 0);
    }
  }, [paginatedData, currentPage]);

  // Update sortedData whenever data or sortConfig changes
  useEffect(() => {
    if (enableApiSorting) {
      // When API sorting is enabled, just use the data as-is
      setSortedData(data);
    } else {
      // Client-side sorting
      const newSortedData = [...data].sort((a, b) => {
        for (const sort of sortConfig) {
          const { column, direction } = sort;
          if (a[column] < b[column]) return direction === "asc" ? -1 : 1;
          if (a[column] > b[column]) return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
      setSortedData(newSortedData);
    }
  }, [data, sortConfig, enableApiSorting]);

  const handleSort = (columnKey: string) => {
    const currentSort = sortConfig.find((sort) => sort.column === columnKey);
    let newDirection: "asc" | "desc" | null = "asc";

    if (currentSort) {
      if (currentSort.direction === "asc") newDirection = "desc";
      else if (currentSort.direction === "desc") newDirection = null;
    }

    if (enableApiSorting && onSortChange && newDirection) {
      // Use API-based sorting
      onSortChange(columnKey, newDirection);
      // Also update local state to reflect the change
      setSortConfig(
        newDirection
          ? [{ column: columnKey, direction: newDirection }]
          : sortConfig.filter((sort) => sort.column !== columnKey),
      );
    } else {
      // Use client-side sorting
      setSortConfig(
        newDirection
          ? [{ column: columnKey, direction: newDirection }]
          : sortConfig.filter((sort) => sort.column !== columnKey),
      );
    }
  };

  const renderActionColumn = (row: any, rowIndex: number) => {
    const actionColumn = columns.find((col) => col.action);
    if (!actionColumn?.options) return null;

    return (
      <Popover
        align="right"
        closeOnAction
        open={openPopoverRowIndex === rowIndex}
        onOpenChange={(isOpen) => {
          setIsArrowBusy(isOpen);
        }}
      >
        {actionColumn.options.map((option) => (
          <button
            key={option.option}
            className={cn(
              "w-full border-b px-2 text-left text-sm last:border-none",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              option.handleAction(row);
            }}
          >
            {option.option}
          </button>
        ))}
      </Popover>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-7em)] items-center justify-center">
        <Loader size="md" label="Loading Table Data..." />
      </div>
    );
  }
  return (
    <div
      className={cn(
        className,
        "grid",
        pagination && "h-[calc(100vh-7em)] grid-rows-[auto,_1fr]",
      )}
    >
      {showFooter && pagination && (
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Page {currentPage + 1} of {pageCount > 0 ? pageCount : 1}
              <span className="text-gray-400">
                {typeof totalResults === "number"
                  ? ` • ${totalResults} total result${totalResults === 1 ? "" : "s"}`
                  : ""}
              </span>
            </span>
            {selectable && (
              <span className="text-sm text-gray-700">
                ({internalSelectedRows.size} selected)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                const firstRow = data[0];
                onPrevPage(firstRow);
              }}
              disabled={currentPage === 0}
              className="!p-0.5 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              <FaCaretLeft size={18} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const lastRow = data[data.length - 1];
                onNextPage(lastRow);
              }}
              disabled={currentPage === pageCount - 1}
              className="!p-0.5 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              <FaCaretRight size={18} />
            </Button>
          </div>
        </div>
      )}
      <div
        ref={tableRef}
        className={cn(
          "overflow-auto border border-gray-300 bg-white focus:outline-none focus-visible:outline-none",
        )}
        tabIndex={-1}
      >
        {data.length > 0 && (
          <table className="relative table min-w-full table-auto border-collapse border-b border-gray-300 bg-white">
            {showColumnFilter && (
              <Popover
                className="absolute top-1 right-2 z-10"
                align="right"
                title="Visible Columns"
                trigger={<SlidersHorizontal className="h-4 w-4" />}
                open={isVisibleColumnPopoverOpen}
                onOpenChange={(isOpen) => {
                  setIsVisibleColumnPopoverOpen(isOpen);
                  setIsArrowBusy(isOpen);
                }}
              >
                {columns
                  .filter((column) => column.visible !== false) // Only show columns with visible !== false in the column selector
                  .map((column) => (
                    <label
                      className="flex w-full items-center gap-2 px-2 py-1 text-sm select-none"
                      key={column.key}
                      htmlFor={column.key}
                    >
                      <Checkbox
                        id={column.key}
                        checked={visibleColumns.includes(column.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibleColumns([...visibleColumns, column.key]);
                          } else {
                            setVisibleColumns(
                              visibleColumns.filter(
                                (key) => key !== column.key,
                              ),
                            );
                          }
                        }}
                      />
                      {column.label}
                    </label>
                  ))}
              </Popover>
            )}
            <thead className="sticky top-0 z-2 bg-gray-200">
              <tr>
                {selectable && (
                  <th className="min-w-10 border-r border-gray-300 pt-2">
                    {!singleSelect && (
                      <Checkbox
                        checked={
                          internalSelectedRows.size === data.length &&
                          data.length > 0
                        }
                        onChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    )}
                  </th>
                )}
                {columns
                  .filter((col) => visibleColumns.includes(col.key))
                  .map((column, columnIndex) => {
                    const sort = sortConfig.find(
                      (s) => s.column === column.key,
                    );
                    return (
                      <th
                        {...(typeof column.label === "string" && {
                          title: column.label,
                        })}
                        key={column.key}
                        className={cn(
                          "group relative border-r border-gray-300 px-2 py-1 text-left text-sm font-medium text-gray-900 select-none last:border-none",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                        )}
                      >
                        <div
                          className="flex items-center gap-2"
                          style={{
                            width: column.width,
                          }}
                        >
                          {column.headerEditable ? (
                            <Input
                              tabIndex={-1}
                              value={column.label}
                              onChange={(e) => {
                                // Only update the local state for visual feedback
                                const newColumns = [...columns];
                                const columnIndex = newColumns.findIndex(
                                  (col) => col.key === column.key,
                                );
                                if (columnIndex !== -1) {
                                  newColumns[columnIndex] = {
                                    ...newColumns[columnIndex],
                                    label: e.target.value,
                                  };
                                  setColumns(newColumns);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  column.onHeaderChange?.(input.value);
                                  input.blur();
                                }
                              }}
                              onBlur={(e) => {
                                const input = e.target as HTMLInputElement;
                                column.onHeaderChange?.(input.value);
                              }}
                              className="border-none bg-transparent p-0 focus:ring-0 focus:outline-none"
                              width="full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="block truncate">
                              {column.label}
                            </span>
                          )}
                          {column.sortable && (
                            <Button
                              variant="ghost"
                              onClick={() => handleSort(column.key)}
                              className="!p-1 hover:bg-gray-200"
                            >
                              {sort?.direction === "asc" && (
                                <ArrowUp className="h-4 w-4" />
                              )}
                              {sort?.direction === "desc" && (
                                <ArrowDown className="h-4 w-4" />
                              )}
                              {!sort && (
                                <div className="h-4 w-4">
                                  <ArrowUpDown className="h-4 w-4" />
                                </div>
                              )}
                            </Button>
                          )}
                        </div>
                        <div
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-0 group-hover:opacity-100",
                            resizing?.columnIndex === columnIndex &&
                              "bg-primary opacity-100",
                          )}
                          onMouseDown={(e) => handleMouseDown(e, columnIndex)}
                        />
                      </th>
                    );
                  })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row) || rowIndex;

                return (
                  <tr
                    key={tableId ? `${tableId}-${rowId}` : rowId}
                    onMouseEnter={() => {
                      if (!getRowTooltip) return;
                      const content = getRowTooltip(row);
                      if (!content) return;
                      setHoverTooltip({ visible: true, content });
                      setHoveredRowIndex(rowIndex);
                    }}
                    onMouseLeave={() => {
                      if (!hoverTooltip.visible) return;
                      setHoverTooltip({ visible: false, content: undefined });
                      setHoveredRowIndex(null);
                    }}
                    onClick={(e) => {
                      if (
                        !focusable ||
                        (e.target as HTMLElement).closest("[data-checkbox]")
                      )
                        return;
                      setFocusedRowIndex(rowIndex);
                      onRowClick?.(row);
                    }}
                    tabIndex={-1}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50 focus:outline-none",
                      "border-t border-gray-300",
                      internalSelectedRows.has(rowId) &&
                        "bg-gray-50 hover:bg-gray-100",
                      getRowTooltip &&
                        hoveredRowIndex === rowIndex &&
                        "outline-primaryH outline-2 -outline-offset-2",
                      focusedRowIndex === rowIndex &&
                        "outline-primary focus:outline-primary bg-gray-100 -outline-offset-2 outline-none hover:bg-gray-200 focus:outline-2 focus:-outline-offset-2 focus:outline-none",
                      rowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-10 border-r border-gray-300 text-center"
                        onClick={() => {
                          if (!focusable) return;
                          setFocusedRowIndex(rowIndex);
                        }}
                        data-row-index={rowIndex}
                      >
                        <Checkbox
                          checked={internalSelectedRows.has(rowId)}
                          onChange={() => handleRowSelection(rowId)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </td>
                    )}
                    {columns
                      .filter((col) => visibleColumns.includes(col.key))
                      .map((column) => (
                        <td
                          key={column.key}
                          tabIndex={column?.tabIndex ?? -1}
                          className={cn(
                            "max-w-[250px] truncate border-r border-gray-300 px-2 py-[3px] text-sm text-gray-900 last:border-none",
                            cellClassName,
                            column.align === "center" && "text-center",
                            column.align === "right" && "text-right",
                            column.uppercase && "uppercase",
                          )}
                          onClick={() => {
                            if (!focusable) return;
                            setFocusedRowIndex(rowIndex);
                          }}
                          data-row-index={rowIndex}
                          title={
                            column.action
                              ? "actions"
                              : typeof row[column.key] === "string"
                                ? row[column.key]
                                : undefined
                          }
                        >
                          {column.action
                            ? renderActionColumn(row, rowIndex)
                            : column.formatValue
                              ? column.formatValue(
                                  row[column.key],
                                  row,
                                  rowIndex,
                                )
                              : row[column.key]}
                        </td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {data.length === 0 && (
          <div className="flex h-full items-center justify-center">
            {NotFoundContent ? (
              NotFoundContent
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <SearchX className="h-8 w-8 text-gray-500 md:h-10 md:w-10" />
                <h2 className="text-xl text-gray-500 md:text-2xl">
                  No data found
                </h2>
                <p className="text-sm text-gray-400">
                  No records to display in this table
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Static, optimized row tooltip (top-right of table) */}
      {hoverTooltip.visible && hoverTooltip.content && (
        <div
          className={cn(
            "pointer-events-none absolute right-4 bottom-4 z-[555] max-w-xs border border-gray-300 bg-white p-2 text-xs text-gray-800 shadow-lg",
            tooltipClassName,
          )}
        >
          {hoverTooltip.content}
        </div>
      )}
    </div>
  );
}
