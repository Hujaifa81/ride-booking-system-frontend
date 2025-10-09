/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useRequestRideMutation } from "@/redux/features/ride/ride.api";

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  estimatedFare: number;
  route: [number, number][];
}

export default function RideRequest() {
  const [createRide]=useRequestRideMutation()

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  // Changed: [longitude, latitude] format
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropCoords, setDropCoords] = useState<[number, number] | null>(null);
  const [activeInput, setActiveInput] = useState<"pickup" | "drop" | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Separate refs for pickup and drop containers
  const pickupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Debounce for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pickup && activeInput === "pickup") {
        fetchSuggestions(pickup);
      } else if (drop && activeInput === "drop") {
        fetchSuggestions(drop);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pickup, drop, activeInput]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (pickupCoords && dropCoords) {
      calculateRoute();
    } else {
      setRouteInfo(null);
    }
  }, [pickupCoords, dropCoords]);

  // Close dropdown when clicking outside (but not on map)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsidePickup = pickupRef.current?.contains(target);
      const isClickInsideDrop = dropRef.current?.contains(target);
      const isClickInsideMap = mapRef.current?.contains(target);
      
      // Only close dropdown if clicking outside input fields AND not on the map
      if (!isClickInsidePickup && !isClickInsideDrop && !isClickInsideMap) {
        setShowDropdown(false);
        setActiveInput(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&countrycodes=bd`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      toast.error("Failed to fetch location suggestions");
    } finally {
      setLoading(false);
    }
  };

  // Calculate route and fare estimation
  const calculateRoute = async () => {
    if (!pickupCoords || !dropCoords) return;

    try {
      // Changed: Using [longitude, latitude] format for OSRM
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords[0]},${pickupCoords[1]};${dropCoords[0]},${dropCoords[1]}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // km
        const duration = route.duration / 60; // minutes
        
        // Simple fare calculation (adjust as needed)
        const baseFare = 50; // Base fare in BDT
        const perKmRate = 15; // Rate per km
        const estimatedFare = baseFare + (distance * perKmRate);

        // Changed: Keep coordinates in [longitude, latitude] format
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[0], coord[1]]);

        setRouteInfo({
          distance: Math.round(distance * 100) / 100,
          duration: Math.round(duration),
          estimatedFare: Math.round(estimatedFare),
          route: coordinates
        });

        toast.success("Route calculated successfully!");
      }
    } catch (err) {
      console.error("Error calculating route:", err);
      toast.error("Failed to calculate route");
    }
  };

  // Reverse geocode for map click
  const reverseGeocode = async (lat: number, lon: number, type: "pickup" | "drop") => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      
      if (data.display_name) {
        if (type === "pickup") {
          setPickup(data.display_name);
          // Changed: Store as [longitude, latitude]
          setPickupCoords([lon, lat]);
        } else {
          setDrop(data.display_name);
          // Changed: Store as [longitude, latitude]
          setDropCoords([lon, lat]);
        }
        toast.success(`${type === "pickup" ? "Pickup" : "Drop-off"} location set from map`);
        
        // Close dropdown and reset active input after successful map selection
        setShowDropdown(false);
        setActiveInput(null);
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
      toast.error("Failed to get location details");
    }
  };

  // Map click handler
  const MapClickHandler = ({ activeInput }: { activeInput: "pickup" | "drop" | null }) => {
    useMapEvents({
      click(e) {
        if (!activeInput) {
          toast.info("Please select an input field first");
          return;
        }
        reverseGeocode(e.latlng.lat, e.latlng.lng, activeInput);
      },
    });
    return null;
  };

  // Handle selecting suggestion
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    // Changed: Store as [longitude, latitude]
    const coords: [number, number] = [parseFloat(suggestion.lon), parseFloat(suggestion.lat)];
    
    if (activeInput === "pickup") {
      setPickup(suggestion.display_name);
      setPickupCoords(coords);
      toast.success("Pickup location set successfully!");
    } else if (activeInput === "drop") {
      setDrop(suggestion.display_name);
      setDropCoords(coords);
      toast.success("Drop-off location set successfully!");
    }
    
    setSuggestions([]);
    setShowDropdown(false);
    setActiveInput(null);
  };

  // Clear location
  const clearLocation = (type: "pickup" | "drop") => {
    if (type === "pickup") {
      setPickup("");
      setPickupCoords(null);
      toast.info("Pickup location cleared");
    } else {
      setDrop("");
      setDropCoords(null);
      toast.info("Drop-off location cleared");
    }
  };

  const handleSubmit = async () => {
    if (!pickup || !drop || !pickupCoords || !dropCoords) {
      toast.error("Please select both pickup and drop-off locations");
      return;
    }

    if (!routeInfo) {
      toast.error("Route calculation failed. Please try again");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Submitting ride request...", { id: "ride-submit" });

    try {
      const rideData = {
        pickupLocation:{
          type: "Point",
          coordinates: [pickupCoords[0], pickupCoords[1]], // lng, lat
        },
        dropOffLocation:{
          type: "Point",
          coordinates: [dropCoords[0], dropCoords[1]], // lng, lat
        }
      };

      // Here you would typically send this data to your backend
      console.log("Ride request submitted:", rideData);
      
      // Simulate API call
      await createRide(rideData).unwrap()
      
      toast.success("Ride request submitted successfully!", { id: "ride-submit" });
      
      // Reset form
      setPickup("");
      setDrop("");
      setPickupCoords(null);
      setDropCoords(null);
      setRouteInfo(null);
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        typeof error === "object" && error !== null && "data" in error && (error as any).data?.message
          ? (error as any).data.message
          : "Failed to submit ride request",
        { id: "ride-submit" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert coordinates for Leaflet (which expects [lat, lng])
  const toLeafletCoords = (coords: [number, number] | null): [number, number] | undefined => {
    if (!coords) return undefined;
    return [coords[1], coords[0]]; // Convert [lon, lat] to [lat, lon] for Leaflet
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Navigation className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">New Ride Booking</h2>
      </div>

      <Card className="shadow-md rounded-2xl">
        <CardContent className="space-y-6 p-6">
          {/* Input Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pickup Location */}
            <div className="relative" ref={pickupRef}>
              <Label htmlFor="pickup" className="text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Pickup Location
              </Label>
              <div className="relative">
                <Input
                  id="pickup"
                  value={pickup}
                  placeholder="Enter pickup location"
                  className="pr-8"
                  onFocus={() => {
                    setActiveInput("pickup");
                    setShowDropdown(true);
                  }}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setActiveInput("pickup");
                    setShowDropdown(true);
                  }}
                />
                {pickup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => clearLocation("pickup")}
                  >
                    ×
                  </Button>
                )}
              </div>
              
              {/* Pickup Suggestions */}
              {showDropdown && activeInput === "pickup" && (
                <div className="absolute top-full z-[9999] mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loading && (
                    <div className="p-3 text-center text-gray-500">Loading...</div>
                  )}
                  {!loading && suggestions.length === 0 && pickup.length >= 3 && (
                    <div className="p-3 text-center text-gray-500">No locations found</div>
                  )}
                  {!loading && suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 line-clamp-2">{s.display_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drop-off Location */}
            <div className="relative" ref={dropRef}>
              <Label htmlFor="drop" className="text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                Drop-off Location
              </Label>
              <div className="relative">
                <Input
                  id="drop"
                  value={drop}
                  placeholder="Enter drop-off location"
                  className="pr-8"
                  onFocus={() => {
                    setActiveInput("drop");
                    setShowDropdown(true);
                  }}
                  onChange={(e) => {
                    setDrop(e.target.value);
                    setActiveInput("drop");
                    setShowDropdown(true);
                  }}
                />
                {drop && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => clearLocation("drop")}
                  >
                    ×
                  </Button>
                )}
              </div>

              {/* Drop-off Suggestions */}
              {showDropdown && activeInput === "drop" && (
                <div className="absolute top-full z-[9999] mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {loading && (
                    <div className="p-3 text-center text-gray-500">Loading...</div>
                  )}
                  {!loading && suggestions.length === 0 && drop.length >= 3 && (
                    <div className="p-3 text-center text-gray-500">No locations found</div>
                  )}
                  {!loading && suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 line-clamp-2">{s.display_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Route Information */}
          {routeInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Distance</p>
                  <p className="font-semibold">{routeInfo.distance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-semibold">{routeInfo.duration} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-600">Estimated Fare</p>
                  <p className="font-semibold">৳{routeInfo.estimatedFare}</p>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="h-[400px] w-full rounded-lg overflow-hidden border relative z-10" ref={mapRef}>
            <MapContainer
              center={toLeafletCoords(pickupCoords) || toLeafletCoords(dropCoords) || [23.8103, 90.4125]}
              zoom={13}
              scrollWheelZoom
              className="h-full w-full"
              style={{ zIndex: 1 }}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler activeInput={activeInput} />

              {/* Route polyline */}
              {routeInfo && routeInfo.route.length > 0 && (
                <Polyline 
                  positions={routeInfo.route.map(coord => [coord[1], coord[0]])} // Convert [lon, lat] to [lat, lon] for Leaflet
                  color="blue" 
                  weight={4}
                  opacity={0.7}
                />
              )}

              {/* Pickup marker */}
              {pickupCoords && toLeafletCoords(pickupCoords) && (
                <Marker position={toLeafletCoords(pickupCoords)!} icon={pickupIcon}>
                  <Popup>
                    <div className="text-sm">
                      <strong>Pickup Location</strong>
                      <br />
                      {pickup}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Drop-off marker */}
              {dropCoords && toLeafletCoords(dropCoords) && (
                <Marker position={toLeafletCoords(dropCoords)!} icon={dropIcon}>
                  <Popup>
                    <div className="text-sm">
                      <strong>Drop-off Location</strong>
                      <br />
                      {drop}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Type in the location fields or click on the map to select locations</li>
              <li>Green marker represents pickup, red marker represents drop-off</li>
              <li>Route and fare will be calculated automatically</li>
            </ol>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 text-lg font-semibold"
            disabled={!pickup || !drop || !routeInfo || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Book Ride"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}