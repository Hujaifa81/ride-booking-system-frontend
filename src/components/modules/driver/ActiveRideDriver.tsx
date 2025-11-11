/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback, useEffect } from "react";
import {
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Navigation,
  ChevronDown,
  Info,
  ArrowDown,
  User,
  MapIcon,
  PhoneCall,
  MessageCircle,
  Copy,
} from "lucide-react";
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
import { toast } from "sonner";
import type { Ride } from "@/types";
import {
  clearActiveRide,
  clearIncomingRequests,
} from "@/redux/features/ride/ride.slice";
import { useUpdateRideStatusAfterAcceptedMutation, useCancelRideMutation, rideApi, useActiveRideQuery } from "@/redux/features/ride/ride.api";
import { initSocket } from "@/lib/socket";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
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

const passengerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const toLeaflet = (lngLat?: [number, number] | null): [number, number] | undefined =>
  lngLat ? [lngLat[1], lngLat[0]] : undefined;

const dhakaCenter: [number, number] = [23.8103, 90.4125];

const formatCoords = ([lng, lat]: [number, number]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "bg-blue-500/20 text-blue-300 border-blue-500/50";
    case "GOING_TO_PICK_UP":
      return "bg-purple-500/20 text-purple-300 border-purple-500/50";
    case "DRIVER_ARRIVED":
      return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    case "IN_TRANSIT":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
    case "REACHED_DESTINATION":
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/50";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "🎉 Ride Accepted";
    case "GOING_TO_PICK_UP":
      return "🚗 Going to Pickup";
    case "DRIVER_ARRIVED":
      return "📍 Arrived at Pickup";
    case "IN_TRANSIT":
      return "🛣️ In Transit";
    case "REACHED_DESTINATION":
      return "🏁 Reached Destination";
    default:
      return status;
  }
};

const ActiveRideDriver = () => {
  const dispatch = useDispatch();

  // ✅ Get active ride from API - PRIMARY SOURCE
  const { data: activeRideData, isLoading: isActiveRideLoading, refetch } = useActiveRideQuery(undefined);

  // ✅ Get from Redux as fallback
  const reduxActiveRide = useSelector((state: any) => state?.activeRide?.ride || null);

  // ✅ Use API data as primary, fallback to Redux
  const activeRide = activeRideData?.data

  // ✅ Mutations
  const [statusUpdateAfterAccepted, { isLoading: isStatusChanging }] =
    useUpdateRideStatusAfterAcceptedMutation();
  const [cancelRideApi, { isLoading: isCancellingRide }] = useCancelRideMutation();

  // UI State
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [expandedSection, setExpandedSection] = useState<"route" | "passenger" | "map" | null>("route");

  // ✅ SYNC REDUX WITH API - CRITICAL FIX
  useEffect(() => {
    if (activeRideData?.data === null || activeRideData?.data === undefined) {
      // ✅ API returned no ride - clear Redux
      if (reduxActiveRide) {
        console.log("🧹 [SYNC] Clearing stale Redux state - API has no active ride");
        dispatch(clearActiveRide());
        dispatch(clearIncomingRequests());
      }
    }
  }, [activeRideData?.data, reduxActiveRide, dispatch]);

  // ✅ Next available status based on current status
  const getNextStatus = (currentStatus: string) => {
    const statusFlow: { [key: string]: string } = {
      ACCEPTED: "GOING_TO_PICK_UP",
      GOING_TO_PICK_UP: "DRIVER_ARRIVED",
      DRIVER_ARRIVED: "IN_TRANSIT",
      IN_TRANSIT: "REACHED_DESTINATION",
      REACHED_DESTINATION: "COMPLETED",
    };
    return statusFlow[currentStatus] || null;
  };

  const nextStatus = activeRide ? getNextStatus(activeRide.status) : null;
  const cancelEnabledStatuses = ["ACCEPTED", "GOING_TO_PICK_UP", "DRIVER_ARRIVED"];
  const isCancelEnabled = activeRide && cancelEnabledStatuses.includes(activeRide.status);

  // ✅ Update ride status
  const handleStatusChange = useCallback(
    async (ride: Ride, nextStatus: string) => {
      try {
        console.log("🟪 [STATUS] Updating ride status:", { rideId: ride._id, currentStatus: ride.status, nextStatus });

        const res = await statusUpdateAfterAccepted({ rideId: ride._id, status: nextStatus }).unwrap();
        console.log("🟪 [STATUS] Status update response:", res);

        if (nextStatus === "COMPLETED") {
          console.log("🟪🟪🟪 [STATUS] RIDE COMPLETED - LEAVING ROOM 🟪🟪🟪");

          // ✅ Leave ride room when completed
          const socket = initSocket();
          socket.emit("leave_ride_room", { rideId: ride._id });
          console.log("🚪 [STATUS] Emitted leave_ride_room for completed ride:", ride._id);

          // ✅ Step 1: Clear Redux state immediately
          dispatch(clearActiveRide());
          dispatch(clearIncomingRequests());
          console.log("🟪 [STATUS] Redux cleared");

          // ✅ Step 2: Invalidate ALL ride-related cache
          dispatch(rideApi.util.resetApiState());
          console.log("🟪 [STATUS] Reset entire API state");

          // ✅ Step 3: Wait for state to settle
          await new Promise(resolve => setTimeout(resolve, 100));

          // ✅ Step 4: Refetch - this will now get fresh data from server
          const refetchResult = await refetch();
          console.log("🟪 [STATUS] Refetch result:", refetchResult);

          // ✅ Step 5: Check if data is actually null now
          if (!refetchResult.data?.data) {
            console.log("🟪 [STATUS] ✅ API confirmed no active ride");
          } else {
            console.warn("🟪 [STATUS] ⚠️ API still has ride data:", refetchResult.data?.data);
          }

  
          toast.success("Ride completed! ✅");
        } else {
          console.log("🔄 [STATUS] Status updated to:", nextStatus);

          // ✅ Invalidate only ACTIVE_RIDE tag for intermediate updates
          dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE"]));
          console.log("🔄 [STATUS] Invalidated ACTIVE_RIDE tag");

          await new Promise(resolve => setTimeout(resolve, 100));
          await refetch();
          console.log("🔄 [STATUS] Refetched active ride");

          toast.success(`Status updated to ${getStatusLabel(nextStatus)}`);
        }
      } catch (e: any) {
        console.error("🔴 [STATUS] Error updating status:", e);
        toast.error(e?.data?.message || "Failed to update ride status");
      }
    },
    [statusUpdateAfterAccepted, dispatch, refetch]
  );



  // ✅ Cancel ride
  const handleCancelRide = useCallback(async () => {
    if (!activeRide) return;
    try {
      console.log("🟥 [CANCEL] Cancelling ride:", activeRide._id);

      // ✅ Call cancel API
      await cancelRideApi({ rideId: activeRide._id, canceledReason: cancelReason }).unwrap();
      console.log("🟥 [CANCEL] Cancel API response received");

      // ✅ Leave ride room when cancelled
      const socket = initSocket();
      socket.emit("leave_ride_room", { rideId: activeRide._id });
      console.log("🚪 [CANCEL] Emitted leave_ride_room for cancelled ride:", activeRide._id);

      // ✅ Clear Redux state FIRST
      dispatch(clearActiveRide());
      dispatch(clearIncomingRequests());
      console.log("🟥 [CANCEL] Redux cleared");

      // ✅ Invalidate cache tags
      dispatch(rideApi.util.invalidateTags(["ACTIVE_RIDE"]));
      console.log("🟥 [CANCEL] Invalidated ACTIVE_RIDE tag");

      dispatch(rideApi.util.invalidateTags(["INCOMING_RIDES"]));
      console.log("🟥 [CANCEL] Invalidated INCOMING_RIDES tag");

      // ✅ Refetch to ensure API is empty
      await refetch();
      console.log("🟥 [CANCEL] Refetched active ride");

      setShowCancelDialog(false);
      setCancelReason("");

      toast.success("Ride cancelled successfully");
    } catch (e: any) {
      console.error("🔴 [CANCEL] Error:", e);
      toast.error(e?.data?.message || "Failed to cancel ride");
    }
  }, [activeRide, cancelReason, cancelRideApi, dispatch, refetch]);

  // ✅ If no active ride, show empty state
  if (!activeRide || isActiveRideLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto">
            {isActiveRideLoading ? (
              <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
            ) : (
              <AlertCircle className="w-12 h-12 text-slate-500 animate-pulse" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isActiveRideLoading ? "Loading Ride..." : "No Active Ride"}
          </h2>
          <p className="text-slate-400">
            {isActiveRideLoading ? "Please wait..." : "Accept a ride request to get started"}
          </p>
        </div>
      </div>
    );
  }

  const pickup =
    activeRide.pickupAddress ||
    (activeRide.pickupLocation?.coordinates ? formatCoords(activeRide.pickupLocation.coordinates) : "Pickup");
  const dropoff =
    activeRide.dropOffAddress ||
    (activeRide.dropOffLocation?.coordinates ? formatCoords(activeRide.dropOffLocation.coordinates) : "Dropoff");

  const mapKey = `map-${activeRide._id}`;
  const leafletCenter = toLeaflet(activeRide.pickupLocation?.coordinates) || dhakaCenter;
  const pickupCoords = toLeaflet(activeRide.pickupLocation?.coordinates);
  const dropoffCoords = toLeaflet(activeRide.dropOffLocation?.coordinates);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg ${activeRide.status === "IN_TRANSIT"
                      ? "from-emerald-500 to-emerald-600"
                      : activeRide.status === "REACHED_DESTINATION"
                        ? "from-cyan-500 to-cyan-600"
                        : "from-blue-500 to-purple-600"
                    }`}
                >
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Active Ride</h1>
                  <p className="text-sm text-slate-400">{getStatusLabel(activeRide.status)}</p>
                </div>
              </div>
            </div>

            <Badge className={`${getStatusBadgeColor(activeRide.status)} border rounded-lg text-lg px-4 py-2`}>
              {getStatusLabel(activeRide.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Ride Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Card */}
            <div className="group relative bg-gradient-to-br from-blue-600/30 to-blue-700/30 border border-blue-500/50 rounded-2xl overflow-hidden backdrop-blur-md hover:border-blue-500/70 transition-all duration-300">
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedSection(expandedSection === "route" ? null : "route")}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-blue-300" />
                    Route Details
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-300 transition-transform duration-300 ${expandedSection === "route" ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </div>

              {expandedSection === "route" && (
                <div className="px-6 pb-6 border-t border-blue-500/30 space-y-6">
                  {/* Route visualization */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg shadow-blue-500/50" />
                      <div className="w-1 h-24 bg-gradient-to-b from-blue-500/50 via-purple-500/30 to-rose-500/50" />
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-rose-400 to-rose-500 shadow-lg shadow-rose-500/50" />
                    </div>

                    <div className="flex-1 space-y-8 min-w-0">
                      {/* Pickup */}
                      <div className="space-y-2">
                        <p className="text-xs text-blue-300 font-bold uppercase tracking-wide">Pickup Location</p>
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                          <p className="font-semibold text-white break-words">{pickup}</p>
                          <p className="text-sm text-slate-400 mt-1">📍 Pick up your passenger here</p>
                        </div>
                      </div>

                      {/* Dropoff */}
                      <div className="space-y-2">
                        <p className="text-xs text-rose-300 font-bold uppercase tracking-wide">Dropoff Location</p>
                        <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-4">
                          <p className="font-semibold text-white break-words">{dropoff}</p>
                          <p className="text-sm text-slate-400 mt-1">🏁 Drop off your passenger here</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-blue-500/30">
                    {typeof activeRide.estimatedDuration === "number" && (
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center hover:bg-blue-500/30 transition-colors">
                        <p className="text-slate-400 text-xs font-semibold mb-2">ETA</p>
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-blue-300" />
                          <p className="text-2xl font-bold text-blue-300">{activeRide.estimatedDuration}m</p>
                        </div>
                      </div>
                    )}

                    {typeof activeRide.distance === "number" && (
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center hover:bg-purple-500/30 transition-colors">
                        <p className="text-slate-400 text-xs font-semibold mb-2">DISTANCE</p>
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-300" />
                          <p className="text-2xl font-bold text-purple-300">{activeRide.distance.toFixed(1)}km</p>
                        </div>
                      </div>
                    )}

                    {typeof activeRide.approxFare === "number" && (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-center hover:bg-emerald-500/30 transition-colors">
                        <p className="text-slate-400 text-xs font-semibold mb-2">FARE</p>
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-300" />
                          <p className="text-2xl font-bold text-emerald-300">${activeRide.approxFare.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Passenger Card */}
            <div className="group relative bg-gradient-to-br from-purple-600/30 to-purple-700/30 border border-purple-500/50 rounded-2xl overflow-hidden backdrop-blur-md hover:border-purple-500/70 transition-all duration-300">
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedSection(expandedSection === "passenger" ? null : "passenger")}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <User className="w-6 h-6 text-purple-300" />
                    Passenger Details
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-purple-300 transition-transform duration-300 ${expandedSection === "passenger" ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </div>

              {expandedSection === "passenger" && (
                <div className="px-6 pb-6 border-t border-purple-500/30 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white">Passenger</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-yellow-300 font-semibold">4.92</span>
                        <span className="text-xs text-slate-400">(127 rides)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-purple-500/30">
                    <Button className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-300">
                      <PhoneCall className="w-4 h-4" />
                      <span className="hidden sm:inline">Call</span>
                    </Button>
                    <Button className="gap-2 h-10 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all duration-300">
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Message</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Map Card */}
            <div className="group relative bg-gradient-to-br from-emerald-600/30 to-emerald-700/30 border border-emerald-500/50 rounded-2xl overflow-hidden backdrop-blur-md hover:border-emerald-500/70 transition-all duration-300">
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedSection(expandedSection === "map" ? null : "map")}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <MapIcon className="w-6 h-6 text-emerald-300" />
                    Route Map
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-300 transition-transform duration-300 ${expandedSection === "map" ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </div>

              {expandedSection === "map" && (
                <div className="p-6 border-t border-emerald-500/30">
                  <div className="h-80 rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg">
                    <MapContainer key={mapKey} center={leafletCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {pickupCoords && (
                        <Marker position={pickupCoords} icon={passengerIcon}>
                          <Popup>
                            <div className="text-sm">
                              <div className="font-bold">📍 Pickup Location</div>
                              <div className="text-xs text-slate-600">{pickup}</div>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      {dropoffCoords && (
                        <Marker position={dropoffCoords} icon={driverIcon}>
                          <Popup>
                            <div className="text-sm">
                              <div className="font-bold">🏁 Dropoff Location</div>
                              <div className="text-xs text-slate-600">{dropoff}</div>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-bold text-white">Next Action</h3>

              {nextStatus ? (
                <>
                  <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Current Status</p>
                    <Badge className={`${getStatusBadgeColor(activeRide.status)} border w-full justify-center py-2`}>
                      {getStatusLabel(activeRide.status)}
                    </Badge>
                  </div>

                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-5 h-5 text-slate-500 animate-bounce" />
                  </div>

                  <Button
                    className="w-full h-12 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (activeRide) {
                        console.log("🔵 [CLICK] Button clicked with current ride:", activeRide._id, "Status:", activeRide.status);
                        handleStatusChange(activeRide, nextStatus);
                      }
                    }}
                    disabled={isStatusChanging}
                  >
                    {isStatusChanging ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {getStatusLabel(nextStatus)}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-pulse" />
                  <p className="text-emerald-300 font-semibold text-lg">Ride Completed! 🎉</p>
                  <p className="text-slate-400 text-sm mt-2">Great job on completing the ride.</p>
                </div>
              )}
            </div>

            {/* Communication Box */}
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 border border-blue-500/50 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-300" />
                Quick Contact
              </h3>

              <div className="space-y-3">
                <Button className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all duration-300">
                  <PhoneCall className="w-5 h-5" />
                  Call Passenger
                </Button>
                <Button variant="outline" className="w-full h-11 gap-2 border-slate-600 text-white hover:bg-slate-700/50 rounded-xl font-semibold transition-all duration-300">
                  <MessageCircle className="w-5 h-5" />
                  Message Passenger
                </Button>
              </div>
            </div>

            {/* Ride Info Box */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-300" />
                Ride Info
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                  <span className="text-slate-400">Ride ID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-slate-200 font-mono text-xs">{activeRide._id.slice(0, 8)}...</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeRide._id);
                        toast.success("Ride ID copied!");
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy Ride ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                  <span className="text-slate-400">Status</span>
                  <span className="text-white font-semibold text-xs uppercase">{activeRide.status}</span>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            {isCancelEnabled && (
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-11 gap-2 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isCancellingRide}>
                    <XCircle className="w-5 h-5" />
                    Cancel Ride
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Cancel This Ride?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Are you sure you want to cancel? This action cannot be undone and may affect your rating.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cancel-reason" className="text-white text-sm font-semibold">
                        Reason for cancellation (optional)
                      </Label>
                      <Input
                        id="cancel-reason"
                        placeholder="e.g., Emergency, vehicle issue, etc."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        maxLength={200}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:border-red-500 focus:ring-red-500/20"
                      />
                      <p className="text-xs text-slate-500">{cancelReason.length}/200 characters</p>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-800 hover:text-white">
                      Keep Ride
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelRide}
                      disabled={isCancellingRide}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancellingRide ? (
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
            )}

            {/* Navigation Button */}
            <Button className="w-full h-12 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300">
              <Navigation className="w-5 h-5" />
              Start Navigation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRideDriver;