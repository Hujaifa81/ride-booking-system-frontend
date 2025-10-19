// Reverse geocoding function
  export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`
      );
      const data = await response.json();

      if (data && data.display_name) {
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