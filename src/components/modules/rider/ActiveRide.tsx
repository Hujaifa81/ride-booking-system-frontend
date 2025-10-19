/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Car,
  X,
  MapPin,
  Clock,
  Phone,
  User,
  Navigation,
  Star,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { rideApi, useActiveRideQuery, useCancelRideMutation } from "@/redux/features/ride/ride.api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import type { Ride, RideStatus } from "@/types";
import { getStatusColor, getStatusIcon, getStatusText } from "@/utils/status";
import { RideMap } from "@/components/shared/RideMap";
import { reverseGeocode } from "@/utils/reverseGeocode";



export default function ActiveRide() {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  // Enhanced query options with proper cache management
  const { data: rideResponse, isLoading, refetch, error } = useActiveRideQuery(undefined, {
    refetchOnMountOrArgChange: 30,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: false,
  });
  const [cancelRide, { isLoading: cancelling }] = useCancelRideMutation();

  const [liveRide, setLiveRide] = useState<Ride | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [driverSearchTime] = useState<number>(120);
  const [currentDriverAttempt] = useState<number>(1);
  const socketRef = useRef<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  // Component mounted state to prevent actions after unmount
  const [isMounted, setIsMounted] = useState(true);
  const [hasHandledCancellation, setHasHandledCancellation] = useState(false);
  const [showCancellationUI, setShowCancellationUI] = useState<RideStatus | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [dropoffAddress, setDropoffAddress] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState<boolean>(false);
  const [showCompletedUI, setShowCompletedUI] = useState(false);

  // State for cancellation reason
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Extract ride data from response
  const ride = rideResponse?.data;

  // Track component mount state
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Clear any cached cancelled rides on mount
  useEffect(() => {
    dispatch(rideApi.util.invalidateTags(['RIDE']));
    setHasHandledCancellation(false);
    setRedirecting(false);
    setLiveRide(null);
    setShowCancellationUI(null);

    const timer = setTimeout(() => {
      if (isMounted) {
        refetch();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [dispatch, refetch, isMounted]);


  // Only set ride data if it's valid and not cancelled
  useEffect(() => {
    if (ride && !ride.status.startsWith('CANCELLED') && isMounted) {
      console.log('Setting initial ride data:', ride);
      setLiveRide(ride);
    } else if (ride && ride.status.startsWith('CANCELLED')) {
      console.log('Received cancelled ride from API, not setting to local state');
      setLiveRide(null);
    }
  }, [ride, isMounted]);

  // cancellation redirect handling for all cancellation types
  useEffect(() => {
    const displayRide = liveRide || ride;

    if (!isMounted || hasHandledCancellation || redirecting) return;

    if (displayRide && displayRide.status.startsWith('CANCELLED')) {
      console.log('Detected cancelled ride, handling redirect:', displayRide.status);
      setHasHandledCancellation(true);

      // Show custom UI for all cancellation types
      setShowCancellationUI(displayRide.status);

      // DO NOT auto-redirect for rider-initiated cancellation — let user use the button
      if (displayRide.status === 'CANCELLED_BY_RIDER') {
        return;
      }

      // Different delays based on cancellation type
      const delay = displayRide.status === 'CANCELLED_FOR_PENDING_TIME_OVER' ? 5000 : 4000;

      const cancellationTimer = setTimeout(() => {
        if (!isMounted) return;

        console.log('Starting redirect process...');
        setRedirecting(true);
        setShowCancellationUI(null);
        setLiveRide(null);

        setTimeout(() => {
          if (isMounted) {
            navigate("/rider/ride-request", { replace: true });
          }
        }, 2500);
      }, delay);

      return () => clearTimeout(cancellationTimer);
    }
  }, [liveRide, ride, redirecting, hasHandledCancellation, navigate, isMounted]);

  // Handle ride completion
  useEffect(() => {
    const displayRide = liveRide || ride;

    if (!isMounted || redirecting) return;

    if (displayRide && displayRide.status === 'COMPLETED') {
      console.log('Ride completed, showing completion UI');
      setShowCompletedUI(true);
    }
  }, [liveRide, ride, redirecting, isMounted]);

  // Fetch addresses when ride data loads
  useEffect(() => {
    const fetchAddresses = async () => {
      const displayRide = liveRide || ride;
      if (!displayRide || addressLoading || !isMounted) return;

      if (displayRide.pickupAddress && displayRide.dropOffAddress) {
        setPickupAddress(displayRide.pickupAddress);
        setDropoffAddress(displayRide.dropOffAddress);
        return;
      }

      setAddressLoading(true);

      try {
        if (!pickupAddress && !displayRide.pickupAddress) {
          const pickupAddr = await reverseGeocode(
            displayRide.pickupLocation.coordinates[1],
            displayRide.pickupLocation.coordinates[0]
          );
          if (isMounted) setPickupAddress(pickupAddr);
        }

        if (!dropoffAddress && !displayRide.dropOffAddress) {
          const dropoffAddr = await reverseGeocode(
            displayRide.dropOffLocation.coordinates[1],
            displayRide.dropOffLocation.coordinates[0]
          );
          if (isMounted) setDropoffAddress(dropoffAddr);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        if (isMounted) toast.error('Failed to load addresses');
      } finally {
        if (isMounted) setAddressLoading(false);
      }
    };

    fetchAddresses();
  }, [liveRide, ride, pickupAddress, dropoffAddress, addressLoading, isMounted]);

  // Calculate time remaining for ride timeout
  const calculateTimeRemaining = (rideData: Ride): number => {
    if (!rideData.createdAt || !['REQUESTED', 'PENDING'].includes(rideData.status)) {
      return 0;
    }

    const createdTime = new Date(rideData.createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000);
    const timeoutSeconds = 10 * 60; // 10 minutes timeout

    return Math.max(0, timeoutSeconds - elapsedSeconds);
  };

  // Update time remaining
  useEffect(() => {
    const displayRide = liveRide || ride;
    if (!displayRide || !isMounted) return;

    const updateTime = () => {
      if (isMounted) {
        setTimeRemaining(calculateTimeRemaining(displayRide));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [liveRide, ride, isMounted]);

  // Socket.IO connection with backend timeout handling
  useEffect(() => {
    if (!ride?._id || !isMounted) return;

    if (ride.status.startsWith('CANCELLED')) {
      console.log('Not setting up socket for cancelled ride');
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // Connection status handlers
    socket?.on('connect', () => {
      if (!isMounted) return;
      console.log('✅ Socket connected');
      setConnectionStatus('connected');
      socket.emit("join_ride_room", { rideId: ride._id });
      toast.success('Connected to real-time updates');
    });

    socket?.on('disconnect', () => {
      if (!isMounted) return;
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
      toast.warning('Disconnected from real-time updates');
    });

    socket?.on('connect_error', (error: any) => {
      if (!isMounted) return;
      console.error('⚠️ Socket connection error:', error);
      setConnectionStatus('disconnected');
      toast.error('Connection error. Please refresh the page.');
    });

    if (socket?.connected) {
      setConnectionStatus('connected');
      socket.emit("join_ride_room", { rideId: ride._id });
    }

    // Enhanced ride event listeners for backend cancellation handling
    socket?.on("ride_update", (payload: Partial<Ride>) => {
      if (!isMounted || hasHandledCancellation) return;

      console.log('📡 Ride update received:', payload);

      setLiveRide((prev) => {
        if (!prev || !isMounted) return prev;
        const updatedRide = { ...prev, ...payload };

        if (updatedRide.status?.startsWith('CANCELLED')) {
          console.log('Ride cancelled via socket update');
          dispatch(rideApi.util.invalidateTags(['RIDE']));

          // Don't show toast for any cancellation, let the UI handle messaging
          if (updatedRide.status !== 'CANCELLED_FOR_PENDING_TIME_OVER') {
            toast.error(`Ride ${getStatusText(updatedRide.status)}`);
          }

          return updatedRide;
        } else if (updatedRide.status === 'COMPLETED') {
          console.log('Ride completed via socket update');
          dispatch(rideApi.util.invalidateTags(['RIDE']));
          toast.success('Ride completed successfully!');
          return updatedRide;
        } else {
          dispatch(rideApi.util.updateQueryData('activeRide', undefined, (draft) => {
            if (draft?.data) {
              Object.assign(draft.data, payload);
            }
          }));

          toast.info('Ride information updated');
          return updatedRide;
        }
      });
    });

    socket?.on("driver_location_update", ({ location }: {
      location: [number, number];
      timestamp: string
    }) => {
      if (!isMounted || hasHandledCancellation) return;

      console.log('📍 Driver location update:', location);

      setLiveRide((prev) => {
        if (!prev || !prev.driver || !isMounted) return prev;
        const updatedRide = {
          ...prev,
          driver: {
            ...prev.driver,
            location: {
              type: "Point" as const,
              coordinates: location
            }
          }
        };

        dispatch(rideApi.util.updateQueryData('activeRide', undefined, (draft) => {
          if (draft?.data?.driver) {
            draft.data.driver.location = {
              type: "Point",
              coordinates: location
            };
          }
        }));

        return updatedRide;
      });
    });

    // Handle backend cancellation via status change
    socket?.on("ride_status_change", ({
      status,
      updatedBy,
      timestamp
    }: {
      status: RideStatus;
      updatedBy: string;
      timestamp: string
    }) => {
      if (!isMounted || hasHandledCancellation) return;

      console.log('🔄 Status change:', status, 'by:', updatedBy);

      setLiveRide((prev) => {
        if (!prev || !isMounted) return prev;
        const updatedRide = {
          ...prev,
          status,
          statusHistory: [
            ...prev.statusHistory,
            { status, timestamp, by: updatedBy }
          ]
        };

        if (status.startsWith('CANCELLED')) {
          dispatch(rideApi.util.invalidateTags(['RIDE']));

          // Don't show toast for cancellations, let the custom UI handle messaging
          if (status !== 'CANCELLED_FOR_PENDING_TIME_OVER') {
            toast.error(`Ride ${getStatusText(status)}`);
          }
        } else if (status === 'COMPLETED') {
          dispatch(rideApi.util.invalidateTags(['RIDE']));
          toast.success('Ride completed successfully!');
        } else {
          dispatch(rideApi.util.updateQueryData('activeRide', undefined, (draft) => {
            if (draft?.data) {
              draft.data.status = status;
              draft.data.statusHistory = [
                ...draft.data.statusHistory,
                { status, timestamp, by: updatedBy }
              ];
            }
          }));

          toast.success(`Ride Status Updated to ${getStatusText(status)}`);
        }

        return updatedRide;
      });
    });

    socket?.on('notification', (notification: any) => {
      if (!isMounted) return;
      console.log('🔔 Notification received:', notification);
      toast.info(notification.message);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket?.emit("leave_ride_room", { rideId: ride._id });
      socket?.off("ride_update");
      socket?.off("driver_location_update");
      socket?.off("ride_status_change");
      socket?.off("driver_assigned");
      socket?.off("notification");
      socket?.off('connect');
      socket?.off('disconnect');
      socket?.off('connect_error');
    };
  }, [ride?._id, dispatch, isMounted, hasHandledCancellation]);

  const handleCancel = async () => {
    if (!ride?._id || !isMounted) return;

    const reason = cancellationReason.trim() || "Cancelled by user";

    try {
      await cancelRide({
        rideId: ride._id,
        canceledReason: reason
      }).unwrap();

      if (!isMounted) return;

      toast.success("Ride cancelled successfully");

      setHasHandledCancellation(true);
      setLiveRide(null);
      dispatch(rideApi.util.invalidateTags(['RIDE']));

      // SHOW rider-cancel UI and DO NOT auto-redirect
      setShowCancellationUI('CANCELLED_BY_RIDER');

    } catch (err: any) {
      console.error('Cancellation error:', err);
      if (isMounted) {
        toast.error(err?.data?.message || "Failed to cancel ride");
      }
    }
  };

  const handleCallDriver = () => {
    if (isMounted) toast.info("Calling driver...");
  };

  const handleMessageDriver = () => {
    if (isMounted) toast.info("Opening chat with driver...");
  };

  // Map center calculation
  const center = useMemo((): [number, number] => {
    const displayRide = liveRide || ride;
    if (!displayRide) return [23.8103, 90.4125];

    return [
      displayRide.pickupLocation.coordinates[1],
      displayRide.pickupLocation.coordinates[0],
    ];
  }, [liveRide, ride]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCancellationUIConfig = (status: RideStatus, cancelReason?: string) => {
    switch (status) {
      case 'CANCELLED_FOR_PENDING_TIME_OVER':
        return {
          icon: Clock,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconBg: 'bg-orange-100',
          title: 'No Driver Found',
          message: "We couldn't find a driver within the time limit. Your ride has been automatically cancelled.",
          reasons: [
            'High demand in your area - all nearby drivers were busy',
            'Peak hours when driver availability is limited',
            'Weather or traffic conditions affecting driver availability'
          ],
          showCustomReason: false
        };
      case 'CANCELLED_BY_DRIVER':
        return {
          icon: User,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-100',
          title: 'Driver Cancelled',
          message: 'Your driver has cancelled the ride. We apologize for the inconvenience.',
          reasons: cancelReason ? [cancelReason] : [
            'Driver may have encountered an emergency',
            'Vehicle issue or breakdown',
            'Unable to reach pickup location'
          ],
          showCustomReason: !!cancelReason
        };
      case 'CANCELLED_BY_ADMIN':
        return {
          icon: AlertCircle,
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconBg: 'bg-purple-100',
          title: 'Cancelled by Admin',
          message: 'This ride has been cancelled by our support team.',
          reasons: cancelReason ? [cancelReason] : [
            'Policy violation detected',
            'Safety concerns',
            'System maintenance or technical issues'
          ],
          showCustomReason: !!cancelReason
        };
      case 'CANCELLED_BY_RIDER':
        return {
          icon: X,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconBg: 'bg-gray-100',
          title: 'Ride Cancelled',
          message: 'You have cancelled this ride.',
          reasons: cancelReason ? [cancelReason] : ['No reason provided'],
          showCustomReason: !!cancelReason
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconBg: 'bg-gray-100',
          title: 'Ride Cancelled',
          message: 'This ride has been cancelled.',
          reasons: cancelReason ? [cancelReason] : ['Cancellation reason not available'],
          showCustomReason: !!cancelReason
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your ride details...</p>
        </div>
      </div>
    );
  }
  // Show completed ride UI
  if (showCompletedUI) {
    const displayRide = liveRide || ride;

    if (!displayRide) return null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-white shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                {/* Success Icon */}
                <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-green-800 mb-2">
                  Trip Completed!
                </h1>

                <p className="text-lg text-gray-600 mb-8">
                  Thank you for riding with us
                </p>

                {/* Trip Summary Card */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-4 text-lg">Trip Summary</h3>

                  <div className="space-y-4">
                    {/* Route */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <div className="w-0.5 h-8 bg-gray-300"></div>
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Pickup</p>
                            <p className="text-sm font-medium text-gray-800">
                              {displayRide.pickupAddress || pickupAddress || 'Pickup Location'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Drop-off</p>
                            <p className="text-sm font-medium text-gray-800">
                              {displayRide.dropOffAddress || dropoffAddress || 'Drop-off Location'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {displayRide.distance && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Distance</p>
                          <p className="text-lg font-bold text-gray-800">{displayRide.distance} km</p>
                        </div>
                      )}
                      {displayRide.estimatedDuration && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Duration</p>
                          <p className="text-lg font-bold text-gray-800">{displayRide.estimatedDuration} min</p>
                        </div>
                      )}
                    </div>

                    {/* Fare */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Total Fare</span>
                        <span className="text-2xl font-bold text-green-600">
                          ৳{displayRide.approxFare?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                {displayRide.driver && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Your Driver</h3>
                    <div className="flex items-center justify-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-green-200">
                        <AvatarFallback className="bg-green-100 text-green-700">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">Driver</p>
                        <p className="text-sm text-gray-600">License: {displayRide.driver.licenseNumber}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{displayRide.driver.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating Section */}
                {!displayRide.rating && (
                  <div className="bg-blue-50 rounded-lg p-5 mb-6 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center justify-center gap-2">
                      <Star className="w-5 h-5" />
                      Rate Your Experience
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Help us improve by rating your ride
                    </p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className="hover:scale-110 transition-transform"
                          onClick={() => {
                            // TODO: Implement rating functionality
                            toast.info(`Rated ${star} stars - Feature coming soon!`);
                          }}
                        >
                          <Star className="w-8 h-8 text-gray-300 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Tap a star to rate</p>
                  </div>
                )}

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Trip Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ride ID:</span>
                      <span className="font-mono text-xs text-gray-800">{displayRide._id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Started:</span>
                      <span className="text-gray-800">{new Date(displayRide.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="text-gray-800">{new Date(displayRide.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setShowCompletedUI(false);
                      navigate("/rider/ride-request", { replace: true });
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                    size="lg"
                  >
                    <Car className="w-5 h-5 mr-2" />
                    Book Another Ride
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCompletedUI(false);
                        navigate("/rider/ride-history", { replace: true });
                      }}
                      className="border-gray-300"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      View History
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCompletedUI(false);
                        navigate("/rider/dashboard", { replace: true });
                      }}
                      className="border-gray-300"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>

                {/* Receipt Option */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      toast.info("Receipt download feature coming soon!");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Download Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thank You Message */}
          <div className="text-center mt-6 text-gray-500 text-sm">
            <p>Thank you for choosing our service!</p>
            <p className="mt-1">Have a great day 🚗</p>
          </div>
        </div>
      </div>
    );
  }

  // UPDATED: Show cancellation UI for all cancellation types with reason support
  if (showCancellationUI) {
    const displayRide = liveRide || ride;

    // FIXED: Extract cancellation reason from the ride object, not statusHistory
    const cancelReasonFromRide = displayRide?.canceledReason || displayRide?.cancellationReason || '';

    const finalCancelReason = cancellationReason || cancelReasonFromRide || '';

    const config = getCancellationUIConfig(showCancellationUI, finalCancelReason);
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className={`${config.borderColor} ${config.bgColor}`}>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 ${config.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-10 h-10 ${config.iconColor}`} />
                </div>

                {/* Title */}
                <h1 className={`text-2xl font-bold mb-4 ${config.iconColor.replace('-600', '-800')}`}>
                  {config.title}
                </h1>

                {/* Message */}
                <p className={`text-lg mb-6 ${config.iconColor.replace('-600', '-700')}`}>
                  {config.message}
                </p>

                {/* Ride Details Summary */}
                {displayRide && (
                  <div className={`bg-white rounded-lg p-4 mb-6 border ${config.borderColor}`}>
                    <h3 className="font-semibold text-gray-800 mb-3">Ride Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Ride ID:</span>
                        <span className="font-mono text-xs">{displayRide._id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Requested at:</span>
                        <span>{new Date(displayRide.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Estimated Fare:</span>
                        <span className="font-semibold">৳{displayRide.approxFare?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <span className="font-semibold text-red-600">{getStatusText(showCancellationUI)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reasons */}
                <div className={`bg-white rounded-lg p-4 mb-6 border ${config.borderColor}`}>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {config.showCustomReason
                      ? 'Cancellation Reason:'
                      : showCancellationUI === 'CANCELLED_BY_RIDER'
                        ? 'Cancellation Reason:'
                        : 'Why did this happen?'}
                  </h3>

                  {config.showCustomReason ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 italic">"{config.reasons[0]}"</p>
                    </div>
                  ) : showCancellationUI === 'CANCELLED_BY_RIDER' && !finalCancelReason ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 italic">{config.reasons[0]}</p>
                    </div>
                  ) : showCancellationUI === 'CANCELLED_BY_RIDER' && finalCancelReason ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 italic">"{finalCancelReason}"</p>
                    </div>
                  ) : (
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      {config.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 ${config.iconColor.replace('text-', 'bg-').replace('-600', '-500')} rounded-full mt-2 flex-shrink-0`}></span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Suggestions - only for non-rider cancellations */}
                {showCancellationUI !== 'CANCELLED_BY_RIDER' && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-3">What can you do next?</h3>
                    <ul className="text-sm text-blue-700 space-y-2 text-left">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Try booking again - more drivers may be available now</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Consider waiting a few minutes before trying again</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Contact support if you need assistance</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center mb-6">
                  <Button
                    onClick={() => {
                      setShowCancellationUI(null);
                      setCancellationReason('');
                      setRedirecting(true);
                      navigate("/rider/ride-request", { replace: true });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Book New Ride
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancellationUI(null);
                      setCancellationReason('');
                      setRedirecting(true);
                      navigate("/rider/dashboard", { replace: true });
                    }}
                    className="px-6"
                  >
                    Go to Dashboard
                  </Button>
                </div>

                {/* Support */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Need help? Contact our support team at{" "}
                    <a href="tel:+8801XXXXXXX" className="text-blue-600 hover:underline">
                      +880-1XXXXXXX
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Redirecting after cancellation
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Ride Cancelled
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecting you to book a new ride...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // error state handling
  if (error) {
    const errorMessage = (error as any)?.data?.message || "Failed to load ride details";
    const isNoActiveRide = errorMessage.toLowerCase().includes('no active ride') ||
      errorMessage.toLowerCase().includes('not found') ||
      (error as any)?.status === 404;

    if (isNoActiveRide) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Ride</h2>
            <p className="text-gray-600 mb-4">You don't have any active rides at the moment.</p>
            <Button onClick={() => navigate("/rider/ride-request", { replace: true })}>
              Book a New Ride
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Ride</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <div className="space-x-2">
            <Button onClick={() => {
              dispatch(rideApi.util.invalidateTags(['RIDE']));
              refetch();
            }}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate("/rider/ride-request", { replace: true })}>
              Book New Ride
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Better guard for no active ride
  if (!ride && !liveRide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Ride</h2>
          <p className="text-gray-600 mb-4">You don't have any active rides at the moment.</p>
          <Button onClick={() => navigate("/rider/ride-request", { replace: true })}>
            Book a New Ride
          </Button>
        </div>
      </div>
    );
  }

  const displayRide = liveRide || ride;

  // Additional guard for cancelled rides that might slip through
  if (!displayRide || displayRide.status.startsWith('CANCELLED')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Ride</h2>
          <p className="text-gray-600 mb-4">You don't have any active rides at the moment.</p>
          <Button onClick={() => navigate("/rider/ride-request", { replace: true })}>
            Book a New Ride
          </Button>
        </div>
      </div>
    );
  }

  const isSearchingForDriver = displayRide.status === 'REQUESTED';
  const isCancelled = displayRide.status.startsWith('CANCELLED');
  const getDisplayStatus = () => {
    return isSearchingForDriver ? 'searching' : displayRide.status;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Active Ride</h1>
              <p className="text-gray-600">Ride ID: {displayRide._id}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
              </div>

              {/* Status Badge */}
              <Badge className={`text-white ${getStatusColor(getDisplayStatus())}`}>
                {getStatusIcon(getDisplayStatus())}
                <span className="ml-1">{getStatusText(getDisplayStatus())}</span>
              </Badge>
            </div>
          </div>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Ride Progress
                </CardTitle>
                {(displayRide.status === 'REQUESTED' || displayRide.status === 'PENDING') && !isCancelled && timeRemaining > 0 && (
                  <div className="text-sm text-gray-600">
                    Time remaining: <span className="font-mono font-bold text-red-600">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {isSearchingForDriver && !isCancelled && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Contacting driver #{currentDriverAttempt}</span>
                    <span>{formatTime(driverSearchTime)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${((120 - driverSearchTime) / 120) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {[
                  { key: 'REQUESTED', label: 'Ride Requested' },
                  { key: 'searching', label: 'Searching for Driver' },
                  { key: 'ACCEPTED', label: 'Driver Assigned' },
                  { key: 'GOING_TO_PICK_UP', label: 'Driver on the Way' },
                  { key: 'DRIVER_ARRIVED', label: 'Driver Arrived' },
                  { key: 'IN_TRANSIT', label: 'Trip in Progress' },
                  { key: 'REACHED_DESTINATION', label: 'Reached Destination' },
                  { key: 'COMPLETED', label: 'Trip Completed' }
                ].map((step) => {
                  let isActive = false;
                  let isCompleted = false;

                  if (step.key === 'REQUESTED') {
                    isCompleted = true;
                  } else if (step.key === 'searching') {
                    isActive = displayRide.status === 'REQUESTED' || displayRide.status === 'PENDING';
                    isCompleted = !['REQUESTED', 'PENDING'].includes(displayRide.status) && !isCancelled;
                  } else {
                    const statusOrder = ['ACCEPTED', 'GOING_TO_PICK_UP', 'DRIVER_ARRIVED', 'IN_TRANSIT', 'REACHED_DESTINATION', 'COMPLETED'];
                    const stepIndex = statusOrder.indexOf(step.key as RideStatus);
                    const currentIndex = statusOrder.indexOf(displayRide.status);

                    isActive = displayRide.status === step.key;
                    isCompleted = currentIndex > stepIndex;
                  }

                  return (
                    <div key={step.key} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? getStatusColor(step.key as RideStatus | 'searching') + ' text-white' :
                        isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                        {getStatusIcon(step.key as RideStatus | 'searching')}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                          {step.label}
                        </p>
                        {isActive && step.key === 'searching' && (
                          <p className="text-sm text-gray-500">
                            Attempting to contact driver #{currentDriverAttempt}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Driver Information */}
          {displayRide.driver && displayRide.status !== "REQUESTED" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Your Driver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-blue-200">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <h4 className="font-semibold text-lg">Driver</h4>
                      <p className="text-sm text-gray-600">License: {displayRide.driver.licenseNumber}</p>

                      {displayRide.vehicle && (
                        <p className="text-sm text-gray-600">
                          {displayRide.vehicle.model}
                        </p>
                      )}

                      {displayRide.vehicle?.licensePlate && (
                        <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {displayRide.vehicle.licensePlate}
                        </p>
                      )}

                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{displayRide.driver.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={handleCallDriver}>
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMessageDriver}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>

                {(displayRide.status === 'GOING_TO_PICK_UP') && (
                  <div className="bg-blue-100 p-3 rounded-lg mt-4">
                    <p className="text-sm text-blue-800">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Driver is on the way to pickup location
                    </p>
                  </div>
                )}

                {displayRide.status === 'DRIVER_ARRIVED' && (
                  <div className="bg-green-100 p-3 rounded-lg mt-4">
                    <p className="text-sm text-green-800">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Your driver has arrived at the pickup location
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Live Map
                {displayRide.driver?.location && displayRide.status !== 'REQUESTED' && displayRide.status !== 'PENDING' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Driver location visible
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <RideMap displayRide={displayRide} center={center} />
              </div>
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Pickup</span>
                  </div>
                  <div className="min-h-[2.5rem]">
                    {addressLoading && !pickupAddress && !displayRide.pickupAddress ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Loading address...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {displayRide.pickupAddress || pickupAddress || `${displayRide.pickupLocation.coordinates[1].toFixed(4)}, ${displayRide.pickupLocation.coordinates[0].toFixed(4)}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Drop-off</span>
                  </div>
                  <div className="min-h-[2.5rem]">
                    {addressLoading && !dropoffAddress && !displayRide.dropOffAddress ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Loading address...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {displayRide.dropOffAddress || dropoffAddress || `${displayRide.dropOffLocation.coordinates[1].toFixed(4)}, ${displayRide.dropOffLocation.coordinates[0].toFixed(4)}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="font-medium">Estimated Fare</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ৳{displayRide.approxFare.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span> {new Date(displayRide.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {new Date(displayRide.updatedAt).toLocaleString()}
                </div>
                {displayRide.distance && (
                  <div>
                    <span className="font-medium">Distance:</span> {displayRide.distance} km
                  </div>
                )}
                {displayRide.estimatedDuration && (
                  <div>
                    <span className="font-medium">Duration:</span> {displayRide.estimatedDuration} min
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild className="flex-1">
                    <div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            disabled={cancelling || !(displayRide.status === "REQUESTED" || displayRide.status === "PENDING")}
                            className="w-full"
                            size="lg"
                          >
                            {cancelling ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel Ride
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Ride</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this ride? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2 py-4">
                            <Label htmlFor="cancellation-reason">
                              Reason for cancellation (optional)
                            </Label>
                            <Input
                              id="cancellation-reason"
                              placeholder="e.g., Change of plans, emergency, etc."
                              value={cancellationReason}
                              onChange={(e) => setCancellationReason(e.target.value)}
                              maxLength={200}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">
                              {cancellationReason.length}/200 characters
                            </p>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setCancellationReason('')}
                            >
                              Keep Ride
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancel}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={cancelling}
                            >
                              {cancelling ? (
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
                  </TooltipTrigger>
                  {!(displayRide.status === "REQUESTED" || displayRide.status === "PENDING") && (
                    <TooltipContent>
                      <p>You cannot cancel ride after accepted</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                <Button variant="outline" onClick={() => {
                  dispatch(rideApi.util.invalidateTags(['RIDE']));
                  refetch();
                }}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Emergency Support</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Need help? Call our 24/7 support: +880-1XXXXXXX
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}