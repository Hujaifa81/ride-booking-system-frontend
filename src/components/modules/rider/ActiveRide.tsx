/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
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
import { useActiveRideQuery, useCancelRideMutation } from "@/redux/features/ride/ride.api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Import CSS at the top level
import "leaflet/dist/leaflet.css";


// Map component that handles Leaflet initialization
const RideMap = ({ displayRide, center }: {
  displayRide: any;
  center: [number, number];
}) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>({});
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    const loadMapComponents = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Import Leaflet
        const L = await import("leaflet");

        // Import React Leaflet components
        const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import("react-leaflet");

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        setLeaflet(L);
        setMapComponents({
          MapContainer,
          TileLayer,
          Marker,
          Popup,
          Polyline,
        });
        setIsMapReady(true);
      } catch (error) {
        console.error("Failed to load map components:", error);
        toast.error("Failed to load map. Please refresh the page.");
      }
    };

    loadMapComponents();
  }, []);

  if (!isMapReady || !mapComponents.MapContainer || !leaflet) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Create custom icons
  const createIcon = (color: string) => new leaflet.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const pickupIcon = createIcon('green');
  const dropIcon = createIcon('red');
  const driverIcon = createIcon('orange');

  const { MapContainer, TileLayer, Marker, Popup, Polyline } = mapComponents;

  // Check if driver marker should be shown
  const shouldShowDriverMarker = displayRide?.driver?.location &&
    displayRide?.status !== 'REQUESTED' &&
    displayRide?.status !== 'PENDING';

  console.log('Driver marker check:', {
    shouldShow: shouldShowDriverMarker,
    hasLocation: !!displayRide?.driver?.location,
    status: displayRide?.status,
    coordinates: displayRide?.driver?.location?.coordinates
  });

  return (
    <div className="h-[400px] w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Route */}
        {displayRide.route && displayRide.route.length > 0 && (
          <Polyline
            positions={displayRide.route.map((coord: [number, number]) => [coord[1], coord[0]])}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Pickup Marker */}
        {displayRide.pickupLocation && (
          <Marker
            position={[
              displayRide.pickupLocation.coordinates[1], // lat
              displayRide.pickupLocation.coordinates[0]  // lng
            ]}
            icon={pickupIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-green-700">Pickup Location</div>
                <div className="text-sm text-gray-600">
                  {displayRide.pickupAddress || "Pickup Location"}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drop-off Marker */}
        {displayRide.dropOffLocation && (
          <Marker
            position={[
              displayRide.dropOffLocation.coordinates[1], // lat
              displayRide.dropOffLocation.coordinates[0]  // lng
            ]}
            icon={dropIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-red-700">Drop-off Location</div>
                <div className="text-sm text-gray-600">
                  {displayRide.dropOffAddress || "Drop-off Location"}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver Marker - Show driver's location from database when ride is accepted */}
        {shouldShowDriverMarker && (
          <Marker
            position={[
              displayRide.driver.location.coordinates[1], // lat
              displayRide.driver.location.coordinates[0], // lng
            ]}
            icon={driverIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-orange-700">Your Driver</div>
                <div className="text-sm text-gray-600">Current Location</div>
                {displayRide.vehicle?.licensePlate && (
                  <div className="text-xs text-gray-500 mt-1">
                    {displayRide.vehicle.licensePlate}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {displayRide.driver.location.coordinates[1].toFixed(6)}, {displayRide.driver.location.coordinates[0].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

// Backend statuses matching your enum
type RideStatus =
  | 'REQUESTED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'GOING_TO_PICK_UP'
  | 'DRIVER_ARRIVED'
  | 'IN_TRANSIT'
  | 'REACHED_DESTINATION'
  | 'COMPLETED'
  | 'CANCELLED_BY_RIDER'
  | 'CANCELLED_BY_DRIVER'
  | 'CANCELLED_BY_ADMIN'
  | 'CANCELLED_FOR_PENDING_TIME_OVER';

// Interfaces matching your API response
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isActive: string;
}

interface Driver {
  _id: string;
  user: string;
  licenseNumber: string;
  rating: number;
  status: string;
  approved: boolean;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  activeRide: string;
  earnings: number;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Vehicle {
  licensePlate: string;
  model: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StatusHistory {
  status: RideStatus;
  timestamp: string;
  by: string;
}

interface Ride {
  _id: string;
  pickupLocation: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  dropOffLocation: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  approxFare: number;
  user: User;
  driver?: Driver;
  vehicle?: Vehicle;
  status: RideStatus;
  statusHistory: StatusHistory[];
  rejectedDrivers: string[];
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  // Additional fields for UI
  pickupAddress?: string;
  dropOffAddress?: string;
  estimatedDuration?: number;
  distance?: number;
  route?: [number, number][];
}

// Status color mapping
const getStatusColor = (status: RideStatus | 'searching'): string => {
  switch (status) {
    case 'REQUESTED': return 'bg-blue-500';
    case 'searching': return 'bg-yellow-500';
    case 'PENDING': return 'bg-orange-500';
    case 'ACCEPTED': return 'bg-green-500';
    case 'GOING_TO_PICK_UP': return 'bg-green-500';
    case 'DRIVER_ARRIVED': return 'bg-green-600';
    case 'IN_TRANSIT': return 'bg-purple-500';
    case 'REACHED_DESTINATION': return 'bg-purple-600';
    case 'COMPLETED': return 'bg-green-700';
    case 'CANCELLED_BY_RIDER': return 'bg-red-500';
    case 'CANCELLED_BY_DRIVER': return 'bg-red-500';
    case 'CANCELLED_BY_ADMIN': return 'bg-red-600';
    case 'CANCELLED_FOR_PENDING_TIME_OVER': return 'bg-red-700';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: RideStatus | 'searching'): string => {
  switch (status) {
    case 'REQUESTED': return 'Searching for Driver';
    case 'searching': return 'Searching for Driver';
    case 'PENDING': return 'Searching for Driver';
    case 'ACCEPTED': return 'Driver Assigned';
    case 'GOING_TO_PICK_UP': return 'Driver on the Way';
    case 'DRIVER_ARRIVED': return 'Driver Arrived';
    case 'IN_TRANSIT': return 'Trip in Progress';
    case 'REACHED_DESTINATION': return 'Reached Destination';
    case 'COMPLETED': return 'Trip Completed';
    case 'CANCELLED_BY_RIDER': return 'Cancelled by You';
    case 'CANCELLED_BY_DRIVER': return 'Cancelled by Driver';
    case 'CANCELLED_BY_ADMIN': return 'Cancelled by Admin';
    case 'CANCELLED_FOR_PENDING_TIME_OVER': return 'Cancelled - Timeout';
    default: return 'Unknown Status';
  }
};

const getStatusIcon = (status: RideStatus | 'searching') => {
  switch (status) {
    case 'REQUESTED': return <CheckCircle className="w-4 h-4" />;
    case 'searching': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'PENDING': return <AlertCircle className="w-4 h-4" />;
    case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />;
    case 'GOING_TO_PICK_UP': return <Car className="w-4 h-4" />;
    case 'DRIVER_ARRIVED': return <MapPin className="w-4 h-4" />;
    case 'IN_TRANSIT': return <Navigation className="w-4 h-4" />;
    case 'REACHED_DESTINATION': return <MapPin className="w-4 h-4" />;
    case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
    case 'CANCELLED_BY_RIDER':
    case 'CANCELLED_BY_DRIVER':
    case 'CANCELLED_BY_ADMIN':
    case 'CANCELLED_FOR_PENDING_TIME_OVER':
      return <X className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export default function ActiveRide() {
  const { data: rideResponse, isLoading, refetch, error } = useActiveRideQuery(undefined);
  const [cancelRide, { isLoading: cancelling }] = useCancelRideMutation();

  const [liveRide, setLiveRide] = useState<Ride | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [driverSearchTime] = useState<number>(120);
  const [currentDriverAttempt] = useState<number>(1);
  const socketRef = useRef<any>(null);

  // Add these new states for addresses
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [dropoffAddress, setDropoffAddress] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState<boolean>(false);

  // Add state for cancellation reason
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Extract ride data from response
  const ride = rideResponse?.data;

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`
      );
      const data = await response.json();

      if (data && data.display_name) {
        // Format the address to show the most relevant parts
        const address = data.address || {};
        const parts = [];

        if (address.house_number) parts.push(address.house_number);
        if (address.road) parts.push(address.road);
        if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
        if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
        if (address.state) parts.push(address.state);

        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
      return 'Address not found';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unable to fetch address';
    }
  };

  // Update live ride when initial data loads
  useEffect(() => {
    if (ride) {
      setLiveRide(ride);
    }
  }, [ride]);

  // Fetch addresses when ride data loads
  useEffect(() => {
    const fetchAddresses = async () => {
      const displayRide = liveRide || ride;
      if (!displayRide || addressLoading) return;

      // If we already have addresses from the API, use them
      if (displayRide.pickupAddress && displayRide.dropOffAddress) {
        setPickupAddress(displayRide.pickupAddress);
        setDropoffAddress(displayRide.dropOffAddress);
        return;
      }

      setAddressLoading(true);

      try {
        // Fetch pickup address if not already fetched
        if (!pickupAddress && !displayRide.pickupAddress) {
          const pickupAddr = await reverseGeocode(
            displayRide.pickupLocation.coordinates[1], // lat
            displayRide.pickupLocation.coordinates[0]  // lng
          );
          setPickupAddress(pickupAddr);
        }

        // Fetch dropoff address if not already fetched
        if (!dropoffAddress && !displayRide.dropOffAddress) {
          const dropoffAddr = await reverseGeocode(
            displayRide.dropOffLocation.coordinates[1], // lat
            displayRide.dropOffLocation.coordinates[0]  // lng
          );
          setDropoffAddress(dropoffAddr);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.error('Failed to load addresses');
      } finally {
        setAddressLoading(false);
      }
    };

    fetchAddresses();
  }, [liveRide, ride, pickupAddress, dropoffAddress, addressLoading]);

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
    if (!displayRide) return;

    const updateTime = () => {
      setTimeRemaining(calculateTimeRemaining(displayRide));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [liveRide, ride]);

  // Socket.IO connection and event handling
  useEffect(() => {
    if (!ride?._id) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Connection status handlers
    socket?.on('connect', () => {
      console.log('✅ Socket connected');
      setConnectionStatus('connected');
      socket.emit("join_ride_room", { rideId: ride._id });
      toast.success('Connected to real-time updates');
    });

    socket?.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
      toast.warning('Disconnected from real-time updates');
    });

    socket?.on('connect_error', (error: any) => {
      console.error('⚠️ Socket connection error:', error);
      setConnectionStatus('disconnected');
      toast.error('Connection error. Please refresh the page.');
    });

    // Join ride room if already connected
    if (socket?.connected) {
      setConnectionStatus('connected');
      socket.emit("join_ride_room", { rideId: ride._id });
    }

    // Ride event listeners
    socket?.on("ride_update", (payload: Partial<Ride>) => {
      console.log('📡 Ride update received:', payload);
      setLiveRide((prev) => {
        if (!prev) return prev;
        return { ...prev, ...payload };
      });
      toast.info('Ride information updated');
    });

    socket?.on("driver_location_update", ({ location }: {
      location: [number, number];
      timestamp: string
    }) => {
      console.log('📍 Driver location update:', location);
      setLiveRide((prev) => {
        if (!prev || !prev.driver) return prev;
        return {
          ...prev,
          driver: {
            ...prev.driver,
            location: {
              type: "Point",
              coordinates: location
            }
          }
        };
      });
    });

    socket?.on("ride_status_change", ({
      status,
      updatedBy,
      timestamp
    }: {
      status: RideStatus;
      updatedBy: string;
      timestamp: string
    }) => {
      console.log('🔄 Status change:', status, 'by:', updatedBy);
      setLiveRide((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status,
          statusHistory: [
            ...prev.statusHistory,
            { status, timestamp, by: updatedBy }
          ]
        };
      });
      toast.success(`${status ? status.includes('CANCELLED') ? getStatusText(status) : 'Ride Status Updated to ' + getStatusText(status) : ''}`);
    });

    socket?.on('notification', (notification: any) => {
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
  }, [ride?._id]);

  // Update the handleCancel function
  const handleCancel = async () => {
    if (!ride?._id) return;

    const reason = cancellationReason.trim() || "Unknown";

    try {
      await cancelRide({
        rideId: ride._id,
        canceledReason: reason
      }).unwrap();

      toast.success("Ride cancelled successfully");
      setCancellationReason(''); // Clear the reason after successful cancellation
      setLiveRide(null);
      refetch();
    } catch (err: any) {
      console.error('Cancellation error:', err);
      toast.error(err?.data?.message || "Failed to cancel ride");
    }
  };

  const handleCallDriver = () => {
    toast.info("Calling driver...");
  };

  const handleMessageDriver = () => {
    toast.info("Opening chat with driver...");
  };

  // Map center calculation
  const center = useMemo((): [number, number] => {
    const displayRide = liveRide || ride;
    if (!displayRide) return [23.8103, 90.4125]; // Default to Dhaka

    return [
      displayRide.pickupLocation.coordinates[1], // lat
      displayRide.pickupLocation.coordinates[0], // lng
    ];
  }, [liveRide, ride]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // No active ride
  if (!ride && !liveRide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Ride</h2>
          <p className="text-gray-600 mb-4">You don't have any active rides at the moment.</p>
          <Button onClick={() => window.location.href = "/rider/ride-request"}>
            Book a New Ride
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Ride</h2>
          <p className="text-gray-600 mb-4">
            {(error as any)?.data?.message || "Failed to load ride details"}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const displayRide = liveRide || ride;
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
                    Time remaining before canceled without accepted: <span className="font-mono font-bold text-red-600">
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

              {!isCancelled && (
                <div className="space-y-4">
                  {/* Timeline steps */}
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
              )}

              {/* Cancellation message */}
              {isCancelled && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 text-red-800">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{getStatusText(displayRide.status)}</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    {displayRide.status === 'CANCELLED_BY_RIDER' && "You cancelled this ride."}
                    {displayRide.status === 'CANCELLED_BY_DRIVER' && "The driver cancelled this ride."}
                    {displayRide.status === 'CANCELLED_BY_ADMIN' && "This ride was cancelled by admin."}
                    {displayRide.status === 'CANCELLED_FOR_PENDING_TIME_OVER' && "This ride was cancelled due to timeout."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Information */}
          {displayRide.driver && !isCancelled && displayRide.status !== "REQUESTED" && (
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

                {/* Driver status indicators */}
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

                {/* Pickup Info */}
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

                {/* Drop-off Info */}
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

                {/* Fare Info */}
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

              {/* Additional ride info */}
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
          {!isCancelled && (
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

                  <Button variant="outline" onClick={() => refetch()}>
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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