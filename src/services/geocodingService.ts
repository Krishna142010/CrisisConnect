export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export const geocode = async (query: string): Promise<GeocodeResult | null> => {
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'CrisisConnect/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
    }
  } catch (error) {
    console.warn('Nominatim geocode failed, trying fallback...', error);
  }

  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(photonUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          displayName: feature.properties.name || `${feature.properties.street || ''} ${feature.properties.city || ''}`.trim()
        };
      }
    }
  } catch (error) {
    console.error('Photon geocode fallback also failed:', error);
  }

  return null;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CrisisConnect/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (error) {
    console.error('Reverse geocode failed:', error);
  }
  
  return 'Unknown Location';
};
