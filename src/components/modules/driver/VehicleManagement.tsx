import { useMemo, useState, useEffect } from "react";
import { Car, BadgeCheck, Ban, Search, RefreshCcw, Eye, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetAllVehiclesQuery, useUpdateVehicleStatusMutation } from "@/redux/features/vehicle/vehicle.api";
import type { Vehicle as BaseVehicle } from "@/types/vehicle.type";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type Vehicle = BaseVehicle & { isActive?: boolean };

const PAGE_SIZES = [6, 12, 24];

const deriveStatus = (v: Vehicle) => (v.isActive ? ("ACTIVE" as const) : ("INACTIVE" as const));

const statusBadgeClass = (s: ReturnType<typeof deriveStatus>) => {
  switch (s) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "INACTIVE":
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const VehicleManagement = () => {
  const { data: vehiclesRes, isLoading, isError, refetch } = useGetAllVehiclesQuery(undefined);
  const [updateVehicleStatus, { isLoading: isUpdating }] = useUpdateVehicleStatusMutation();

  // Normalize API payload to Vehicle[]
  const vehiclesFromApi: Vehicle[] = useMemo(() => {
    const env= vehiclesRes;
    if (Array.isArray(env)) return env as Vehicle[];
    if (Array.isArray(env?.data)) return env.data as Vehicle[];
    if (Array.isArray(env?.data?.data)) return env.data.data as Vehicle[];
    return [];
  }, [vehiclesRes]);

  // Local working list (for client-side filtering/pagination and optimistic UX)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  useEffect(() => setVehicles(vehiclesFromApi), [vehiclesFromApi]);

  // Filters and paging
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, limit]);

  // Derived data
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles
      .filter((v) => (statusFilter === "ALL" ? true : deriveStatus(v) === statusFilter))
      .filter((v) => (q ? [v.model, v.licensePlate, v._id].some((t) => String(t || "").toLowerCase().includes(q)) : true));
  }, [vehicles, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageItems = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);

  const kpis = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => deriveStatus(v) === "ACTIVE").length;
    const inactive = vehicles.filter((v) => deriveStatus(v) === "INACTIVE").length;
    return { total, active, inactive };
  }, [vehicles]);

  // Modal
  const [selected, setSelected] = useState<Vehicle | null>(null);

  // Per-item pending states
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const setPending = (id: string, val: boolean) =>
    setPendingIds((p) => (val ? { ...p, [id]: true } : Object.fromEntries(Object.entries(p).filter(([k]) => k !== id))));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
    }
  };

  // Toggle via RTK Query mutation with optimistic UI + revert on error
  const toggleStatus = async (v: Vehicle) => {
    const next = !v.isActive;
    setPending(v._id, true);
    setVehicles((prev) => prev.map((x) => (x._id === v._id ? { ...x, isActive: next } : x)));
    try {
      await updateVehicleStatus({ vehicleId: v._id }).unwrap();
      // Optional: ensure server truth
      // await refetch();
    } catch {
      setVehicles((prev) => prev.map((x) => (x._id === v._id ? { ...x, isActive: !next } : x)));
    } finally {
      setPending(v._id, false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Vehicle Management</h1>
          <p className="text-sm text-slate-500">Manage and review your registered vehicles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-white border rounded-md px-3 py-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              className="outline-none text-sm"
              placeholder="Search model, plate, ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Controls (mobile search) */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="sm:hidden">
          <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              className="outline-none text-sm"
              placeholder="Search model, plate, ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border rounded-md bg-white text-sm px-2 py-2"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded-md bg-white text-sm px-2 py-2"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
              setLimit(PAGE_SIZES[0]);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Loading/Error */}
      {isError && (
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-6 text-rose-700">Failed to load vehicles. Try Refresh.</CardContent>
        </Card>
      )}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
                <div className="mt-2 h-3 w-24 bg-slate-100 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-2/3 bg-slate-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{kpis.total}</div>
              <CardDescription>Registered vehicles</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{kpis.active}</div>
              <CardDescription>Available for trips</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Ban className="w-4 h-4 text-slate-700" />
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{kpis.inactive}</div>
              <CardDescription>Not currently active</CardDescription>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageItems.length === 0 ? (
            <Card className="border-0 shadow-sm sm:col-span-2 xl:col-span-3">
              <CardContent className="p-6 text-slate-600">No vehicles found.</CardContent>
            </Card>
          ) : (
            pageItems.map((v) => {
              const s = deriveStatus(v);
              const pending = !!pendingIds[v._id] || isUpdating;
              return (
                <Card key={v._id} className="border-0 shadow-sm overflow-hidden group relative">
                  {/* Accent bar */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-md bg-indigo-50 text-indigo-600">
                            <Car className="w-4 h-4" />
                          </div>
                          <CardTitle className="text-base truncate">{v.model || "—"}</CardTitle>
                        </div>

                        {/* Plate chip */}
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md border px-2 py-1 bg-slate-50">
                          <span className="text-[11px] tracking-wide text-slate-500">PLATE</span>
                          <span className="text-sm font-semibold text-slate-800">{v.licensePlate || "—"}</span>
                        </div>

                        {/* Status */}
                        <div className="mt-2">
                          <Badge variant="outline" className={statusBadgeClass(s)}>
                            {s}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelected(v)} title="Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => copy(v._id)} title="Copy ID">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Quick actions */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-gradient-to-b from-slate-50 to-white">
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">Status</div>
                        <div className="text-xs text-slate-500">
                          {v.isActive ? "Vehicle is available for trips" : "Vehicle is inactive"}
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleStatus(v)}
                        disabled={pending}
                        className={v.isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        variant={v.isActive ? "default" : "outline"}
                      >
                        {pending ? "Updating..." : v.isActive ? "Set Inactive" : "Set Active"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pageItems.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <div className="text-sm text-slate-700">
              Page {page} of {totalPages}
            </div>
            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="w-full max-w-xl bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Vehicle Details</div>
                <div className="text-xs text-slate-500">{selected._id}</div>
              </div>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Model</div>
                <div className="font-medium text-slate-800">{selected.model || "—"}</div>
                <div className="text-xs text-slate-500 mt-3">License Plate</div>
                <div className="font-medium text-slate-800">{selected.licensePlate || "—"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Status</div>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs ${statusBadgeClass(
                    deriveStatus(selected)
                  )}`}>
                    {deriveStatus(selected)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-3">Owner</div>
                <div className="text-sm text-slate-700 break-all">{(selected).user?._id || "—"}</div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => copy(selected._id)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </Button>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;