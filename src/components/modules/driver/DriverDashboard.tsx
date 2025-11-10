/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGetDriverProfileQuery, useUpdateDriverStatusMutation } from "@/redux/features/driver/driver.api";
import { DriverStatus } from "@/constants/status";
import { toast } from "sonner";
import DriverLocationModal from "./DriverLocationModal";
import {
  useAcceptRideMutation,
  useCancelRideMutation,
  useRejectRideMutation,
  useUpdateRideStatusAfterAcceptedMutation,
  useActiveRideQuery,
  useGetIncomingRidesQuery,
  rideApi,
} from "@/redux/features/ride/ride.api";
import type { Ride } from "@/types";
import {
  removeIncomingRequest,
  setActiveRide,
  clearActiveRide,
  clearIncomingRequests,
} from "@/redux/features/ride/ride.slice";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initSocket } from "@/lib/socket";

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
  lngLat ? [lngLat[1], lngLat[0]] : undefined;
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
    case "CANCELLED_BY_RIDER":
      return "Cancelled by rider";
    case "ACCEPTED":
      return "Accepted";
    default:
      return status;
  }
};

const DriverDashboard = () => {
  const dispatch = useDispatch();

  // ✅ Get data from Redux (populated by global socket listener)
  const incomingRidesRedux = useSelector((state: any) => state?.requests || []);
  const isSocketConnected = useSelector((state: any) => state?.socketConnected || false);
  // ✅ Local state to track if ride is completed (permanently disable polling)
  const [isRideCompleted, setIsRideCompleted] = useState(false);
  // ✅ Track completed ride ID to prevent stale data re-sync
  const [completedRideId, setCompletedRideId] = useState<string | null>(null);

  // ✅ Get driver profile with polling
  const {
    data: driverProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetDriverProfileQuery(undefined);

  // ✅ Get active ride from API - COMPLETELY SKIP if ride is completed
  const {
    data: activeRideData,
    isLoading: isActiveRideLoading,
    refetch: refetchActiveRide,
  } = useActiveRideQuery(undefined, {
    skip: isRideCompleted, // ✅ Completely skip the query when ride is completed
  });

  // ✅ Get incoming rides with polling
  const {
    data: incomingRidesData,
    refetch: refetchIncomingRides,
  } = useGetIncomingRidesQuery(undefined);

  // ✅ ENHANCED: Filter completed rides more aggressively
  const activeRide = useMemo(() => {
    // ✅ Never show any ride if we marked one as completed
    if (isRideCompleted) {
      return null;
    }

    // ✅ If API data doesn't exist, return null
    if (!activeRideData?.data) {
      return null;
    }
    const ride = activeRideData.data;

    // ✅ Filter out COMPLETED status
    if (ride.status === "COMPLETED") {
      return null;
    }

    // ✅ If this ride matches completed ride ID, ignore it
    if (completedRideId && ride._id === completedRideId) {

      return null;
    }

    return ride;
  }, [activeRideData?.data, isRideCompleted, completedRideId]);

  const incomingRides = incomingRidesData?.data || incomingRidesRedux;

  // ✅ Filter out completed/cancelled rides for display
  const displayActiveRide = useMemo(() => {
    if (!activeRide) {
      return null;
    }


    // ✅ NEVER show completed rides
    if (activeRide.status === "COMPLETED") {
      return null;
    }

    // ✅ NEVER show cancelled rides
    if (
      activeRide.status === "CANCELLED_BY_DRIVER" ||
      activeRide.status === "CANCELLED_BY_RIDER" ||
      activeRide.status?.includes("CANCELLED")
    ) {
      return null;
    }
    return activeRide;
  }, [activeRide]);

  // ✅ Mutations
  const [updateStatus, { isLoading: isUpdating }] = useUpdateDriverStatusMutation();
  const [acceptRide] = useAcceptRideMutation();
  const [rejectRide, { isLoading: isRejecting }] = useRejectRideMutation();
  const [cancelRide, { isLoading: isCancelling }] = useCancelRideMutation();
  const [statusUpdateAfterAccepted, { isLoading: isStatusChanging }] =
    useUpdateRideStatusAfterAcceptedMutation();

  // Driver status
  const status = (driverProfile as any)?.data?.status;
  const isAvailable = status === DriverStatus.AVAILABLE;
  const isOnTrip = status === DriverStatus.ON_TRIP;
  const isOffline = status === DriverStatus.OFFLINE || !status;

  // Metrics
  const [metrics] = useState({
    earningsToday: 126.75,
    tripsToday: 9,
    onlineMins: 312,
    rating: 4.92,
    acceptanceRate: 96,
    weeklyEarnings: [85, 120, 140, 90, 160, 200, 126],
  });

  const onlineH = Math.floor(metrics.onlineMins / 60);
  const onlineM = metrics.onlineMins % 60;

  // UI State
  const [showLocModal, setShowLocModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);

  // Profile coordinates
  const profileCoords = useMemo<[number, number] | null>(() => {
    const raw = (driverProfile as any)?.data?.location?.coordinates;
    if (Array.isArray(raw) && raw.length === 2 && raw.every((n: any) => typeof n === "number")) {
      return [raw[0], raw[1]];
    }
    return null;
  }, [driverProfile]);

  const cancelEnabledStatuses = ["ACCEPTED", "GOING_TO_PICK_UP", "DRIVER_ARRIVED"];
  const isCancelEnabled = !!(displayActiveRide && cancelEnabledStatuses.includes(displayActiveRide.status));
  const isAcceptDisabled = !!acceptingRideId || !!displayActiveRide;

  // ✅ Refetch all fresh data when component mounts
  useEffect(() => {
    refetchProfile();
    if (!isRideCompleted) {
      refetchActiveRide();
    }
    
  }, [refetchProfile, refetchActiveRide, activeRide, isRideCompleted]);

  // ✅ Toggle availability
  const toggleAvailability = useCallback(async () => {
    if (isOnTrip) return;
    const next = isAvailable ? DriverStatus.OFFLINE : DriverStatus.AVAILABLE;
    try {
      await updateStatus({ status: next }).unwrap();
      await refetchProfile();
      toast.success(`Status updated to ${next}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  }, [isAvailable, isOnTrip, updateStatus, refetchProfile]);

  // ✅ Accept request - RESET completion flags to enable polling again
  const acceptRequest = useCallback(
    async (ride: Ride) => {
      try {
        setAcceptingRideId(ride._id);
        const res = await acceptRide(ride._id).unwrap();

        const socket = initSocket();
        socket.emit("join_ride_room", { rideId: ride._id });
        // ✅ Update Redux
        dispatch(setActiveRide(res?.data || null));
        dispatch(clearIncomingRequests());
        dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
        // ✅ RESET completion flags - this re-enables polling for the new ride
        setIsRideCompleted(false);
        setCompletedRideId(null);

        toast.success("Ride accepted successfully! 🎉");

        await refetchProfile();
        await refetchActiveRide();
        // await refetchIncomingRides();
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to accept ride");
      } finally {
        setAcceptingRideId(null);
      }
    },
    [acceptRide, dispatch, refetchProfile, refetchActiveRide]
  );

  // ✅ Decline request
  const declineRequest = useCallback(
    async (rideId: string) => {
      try {
        await rejectRide(rideId).unwrap();
        dispatch(removeIncomingRequest(rideId));
        toast.success("Ride declined");
        await refetchIncomingRides();
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to decline ride");
      }
    },
    [rejectRide, dispatch, refetchIncomingRides]
  );

  // ✅ Cancel ride - PERMANENTLY disable polling
  const handleCancelRide = useCallback(async () => {
    if (!displayActiveRide) return;
    try {
      await cancelRide({ rideId: displayActiveRide._id, canceledReason: cancelReason }).unwrap();
      setShowCancelDialog(false);
      setCancelReason("");

      const socket = initSocket();
      socket.emit("leave_ride_room", { rideId: displayActiveRide._id });

      // ✅ Mark ride as completed (keep polling disabled)
      setCompletedRideId(displayActiveRide._id);
      setIsRideCompleted(true); // ✅ STAYS TRUE - never reset
      dispatch(clearActiveRide());
      dispatch(clearIncomingRequests());



      dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE", "INCOMING_RIDES"]));


      toast.success("Ride cancelled successfully");

    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to cancel ride");
    }
  }, [displayActiveRide, cancelReason, cancelRide, dispatch, refetchProfile, refetchIncomingRides]);

  // ✅ Update ride status - PERMANENTLY disable polling on completion
  const handleStatusChange = useCallback(
    async (ride: Ride, nextStatus: string) => {
      try {
        const res = await statusUpdateAfterAccepted({ rideId: ride._id, status: nextStatus }).unwrap();

        if (nextStatus === "COMPLETED") {

          // ✅ Mark ride as completed - THIS STAYS TRUE
          setCompletedRideId(ride._id);
          setIsRideCompleted(true); // ✅ STAYS TRUE - NEVER RESET

          // ✅ Clear Redux
          dispatch(clearActiveRide());
          dispatch(clearIncomingRequests());


          dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE", "INCOMING_RIDES"]));

          toast.success("Ride completed! ✅");

        } else {
          // ✅ For non-completion status updates
          dispatch(setActiveRide(res?.data || null));
          toast.success(`Status updated to ${getActiveRideBadge(nextStatus)}`);

          await refetchProfile();
          await refetchActiveRide();
          // await refetchIncomingRides();
        }
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to update ride status");
      }
    },
    [statusUpdateAfterAccepted, dispatch, refetchProfile, refetchIncomingRides]
  );

  // Progress bar component
  const progressBar = (value: number, color = "bg-emerald-500") => (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );

  // Status badge component
  const statusBadge = () => {
    const cls =
      isAvailable
        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
        : isOnTrip
          ? "border-sky-200 text-sky-700 bg-sky-50"
          : "border-slate-200 text-slate-600";
    const dot = isAvailable ? "bg-emerald-500" : isOnTrip ? "bg-sky-500" : "bg-slate-300";
    const label = isAvailable ? "Online" : isOnTrip ? "On Trip" : "Offline";
    return (
      <Badge variant="outline" className={cls}>
        <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
        {label}
      </Badge>
    );
  };

  // Map setup
  const leafletCenter = toLeaflet(profileCoords) || dhakaCenter;
  const mapKey = `map-${profileCoords ? `${profileCoords[1]}-${profileCoords[0]}` : "default"}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Driver Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor rides, earnings, and performance</p>
          {/* DEBUG: Show internal state */}
          <div className="text-xs text-slate-500 mt-2 font-mono bg-slate-100 p-2 rounded">
            <div>isRideCompleted: {String(isRideCompleted)}</div>
            <div>completedRideId: {completedRideId || "null"}</div>
            <div>activeRide (API): {activeRide?.status || "null"}</div>
            <div>displayActiveRide: {displayActiveRide ? "visible" : "hidden"}</div>
            <div>querySkipped: {isRideCompleted ? "yes" : "no"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge()}

          {/* ✅ Connection status */}
          <div className="flex items-center gap-1.5 text-xs px-2 py-1.5 bg-slate-100 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-slate-600">{isSocketConnected ? "✅ Connected" : "⚠️ Connecting..."}</span>
          </div>

          <Button
            variant={isAvailable ? "outline" : isOnTrip ? "secondary" : "default"}
            onClick={toggleAvailability}
            disabled={isUpdating || isOnTrip || isProfileLoading}
            title={isOnTrip ? "You are on a trip" : undefined}
            className="whitespace-nowrap"
          >
            {isUpdating
              ? "Updating..."
              : isAvailable
                ? "Go Offline"
                : isOnTrip
                  ? "On Trip"
                  : "Go Online"}
          </Button>

          <Button variant="outline" onClick={() => setShowLocModal(true)} className="whitespace-nowrap">
            <MapPin className="w-4 h-4 mr-2" />
            Set Location
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {isProfileError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load profile</p>
            <p className="text-xs mt-1">Retrying every 5 seconds...</p>
          </div>
        </div>
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
              ${metrics.earningsToday.toFixed(2)}
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
          <div className="h-[320px] rounded-md overflow-hidden border relative">
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
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-700 font-semibold">Location not set</p>
                  <p className="text-xs text-amber-600 mt-1">Click "Set Location" to enable</p>
                </div>
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
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Active Ride</CardTitle>
                <CardDescription>
                  {isActiveRideLoading ? (
                    "Loading active ride..."
                  ) : displayActiveRide ? (
                    `Ride ${displayActiveRide._id}`
                  ) : isAvailable ? (
                    "You are available for new requests"
                  ) : (
                    "Go online to receive requests"
                  )}
                </CardDescription>
              </div>
              {displayActiveRide && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 whitespace-nowrap">
                  {getActiveRideBadge(displayActiveRide.status)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isActiveRideLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : displayActiveRide ? (
              <>
                <div className="rounded-lg border bg-slate-50 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 break-words">
                        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-slate-800">
                          {displayActiveRide.pickupAddress ||
                            (displayActiveRide.pickupLocation?.coordinates
                              ? formatCoords(displayActiveRide.pickupLocation.coordinates)
                              : "Pickup")}
                        </span>
                      </div>
                      <div className="h-4 w-0.5 bg-slate-300 ml-2 my-2 rounded-full" />
                      <div className="flex items-center gap-2 break-words">
                        <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span className="font-medium text-slate-800">
                          {displayActiveRide.dropOffAddress ||
                            (displayActiveRide.dropOffLocation?.coordinates
                              ? formatCoords(displayActiveRide.dropOffLocation.coordinates)
                              : "Dropoff")}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        {typeof displayActiveRide.estimatedDuration === "number" && (
                          <span className="inline-flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-4 h-4 text-slate-500" />
                            ETA {displayActiveRide.estimatedDuration}m
                          </span>
                        )}
                        {typeof displayActiveRide.distance === "number" && (
                          <span className="inline-flex items-center gap-1 flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                            {displayActiveRide.distance.toFixed(1)} km
                          </span>
                        )}
                        {typeof displayActiveRide.approxFare === "number" && (
                          <span className="inline-flex items-center gap-1 flex-shrink-0">
                            <DollarSign className="w-4 h-4 text-slate-500" />${displayActiveRide.approxFare.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                      <Button
                        variant="default"
                        className="w-full sm:w-48"
                        onClick={() => window.open("https://www.google.com/maps", "_blank")}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </Button>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        {displayActiveRide.status === "ACCEPTED" && (
                          <Button
                            className="flex-1 sm:flex-none"
                            onClick={() => handleStatusChange(displayActiveRide, "GOING_TO_PICK_UP")}
                            disabled={isStatusChanging}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Going to Pickup
                          </Button>
                        )}
                        {displayActiveRide.status === "GOING_TO_PICK_UP" && (
                          <Button
                            className="flex-1 sm:flex-none"
                            onClick={() => handleStatusChange(displayActiveRide, "DRIVER_ARRIVED")}
                            disabled={isStatusChanging}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Arrived
                          </Button>
                        )}
                        {displayActiveRide.status === "DRIVER_ARRIVED" && (
                          <Button
                            className="flex-1 sm:flex-none"
                            onClick={() => handleStatusChange(displayActiveRide, "IN_TRANSIT")}
                            disabled={isStatusChanging}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Start Ride
                          </Button>
                        )}
                        {displayActiveRide.status === "IN_TRANSIT" && (
                          <Button
                            className="flex-1 sm:flex-none"
                            onClick={() => handleStatusChange(displayActiveRide, "REACHED_DESTINATION")}
                            disabled={isStatusChanging}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Reached Destination
                          </Button>
                        )}
                        {displayActiveRide.status === "REACHED_DESTINATION" && (
                          <Button
                            className="flex-1 sm:flex-none"
                            onClick={() => handleStatusChange(displayActiveRide, "COMPLETED")}
                            disabled={isStatusChanging}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        )}
                        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 sm:flex-none"
                              disabled={!isCancelEnabled || isCancelling}
                              size="sm"
                            >
                              {isCancelling ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Ride</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this ride? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 py-4">
                              <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
                              <Input
                                id="cancel-reason"
                                placeholder="e.g., Emergency, vehicle issue, etc."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                maxLength={200}
                              />
                              <p className="text-xs text-gray-500">{cancelReason.length}/200 characters</p>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setCancelReason("")}>
                                Keep Ride
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelRide}
                                disabled={isCancelling}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isCancelling ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  "Cancel Ride"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full sm:w-48"
                        onClick={() => toast.info("Calling passenger...")}
                        size="sm"
                      >
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
                {isAvailable && incomingRides?.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    You'll be notified when a new request arrives.
                  </div>
                )}
                {isOffline && (
                  <Button
                    className="mt-4"
                    onClick={toggleAvailability}
                    disabled={isUpdating || isProfileLoading}
                  >
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
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Incoming Requests</CardTitle>
                <CardDescription>Accept or decline new ride requests</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 whitespace-nowrap">
                {incomingRides?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!incomingRides || incomingRides?.length === 0 || activeRideData?.data ? (
              <div className="text-sm text-slate-600 border rounded-lg p-6 text-center">
                {displayActiveRide ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                    <p>No more requests while you have an active ride</p>
                  </>
                ) : isAvailable ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <p>No pending requests. Waiting for new ones...</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <p>Go online to receive requests</p>
                  </>
                )}
              </div>
            ) : (
              incomingRides.map((ride: Ride) => {
                const pickup =
                  ride.pickupAddress ||
                  (ride.pickupLocation?.coordinates ? formatCoords(ride.pickupLocation.coordinates) : "Pickup");
                const dropoff =
                  ride.dropOffAddress ||
                  (ride.dropOffLocation?.coordinates ? formatCoords(ride.dropOffLocation.coordinates) : "Dropoff");
                const etaMin = typeof ride.estimatedDuration === "number" ? ride.estimatedDuration : undefined;
                const distanceKm = typeof ride.distance === "number" ? ride.distance : undefined;
                const fare = typeof ride.approxFare === "number" ? ride.approxFare : undefined;

                const isThisRideAccepting = acceptingRideId === ride._id;

                return (
                  <div
                    key={ride._id}
                    className={`rounded-lg border p-3 sm:p-4 bg-white transition ${isAcceptDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50/60"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-500 break-all">{ride._id}</div>
                        <div className="mt-1 flex items-center gap-2 break-words">
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-slate-800">{pickup}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 break-words">
                          <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span className="font-medium text-slate-800">{dropoff}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          {typeof etaMin === "number" && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-4 h-4 text-slate-500" />
                              ETA {etaMin}m
                            </span>
                          )}
                          {typeof distanceKm === "number" && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0">
                              <TrendingUp className="w-4 h-4 text-slate-500" />
                              {distanceKm.toFixed(1)} km
                            </span>
                          )}
                          {typeof fare === "number" && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0">
                              <DollarSign className="w-4 h-4 text-slate-500" />${fare.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                        <Button
                          className="flex-1 sm:flex-none"
                          onClick={() => acceptRequest(ride)}
                          disabled={isAcceptDisabled}
                          title={
                            acceptingRideId
                              ? "Accepting a ride..."
                              : displayActiveRide
                                ? "Complete or cancel your active ride first"
                                : undefined
                          }
                          size="sm"
                        >
                          {isThisRideAccepting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            "Accept"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          onClick={() => declineRequest(ride._id)}
                          disabled={isRejecting || isAcceptDisabled}
                          size="sm"
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
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-300 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800 break-words">{a.text}</div>
                    <div className="text-xs text-slate-500">{a.ts}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                View All
              </Button>
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