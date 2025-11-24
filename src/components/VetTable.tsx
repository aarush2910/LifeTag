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

type Appointment = {
  appointment_id: string;
  farmer_name: string;
  cattle_name: string;
  cattle_tag_id: string;
  inaph_id: string;
  cattle_breed?: string;
  symptoms: string;
  appointment_date: string;
  time_slot: string;
  status: "Pending" | "Accepted" | "Completed";
  remarks?: string;
};

// Updated Static Data
const staticData: Appointment[] = [
  {
    appointment_id: "APT001",
    farmer_name: "Ramesh Kumar",
    cattle_name: "Bhuri",
    cattle_tag_id: "TAG1001",
    inaph_id: "INAPH001",
    cattle_breed: "Gir",
    symptoms: "Loss of appetite, fever",
    appointment_date: "2025-11-01",
    time_slot: "10:00 AM",
    status: "Pending",
    remarks: "Urgent case",
  },
  {
    appointment_id: "APT002",
    farmer_name: "Sita Devi",
    cattle_name: "Kali",
    cattle_tag_id: "TAG1002",
    inaph_id: "INAPH002",
    cattle_breed: "Sahiwal",
    symptoms: "Lameness in left leg",
    appointment_date: "2025-11-02",
    time_slot: "02:00 PM",
    status: "Accepted",
    remarks: "Requires urgent checkup",
  },
  {
    appointment_id: "APT003",
    farmer_name: "Anil Patel",
    cattle_name: "Gauri",
    cattle_tag_id: "TAG1003",
    inaph_id: "INAPH003",
    cattle_breed: "Jersey",
    symptoms: "Coughing and runny nose",
    appointment_date: "2025-11-03",
    time_slot: "09:00 AM",
    status: "Completed",
    remarks: "Recovered well",
  },
  {
    appointment_id: "APT004",
    farmer_name: "Priya Sharma",
    cattle_name: "Lakshmi",
    cattle_tag_id: "TAG1004",
    inaph_id: "INAPH004",
    symptoms: "Swollen udder",
    appointment_date: "2025-11-05",
    time_slot: "11:00 AM",
    status: "Pending",
  },
  {
    appointment_id: "APT005",
    farmer_name: "Vikram Singh",
    cattle_name: "Nandi",
    cattle_tag_id: "TAG1005",
    inaph_id: "INAPH005",
    cattle_breed: "Holstein",
    symptoms: "Decreased milk production",
    appointment_date: "2025-11-06",
    time_slot: "03:00 PM",
    status: "Accepted",
    remarks: "Follow-up required",
  },
  {
    appointment_id: "APT006",
    farmer_name: "Lakshmi Reddy",
    cattle_name: "Surbhi",
    cattle_tag_id: "TAG1006",
    inaph_id: "INAPH006",
    cattle_breed: "Red Sindhi",
    symptoms: "Eye infection",
    appointment_date: "2025-11-07",
    time_slot: "10:00 AM",
    status: "Pending",
  },
  {
    appointment_id: "APT007",
    farmer_name: "Mohan Lal",
    cattle_name: "Rani",
    cattle_tag_id: "TAG1007",
    inaph_id: "INAPH007",
    symptoms: "Skin rashes",
    appointment_date: "2025-11-08",
    time_slot: "01:00 PM",
    status: "Completed",
    remarks: "Treatment successful",
  },
];


// Multi-column filter function
const multiColumnFilterFn: FilterFn<Appointment> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.farmer_name} ${row.original.cattle_tag_id}`.toLowerCase();
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
    header: "Cattle Id",
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
    cell: ({ row }) => <RowActions row={row} />,
    enableHiding: false,
  },
];

export default function VetTable() {
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

  const [data] = useState<Appointment[]>(staticData);

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
        <Pagination >
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

function RowActions({ row }: { row: Row<Appointment> }) {
  const appointment = row.original;

  const handleAccept = () => {
    console.log("Accept appointment:", appointment.appointment_id);
  };

  const handleComplete = () => {
    console.log("Complete appointment:", appointment.appointment_id);
  };

  const handleView = () => {
    console.log("View appointment:", appointment.appointment_id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shadow-none"
          aria-label="Actions"
        >
          <EllipsisIcon size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleView}>View Details</DropdownMenuItem>
          {appointment.status === "Pending" && (
            <DropdownMenuItem onClick={handleAccept}>
              Accept Appointment
            </DropdownMenuItem>
          )}
          {appointment.status === "Accepted" && (
            <DropdownMenuItem onClick={handleComplete}>
              Mark as Completed
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          Cancel Appointment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
