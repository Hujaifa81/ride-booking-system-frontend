/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  Car,
  MapPin,
  DollarSign,
  Timer,
  Star,
  Navigation,
  Phone,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetDriverProfileQuery, useUpdateDriverStatusMutation } from "@/redux/features/driver/driver.api";
import { DriverStatus } from "@/constants/status";
import { toast } from "sonner";
import DriverLocationModal from "./DriverLocationModal";
import {
  useAcceptRideMutation,
  useGetIncomingRidesQuery,
  useRejectRideMutation,
  useUpdateRideStatusAfterAcceptedMutation,
} from "@/redux/features/ride/ride.api";
import type { Ride } from "@/types";
import { useDriverIncomingRequestSocket } from "@/hooks/useDriverIncomingRequestSocket";

// Map imports
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons for bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helpers
const toLeaflet = (lngLat?: [number, number] | null): [number, number] | undefined =>
  lngLat ? [lngLat[1], lngLat[0]] : undefined; // [lng, lat] -> [lat, lng]
const dhakaCenter: [number, number] = [23.8103, 90.4125];
const formatCoords = ([lng, lat]: [number, number]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

const getActiveRideBadge = (status: string) => {
  switch (status) {
    case "GOING_TO_PICK_UP":
      return "Going to pickup";
    case "DRIVER_ARRIVED":
      return "Driver arrived";
    case "IN_TRANSIT":
      return "In transit";
    case "REACHED_DESTINATION":
      return "Reached destination";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED_BY_DRIVER":
      return "Cancelled";
    default:
      return status;
  }
};

const DriverDashboard = () => {
  const {
    data: driverProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetDriverProfileQuery(undefined);

  const {
    data: incomingRidesData,
    isLoading: isIncomingRidesLoading,
    isError: isIncomingRidesError,
    refetch: refetchIncomingRides,
  } = useGetIncomingRidesQuery(undefined);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateDriverStatusMutation();
  const [acceptRide, { isLoading: isAccepting }] = useAcceptRideMutation();
  const [rejectRide, { isLoading: isRejecting }] = useRejectRideMutation();
  const [statusUpdateAfterAccepted, { isLoading: isStatusChanging }] = useUpdateRideStatusAfterAcceptedMutation();

  const status = (driverProfile as any)?.data?.status;
  const isAvailable = status === DriverStatus.AVAILABLE;
  const isOnTrip = status === DriverStatus.ON_TRIP;
  const isOffline = status === DriverStatus.OFFLINE || !status;

  const [activeRide, setActiveRide] = useState<Ride | null>(null);

  const [metrics, setMetrics] = useState({
    earningsToday: 126.75,
    tripsToday: 9,
    onlineMins: 312,
    rating: 4.92,
    acceptanceRate: 96,
    weeklyEarnings: [85, 120, 140, 90, 160, 200, 126],
  });

  const onlineH = Math.floor(metrics.onlineMins / 60);
  const onlineM = metrics.onlineMins % 60;

  const [showLocModal, setShowLocModal] = useState(false);

  const profileCoords = useMemo<[number, number] | null>(() => {
    const raw = (driverProfile as any)?.data?.location?.coordinates;
    if (Array.isArray(raw) && raw.length === 2 && raw.every((n: any) => typeof n === "number")) {
      return [raw[0], raw[1]]; // [lng, lat]
    }
    return null;
  }, [driverProfile]);

  useDriverIncomingRequestSocket({
    enabled: isAvailable,
    onNewRide: async (_ride: Ride) => {
      toast.success("New ride request received!");
      await refetchIncomingRides();
    },
  });

  const toggleAvailability = async () => {
    if (isOnTrip) return;
    const next = isAvailable ? DriverStatus.OFFLINE : DriverStatus.AVAILABLE;
    try {
      await updateStatus({ status: next }).unwrap();
      refetchProfile();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  const acceptRequest = async (ride: Ride) => {
    try {
      const res = await acceptRide(ride._id).unwrap();
      const accepted = (res as any)?.data || ride;
      setActiveRide({ ...accepted });
      await Promise.all([refetchIncomingRides(), refetchProfile()]);
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to accept ride");
    }
  };

  const declineRequest = async (rideId: string) => {
    try {
      await rejectRide(rideId).unwrap();
      setMetrics((m) => ({ ...m, acceptanceRate: Math.max(70, m.acceptanceRate - 1) }));
      await refetchIncomingRides();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to reject ride");
    }
  };

  const handleStatusChange = async (ride: Ride, nextStatus: string) => {
    try {
      const res = await statusUpdateAfterAccepted({ rideId: ride._id, status: nextStatus }).unwrap();
      setActiveRide(res?.data || null);
      toast.success(`Status updated to ${getActiveRideBadge(nextStatus)}`);
      await refetchProfile();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to update ride status");
    }
  };

  

  const progressBar = (value: number, color = "bg-emerald-500") => (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );

  const statusBadge = () => {
    const cls =
      isAvailable
        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
        : isOnTrip
        ? "border-sky-200 text-sky-700 bg-sky-50"
        : "border-slate-200 text-slate-600";
    const dot =
      isAvailable ? "bg-emerald-500" : isOnTrip ? "bg-sky-500" : "bg-slate-300";
    const label = isAvailable ? "Online" : isOnTrip ? "On Trip" : "Offline";
    return (
      <Badge variant="outline" className={cls}>
        <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
        {label}
      </Badge>
    );
  };

  const leafletCenter = toLeaflet(profileCoords) || dhakaCenter;
  const mapKey = `map-${profileCoords ? `${profileCoords[1]}-${profileCoords[0]}` : "default"}`;

  const incomingRides: Ride[] = (incomingRidesData as any)?.data || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Driver Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor rides, earnings, and performance</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          <Button
            variant={isAvailable ? "outline" : isOnTrip ? "secondary" : "default"}
            onClick={toggleAvailability}
            disabled={isUpdating || isOnTrip || isProfileLoading}
            title={isOnTrip ? "You are on a trip" : undefined}
          >
            {isUpdating
              ? "Updating..."
              : isAvailable
              ? "Go Offline"
              : isOnTrip
              ? "On Trip"
              : "Go Online"}
          </Button>
          <Button variant="outline" onClick={() => setShowLocModal(true)}>
            <MapPin className="w-4 h-4 mr-2" />
            Set Location
          </Button>
          <Button variant="outline" onClick={() => refetchProfile()} disabled={isProfileLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Profile load/error states */}
      {isProfileError && (
        <div className="mb-4 text-sm text-rose-600">Failed to load profile. Try Refresh.</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Earnings Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {isProfileLoading ? "—" : `$${metrics.earningsToday.toFixed(2)}`}
            </div>
            <div className="mt-3">{progressBar((metrics.earningsToday / 200) * 100)}</div>
            <div className="text-xs text-slate-500 mt-1">Target: $200</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Timer className="w-4 h-4 text-sky-600" />
              Online Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {onlineH}h {onlineM}m
            </div>
            <div className="mt-3">{progressBar((metrics.onlineMins / (8 * 60)) * 100, "bg-sky-500")}</div>
            <div className="text-xs text-slate-500 mt-1">Goal: 8h</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600" />
              Trips Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">{metrics.tripsToday}</div>
            <div className="mt-3">{progressBar((metrics.tripsToday / 20) * 100, "bg-indigo-500")}</div>
            <div className="text-xs text-slate-500 mt-1">Target: 20 trips</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Rating & Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-semibold text-slate-900">{metrics.rating.toFixed(2)}</div>
              <div className="text-xs text-slate-500">/ 5.0</div>
              <div className="ml-auto text-sm text-slate-700">{metrics.acceptanceRate}%</div>
            </div>
            <div className="mt-3">{progressBar(metrics.acceptanceRate, "bg-amber-500")}</div>
            <div className="text-xs text-slate-500 mt-1">Acceptance Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Location map */}
      <Card className="border-0 shadow-sm mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Location</CardTitle>
          <CardDescription>Current driver position</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] rounded-md overflow-hidden border">
            <MapContainer
              key={mapKey}
              center={leafletCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {profileCoords && (
                <Marker position={toLeaflet(profileCoords)!} icon={driverIcon}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium">You are here</div>
                      <div className="text-xs text-slate-600">
                        Lat {profileCoords[1].toFixed(6)}, Lng {profileCoords[0].toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
            {!profileCoords && (
              <div className="absolute inset-x-0 mt-2 ml-2 px-2 py-1 rounded bg-amber-50 border text-amber-700 w-max text-xs">
                Location not set. Click “Set Location”.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active Ride / Availability */}
        <Card className="xl:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Ride</CardTitle>
                <CardDescription>
                  {activeRide
                    ? `Ride ${activeRide._id}`
                    : isAvailable
                    ? "You are available for new requests"
                    : "Go online to receive requests"}
                </CardDescription>
              </div>
              {activeRide && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                  {getActiveRideBadge(activeRide.status)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRide ? (
              <>
                <div className="rounded-lg border bg-slate-50 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-800">
                          {activeRide.pickupAddress ||
                            (activeRide.pickupLocation?.coordinates
                              ? formatCoords(activeRide.pickupLocation.coordinates)
                              : "Pickup")}
                        </span>
                      </div>
                      <div className="h-4 w-0.5 bg-slate-300 ml-2 my-2 rounded-full" />
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span className="font-medium text-slate-800">
                          {activeRide.dropOffAddress ||
                            (activeRide.dropOffLocation?.coordinates
                              ? formatCoords(activeRide.dropOffLocation.coordinates)
                              : "Dropoff")}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        {typeof activeRide.estimatedDuration === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4 text-slate-500" />
                            ETA {activeRide.estimatedDuration}m
                          </span>
                        )}
                        {typeof activeRide.distance === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                            {activeRide.distance.toFixed(1)} km
                          </span>
                        )}
                        {typeof activeRide.approxFare === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-slate-500" />${activeRide.approxFare.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Button
                        variant="default"
                        className="w-full sm:w-48"
                        onClick={() => window.open("https://www.google.com/maps", "_blank")}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </Button>
                      <div className="flex gap-2">
                        {activeRide.status === "ACCEPTED" && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusChange(activeRide, "GOING_TO_PICK_UP")}
                            disabled={isStatusChanging}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Going to Pickup
                          </Button>
                        )}
                        {activeRide.status === "GOING_TO_PICK_UP" && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusChange(activeRide, "DRIVER_ARRIVED")}
                            disabled={isStatusChanging}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Arrived
                          </Button>
                        )}
                        {activeRide.status === "DRIVER_ARRIVED" && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusChange(activeRide, "IN_TRANSIT")}
                            disabled={isStatusChanging}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Start Ride
                          </Button>
                        )}
                        {activeRide.status === "IN_TRANSIT" && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusChange(activeRide, "REACHED_DESTINATION")}
                            disabled={isStatusChanging}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Reached Destination
                          </Button>
                        )}
                        {activeRide.status === "REACHED_DESTINATION" && (
                          <Button
                            className="flex-1"
                            onClick={() => handleStatusChange(activeRide, "COMPLETED")}
                            disabled={isStatusChanging}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusChange(activeRide, "CANCELLED_BY_DRIVER")}
                          disabled={isStatusChanging}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full sm:w-48" onClick={() => alert("Calling passenger...")}>
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border bg-white p-6 text-center">
                <div className="text-slate-600">
                  {isAvailable ? "No active rides. Waiting for the next request..." : "You are offline."}
                </div>
                {isAvailable && incomingRides.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">You’ll be notified when a new request arrives.</div>
                )}
                {isOffline && (
                  <Button className="mt-4" onClick={toggleAvailability} disabled={isUpdating || isProfileLoading}>
                    Go Online
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Incoming Requests */}
        <Card className="xl:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Incoming Requests</CardTitle>
            <CardDescription>Accept or decline new ride requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isIncomingRidesLoading ? (
              <div className="text-sm text-slate-600 border rounded-lg p-6 text-center">Loading incoming requests...</div>
            ) : isIncomingRidesError ? (
              <div className="text-sm text-rose-600 border rounded-lg p-6 text-center">Failed to load incoming requests.</div>
            ) : incomingRides.length === 0 ? (
              <div className="text-sm text-slate-600 border rounded-lg p-6 text-center">No pending requests</div>
            ) : (
              incomingRides.map((ride) => {
                const pickup =
                  ride.pickupAddress ||
                  (ride.pickupLocation?.coordinates ? formatCoords(ride.pickupLocation.coordinates) : "Pickup");
                const dropoff =
                  ride.dropOffAddress ||
                  (ride.dropOffLocation?.coordinates ? formatCoords(ride.dropOffLocation.coordinates) : "Dropoff");
                const etaMin = typeof ride.estimatedDuration === "number" ? ride.estimatedDuration : undefined;
                const distanceKm = typeof ride.distance === "number" ? ride.distance : undefined;
                const fare = typeof ride.approxFare === "number" ? ride.approxFare : undefined;

                return (
                  <div
                    key={ride._id}
                    className="rounded-lg border p-3 sm:p-4 bg-white hover:bg-slate-50/60 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-slate-500">{ride._id}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-slate-800">{pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <span className="font-medium text-slate-800">{dropoff}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          {typeof etaMin === "number" && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-4 h-4 text-slate-500" />
                              ETA {etaMin}m
                            </span>
                          )}
                          {typeof distanceKm === "number" && (
                            <span className="inline-flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-slate-500" />
                              {distanceKm.toFixed(1)} km
                            </span>
                          )}
                          {typeof fare === "number" && (
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-slate-500" />${fare.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          className="flex-1 sm:flex-none"
                          onClick={() => acceptRequest(ride)}
                          disabled={isOnTrip || isAccepting}
                          title={isOnTrip ? "You are on a trip" : undefined}
                        >
                          {isAccepting ? "Accepting..." : "Accept"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          onClick={() => declineRequest(ride._id)}
                          disabled={isRejecting}
                        >
                          {isRejecting ? "Rejecting..." : "Decline"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest completed trips and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { id: "TR-8172", text: "Trip completed • 6.2 km • $12.80", ts: "Just now" },
                { id: "TR-8169", text: "Rider rated you 5.0 ★", ts: "18m ago" },
                { id: "TR-8163", text: "Trip completed • 12.4 km • $21.50", ts: "1h ago" },
                { id: "SYS-PR", text: "Payout request initiated", ts: "2h ago" },
              ].map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                  <div>
                    <div className="text-sm text-slate-800">{a.text}</div>
                    <div className="text-xs text-slate-500">{a.ts}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location modal */}
      <DriverLocationModal
        open={showLocModal}
        onOpenChange={setShowLocModal}
        initialCoords={profileCoords}
        onSaved={async () => {
          await refetchProfile();
          setShowLocModal(false);
        }}
      />
    </div>
  );
};

export default DriverDashboard;