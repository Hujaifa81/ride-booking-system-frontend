/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useUpdateDriverLocationMutation } from "@/redux/features/driver/driver.api";

// Fix Leaflet default icon URLs for bundlers
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

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCoords?: [number, number] | null; // [lng, lat]
  onSaved?: (coords: [number, number]) => void;
};

const dhakaCenterLatLng: [number, number] = [23.8103, 90.4125]; // [lat, lng]

// Convert [lng, lat] -> [lat, lng] for Leaflet
const toLeaflet = (coords?: [number, number] | null): [number, number] | undefined =>
  coords ? [coords[1], coords[0]] : undefined;

export default function DriverLocationModal({ open, onOpenChange, initialCoords, onSaved }: Props) {
  const [updateLocation, { isLoading: isSaving }] = useUpdateDriverLocationMutation();

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(initialCoords || null); // [lng, lat]
  const [active, setActive] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const mapCenter = useMemo<[number, number]>(() => toLeaflet(coords) || dhakaCenterLatLng, [coords]);

  useEffect(() => {
    if (initialCoords && !address) {
      reverseGeocode(initialCoords[1], initialCoords[0], true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoords]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (address && active) fetchSuggestions(address);
    }, 300);
    return () => clearTimeout(t);
  }, [address, active]);

  const fetchSuggestions = async (q: string) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&countrycodes=bd`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch location suggestions");
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lon: number, silent = false) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name);
      }
      setCoords([lon, lat]); // store as [lng, lat]
      if (!silent) toast.success("Location selected");
    } catch (err) {
      console.error(err);
      toast.error("Failed to resolve address");
    }
  };

  const MapClick = () => {
    useMapEvents({
      click(e) {
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    const lng = parseFloat(s.lon);
    const lat = parseFloat(s.lat);
    setCoords([lng, lat]);
    setAddress(s.display_name);
    setSuggestions([]);
    setActive(false);
    toast.success("Location set from search");
  };

  const saveLocation = async () => {
    if (!coords) {
      toast.error("Please select your current location");
      return;
    }
    try {
      toast.loading("Saving location...", { id: "save-loc" });
      await updateLocation({ coordinates: coords }).unwrap();
      toast.success("Location updated", { id: "save-loc" });
      localStorage.setItem("driver:location:set", "1");
      onSaved?.(coords);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update location", { id: "save-loc" });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Set Your Location</div>
            <div className="text-xs text-slate-500">Choose your current pickup area on the map</div>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Search</CardTitle>
              <CardDescription>Find your place by address</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={boxRef} className="relative">
                <Label htmlFor="address" className="text-xs text-slate-500">
                  Address
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="address"
                    placeholder="Type to search..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={() => setActive(true)}
                  />
                  <Button variant="outline" onClick={() => fetchSuggestions(address)} disabled={loading || !address}>
                    Search
                  </Button>
                </div>
                {active && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full max-h-56 overflow-auto rounded-md border bg-white shadow">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.lat}-${s.lon}-${i}`}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <Label className="text-xs text-slate-500">Selected Coordinates</Label>
                  <div className="mt-1 text-sm text-slate-700">
                    {coords ? `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}` : "—"}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Button onClick={saveLocation} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Location"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Map</CardTitle>
              <CardDescription>Click on the map to set your location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[380px] rounded-md overflow-hidden border">
                <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClick />
                  {coords && (
                    <Marker position={toLeaflet(coords)!} icon={driverIcon}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Selected
                          </div>
                          <div className="mt-1">{address || "Your current position"}</div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}