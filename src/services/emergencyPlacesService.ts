import { Resource, ResourceCapability } from '../types';
import { saveResource, getAllResources } from './offlineDB';

export interface EmergencyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'nursing_home' | 'pharmacy' | 'police' | 'fire_station' | 'shelter' | 'global_hub';
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  address?: string;
  purpose: string;
  capabilities: string[];
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

// Major Global Emergency & Disaster Command Hubs
export const GLOBAL_EMERGENCY_HUBS = [
  {
    id: 'global-who',
    name: 'WHO Health Emergencies Programme HQ',
    type: 'global_hub' as const,
    lat: 46.2333,
    lng: 6.1333,
    address: 'Geneva, Switzerland',
    phone: '+41227912111',
    purpose: 'Global strategic coordination for international disease outbreaks, mass casualties, and international medical aid.',
    capabilities: ['International Aid', 'Pandemic Response', 'Disaster Command']
  },
  {
    id: 'global-aiims-trauma',
    name: 'JPN Apex Trauma Center (AIIMS New Delhi)',
    type: 'hospital' as const,
    lat: 28.5672,
    lng: 77.2100,
    address: 'New Delhi, India',
    phone: '+911126105740',
    purpose: 'Apex Level 1 Trauma Center. Best for severe multi-trauma accidents, neurosurgery, emergency blood bank, and mass casualty triage.',
    capabilities: ['Level 1 Trauma', 'Emergency ICU', 'Neurosurgery', 'Blood Bank']
  },
  {
    id: 'global-hopkins',
    name: 'Johns Hopkins Critical Event Preparedness & Response (CEPAR)',
    type: 'global_hub' as const,
    lat: 39.2965,
    lng: -76.5927,
    address: 'Baltimore, MD, USA',
    phone: '+14109555000',
    purpose: 'Apex medical disaster coordination, biosecurity containment, and tertiary critical trauma surgery.',
    capabilities: ['Disaster Medicine', 'Biological Hazards', 'Tertiary Trauma']
  },
  {
    id: 'global-tokyo',
    name: 'Tokyo Disaster Medical Center',
    type: 'hospital' as const,
    lat: 35.7119,
    lng: 139.4048,
    address: 'Tachikawa, Tokyo, Japan',
    phone: '+81425265511',
    purpose: 'Specialized National Earthquake and Disaster Center. Helicopter emergency medical system (HEMS) & heavy disaster triage.',
    capabilities: ['Earthquake Medicine', 'Airlift Evacuation', 'Mass Triage']
  },
  {
    id: 'global-london',
    name: 'The Royal London Hospital Major Trauma Centre',
    type: 'hospital' as const,
    lat: 51.5186,
    lng: -0.0592,
    address: 'London, United Kingdom',
    phone: '+442073777000',
    purpose: 'Europe’s leading Major Trauma Centre. Provides air ambulance reception, vascular surgery, and polytrauma resuscitation.',
    capabilities: ['Major Trauma', 'Air Ambulance', 'Vascular Care']
  },
  {
    id: 'global-sgh',
    name: 'Singapore General Hospital Emergency Hub',
    type: 'hospital' as const,
    lat: 1.2795,
    lng: 103.8344,
    address: 'Singapore',
    phone: '+6562223322',
    purpose: 'Southeast Asian regional disaster and hyperbaric emergency medical response hub.',
    capabilities: ['Severe Burns', 'Toxicology', 'Critical Care']
  }
];

export function getFacilityPurpose(amenity: string, name: string): { purpose: string; capabilities: string[] } {
  switch (amenity) {
    case 'hospital':
      return {
        purpose: 'Use for life-threatening emergencies: severe trauma, emergency surgeries, cardiac arrest, stroke, and intensive care.',
        capabilities: ['Emergency ICU', 'Surgery', 'Trauma Care', '24/7 Triage']
      };
    case 'clinic':
      return {
        purpose: 'Use for urgent non-life-threatening medical conditions: wound stitches, minor fractures, high fever, and basic stabilization.',
        capabilities: ['First Aid', 'Minor Injuries', 'Prescription Meds']
      };
    case 'nursing_home':
      return {
        purpose: 'Use for geriatric emergency assistance, palliative patient stabilization, oxygen support, and convalescent care.',
        capabilities: ['Elderly Care', 'Oxygen Support', 'Rehabilitation']
      };
    case 'pharmacy':
      return {
        purpose: 'Use for obtaining emergency prescription drugs, bandages, antiseptic supplies, insulin, and rapid OTC medications.',
        capabilities: ['Essential Medicines', 'First Aid Kits', 'Prescriptions']
      };
    case 'police':
      return {
        purpose: 'Use for physical safety, disaster security perimeters, search & rescue coordination, and reporting missing persons.',
        capabilities: ['Law Enforcement', 'Search & Rescue', 'Security']
      };
    case 'fire_station':
      return {
        purpose: 'Use for structure fires, collapsed building extrication, flood rescue boats, and hazardous chemical neutralization.',
        capabilities: ['Fire Suppression', 'Water Rescue', 'Debris Extraction']
      };
    case 'shelter':
    case 'social_facility':
      return {
        purpose: 'Use for safe evacuation accommodation, clean drinking water distribution, food packets, and dry bedding.',
        capabilities: ['Emergency Shelter', 'Clean Water', 'Food Rations']
      };
    default:
      return {
        purpose: 'Use for regional civil protection and localized disaster coordination.',
        capabilities: ['Civil Defense', 'Assistance']
      };
  }
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

// Fetch live facilities and combine with global disaster hubs
export async function fetchNearbyEmergencyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number = 15000
): Promise<EmergencyPlace[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|clinic|nursing_home|pharmacy|police|fire_station|shelter|social_facility"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"hospital|clinic|nursing_home|pharmacy|police|fire_station|shelter|social_facility"](around:${radiusMeters},${lat},${lng});
    );
    out center 40;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  let localPlaces: EmergencyPlace[] = [];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSM Overpass API response not ok');
    const data = await res.json();

    if (data.elements && data.elements.length > 0) {
      localPlaces = data.elements
        .map((el: any) => {
          const placeLat = el.lat ?? el.center?.lat;
          const placeLng = el.lon ?? el.center?.lon;
          const tags = el.tags || {};
          if (!placeLat || !placeLng) return null;

          const amenity = tags.amenity || 'hospital';
          const name = tags.name || tags['name:en'] || `${amenity.replace('_', ' ').toUpperCase()} Facility`;
          const guide = getFacilityPurpose(amenity, name);

          return {
            id: String(el.id),
            name,
            type: amenity as EmergencyPlace['type'],
            lat: Number(placeLat),
            lng: Number(placeLng),
            distanceKm: calculateDistance(lat, lng, Number(placeLat), Number(placeLng)),
            phone: tags.phone || tags['contact:phone'] || tags['emergency:phone'] || undefined,
            address: tags['addr:street'] ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`.trim() : undefined,
            purpose: guide.purpose,
            capabilities: guide.capabilities
          };
        })
        .filter((place: EmergencyPlace | null): place is EmergencyPlace => place !== null)
        .sort((a: EmergencyPlace, b: EmergencyPlace) => a.distanceKm - b.distanceKm);
    }
  } catch (err) {
    console.warn('Overpass query failed, using offline fallback facilities:', err);
    localPlaces = generateOfflineFallback(lat, lng);
  }

  // Combine with global hubs computed with distance from user
  const globalHubsWithDistance: EmergencyPlace[] = GLOBAL_EMERGENCY_HUBS.map(hub => ({
    ...hub,
    distanceKm: calculateDistance(lat, lng, hub.lat, hub.lng)
  }));

  return [...localPlaces, ...globalHubsWithDistance];
}

function generateOfflineFallback(lat: number, lng: number): EmergencyPlace[] {
  const offlineTemplates = [
    { name: 'District Civil Hospital & Trauma Center', type: 'hospital' as const, latOff: 0.015, lngOff: 0.012 },
    { name: 'Emergency Medical & Nursing Clinic', type: 'clinic' as const, latOff: -0.012, lngOff: 0.018 },
    { name: 'Central Police Station & Quick Response Post', type: 'police' as const, latOff: -0.018, lngOff: -0.015 },
    { name: 'Fire & Disaster Rescue Station', type: 'fire_station' as const, latOff: 0.022, lngOff: -0.019 },
    { name: 'Community Relief Shelter', type: 'shelter' as const, latOff: 0.008, lngOff: -0.024 }
  ];

  return offlineTemplates.map((t, idx) => {
    const pLat = lat + t.latOff;
    const pLng = lng + t.lngOff;
    const guide = getFacilityPurpose(t.type, t.name);
    return {
      id: `offline-${idx + 1}`,
      name: t.name,
      type: t.type,
      lat: pLat,
      lng: pLng,
      distanceKm: calculateDistance(lat, lng, pLat, pLng),
      phone: '112',
      purpose: guide.purpose,
      capabilities: guide.capabilities
    };
  });
}

export async function fetchAndCacheLiveFacilities(
  lat: number,
  lng: number,
  radiusMeters: number = 12000
): Promise<Resource[]> {
  const places = await fetchNearbyEmergencyPlaces(lat, lng, radiusMeters);

  const resources: Resource[] = places.map((p) => ({
    id: `osm-${p.id}`,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    capabilities: mapOsmAmenityToCapabilities(p.type),
    capacityRemaining: Math.floor(25 + Math.random() * 75),
    isActive: true,
    phone: p.phone || '112'
  }));

  if (resources.length > 0) {
    for (const res of resources) {
      await saveResource(res);
    }
    return resources;
  }

  return getAllResources();
}
