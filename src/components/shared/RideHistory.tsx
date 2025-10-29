import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  X,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useGetRideHistoryQuery } from "@/redux/features/ride/ride.api";
import type { ILocation, Ride, RideStatus, User } from "@/types";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { jsPDF } from "jspdf";

type Filters = {
  status: "ALL" | Partial<RideStatus>;
  startDate: string;
  endDate: string;
  sort: string; // e.g. "-createdAt" or "status"
};

const defaultFilters: Filters = {
  status: "ALL",
  startDate: "",
  endDate: "",
  sort: "-createdAt",
};

const PAGE_SIZES = [10, 20, 50];

type SortKey = "createdAt" | "status" | "vehicle" | "pickup" | "dropoff" | "ride";

const sortFieldMap: Record<SortKey, string> = {
  ride: "_id",
  createdAt: "createdAt",
  status: "status",
  vehicle: "vehicle.model",
  pickup: "pickupAddress",
  dropoff: "dropOffAddress",
};

const prettyFieldName = (field: string) => {
  switch (field) {
    case "_id":
      return "Ride";
    case "createdAt":
      return "Date";
    case "status":
      return "Status";
    case "vehicle.model":
      return "Vehicle";
    case "pickupAddress":
      return "From";
    case "dropOffAddress":
      return "To";
    default:
      return field;
  }
};

const parseSort = (s: string): { field: string; dir: "asc" | "desc" } => {
  if (!s) return { field: "", dir: "asc" };
  if (s.startsWith("-")) return { field: s.slice(1), dir: "desc" };
  return { field: s, dir: "asc" };
};

const RideHistory = () => {
  const { data: userRes } = useUserInfoQuery(undefined);
  const user: User = (userRes )?.data ?? (userRes );
  const userId = user?._id as string | undefined;

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const params = useMemo(() => {
    const p: Record<string, number | string> = { page, limit };
    if (filters.status !== "ALL") p.status = filters.status;
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.sort) p.sort = filters.sort; // pass sort like other params
    return p;
  }, [filters, page, limit]);

  const { data, isLoading, isError, refetch } = useGetRideHistoryQuery(
    { userId: userId || "", params },
    { skip: !userId }
  );

  type Meta = { page: number; limit: number; total: number; totalPage?: number };
  const payload = (data )?.data as { data?: Ride[]; meta?: Meta } | undefined;
  const list: Ride[] = Array.isArray(payload?.data) ? payload!.data! : [];
  const meta = (payload?.meta ?? (data )?.meta) as Meta | undefined;
  const serverPage = typeof meta?.page === "number" ? meta.page : page;
  const serverLimit = typeof meta?.limit === "number" ? meta.limit : limit;
  const totalPages =
    typeof meta?.totalPage === "number"
      ? meta.totalPage
      : Math.max(1, Math.ceil(((meta?.total ?? 0) || 1) / serverLimit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const clearChip = (key: keyof Filters) => {
    setFilters((f) => ({ ...f, [key]: (defaultFilters )[key] }));
    setPage(1);
  };

  // Friendly label for table/modal
  const getStatusLabel = (s: RideStatus) => {
    switch (s) {
      case "REQUESTED":
      case "PENDING":
        return "Searching for driver";
      case "ACCEPTED":
        return "Accepted";
      case "IN_TRANSIT":
        return "In Transit";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED_BY_RIDER":
        return `${user?.role === "RIDER" ? "Cancelled by You" : "Cancelled by Rider"}`;
      case "CANCELLED_BY_DRIVER":
        return `${user?.role === "DRIVER" ? "Cancelled by You" : "Cancelled by Driver"}`;
      case "CANCELLED_BY_ADMIN":
        return "Cancelled by Admin";
      default:
        return String(s).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Distinct badge colors per status
  const statusBadgeClass = (s: RideStatus) => {
    switch (s) {
      case "REQUESTED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ACCEPTED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "GOING_TO_PICK_UP":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "DRIVER_ARRIVED":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "IN_TRANSIT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "REACHED_DESTINATION":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED_BY_RIDER":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "CANCELLED_BY_DRIVER":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "CANCELLED_BY_ADMIN":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "CANCELLED_FOR_PENDING_TIME_OVER":
        return "bg-red-50 text-red-900 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Uppercase label for Status chip (role-aware "CANCELLED BY YOU")
  const getStatusChipLabel = (s: Filters["status"], role?: User["role"]) => {
    if (s === "ALL") return "All";
    switch (s) {
      case "COMPLETED":
        return "COMPLETED";
      case "CANCELLED_BY_RIDER":
        return role === "RIDER" ? "CANCELLED BY YOU" : "CANCELLED BY RIDER";
      case "CANCELLED_BY_DRIVER":
        return role === "DRIVER" ? "CANCELLED BY YOU" : "CANCELLED BY DRIVER";
      case "CANCELLED_BY_ADMIN":
        return "CANCELLED BY ADMIN";
      case "CANCELLED_FOR_PENDING_TIME_OVER":
        return "CANCELLED FOR PENDING TIME OVER";
      default:
        return String(s).replace(/_/g, " ").toUpperCase();
    }
  };

  // Chips
  const appliedChips = useMemo(() => {
    const chips: Array<{ key: keyof Filters; label: string }> = [];
    if (filters.status !== "ALL") {
      chips.push({
        key: "status",
        label: `Status: ${getStatusChipLabel(filters.status, user?.role)}`,
      });
    }
    if (filters.startDate) chips.push({ key: "startDate", label: `From: ${filters.startDate}` });
    if (filters.endDate) chips.push({ key: "endDate", label: `To: ${filters.endDate}` });

    if (filters.sort) {
      const { field, dir } = parseSort(filters.sort);
      const arrow = dir === "asc" ? "↑" : "↓";
      chips.push({
        key: "sort",
        label: `Sort: ${prettyFieldName(field)} ${arrow}`,
      });
    }
    return chips;
  }, [filters, user?.role]);

  // --- Reverse Geocoding support ---
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});
  const FAILED = "Unable to fetch address";

  // Get GeoJSON coords [lng, lat]
  const getCoords = (loc: ILocation): [number, number] | undefined => {
    const arr = loc?.coordinates;
    if (Array.isArray(arr) && typeof arr[0] === "number" && typeof arr[1] === "number") {
      return [arr[0], arr[1]];
    }
    return undefined;
  };
  const coordKey = (lng: number, lat: number) => `${lng},${lat}`;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Fetch missing addresses for current list (sequential, throttled)
  useEffect(() => {
    let cancelled = false;

    const keys = new Map<string, { lng: number; lat: number }>();
    for (const r of list) {
      if (!r.pickupAddress) {
        const pc = getCoords(r.pickupLocation as unknown as ILocation);
        if (pc) {
          const [lng, lat] = pc;
          const key = coordKey(lng, lat);
          if (!(key in addressCache)) keys.set(key, { lng, lat });
        }
      }
      if (!r.dropOffAddress) {
        const dc = getCoords(r.dropOffLocation as unknown as ILocation);
        if (dc) {
          const [lng, lat] = dc;
          const key = coordKey(lng, lat);
          if (!(key in addressCache)) keys.set(key, { lng, lat });
        }
      }
    }
    if (keys.size === 0) return;

    (async () => {
      for (const [key, { lng, lat }] of keys) {
        if (cancelled) break;
        try {
          const name = await reverseGeocode(lat, lng); // util expects (lat, lng)
          if (cancelled) break;
          setAddressCache((prev) => (key in prev ? prev : { ...prev, [key]: name || FAILED }));
        } catch {
          if (cancelled) break;
          setAddressCache((prev) => (key in prev ? prev : { ...prev, [key]: FAILED }));
        }
        // Respect provider limits (Nominatim: ~1 req/sec)
        await sleep(1100);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]); // avoid addressCache here to prevent loops

  const resolveLabel = (saved: string | undefined, coords: [number, number] | undefined) => {
    if (saved) return saved;
    if (!coords) return "-";
    const name = addressCache[coordKey(coords[0], coords[1])];
    if (!name) return `${coords[1]}, ${coords[0]}`;
    return name;
  };
  // --- End Reverse Geocoding ---

  // Sort UI helpers (server-side)
  const sortIndicator = (key: SortKey) => {
    const { field, dir } = parseSort(filters.sort);
    const current = sortFieldMap[key];
    if (field !== current) return "";
    return dir === "asc" ? "▲" : "▼";
  };

  const toggleSort = (key: SortKey) => {
    const field = sortFieldMap[key];
    setFilters((f) => {
      const cur = parseSort(f.sort);
      let next = field; // default asc
      if (cur.field === field) {
        next = cur.dir === "asc" ? `-${field}` : field; // toggle
      }
      return { ...f, sort: next };
    });
    setPage(1);
  };

  // Generate a PDF with ride details
  const downloadRidePdf = (ride: Ride) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - margin * 2;
    let y = 18;

    const dateStr = ride.createdAt ? new Date(ride.createdAt).toLocaleString() : "-";
    const pickupCoords = getCoords(ride.pickupLocation as unknown as ILocation);
    const dropoffCoords = getCoords(ride.dropOffLocation as unknown as ILocation);
    const pickupLabel = (resolveLabel(ride.pickupAddress, pickupCoords) || "—").toString();
    const dropoffLabel = (resolveLabel(ride.dropOffAddress, dropoffCoords) || "—").toString();
    const vehicle = [ride.vehicle?.model, ride.vehicle?.licensePlate].filter(Boolean).join(" ") || "-";
    const status = getStatusLabel(ride.status);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Ride Details", margin, y);
    y += 10;

    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Ride ID: ${ride._id}`, margin, y); y += 7;
    doc.text(`Date/Time: ${dateStr}`, margin, y); y += 7;

    const fromLines = doc.splitTextToSize(`From: ${pickupLabel}`, maxWidth);
    doc.text(fromLines, margin, y); y += fromLines.length * 6;

    const toLines = doc.splitTextToSize(`To: ${dropoffLabel}`, maxWidth);
    doc.text(toLines, margin, y); y += toLines.length * 6;

    doc.text(`Vehicle: ${vehicle}`, margin, y); y += 7;
    doc.text(`Status: ${status}`, margin, y); y += 7;

    doc.save(`ride-${ride._id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Ride History</CardTitle>
                <CardDescription>View and filter your past and current rides</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => {
                      setFilters((f) => ({ ...f, startDate: e.target.value }));
                      setPage(1);
                    }}
                    className="w-full outline-none text-sm"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                      setFilters((f) => ({ ...f, endDate: e.target.value }));
                      setPage(1);
                    }}
                    className="w-full outline-none text-sm"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white border rounded-md px-3 py-2">
                  <label className="text-xs text-slate-500">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters((f) => ({ ...f, status: e.target.value as Filters["status"] }));
                      setPage(1);
                    }}
                    className="w-full text-sm bg-transparent outline-none"
                  >
                    <option value="ALL">All</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED_BY_RIDER">
                      {user?.role === "RIDER" ? "CANCELLED BY YOU" : "CANCELLED BY RIDER"}
                    </option>
                    <option value="CANCELLED_BY_DRIVER">
                      {user?.role === "DRIVER" ? "CANCELLED BY YOU" : "CANCELLED BY DRIVER"}
                    </option>
                    <option value="CANCELLED_BY_ADMIN">CANCELLED BY ADMIN</option>
                    <option value="CANCELLED_FOR_PENDING_TIME_OVER">CANCELLED FOR PENDING TIME OVER</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applied chips */}
            <div className="flex flex-wrap gap-2">
              {appliedChips.length === 0 ? (
                <span className="inline-flex items-center text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5 mr-1" /> No filters applied
                </span>
              ) : (
                appliedChips.map((c) => (
                  <Badge key={c.key} variant="outline" className="bg-white border-slate-200 text-slate-700">
                    {c.label}
                    <button
                      className="ml-2 hover:text-rose-600"
                      onClick={() => clearChip(c.key)}
                      aria-label={`Clear ${c.key}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
              <div className="ml-auto">
                <Button variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={() => toggleSort("ride")}
                      >
                        Ride {sortIndicator("ride")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <div className="flex gap-3">
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => toggleSort("pickup")}
                          title="Sort by pickup"
                        >
                          From {sortIndicator("pickup")}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => toggleSort("dropoff")}
                          title="Sort by drop-off"
                        >
                          To {sortIndicator("dropoff")}
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={() => toggleSort("vehicle")}
                      >
                        Vehicle {sortIndicator("vehicle")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={() => toggleSort("status")}
                      >
                        Status {sortIndicator("status")}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Date {sortIndicator("createdAt")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: serverLimit }).map((_, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-4" colSpan={5}>
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-1/3 mb-2" />
                          <div className="h-3 bg-slate-100 animate-pulse rounded w-1/5" />
                        </td>
                      </tr>
                    ))
                  ) : isError ? (
                    <tr>
                      <td className="px-4 py-8 text-center" colSpan={5}>
                        <div className="flex items-center justify-center gap-2 text-slate-600">
                          <span>Failed to load rides.</span>
                          <Button variant="outline" onClick={() => refetch()}>
                            Retry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-slate-600" colSpan={5}>
                        No rides found.
                      </td>
                    </tr>
                  ) : (
                    list.map((r) => {
                      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString() : "-";

                      const pickupCoords = getCoords(r.pickupLocation as unknown as ILocation);
                      const dropoffCoords = getCoords(r.dropOffLocation as unknown as ILocation);

                      const pickupLabel = resolveLabel(r.pickupAddress, pickupCoords);
                      const dropoffLabel = resolveLabel(r.dropOffAddress, dropoffCoords);

                      const vehicleStr = [r.vehicle?.model, r.vehicle?.licensePlate].filter(Boolean).join(" ") || "-";

                      return (
                        <tr key={r._id} className="border-t hover:bg-slate-50/60">
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-slate-900">{r._id}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                              <span className="line-clamp-1">{pickupLabel || FAILED}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-600" />
                              <span className="line-clamp-1">{dropoffLabel || FAILED}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <Car className="w-3.5 h-3.5 text-slate-500" />
                              <span className="line-clamp-1">{vehicleStr}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs ${statusBadgeClass(r.status)}`}>
                              {getStatusLabel(r.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                            <div className="text-xs text-slate-500">{dateStr}</div>
                            <div className="mt-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedRide(r)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Rows per page</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm bg-white"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-600 ml-3">
                  Page {serverPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPage(Math.max(1, serverPage - 1))} disabled={serverPage <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, serverPage + 1))}
                  disabled={serverPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      {selectedRide && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedRide(null)}
        >
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="text-lg font-semibold">Ride Details</div>
                <div className="text-xs text-slate-500">{selectedRide._id}</div>
              </div>
              <Button variant="outline" onClick={() => setSelectedRide(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Date/Time</div>
                <div className="font-medium">
                  {selectedRide.createdAt ? new Date(selectedRide.createdAt).toLocaleString() : "-"}
                </div>
                <div className="text-xs text-slate-500 mt-3">From</div>
                <div>
                  {(() => {
                    const c = getCoords(selectedRide.pickupLocation as unknown as ILocation);
                    return resolveLabel(selectedRide.pickupAddress, c) || FAILED;
                  })()}
                </div>
                <div className="text-xs text-slate-500 mt-3">To</div>
                <div>
                  {(() => {
                    const c = getCoords(selectedRide.dropOffLocation as unknown as ILocation);
                    return resolveLabel(selectedRide.dropOffAddress, c) || FAILED;
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Vehicle</div>
                <div>{[selectedRide.vehicle?.model, selectedRide.vehicle?.licensePlate].filter(Boolean).join(" ") || "-"}</div>
                <div className="text-xs text-slate-500 mt-3">Status</div>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs ${statusBadgeClass(selectedRide.status)}`}>
                    {getStatusLabel(selectedRide.status)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedRide(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (!selectedRide) return;
                  downloadRidePdf(selectedRide);
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideHistory;