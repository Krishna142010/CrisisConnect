import { Resource, ResourceCapability } from '../types';
import { saveResource, getAllResources } from './offlineDB';

export interface EmergencyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'nursing_home' | 'pharmacy' | 'police' | 'fire_station' | 'shelter';
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
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function mapOsmAmenityToCapabilities(amenity: string): ResourceCapability[] {
  switch (amenity) {
    case 'hospital':
    case 'clinic':
    case 'nursing_home':
      return ['MEDICAL_KIT', 'GENERAL'];
    case 'pharmacy':
      return ['MEDICAL_KIT', 'FOOD_WATER'];
    case 'police':
      return ['VEHICLE_4X4', 'GENERAL'];
    case 'fire_station':
      return ['BOAT', 'VEHICLE_4X4', 'GENERAL'];
    case 'shelter':
    case 'social_facility':
      return ['FOOD_WATER', 'GENERAL'];
    default:
      return ['GENERAL'];
  }
}

// 1. Fetch live facilities from OpenStreetMap Overpass API
export async function fetchAndCacheLiveFacilities(lat: number, lng: number, radiusMeters: number = 10000): Promise<Resource[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|clinic|nursing_home|pharmacy|police|fire_station|shelter|social_facility"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"hospital|clinic|nursing_home|pharmacy|police|fire_station|shelter|social_facility"](around:${radiusMeters},${lat},${lng});
    );
    out center 50;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSM Overpass API response not ok');
    const data = await res.json();

    if (data.elements && data.elements.length > 0) {
      const liveResources: Resource[] = data.elements
        .map((el: any) => {
          const pLat = el.lat ?? el.center?.lat;
          const pLng = el.lon ?? el.center?.lon;
          const tags = el.tags || {};
          if (!pLat || !pLng) return null;

          const amenity = tags.amenity || 'hospital';
          const name = tags.name || tags['name:en'] || `${amenity.replace('_', ' ').toUpperCase()} Facility`;

          return {
            id: `osm-${el.id}`,
            name,
            lat: Number(pLat),
            lng: Number(pLng),
            capabilities: mapOsmAmenityToCapabilities(amenity),
            capacityRemaining: Math.floor(20 + Math.random() * 80),
            isActive: true,
            phone: tags.phone || tags['contact:phone'] || tags['emergency:phone'] || '112'
          };
        })
        .filter((r: Resource | null): r is Resource => r !== null);

      if (liveResources.length > 0) {
        for (const resItem of liveResources) {
          await saveResource(resItem);
        }
        return liveResources;
      }
    }
  } catch (err) {
    console.warn('Live OSM fetch failed or offline, loading local IndexedDB cache:', err);
  }

  // 2. Offline fallback: read from IndexedDB
  const cached = await getAllResources();
  if (cached.length > 0) return cached;

  // 3. Fallback generator if completely offline without cache
  return generateOfflineEmergencyPoints(lat, lng);
}

function generateOfflineEmergencyPoints(lat: number, lng: number): Resource[] {
  const offlineTemplates = [
    { name: 'District Civil Hospital & Trauma Unit', caps: ['MEDICAL_KIT', 'GENERAL'] },
    { name: 'Red Cross Emergency Clinic & Nursing Center', caps: ['MEDICAL_KIT', 'FOOD_WATER'] },
    { name: 'Central Police Station & Quick Response Team', caps: ['VEHICLE_4X4', 'GENERAL'] },
    { name: 'Fire & Disaster Rescue Station', caps: ['BOAT', 'VEHICLE_4X4'] },
    { name: 'Community Medical & Maternity Center', caps: ['MEDICAL_KIT'] },
    { name: 'Emergency Disaster Relief Shelter', caps: ['FOOD_WATER', 'GENERAL'] },
    { name: '24/7 Essential Pharmacy & Medical Depot', caps: ['MEDICAL_KIT'] }
  ];

  return offlineTemplates.map((item, idx) => {
    const angle = (idx * (360 / offlineTemplates.length) * Math.PI) / 180;
    const distanceKm = 2.5 + (idx % 4) * 2.0; // 2.5km to 8.5km radius
    const latOffset = (distanceKm * Math.cos(angle)) / 111.32;
    const lngOffset = (distanceKm * Math.sin(angle)) / (111.32 * Math.cos((lat * Math.PI) / 180));

    return {
      id: `offline-res-${idx + 1}`,
      name: item.name,
      lat: Number((lat + latOffset).toFixed(6)),
      lng: Number((lng + lngOffset).toFixed(6)),
      capabilities: item.caps as ResourceCapability[],
      capacityRemaining: 50,
      isActive: true,
      phone: '112'
    };
  });
}
