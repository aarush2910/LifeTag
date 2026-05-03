// VetTable.tsx
import { useId, useMemo, useRef, useState } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "../components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export type Appointment = {
  aid: string;                 // real UUID — used for API calls
  appointment_id: string;      // human-readable appointment_code — display only
  farmer_name: string;
  cattle_name: string;         // map cattle_cid_short (or local_cattle_id)
  cattle_tag_id: string;
  inaph_id: string;
  cattle_breed?: string;
  symptoms: string;
  appointment_date: string;
  time_slot: string;
  status: "Pending" | "Accepted" | "Completed";
  remarks?: string;
};

// Multi-column filter function
const multiColumnFilterFn: FilterFn<Appointment> = (
  row,
  filterValue
) => {
  const searchableRowContent = `${row.original.farmer_name} ${row.original.cattle_tag_id} ${row.original.cattle_name} ${row.original.inaph_id}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Status filter function
const statusFilterFn: FilterFn<Appointment> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

const columns: ColumnDef<Appointment>[] = [
  {
    header: "ID",
    accessorKey: "appointment_id",
    enableHiding: false,
  },
  {
    header: "Farmer Name",
    accessorKey: "farmer_name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("farmer_name")}</div>
    ),
    filterFn: multiColumnFilterFn,
  },
  {
    header: "INAPH ID",
    accessorKey: "inaph_id",
  },
  {
    header: "Cattle Tag ID",
    accessorKey: "cattle_tag_id",
  },
  {
    header: "Cattle Name",
    accessorKey: "cattle_name",
  },
  {
    header: "Breed",
    accessorKey: "cattle_breed",
    cell: ({ row }) =>
      row.getValue("cattle_breed") || (
        <span className="text-muted-foreground italic">N/A</span>
      ),
  },
  {
    header: "Symptoms",
    accessorKey: "symptoms",
  },
  {
    header: "Date",
    accessorKey: "appointment_date",
  },
  {
    header: "Time",
    accessorKey: "time_slot",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={cn(
            status === "Pending" && "bg-yellow-500 text-white hover:bg-yellow-600",
            status === "Accepted" && "bg-blue-500 text-white hover:bg-blue-600",
            status === "Completed" && "bg-green-500 text-white hover:bg-green-600"
          )}
        >
          {status}
        </Badge>
      );
    },
    filterFn: statusFilterFn,
  },
  {
    header: "Remarks",
    accessorKey: "remarks",
    cell: ({ row }) =>
      row.getValue("remarks") || (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => <RowActions row={row} onDelete={(table.options.meta as any)?.onDelete} />,
    enableHiding: false,
  },
];

export type VetTableProps = {
  data: Appointment[];
  onDelete?: (aid: string) => void;
};

export default function VetTable({ data, onDelete }: VetTableProps) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "appointment_id",
      desc: false,
    },
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
    meta: { onDelete },
  });

  // Get unique status values
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn("status");
    if (!statusColumn) return [];
    const values = Array.from(statusColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn("status");
    if (!statusColumn) return new Map();
    return statusColumn.getFacetedUniqueValues();
  }, [table]);

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("status")?.getFilterValue()]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn("status")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <div className="w-full space-y-4 p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by farmer name or cattle tag */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(table.getColumn("farmer_name")?.getFilterValue()) && "pe-9"
              )}
              value={
                (table.getColumn("farmer_name")?.getFilterValue() ?? "") as string
              }
              onChange={(e) =>
                table.getColumn("farmer_name")?.setFilterValue(e.target.value)
              }
              placeholder="Filter by farmer name or tag..."
              type="text"
              aria-label="Filter by farmer name or cattle tag"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("farmer_name")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("farmer_name")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filter by status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <FilterIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Filters
                </div>
                <div className="space-y-3">
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleStatusChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {statusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3Icon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-11">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col w-full sm:flex-row items-center justify-between gap-4">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page number information */}
        <div className="flex justify-center text-sm whitespace-nowrap text-muted-foreground">
          <p aria-live="polite">
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getRowCount()
              )}
            </span>{" "}
            of{" "}
            <span className="text-foreground">
              {table.getRowCount()}
            </span>
          </p>
        </div>

        {/* Pagination buttons */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronFirstIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronLastIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

// ─── Appointment Modal ────────────────────────────────────────────────────────
function AppointmentModal({ type, data, onClose, onConfirm }: {
  type: "view" | "error" | "confirm" | "clear";
  data: any;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          type === "error" ? "bg-red-50 dark:bg-red-900/20" :
          type === "confirm" ? "bg-orange-50 dark:bg-orange-900/20" :
          type === "clear" ? "bg-orange-50 dark:bg-orange-900/20" : "bg-muted/30"
        }`}>
          <h2 className="font-semibold text-base">
            {type === "view" ? "Appointment Details" :
             type === "error" ? "⚠ Action Failed" :
             type === "clear" ? "🗑 Clear Appointment" : "⚠ Confirm Cancellation"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {type === "view" && (
            <div className="space-y-3">
              {[
                ["Appointment ID", data?.appointment_id],
                ["Farmer", data?.farmer_name],
                ["Cattle", `${data?.cattle_name} (${data?.cattle_tag_id})`],
                ["INAPH ID", data?.inaph_id],
                ["Symptoms", data?.symptoms],
                ["Date & Time", `${data?.appointment_date} ${data?.time_slot}`],
                ["Status", data?.status],
                ["Remarks", data?.remarks || "None"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm font-medium break-words">{value || "—"}</span>
                </div>
              ))}
            </div>
          )}
          {type === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">{data?.message || "Something went wrong. Please try again."}</p>
          )}
          {type === "confirm" && (
            <p className="text-sm text-foreground">Are you sure you want to cancel appointment <span className="font-mono font-bold">{data?.appointment_id}</span>? This action cannot be undone.</p>
          )}
          {type === "clear" && (
            <p className="text-sm text-foreground">Permanently remove <span className="font-mono font-bold">{data?.appointment_id}</span> from your list? The appointment record will be deleted from the database.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          {type === "view" && (
            <button onClick={onClose} className="w-full px-4 py-2 rounded-lg border bg-background hover:bg-muted text-sm font-medium transition-colors">Close</button>
          )}
          {type === "error" && (
            <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Dismiss</button>
          )}
          {type === "confirm" && (
            <>
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border bg-background hover:bg-muted text-sm font-medium transition-colors">Keep Appointment</button>
              <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors">Yes, Cancel It</button>
            </>
          )}
          {type === "clear" && (
            <>
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border bg-background hover:bg-muted text-sm font-medium transition-colors">Keep It</button>
              <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors">Yes, Clear It</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RowActions({ row, onDelete, onRefresh }: { row: Row<Appointment>; onRefresh?: () => void; onDelete?: (aid: string) => void }) {
  const appointment = row.original;
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ type: "view" | "error" | "confirm" | "clear"; data: any } | null>(null);

  const getUser = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const navTo = (path: string) => { window.location.href = path; };

  const callApi = async (method: string, url: string, sendBody?: boolean) => {
    const user = getUser();
    const token = user.access_token || user.token || "";
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      // Only set Content-Type when actually sending a body
      if (sendBody) headers["Content-Type"] = "application/json";

      const res = await fetch(url, {
        method,
        headers,
        body: sendBody ? JSON.stringify({ status: "Approved" }) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const detail = d.detail;
        const msg = Array.isArray(detail)
          ? detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ")
          : typeof detail === "string" ? detail : JSON.stringify(d) || "Request failed";
        throw new Error(msg);
      }
      if (res.status === 204) return null;
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await callApi("PUT", `${API_BASE}/api/vet/appointments/${appointment.aid}/accept`);
      const params = new URLSearchParams({
        appointment_code: appointment.appointment_id,
        inaph_id: appointment.inaph_id || "",
        cattle_id: appointment.cattle_tag_id || "",
      });
      // Persist context so the health form survives navigation away and back
      sessionStorage.setItem(
        "pendingHealthForm",
        JSON.stringify({
          appointment_code: appointment.appointment_id,
          inaph_id: appointment.inaph_id || "",
          cattle_id: appointment.cattle_tag_id || "",
          expires_at: Date.now() + 8 * 3600 * 1000, // 8-hour window
        })
      );
      navTo(`/vet-dashboard/health?${params.toString()}`);
    } catch (e: any) {
      setModal({ type: "error", data: { message: `Failed to accept appointment: ${e.message}` } });
    }
  };

  const handleComplete = async () => {
    try {
      await callApi("PUT", `${API_BASE}/api/vet/appointments/${appointment.aid}/complete`);
      onRefresh?.();
    } catch (e: any) {
      setModal({ type: "error", data: { message: `Failed to complete: ${e.message}` } });
    }
  };

  const handleCancelConfirmed = async () => {
    setModal(null);
    try {
      await callApi("PUT", `${API_BASE}/api/vet/appointments/${appointment.aid}/cancel`);
      onDelete?.(appointment.aid);
    } catch (e: any) {
      setModal({ type: "error", data: { message: `Failed to cancel: ${e.message}` } });
    }
  };

  const handleClearConfirmed = async () => {
    setModal(null);
    try {
      await callApi("DELETE", `${API_BASE}/api/vet/appointments/clear/${appointment.aid}`);
      onDelete?.(appointment.aid);
    } catch (e: any) {
      setModal({ type: "error", data: { message: `Failed to clear: ${e.message}` } });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 shadow-none" aria-label="Actions" disabled={loading}>
            <EllipsisIcon size={16} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setModal({ type: "view", data: appointment })}>
              View Details
            </DropdownMenuItem>
            {appointment.status === "Pending" && (
              <DropdownMenuItem onClick={handleAccept}>Accept Appointment</DropdownMenuItem>
            )}
            {appointment.status === "Accepted" && (
              <DropdownMenuItem onClick={handleComplete}>Mark as Completed</DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {appointment.status !== "Completed" && appointment.status !== "Accepted" && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setModal({ type: "confirm", data: appointment })}
            >
              Cancel Appointment
            </DropdownMenuItem>
          )}
          {appointment.status === "Completed" && (
            <DropdownMenuItem
              className="text-orange-600 focus:text-orange-600"
              onClick={() => setModal({ type: "clear", data: appointment })}
            >
              Clear from List
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {modal && (
        <AppointmentModal
          type={modal.type}
          data={modal.data}
          onClose={() => setModal(null)}
          onConfirm={
            modal.type === "confirm" ? handleCancelConfirmed :
            modal.type === "clear" ? handleClearConfirmed : undefined
          }
        />
      )}
    </>
  );
}
