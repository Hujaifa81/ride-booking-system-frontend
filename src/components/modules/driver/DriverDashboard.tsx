/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Car,
  MapPin,
  DollarSign,
  Star,
  Navigation,
  Phone,
  CheckCircle2,
  XCircle,
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
import { useGetDashboardMetricsQuery, useGetDriverProfileQuery, useUpdateDriverStatusMutation } from "@/redux/features/driver/driver.api";
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
import { reverseGeocode } from "@/utils/reverseGeocode";


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

const toLeaflet = (lngLat?: [number, number] | null): [number, number] | undefined =>
  lngLat ? [lngLat[1], lngLat[0]] : undefined;
const dhakaCenter: [number, number] = [23.8103, 90.4125];
// const formatCoords = ([lng, lat]: [number, number]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

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

  const incomingRidesRedux = useSelector((state: any) => state?.requests || []);
  const [isRideCompleted, setIsRideCompleted] = useState(false);
  const [completedRideId, setCompletedRideId] = useState<string | null>(null);
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});

  const {
    data: driverProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetDriverProfileQuery(undefined);

  const {
    data: activeRideData,
    isLoading: isActiveRideLoading,
    refetch: refetchActiveRide,
  } = useActiveRideQuery(undefined, {
    skip: isRideCompleted,
  });

  const {
    data: incomingRidesData,
    refetch: refetchIncomingRides,
  } = useGetIncomingRidesQuery(undefined);

  const {
    data: dashboardMetricsData,
    isLoading: isDashboardMetricsLoading,
    refetch: refetchDashboardMetrics,
  } = useGetDashboardMetricsQuery(undefined);

  const dashboardMetrics = useMemo(() => {
    return dashboardMetricsData?.data || {
      tripsToday: 0,
      totalEarningsToday: 0,
      rating: 0,
      cancelledToday: 0,
      onlineTimeMins: 0,
    };
  }, [dashboardMetricsData?.data]);

  const activeRide = useMemo(() => {
    if (isRideCompleted) {
      return null;
    }

    if (!activeRideData?.data) {
      return null;
    }
    const ride = activeRideData.data;

    if (ride.status === "COMPLETED") {
      return null;
    }

    if (completedRideId && ride._id === completedRideId) {
      return null;
    }

    return ride;
  }, [activeRideData?.data, isRideCompleted, completedRideId]);

  const incomingRides = incomingRidesData?.data || incomingRidesRedux;

  const displayActiveRide = useMemo(() => {
    if (!activeRide) {
      return null;
    }
    if (activeRide.status === "COMPLETED") {
      return null;
    }

    if (
      activeRide.status === "CANCELLED_BY_DRIVER" ||
      activeRide.status === "CANCELLED_BY_RIDER" ||
      activeRide.status?.includes("CANCELLED")
    ) {
      return null;
    }

    return activeRide;
  }, [activeRide]);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateDriverStatusMutation();
  const [acceptRide] = useAcceptRideMutation();
  const [rejectRide, { isLoading: isRejecting }] = useRejectRideMutation();
  const [cancelRide, { isLoading: isCancelling }] = useCancelRideMutation();
  const [statusUpdateAfterAccepted, { isLoading: isStatusChanging }] =
    useUpdateRideStatusAfterAcceptedMutation();

  const status = (driverProfile as any)?.data?.status;
  const isAvailable = status === DriverStatus.AVAILABLE;
  const isOnTrip = status === DriverStatus.ON_TRIP;
  const isOffline = status === DriverStatus.OFFLINE || !status;

  const [showLocModal, setShowLocModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);

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

  const getAddressFromCoords = useCallback(async (coords: [number, number]): Promise<string> => {
    const key = `${coords[0]},${coords[1]}`;
    if (addressCache[key]) {
      return addressCache[key];
    }

    const address = await reverseGeocode(coords[1], coords[0]);
    setAddressCache(prev => ({ ...prev, [key]: address }));
    return address;
  }, [addressCache]);

  const getPickupAddress = useCallback(async (ride: Ride): Promise<string> => {
    if (ride.pickupAddress) return ride.pickupAddress;
    if (ride.pickupLocation?.coordinates) {
      return await getAddressFromCoords(ride.pickupLocation.coordinates);
    }
    return "Pickup";
  }, [getAddressFromCoords]);

  const getDropoffAddress = useCallback(async (ride: Ride): Promise<string> => {
    if (ride.dropOffAddress) return ride.dropOffAddress;
    if (ride.dropOffLocation?.coordinates) {
      return await getAddressFromCoords(ride.dropOffLocation.coordinates);
    }
    return "Dropoff";
  }, [getAddressFromCoords]);

  useEffect(() => {
    refetchProfile();
    refetchIncomingRides();
    refetchDashboardMetrics()

    if (!isRideCompleted) {
      refetchActiveRide();
    }
  }, [refetchProfile, refetchActiveRide, activeRide, isRideCompleted, refetchIncomingRides, refetchDashboardMetrics]);

  useEffect(() => {
    if (displayActiveRide) {
      getPickupAddress(displayActiveRide);
      getDropoffAddress(displayActiveRide);
    }
  }, [displayActiveRide, getPickupAddress, getDropoffAddress]);

  useEffect(() => {
    if (incomingRides && incomingRides.length > 0) {
      incomingRides.forEach((ride: Ride) => {
        getPickupAddress(ride);
        getDropoffAddress(ride);
      });
    }
  }, [incomingRides, getPickupAddress, getDropoffAddress]);

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

  const acceptRequest = useCallback(
    async (ride: Ride) => {
      try {
        setAcceptingRideId(ride._id);
        const res = await acceptRide(ride._id).unwrap();

        const socket = initSocket();
        socket.emit("join_ride_room", { rideId: ride._id });
        dispatch(setActiveRide(res?.data || null));
        dispatch(clearIncomingRequests());
        dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
        setIsRideCompleted(false);
        setCompletedRideId(null);

        toast.success("Ride accepted successfully! 🎉");

        await refetchProfile();
        await refetchActiveRide();
        await refetchDashboardMetrics();

      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to accept ride");
      } finally {
        setAcceptingRideId(null);
      }
    },
    [acceptRide, dispatch, refetchProfile, refetchActiveRide, refetchDashboardMetrics]
  );

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

  const handleCancelRide = useCallback(async () => {
    if (!displayActiveRide) return;
    try {
      await cancelRide({ rideId: displayActiveRide._id, canceledReason: cancelReason }).unwrap();
      setShowCancelDialog(false);
      setCancelReason("");

      const socket = initSocket();
      socket.emit("leave_ride_room", { rideId: displayActiveRide._id });

      setCompletedRideId(displayActiveRide._id);
      setIsRideCompleted(true);
      dispatch(clearActiveRide());
      dispatch(clearIncomingRequests());

      dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE", "INCOMING_RIDES"]));
      await refetchDashboardMetrics();

      toast.success("Ride cancelled successfully");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to cancel ride");
    }
  }, [displayActiveRide, cancelReason, cancelRide, dispatch, refetchDashboardMetrics]);

  const handleStatusChange = useCallback(
    async (ride: Ride, nextStatus: string) => {
      try {
        const res = await statusUpdateAfterAccepted({ rideId: ride._id, status: nextStatus }).unwrap();

        if (nextStatus === "COMPLETED") {
          setCompletedRideId(ride._id);
          setIsRideCompleted(true);

          dispatch(clearActiveRide());
          dispatch(clearIncomingRequests());

          dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE", "INCOMING_RIDES", "RIDE", "RIDE_STATS", "DASHBOARD_METRICS", "EARNINGS_ANALYTICS"]));
          await new Promise(resolve => setTimeout(resolve, 100));
          await refetchActiveRide();
          await refetchDashboardMetrics();

          toast.success("Ride completed! ✅");
        } else {
          dispatch(setActiveRide(res?.data || null));
          toast.success(`Status updated to ${getActiveRideBadge(nextStatus)}`);

          await refetchProfile();
          await refetchActiveRide();
          await refetchDashboardMetrics();
        }
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to update ride status");
      }
    },
    [statusUpdateAfterAccepted, dispatch, refetchProfile, refetchActiveRide, refetchDashboardMetrics]
  );

  const progressBar = (value: number, color = "bg-emerald-500") => (
    <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );

  const statusBadge = () => {
    const cls =
      isAvailable
        ? "border-emerald-300 text-emerald-700 bg-emerald-50"
        : isOnTrip
          ? "border-sky-300 text-sky-700 bg-sky-50"
          : "border-gray-300 text-gray-700 bg-gray-50";
    const dot = isAvailable ? "bg-emerald-500" : isOnTrip ? "bg-sky-500" : "bg-gray-400";
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

  const RideLocationDisplay = ({ ride }: { ride: Ride }) => {
    const [pickup, setPickup] = useState<string>("Loading...");
    const [dropoff, setDropoff] = useState<string>("Loading...");

    useEffect(() => {
      const loadAddresses = async () => {
        const pickupAddr = await getPickupAddress(ride);
        const dropoffAddr = await getDropoffAddress(ride);
        setPickup(pickupAddr);
        setDropoff(dropoffAddr);
      };
      loadAddresses();
    }, [ride]);

    return (
      <>
        <div className="flex items-center gap-2 break-words">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-gray-900">{pickup}</span>
        </div>
        <div className="h-4 w-0.5 bg-gray-400 ml-2 my-2 rounded-full" />
        <div className="flex items-center gap-2 break-words">
          <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-semibold text-gray-900">{dropoff}</span>
        </div>
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white via-blue-50 to-indigo-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor rides, earnings, and performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge()}

          <Button
            variant={isAvailable ? "outline" : isOnTrip ? "secondary" : "default"}
            onClick={toggleAvailability}
            disabled={isUpdating || isOnTrip || isProfileLoading}
            title={isOnTrip ? "You are on a trip" : undefined}
            className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {isUpdating
              ? "Updating..."
              : isAvailable
                ? "Go Offline"
                : isOnTrip
                  ? "On Trip"
                  : "Go Online"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowLocModal(true)}
            className="whitespace-nowrap border-gray-300 text-gray-900 hover:bg-blue-50"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Set Location
          </Button>
        </div>
      </div>

      {isProfileError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-sm text-rose-700 flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load profile</p>
            <p className="text-xs mt-1">Retrying every 5 seconds...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Earnings Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardMetricsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  ${(dashboardMetrics.totalEarningsToday || 0).toFixed(2)}
                </div>
                <div className="mt-3">{progressBar(Math.min(100, ((dashboardMetrics.totalEarningsToday || 0) / 200) * 100))}</div>
                <div className="text-xs text-gray-600 mt-1">Target: $200</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-indigo-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600" />
              Trips Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardMetricsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{dashboardMetrics.tripsToday || 0}</div>
                <div className="mt-3">{progressBar(Math.min(100, ((dashboardMetrics.tripsToday || 0) / 20) * 100), "bg-indigo-500")}</div>
                <div className="text-xs text-gray-600 mt-1">Target: 20 trips</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-amber-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardMetricsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900">{(dashboardMetrics.rating || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-600">/ 5.0</div>
                </div>
                <div className="mt-3">{progressBar(Math.min(100, (dashboardMetrics.rating || 0) * 20), "bg-amber-500")}</div>
                <div className="text-xs text-gray-600 mt-1">Your Rating</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-red-50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Cancelled Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDashboardMetricsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{dashboardMetrics.cancelledToday || 0}</div>
                <div className="mt-3">
                  <div className="w-full h-2 rounded-full bg-red-100 overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${Math.min(100, ((dashboardMetrics.cancelledToday || 0) / 3) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1">Keep it under 3</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {!isOffline && (
        <Card className="border-0 shadow-sm mb-6 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Your Location</CardTitle>
            <CardDescription>Current driver position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] rounded-lg overflow-hidden border border-gray-300 relative shadow-sm">
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
                        <div className="font-semibold text-gray-900">You are here</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Lat {profileCoords[1].toFixed(6)}, Lng {profileCoords[0].toFixed(6)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
              {!profileCoords && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-amber-800 font-semibold">Location not set</p>
                    <p className="text-xs text-amber-700 mt-1">Click "Set Location" to enable</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <Card className="xl:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Active Ride</CardTitle>
                <CardDescription>
                  {isActiveRideLoading ? (
                    "Loading active ride..."
                  ) : displayActiveRide ? (
                    `Ride ${displayActiveRide._id.slice(0, 8)}...`
                  ) : isAvailable ? (
                    "You are available for new requests"
                  ) : (
                    "Go online to receive requests"
                  )}
                </CardDescription>
              </div>
              {displayActiveRide && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-700 whitespace-nowrap">
                  {getActiveRideBadge(displayActiveRide.status)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {isActiveRideLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : displayActiveRide ? (
              <>
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-3 sm:p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <RideLocationDisplay ride={displayActiveRide} />
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                        {typeof displayActiveRide.estimatedDuration === "number" && (
                          <span className="inline-flex items-center gap-1 flex-shrink-0 bg-white px-2 py-1 rounded-md border border-gray-300">
                            <Clock className="w-4 h-4 text-gray-600" />
                            ETA {displayActiveRide.estimatedDuration}m
                          </span>
                        )}
                        {typeof displayActiveRide.distance === "number" && (
                          <span className="inline-flex items-center gap-1 flex-shrink-0 bg-white px-2 py-1 rounded-md border border-gray-300">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            {displayActiveRide.distance.toFixed(1)} km
                          </span>
                        )}
                        {typeof displayActiveRide.approxFare === "number" && (
                          <span className="inline-flex items-center gap-1 flex-shrink-0 bg-white px-2 py-1 rounded-md border border-gray-300">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            ${displayActiveRide.approxFare.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                      <Button
                        variant="default"
                        className="w-full sm:w-48 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        onClick={() => window.open("https://www.google.com/maps", "_blank")}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </Button>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        {displayActiveRide.status === "ACCEPTED" && (
                          <Button
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
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
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
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
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
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
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
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
                            className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                            onClick={() => handleStatusChange(displayActiveRide, "COMPLETED")}
                            disabled={isStatusChanging}
                            size="sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {isStatusChanging ? "Completing..." : "Complete"}
                          </Button>
                        )}
                        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 sm:flex-none border-red-300 text-red-700 hover:bg-red-50"
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
                          <AlertDialogContent className="bg-white border-gray-300">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900">Cancel Ride</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                Are you sure you want to cancel this ride? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 py-4">
                              <Label htmlFor="cancel-reason" className="text-gray-900">Reason for cancellation (optional)</Label>
                              <Input
                                id="cancel-reason"
                                placeholder="e.g., Emergency, vehicle issue, etc."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                maxLength={200}
                                className="bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20"
                              />
                              <p className="text-xs text-gray-600">{cancelReason.length}/200 characters</p>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setCancelReason("")} className="border-gray-300 text-gray-900">
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
                        className="w-full sm:w-48 border-gray-300 text-gray-900 hover:bg-blue-50"
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
              <div className="rounded-lg border border-gray-300 bg-white p-6 text-center shadow-sm">
                <div className="text-gray-700 font-medium">
                  {isAvailable ? "No active rides. Waiting for the next request..." : "You are offline."}
                </div>
                {isAvailable && incomingRides?.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    You'll be notified when a new request arrives.
                  </div>
                )}
                {isOffline && (
                  <Button
                    className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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

        <Card className="xl:col-span-2 border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Incoming Requests</CardTitle>
                <CardDescription>Accept or decline new ride requests</CardDescription>
              </div>
              {/* <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 whitespace-nowrap">
                {incomingRides?.length || 0}
              </Badge> */}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {!incomingRides || incomingRides?.length === 0 || activeRideData?.data ? (
              <div className="text-sm text-gray-600 border border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                {displayActiveRide ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-gray-900 font-medium">No more requests while you have an active ride</p>
                  </>
                ) : isAvailable ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-900 font-medium">No pending requests. Waiting for new ones...</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-900 font-medium">Go online to receive requests</p>
                  </>
                )}
              </div>
            ) : (
              incomingRides.map((ride: Ride) => {
                const etaMin = typeof ride.estimatedDuration === "number" ? ride.estimatedDuration : undefined;
                const distanceKm = typeof ride.distance === "number" ? ride.distance : undefined;
                const fare = typeof ride.approxFare === "number" ? ride.approxFare : undefined;

                const isThisRideAccepting = acceptingRideId === ride._id;

                return (
                  <div
                    key={ride._id}
                    className={`rounded-lg border p-3 sm:p-4 bg-white transition shadow-sm ${isAcceptDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md border-gray-300"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-600 break-all">{ride._id}</div>
                        <div className="mt-1">
                          <RideLocationDisplay ride={ride} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                          {typeof etaMin === "number" && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0 bg-blue-50 px-2 py-1 rounded border border-blue-300">
                              <Clock className="w-4 h-4 text-blue-600" />
                              ETA {etaMin}m
                            </span>
                          )}
                          {typeof distanceKm === "number" && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0 bg-purple-50 px-2 py-1 rounded border border-purple-300">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              {distanceKm.toFixed(1)} km
                            </span>
                          )}
                          {typeof fare === "number" && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              ${fare.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                        <Button
                          className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
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
                          className="flex-1 sm:flex-none border-gray-300 text-gray-900 hover:bg-red-50"
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
      </div>

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