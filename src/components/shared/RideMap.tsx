import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

/* eslint-disable @typescript-eslint/no-explicit-any */
export  const RideMap = ({ displayRide, center }: {
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
        const L = await import("leaflet");
        const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import("react-leaflet");

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        setLeaflet(L);
        setMapComponents({ MapContainer, TileLayer, Marker, Popup, Polyline });
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

  const shouldShowDriverMarker = displayRide?.driver?.location &&
    displayRide?.status !== 'REQUESTED' &&
    displayRide?.status !== 'PENDING';

  return (
    <div className="h-[400px] w-full">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} className="rounded-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        {displayRide.route && displayRide.route.length > 0 && (
          <Polyline positions={displayRide.route.map((coord: [number, number]) => [coord[1], coord[0]])} color="#3b82f6" weight={4} opacity={0.7} />
        )}
        {displayRide.pickupLocation && (
          <Marker position={[displayRide.pickupLocation.coordinates[1], displayRide.pickupLocation.coordinates[0]]} icon={pickupIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-green-700">Pickup Location</div>
                <div className="text-sm text-gray-600">{displayRide.pickupAddress || "Pickup Location"}</div>
              </div>
            </Popup>
          </Marker>
        )}
        {displayRide.dropOffLocation && (
          <Marker position={[displayRide.dropOffLocation.coordinates[1], displayRide.dropOffLocation.coordinates[0]]} icon={dropIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-red-700">Drop-off Location</div>
                <div className="text-sm text-gray-600">{displayRide.dropOffAddress || "Drop-off Location"}</div>
              </div>
            </Popup>
          </Marker>
        )}
        {shouldShowDriverMarker && (
          <Marker position={[displayRide.driver.location.coordinates[1], displayRide.driver.location.coordinates[0]]} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-orange-700">Your Driver</div>
                <div className="text-sm text-gray-600">Current Location</div>
                {displayRide.vehicle?.licensePlate && (
                  <div className="text-xs text-gray-500 mt-1">{displayRide.vehicle.licensePlate}</div>
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