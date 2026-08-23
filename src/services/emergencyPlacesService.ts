export interface EmergencyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire_station' | 'shelter' | 'clinic';
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  address?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export async function fetchNearbyEmergencyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number = 15000
): Promise<EmergencyPlace[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|clinic|police|fire_station|shelter"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"hospital|clinic|police|fire_station|shelter"](around:${radiusMeters},${lat},${lng});
    );
    out center 40;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Overpass API network response error');
    const data = await response.json();

    if (!data.elements || data.elements.length === 0) return [];

    return data.elements
      .map((el: any) => {
        const placeLat = el.lat ?? el.center?.lat;
        const placeLng = el.lon ?? el.center?.lon;
        const tags = el.tags || {};

        if (!placeLat || !placeLng) return null;

        const rawName =
          tags.name ||
          tags['name:en'] ||
          `${tags.amenity?.replace('_', ' ').toUpperCase() || 'Emergency Facility'}`;

        return {
          id: String(el.id),
          name: rawName,
          type: tags.amenity as EmergencyPlace['type'],
          lat: placeLat,
          lng: placeLng,
          distanceKm: calculateDistance(lat, lng, placeLat, placeLng),
          phone: tags.phone || tags['contact:phone'] || tags['emergency:phone'] || undefined,
          address: tags['addr:street']
            ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`.trim()
            : undefined
        };
      })
      .filter((place: EmergencyPlace | null): place is EmergencyPlace => place !== null)
      .sort((a: EmergencyPlace, b: EmergencyPlace) => a.distanceKm - b.distanceKm);
  } catch (error) {
    console.error('Failed to fetch emergency places from OpenStreetMap:', error);
    return [];
  }
}
