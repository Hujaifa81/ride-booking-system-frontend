/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSelector, useDispatch } from "react-redux";
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
  Phone,
  MessageSquare,
  MapPinned,
  Zap,
 
} from "lucide-react";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  useAcceptRideMutation,
  useRejectRideMutation,
  useGetIncomingRidesQuery,
} from "@/redux/features/ride/ride.api";
import type { Ride } from "@/types";
import {
  removeIncomingRequest,
  setIncomingRequests,
  setActiveRide,
  clearIncomingRequests,
} from "@/redux/features/ride/ride.slice";
import { useDriverIncomingRequestSocket } from "@/hooks/useDriverIncomingRequestSocket";

const formatCoords = ([lng, lat]: [number, number]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

const IncomingRequests = () => {
  const dispatch = useDispatch();
  const incomingRequestsRedux = useSelector((state: any) => state.incomingRequests);
  const activeRideRedux = useSelector((state: any) => state.activeRide);

  // Fetch from API
  const {
    data: incomingRidesData,
    isLoading: isApiLoading,
    error: apiError,
    refetch: refetchIncomingRides,
  } = useGetIncomingRidesQuery(undefined);

  const [acceptRide] = useAcceptRideMutation();
  const [rejectRide, { isLoading: isRejecting }] = useRejectRideMutation();
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
  const [rejectingRideId, setRejectingRideId] = useState<string | null>(null);
  // const [searchQuery, setSearchQuery] = useState("");
  // const [filterType, setFilterType] = useState<"all" | "nearby" | "highfare">("all");
  

  // Sync API data to Redux on mount/change
  useEffect(() => {
    if (incomingRidesData?.data) {
      console.log("📡 Syncing incoming rides to Redux:", incomingRidesData.data.length);
      dispatch(setIncomingRequests(incomingRidesData?.data));
    }
  }, [incomingRidesData?.data, dispatch]);

  // Use Redux state (synced from API)
  const incomingRides: Ride[] = incomingRequestsRedux?.requests || [];
  const activeRide = activeRideRedux?.ride || null;

  const isAcceptDisabled = !!acceptingRideId || !!activeRide;

  // ✅ ADD SOCKET HOOK HERE - Listen for ride updates immediately
  useDriverIncomingRequestSocket({
    enabled: true, // Always enabled on this page
    onNewRide: async (ride: Ride) => {
      console.log("✅ New ride received on IncomingRequests page:", ride._id);
      toast.success("New ride request received!");
      await refetchIncomingRides();
    },
    activeRide: activeRide || null,
    onActiveRideUpdate: async (ride: Ride) => {
      console.log("📡 Active ride updated on IncomingRequests page:", ride.status);
      if (ride.status && ride.status.startsWith("CANCELLED")) {
        toast.error("Ride cancelled by rider.");
        dispatch(clearIncomingRequests());
      } else {
        dispatch(setActiveRide(ride));
      }
    },
    rideCancelledBeforeDriverAcceptance: async (payload: { rideId: string }) => {
      console.log("🚫 Ride cancelled before acceptance:", payload.rideId);
      toast.error(`Ride ${payload.rideId} cancelled before acceptance.`);
      await refetchIncomingRides();
    },
  });

  // Filter rides based on search and type
  // const filteredRides = incomingRides.filter((ride) => {
  //   const matchesSearch =
  //     ride._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     ride.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     ride.dropOffAddress?.toLowerCase().includes(searchQuery.toLowerCase());

  //   if (filterType === "nearby") {
  //     return matchesSearch && (ride.distance || 0) < 5;
  //   }
  //   if (filterType === "highfare") {
  //     return matchesSearch && (ride.approxFare || 0) > 15;
  //   }
  //   return matchesSearch;
  // });

  const filteredRides = incomingRides;

  const acceptRequest = useCallback(
    async (ride: Ride) => {
      try {
        setAcceptingRideId(ride._id);
        const res = await acceptRide(ride._id).unwrap();
        dispatch(setActiveRide(res?.data || null));
        dispatch(clearIncomingRequests());
        toast.success("Ride accepted successfully! 🎉");
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to accept ride");
      } finally {
        setAcceptingRideId(null);
      }
    },
    [acceptRide, dispatch]
  );

  const declineRequest = useCallback(
    async (rideId: string) => {
      try {
        setRejectingRideId(rideId);
        await rejectRide(rideId).unwrap();
        dispatch(removeIncomingRequest(rideId));
        toast.success("Ride declined");
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to decline ride");
      } finally {
        setRejectingRideId(null);
      }
    },
    [rejectRide, dispatch]
  );

 

  // Stats
  const avgFare =
    incomingRides.length > 0
      ? (incomingRides.reduce((sum, r) => sum + (r.approxFare || 0), 0) / incomingRides.length).toFixed(2)
      : "0.00";

  // const avgDistance =
  //   incomingRides.length > 0
  //     ? (incomingRides.reduce((sum, r) => sum + (r.distance || 0), 0) / incomingRides.length).toFixed(1)
  //     : "0.0";

  const nearbyRides = incomingRides.filter((r) => (r.distance || 0) < 5).length;
  const highFareRides = incomingRides.filter((r) => (r.approxFare || 0) > 15).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Incoming Requests</h1>
              <p className="text-sm text-slate-600 mt-1">Accept or decline new ride requests</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-base px-3 py-1.5">
                <Zap className="w-4 h-4 mr-2" />
                {incomingRides.length} Request{incomingRides.length !== 1 ? "s" : ""}
              </Badge>
              
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-semibold">Total Requests</p>
                <p className="text-3xl font-bold text-slate-900">{incomingRides.length}</p>
                <p className="text-xs text-slate-500">Pending acceptance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Nearby Rides
                </p>
                <p className="text-3xl font-bold text-slate-900">{nearbyRides}</p>
                <p className="text-xs text-slate-500">Within 5 km</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  Avg Fare
                </p>
                <p className="text-3xl font-bold text-slate-900">${avgFare}</p>
                <p className="text-xs text-slate-500">Average amount</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  High Fare
                </p>
                <p className="text-3xl font-bold text-slate-900">{highFareRides}</p>
                <p className="text-xs text-slate-500">Rides $15</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        {/* <Card className="border-0 shadow-lg mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by ride ID, pickup, or dropoff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10"
                />
              </div>
              <Tabs
                value={filterType}
                onValueChange={(value: any) => setFilterType(value)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="nearby" className="text-xs">
                    Nearby
                  </TabsTrigger>
                  <TabsTrigger value="highfare" className="text-xs">
                    High Fare
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card> */}

        {/* Loading State - check both Redux AND API loading */}
        {incomingRequestsRedux?.isLoading || isApiLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Loading incoming requests...</p>
              <p className="text-xs text-slate-500 mt-2">This may take a few seconds</p>
            </CardContent>
          </Card>
        ) :filteredRides.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">No Requests Found</h3>
                  <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                    {incomingRides.length === 0
                      ? "There are currently no incoming ride requests. Please check back later."
                      : "No rides match your search filters. Try adjusting your search."}
                  </p>
                  {incomingRides.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        // setSearchQuery("");
                        // setFilterType("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )  : 
         incomingRequestsRedux?.error || apiError ? (
          <Card className="border-0 shadow-lg bg-rose-50 border border-rose-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-700">Failed to load requests</p>
                  <p className="text-sm text-rose-600 mt-1">
                    {incomingRequestsRedux?.error || "Please check your connection and try again."}
                  </p>
                 
                </div>
              </div>
            </CardContent>
          </Card>
        ): (
          <div className="space-y-4">
            {filteredRides.map((ride, index) => {
              const pickup =
                ride.pickupAddress ||
                (ride.pickupLocation?.coordinates
                  ? formatCoords(ride.pickupLocation.coordinates)
                  : "Pickup");
              const dropoff =
                ride.dropOffAddress ||
                (ride.dropOffLocation?.coordinates
                  ? formatCoords(ride.dropOffLocation.coordinates)
                  : "Dropoff");
              const etaMin = typeof ride.estimatedDuration === "number" ? ride.estimatedDuration : undefined;
              const distanceKm = typeof ride.distance === "number" ? ride.distance : undefined;
              const fare = typeof ride.approxFare === "number" ? ride.approxFare : undefined;

              const isThisRideAccepting = acceptingRideId === ride._id;
              const isThisRideRejecting = rejectingRideId === ride._id;

              return (
                <Card
                  key={ride._id}
                  className={`border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative ${
                    isAcceptDisabled ? "opacity-60" : ""
                  }`}
                >
                  {/* Card Number Badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                    #{index + 1}
                  </div>

                  <CardContent className="p-6 pt-10">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Route Section */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-semibold text-slate-900 text-sm">Route Details</h3>
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2 pt-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg" />
                            <div className="w-0.5 h-16 bg-gradient-to-b from-blue-300 to-rose-300" />
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg" />
                          </div>
                          <div className="flex-1 space-y-5">
                            {/* Pickup */}
                            <div>
                              <p className="text-xs text-slate-500 font-bold mb-1.5">PICKUP LOCATION</p>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 text-sm leading-tight">{pickup}</p>
                                  <p className="text-xs text-slate-500 mt-1">Drop here to pickup passenger</p>
                                </div>
                              </div>
                            </div>

                            {/* Dropoff */}
                            <div>
                              <p className="text-xs text-slate-500 font-bold mb-1.5">DROPOFF LOCATION</p>
                              <div className="flex items-start gap-2">
                                <MapPinned className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 text-sm leading-tight">{dropoff}</p>
                                  <p className="text-xs text-slate-500 mt-1">Final destination</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trip Stats Section */}
                      <div className="lg:col-span-1 space-y-3">
                        <h3 className="font-semibold text-slate-900 text-sm">Trip Info</h3>
                        {typeof etaMin === "number" && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-xs text-slate-600 font-semibold">ETA</span>
                              </div>
                              <span className="font-bold text-blue-600">{etaMin}m</span>
                            </div>
                          </div>
                        )}
                        {typeof distanceKm === "number" && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                <span className="text-xs text-slate-600 font-semibold">DISTANCE</span>
                              </div>
                              <span className="font-bold text-purple-600">{distanceKm.toFixed(1)}km</span>
                            </div>
                          </div>
                        )}
                        {typeof fare === "number" && (
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs text-slate-600 font-semibold">FARE</span>
                              </div>
                              <span className="font-bold text-emerald-600">${fare.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Passenger & Action Section */}
                      <div className="lg:col-span-1 flex flex-col gap-3">
                        <h3 className="font-semibold text-slate-900 text-sm">Actions</h3>

                        <Button
                          className="w-full gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={() => acceptRequest(ride)}
                          disabled={isAcceptDisabled}
                          title={
                            acceptingRideId
                              ? "Another ride is being accepted..."
                              : activeRide
                              ? "Complete your active ride first"
                              : undefined
                          }
                        >
                          {isThisRideAccepting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Accept
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full gap-2 h-10"
                          onClick={() => declineRequest(ride._id)}
                          disabled={isRejecting || isAcceptDisabled}
                        >
                          {isThisRideRejecting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Declining...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Decline
                            </>
                          )}
                        </Button>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs gap-1 hover:bg-blue-50"
                            onClick={() => alert("Call passenger...")}
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs gap-1 hover:bg-blue-50"
                            onClick={() => alert("Message passenger...")}
                          >
                            <MessageSquare className="w-3 h-3" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Ride ID Footer */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <p className="text-xs text-slate-500">Ride ID: {ride._id}</p>
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        {ride.status || "PENDING"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingRequests;