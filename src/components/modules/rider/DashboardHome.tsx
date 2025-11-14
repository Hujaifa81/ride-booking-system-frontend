import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Clock, MapPin, Loader2, User, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useActiveRide } from "@/hooks/useActiveRide";
import { getStatusText } from "@/utils/status";
import { reverseGeocode } from "@/utils/reverseGeocode";


export default function DashboardHome() {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);

  // Use the custom hook - all logic is centralized!
  const { ride, isLoading, error } = useActiveRide();

  // State for storing geocoded addresses
  const [addresses, setAddresses] = useState<{
    pickup: string | null;
    dropoff: string | null;
  }>({ pickup: null, dropoff: null });

  // Fetch addresses when ride changes
  useEffect(() => {
    if (!ride) {
      setAddresses({ pickup: null, dropoff: null });
      return;
    }

    const fetchAddresses = async () => {
      try {
        // Fetch pickup address if not already provided
        const pickupAddress = ride.pickupAddress || await reverseGeocode(
          ride.pickupLocation.coordinates[1],
          ride.pickupLocation.coordinates[0]
        );

        // Fetch dropoff address if not already provided
        const dropoffAddress = ride.dropOffAddress || await reverseGeocode(
          ride.dropOffLocation.coordinates[1],
          ride.dropOffLocation.coordinates[0]
        );

        setAddresses({
          pickup: pickupAddress,
          dropoff: dropoffAddress
        });
      } catch (error) {
        console.error('Error fetching addresses:', error);
        // Fallback to coordinates
        setAddresses({
          pickup: `${ride.pickupLocation.coordinates[1].toFixed(4)}, ${ride.pickupLocation.coordinates[0].toFixed(4)}`,
          dropoff: `${ride.dropOffLocation.coordinates[1].toFixed(4)}, ${ride.dropOffLocation.coordinates[0].toFixed(4)}`
        });
      }
    };

    fetchAddresses();
  }, [ride?._id]); // Only re-fetch when ride ID changes

  // Map rendering - ONLY for active rides
  useEffect(() => {
    // Don't render map if no ride or ride is finished
    if (!ride || ride.status.startsWith('CANCELLED') || ride.status === 'COMPLETED') {
      // Clean up existing map if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Wait for DOM element to be available
    const mapElement = document.getElementById("live-ride-map");
    if (!mapElement) {
      console.warn("Map element not found in DOM");
      return;
    }

    try {
      const map = L.map("live-ride-map").setView(
        [ride.pickupLocation.coordinates[1], ride.pickupLocation.coordinates[0]],
        13
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Custom icons
      const pickupIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [30, 30],
      });

      const dropoffIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/1483/1483336.png",
        iconSize: [30, 30],
      });

      const pickupLatLng: [number, number] = [
        ride.pickupLocation.coordinates[1],
        ride.pickupLocation.coordinates[0],
      ];
      const dropoffLatLng: [number, number] = [
        ride.dropOffLocation.coordinates[1],
        ride.dropOffLocation.coordinates[0],
      ];

      L.marker(pickupLatLng, { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`📍 <b>Pickup</b><br>${addresses.pickup || 'Loading...'}`, {
          closeButton: true,
          autoClose: false,
          closeOnClick: false,
        });

      L.marker(dropoffLatLng, { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(`🏁 <b>Drop-off</b><br>${addresses.dropoff || 'Loading...'}`, {
          closeButton: true,
          autoClose: false,
          closeOnClick: false,
        });

      // Add driver marker if available
      if (ride.driver?.location && !ride.status.startsWith('CANCELLED')) {
        const driverIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097170.png",
          iconSize: [35, 35],
        });

        L.marker(
          [ride.driver.location.coordinates[1], ride.driver.location.coordinates[0]],
          { icon: driverIcon }
        )
          .addTo(map)
          .bindPopup("🚗 <b>Driver Location</b>", {
            closeButton: true,
            autoClose: false,
            closeOnClick: false,
          });
      }

      const line = L.polyline([pickupLatLng, dropoffLatLng], {
        color: "blue",
        weight: 3,
        opacity: 0.7,
      }).addTo(map);

      map.fitBounds(line.getBounds(), { padding: [50, 50] });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ride, ride?.status, addresses]); // Re-render when addresses are loaded

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hi 👋, where are you going today?</h2>

      <Card className="bg-blue-600 text-white rounded-2xl shadow-md">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-xl font-semibold">Book your next ride</h3>
            <p className="text-sm opacity-90">Choose bike, car, or more</p>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => navigate("/rider/ride-request")}
          >
            Book Now
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-l-4 border-blue-500 rounded-lg shadow-sm">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Checking for active rides...</span>
          </CardContent>
        </Card>
      )}

      {/* No Active Ride */}
      {!isLoading && (error || !ride) && (
        <Card className="border-l-4 border-gray-300 rounded-lg shadow-sm">
          <CardContent className="py-8 text-center">
            <Car className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">You don't have any active rides</p>
            <Button variant="outline" onClick={() => navigate("/rider/ride-request")}>
              <Car className="w-4 h-4 mr-2" />
              Book a Ride
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Ride */}
      {!isLoading && ride && !ride.status.startsWith('CANCELLED') && ride.status !== 'COMPLETED' && !error && (
        <Card 
          key={`active-${ride._id}-${ride.status}`}
          className="border-l-4 border-green-500 rounded-lg shadow-sm"
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-green-600" />
                Live Ride in Progress
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${ride.status === 'IN_TRANSIT'
                ? 'bg-green-100 text-green-700'
                : ride.status === 'GOING_TO_PICK_UP'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
                }`}>
                {getStatusText(ride.status)}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div id="live-ride-map" className="h-[250px] rounded-lg overflow-hidden border"></div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  {addresses.pickup ? (
                    <p className="font-medium text-gray-800 text-xs leading-relaxed break-words">
                      {addresses.pickup}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Drop-off</p>
                  {addresses.dropoff ? (
                    <p className="font-medium text-gray-800 text-xs leading-relaxed break-words">
                      {addresses.dropoff}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {ride.driver && ride.status !== "REQUESTED" && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Your Driver</p>
                      <p className="text-xs text-gray-600">License: {ride.driver.licenseNumber}</p>
                      {ride.vehicle && (
                        <p className="text-xs text-gray-600">
                          {ride.vehicle.model} - {ride.vehicle.licensePlate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{ride?.driver?.rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimated Fare:</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ৳{ride.approxFare.toLocaleString()}
              </span>
            </div>

            <Button className="w-full" onClick={() => navigate("/rider/active-ride")}>
              View Full Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Ride */}
      {!isLoading && ride && ride.status === 'COMPLETED' && (
        <Card 
          key={`completed-${ride._id}`}
          className="border-l-4 border-green-500 rounded-lg shadow-sm"
        >
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Trip Completed!</h3>
            <p className="text-gray-600 mb-4">Your last ride has been completed successfully</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/rider/active-ride")}>
                View Details
              </Button>
              <Button onClick={() => navigate("/rider/ride-request")}>
                <Car className="w-4 h-4 mr-2" />
                Book Another Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Ride */}
      {!isLoading && ride && ride.status.startsWith('CANCELLED') && (
        <Card 
          key={`cancelled-${ride._id}-${ride.status}`}
          className="border-l-4 border-red-400 rounded-lg shadow-sm"
        >
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {ride.status === 'CANCELLED_BY_RIDER' 
                ? 'You cancelled this ride' 
                : 'Ride was cancelled by driver'}
            </h3>
            <p className="text-gray-600 mb-4">Ready to book a new ride?</p>
            <Button onClick={() => navigate("/rider/ride-request")}>
              <Car className="w-4 h-4 mr-2" />
              Book a Ride
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}