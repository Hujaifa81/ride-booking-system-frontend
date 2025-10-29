export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    // Prefer Mapbox if a token is provided
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (mapboxToken) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&language=en&access_token=${encodeURIComponent(
        mapboxToken
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Mapbox ${res.status}`);
      const json = await res.json();
      return (
        json?.features?.[0]?.place_name ||
        json?.features?.[0]?.text ||
        "Unable to fetch address"
      );
    }

    // Fallback to OpenStreetMap Nominatim
    const email = import.meta.env.VITE_NOMINATIM_EMAIL || ""; // optional but recommended
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=16&addressdetails=1&accept-language=en${
      email ? `&email=${encodeURIComponent(email)}` : ""
    }`;

    const res = await fetch(url, {
      headers: {
        // Browser cannot set User-Agent; Accept-Language is fine.
        "Accept-Language": "en",
      },
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();

    if (data?.display_name) {
      const a = data.address || {};
      const parts: string[] = [];
      if (a.house_number) parts.push(a.house_number);
      if (a.road) parts.push(a.road);
      if (a.neighbourhood || a.suburb) parts.push(a.neighbourhood || a.suburb);
      if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
      if (a.state) parts.push(a.state);
      return parts.length > 0 ? parts.join(", ") : data.display_name;
    }
    return "Address not found";
  } catch {
    return "Unable to fetch address";
  }
};