import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Clock } from "lucide-react";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function DashboardHome() {
  const liveRide = {
    pickupLocation: {
      type: "Point",
      coordinates: [90.3563, 23.8103], // lng, lat (Banani)
    },
    dropOffLocation: {
      type: "Point",
      coordinates: [90.4125, 23.7806], // lng, lat (Gulshan)
    },
    status: "Driver on the way",
    eta: "5 min",
    driver: {
      name: "Rahim",
      vehicle: "Toyota Axio",
    },
  };

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

    const line = L.polyline([pickupLatLng, dropoffLatLng], {
      color: "blue",
      weight: 3,
      opacity: 0.7,
    }).addTo(map);

    map.fitBounds(line.getBounds(), { padding: [50, 50] });

    // ✅ Create popups with close buttons (closable)
    const pickupPopup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
    })
      .setLatLng(pickupLatLng)
      .setContent("📍 <b>Pickup Location</b><br>Banani")
      .addTo(map);

    const dropoffPopup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
    })
      .setLatLng(dropoffLatLng)
      .setContent("🏁 <b>Drop-off Location</b><br>Gulshan")
      .addTo(map);

    // ✅ Optional: Clicking marker reopens popup if closed
    pickupMarker.on("click", () => pickupPopup.openOn(map));
    dropoffMarker.on("click", () => dropoffPopup.openOn(map));

    return () => { map.remove(); };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hi Abu 👋, where are you going today?</h2>

      <Card className="bg-blue-600 text-white rounded-2xl shadow-md">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-xl font-semibold">Book your next ride</h3>
            <p className="text-sm opacity-90">Choose bike, car, or more</p>
          </div>
          <Button variant="secondary" className="bg-white text-blue-600">
            Book Now
          </Button>
        </CardContent>
      </Card>

      {liveRide && (
        <Card className="border-l-4 border-green-500 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-green-600" />
              Live Ride in Progress
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div id="live-ride-map" className="h-[250px] rounded-lg overflow-hidden border"></div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Status: <span className="font-medium">{liveRide.status}</span> ({liveRide.eta})
            </div>
            <p className="text-sm text-muted-foreground">
              Driver: {liveRide.driver.name} ({liveRide.driver.vehicle})
            </p>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
