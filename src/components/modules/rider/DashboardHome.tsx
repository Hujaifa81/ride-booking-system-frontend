import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Clock, MapPin, Loader2, User, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useActiveRideQuery } from "@/redux/features/ride/ride.api";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { getStatusText } from "@/utils/status";

export default function DashboardHome() {
  const navigate = useNavigate();
  
  // Fetch active ride data
  const { data: rideResponse, isLoading, error } = useActiveRideQuery(undefined, {
    refetchOnMountOrArgChange: 30,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const liveRide = rideResponse?.data;

  // States for addresses
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [dropoffAddress, setDropoffAddress] = useState<string>('');
  const [addressLoading, setAddressLoading] = useState<boolean>(false);

  

  // Fetch addresses when ride data loads
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!liveRide || addressLoading) return;

      // Use existing addresses if available
      if (liveRide.pickupAddress && liveRide.dropOffAddress) {
        setPickupAddress(liveRide.pickupAddress);
        setDropoffAddress(liveRide.dropOffAddress);
        return;
      }

      setAddressLoading(true);

      try {
        // Fetch pickup address if not available
        if (!pickupAddress && !liveRide.pickupAddress) {
          const pickupAddr = await reverseGeocode(
            liveRide.pickupLocation.coordinates[1],
            liveRide.pickupLocation.coordinates[0]
          );
          setPickupAddress(pickupAddr);
        }

        // Fetch dropoff address if not available
        if (!dropoffAddress && !liveRide.dropOffAddress) {
          const dropoffAddr = await reverseGeocode(
            liveRide.dropOffLocation.coordinates[1],
            liveRide.dropOffLocation.coordinates[0]
          );
          setDropoffAddress(dropoffAddr);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setAddressLoading(false);
      }
    };

    fetchAddresses();
  }, [liveRide, pickupAddress, dropoffAddress, addressLoading]);

  useEffect(() => {
    if (!liveRide) return;

    const map = L.map("live-ride-map").setView(
      [liveRide.pickupLocation.coordinates[1], liveRide.pickupLocation.coordinates[0]],
      13
    );

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
      liveRide.pickupLocation.coordinates[1],
      liveRide.pickupLocation.coordinates[0],
    ];
    const dropoffLatLng: [number, number] = [
      liveRide.dropOffLocation.coordinates[1],
      liveRide.dropOffLocation.coordinates[0],
    ];

    const pickupMarker = L.marker(pickupLatLng, { icon: pickupIcon }).addTo(map);
    const dropoffMarker = L.marker(dropoffLatLng, { icon: dropoffIcon }).addTo(map);

    // Add driver marker if available and not cancelled
    if (liveRide.driver?.location && !liveRide.status.startsWith('CANCELLED')) {
      const driverIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097170.png",
        iconSize: [35, 35],
      });

      const driverLatLng: [number, number] = [
        liveRide.driver.location.coordinates[1],
        liveRide.driver.location.coordinates[0],
      ];

      L.marker(driverLatLng, { icon: driverIcon })
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

    // Get the display addresses
    const displayPickupAddr = liveRide.pickupAddress || pickupAddress || 'Loading address...';
    const displayDropoffAddr = liveRide.dropOffAddress || dropoffAddress || 'Loading address...';

    // Create popups with close buttons
    const pickupPopup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
    })
      .setLatLng(pickupLatLng)
      .setContent(`📍 <b>Pickup Location</b><br>${displayPickupAddr}`)
      .addTo(map);

    const dropoffPopup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
    })
      .setLatLng(dropoffLatLng)
      .setContent(`🏁 <b>Drop-off Location</b><br>${displayDropoffAddr}`)
      .addTo(map);

    pickupMarker.on("click", () => pickupPopup.openOn(map));
    dropoffMarker.on("click", () => dropoffPopup.openOn(map));

    return () => { map.remove(); };
  }, [liveRide, pickupAddress, dropoffAddress]);


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

      {/* Error State - No Active Ride */}
      {!isLoading && (error || !liveRide) && (
        <Card className="border-l-4 border-gray-300 rounded-lg shadow-sm">
          <CardContent className="py-8 text-center">
            <Car className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">You don't have any active rides</p>
            <Button 
              variant="outline"
              onClick={() => navigate("/rider/ride-request")}
            >
              <Car className="w-4 h-4 mr-2" />
              Book a Ride
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Ride Card */}
      {!isLoading && liveRide && !liveRide.status.startsWith('CANCELLED') && liveRide.status !== 'COMPLETED' && (
        <Card className="border-l-4 border-green-500 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-green-600" />
                Live Ride in Progress
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${
                liveRide.status === 'IN_TRANSIT' 
                  ? 'bg-green-100 text-green-700'
                  : liveRide.status === 'GOING_TO_PICK_UP'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {getStatusText(liveRide.status)}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Map */}
            <div id="live-ride-map" className="h-[250px] rounded-lg overflow-hidden border"></div>

            {/* Ride Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <div className="min-h-[2.5rem]">
                    {addressLoading && !pickupAddress && !liveRide.pickupAddress ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-800 text-xs leading-relaxed">
                        {liveRide.pickupAddress || pickupAddress || 'Pickup Location'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Drop-off</p>
                  <div className="min-h-[2.5rem]">
                    {addressLoading && !dropoffAddress && !liveRide.dropOffAddress ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-800 text-xs leading-relaxed">
                        {liveRide.dropOffAddress || dropoffAddress || 'Drop-off Location'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            {liveRide.driver && liveRide.status !== "REQUESTED" && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Your Driver</p>
                      <p className="text-xs text-gray-600">
                        License: {liveRide.driver.licenseNumber}
                      </p>
                      {liveRide.vehicle && (
                        <p className="text-xs text-gray-600">
                          {liveRide.vehicle.model} - {liveRide.vehicle.licensePlate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{liveRide.driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fare Info */}
            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimated Fare:</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ৳{liveRide.approxFare.toLocaleString()}
              </span>
            </div>

            {/* Action Button */}
            <Button 
              className="w-full"
              onClick={() => navigate("/rider/active-ride")}
            >
              View Full Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Ride State */}
      {!isLoading && liveRide && liveRide.status === 'COMPLETED' && (
        <Card className="border-l-4 border-green-500 rounded-lg shadow-sm">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Trip Completed!</h3>
            <p className="text-gray-600 mb-4">Your last ride has been completed successfully</p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => navigate("/rider/active-ride")}
              >
                View Details
              </Button>
              <Button 
                onClick={() => navigate("/rider/ride-request")}
              >
                <Car className="w-4 h-4 mr-2" />
                Book Another Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Ride State */}
      {!isLoading && liveRide && liveRide.status.startsWith('CANCELLED') && (
        <Card className="border-l-4 border-gray-300 rounded-lg shadow-sm">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Your last ride was cancelled</h3>
            <p className="text-gray-600 mb-4">Ready to book a new ride?</p>
            <Button 
              onClick={() => navigate("/rider/ride-request")}
            >
              <Car className="w-4 h-4 mr-2" />
              Book a Ride
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}