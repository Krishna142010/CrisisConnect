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

const locationNameCache = new Map<string, string>();

/**
 * Reverse-geocodes coordinates into a readable locality/city name via OpenStreetMap Nominatim
 */
export async function getReverseGeocodedLocation(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (locationNameCache.has(key)) {
    return locationNameCache.get(key)!;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
    );
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const locality =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.county ||
        'Local Area';
      const stateOrCountry = addr.state || addr.country || '';
      const resolvedName = stateOrCountry ? `${locality}, ${stateOrCountry}` : locality;
      locationNameCache.set(key, resolvedName);
      return resolvedName;
    }
  } catch (e) {
    console.warn('Reverse geocoding network error, using coordinate label:', e);
  }

  const fallback = `Lat: ${lat.toFixed(3)}, Lng: ${lng.toFixed(3)}`;
  locationNameCache.set(key, fallback);
  return fallback;
}

// Global Hubs across ALL continents including Americas & NYC
export const WORLD_EMERGENCY_HUBS = [
  // ── NORTH AMERICA & NYC ──
  {
    id: 'hub-nyc-bellevue',
    name: 'NYC Health + Hospitals / Bellevue Trauma Center',
    type: 'hospital' as const,
    lat: 40.7390,
    lng: -73.9760,
    address: 'New York City, NY, USA',
    phone: '+12125624141',
    purpose: 'New York’s flagship Level 1 Trauma Center. Emergency surgery, disaster medical response, hyperbaric medicine, and psychiatric crisis care.',
    capabilities: ['Level 1 Trauma', 'Disaster Medicine', 'Emergency Surgery', 'ICU']
  },
  {
    id: 'hub-nyc-nyp',
    name: 'NewYork-Presbyterian / Weill Cornell Medical Center',
    type: 'hospital' as const,
    lat: 40.7650,
    lng: -73.9540,
    address: 'New York City, NY, USA',
    phone: '+12127465454',
    purpose: 'Premier Level 1 Adult & Pediatric Trauma Center and regional Burn Center for the Greater New York Area.',
    capabilities: ['Burn Center', 'Pediatric Trauma', 'Cardiac Emergency']
  },
  {
    id: 'hub-nyc-mountsinai',
    name: 'Mount Sinai Hospital Emergency Department',
    type: 'hospital' as const,
    lat: 40.7900,
    lng: -73.9530,
    address: 'New York City, NY, USA',
    phone: '+12122416500',
    purpose: 'Comprehensive emergency stroke, cardiac catheterization, and specialized acute medical care center.',
    capabilities: ['Stroke Rescue', 'Cardiac Catheterization', 'Emergency Care']
  },
  {
    id: 'hub-hopkins-baltimore',
    name: 'Johns Hopkins Critical Event Preparedness & Response',
    type: 'hospital' as const,
    lat: 39.2965,
    lng: -76.5927,
    address: 'Baltimore, MD, USA',
    phone: '+14109555000',
    purpose: 'National disaster medical command, chemical & biological event containment, and tertiary critical trauma surgery.',
    capabilities: ['Disaster Medicine', 'Biological Containment', 'Tertiary Trauma']
  },
  {
    id: 'hub-toronto-general',
    name: 'Toronto General Hospital Emergency Trauma Unit',
    type: 'hospital' as const,
    lat: 43.6590,
    lng: -79.3890,
    address: 'Toronto, ON, Canada',
    phone: '+14163404800',
    purpose: 'Canada’s leading organ transplant and complex surgical emergency resuscitation hub.',
    capabilities: ['Complex Trauma', 'Organ Care', 'Critical Resuscitation']
  },

  // ── AFRICA ──
  {
    id: 'hub-cairo-qasr',
    name: 'Kasr Al Ainy Emergency Hospital (Cairo University)',
    type: 'hospital' as const,
    lat: 30.0302,
    lng: 31.2285,
    address: 'Cairo, Egypt (North Africa)',
    phone: '+20223654060',
    purpose: 'Largest tertiary emergency trauma hospital in North Africa. Best for major trauma surgery, toxicological emergencies, and ICU.',
    capabilities: ['Major Trauma', 'Toxicology', 'Emergency Surgery', 'ICU']
  },
  {
    id: 'hub-nairobi-knh',
    name: 'Kenyatta National Hospital Disaster & Trauma Centre',
    type: 'hospital' as const,
    lat: -1.3015,
    lng: 36.8065,
    address: 'Nairobi, Kenya (East Africa)',
    phone: '+254202726300',
    purpose: 'Apex Level 1 referral hospital for East & Central Africa. Multi-casualty disaster response and neurosurgery.',
    capabilities: ['Level 1 Trauma', 'Disaster Response', 'Neurosurgery']
  },
  {
    id: 'hub-joburg-bara',
    name: 'Chris Hani Baragwanath Academic Hospital Trauma Center',
    type: 'hospital' as const,
    lat: -26.2605,
    lng: 27.9435,
    address: 'Johannesburg, South Africa',
    phone: '+27119338000',
    purpose: 'High-volume Level 1 trauma resuscitation, acute penetrating injuries, disaster triage, and severe burn ICU.',
    capabilities: ['Mass Casualty Triage', 'Polytrauma', 'Burn Center']
  },

  // ── GULF & MIDDLE EAST ──
  {
    id: 'hub-dubai-rashid',
    name: 'Rashid Hospital Trauma & Emergency Centre',
    type: 'hospital' as const,
    lat: 25.2442,
    lng: 55.3262,
    address: 'Dubai, United Arab Emirates',
    phone: '+97142192000',
    purpose: 'Premier Level 1 Trauma Center in the Gulf. Handles vehicular polytrauma, hyperbaric oxygen therapy, and international airlifting.',
    capabilities: ['Level 1 Trauma', 'Hyperbaric Therapy', 'Helicopter Dispatch']
  },
  {
    id: 'hub-riyadh-kfsh',
    name: 'King Faisal Specialist Hospital & Emergency Center',
    type: 'hospital' as const,
    lat: 24.6712,
    lng: 46.6755,
    address: 'Riyadh, Saudi Arabia',
    phone: '+966114647272',
    purpose: 'State-of-the-art tertiary medical center. Critical care for chemical hazards and mass event emergency command.',
    capabilities: ['Critical Care', 'Chemical Incident Care', 'Tertiary Surgery']
  },

  // ── CENTRAL ASIA ──
  {
    id: 'hub-tashkent-emergency',
    name: 'Republican Research Centre of Emergency Medicine (RRCEM)',
    type: 'hospital' as const,
    lat: 41.3435,
    lng: 69.2805,
    address: 'Tashkent, Uzbekistan',
    phone: '+998711504600',
    purpose: 'Apex emergency medicine headquarters for Uzbekistan. Coordinates disaster medical aviation and acute trauma.',
    capabilities: ['Disaster Aviation', 'Burn ICU', 'Trauma']
  },
  {
    id: 'hub-almaty-syzganov',
    name: 'Syzganov National Scientific Center of Surgery',
    type: 'hospital' as const,
    lat: 43.2565,
    lng: 76.9552,
    address: 'Almaty, Kazakhstan',
    phone: '+77272792216',
    purpose: 'Central Asia apex surgical and trauma center. Specialized in reconstructive trauma and seismic disaster response.',
    capabilities: ['Reconstructive Trauma', 'Seismic Medicine']
  },

  // ── SOUTH ASIA, EUROPE & APAC ──
  {
    id: 'hub-aiims-delhi',
    name: 'JPN Apex Trauma Center (AIIMS New Delhi)',
    type: 'hospital' as const,
    lat: 28.5672,
    lng: 77.2100,
    address: 'New Delhi, India',
    phone: '+911126105740',
    purpose: 'National Level 1 Trauma Center. Best for polytrauma accidents, neurotrauma, and mass casualty disaster response.',
    capabilities: ['Level 1 Trauma', 'Neurosurgery', 'Blood Bank', 'ICU']
  },
  {
    id: 'hub-who-geneva',
    name: 'WHO Health Emergencies HQ',
    type: 'global_hub' as const,
    lat: 46.2333,
    lng: 6.1333,
    address: 'Geneva, Switzerland',
    phone: '+41227912111',
    purpose: 'Global strategic coordination for international disease outbreaks and international humanitarian relief.',
    capabilities: ['International Relief', 'Pandemic Response', 'Disaster Command']
  },
  {
    id: 'hub-london-trauma',
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
    id: 'hub-tokyo-disaster',
    name: 'Tokyo Disaster Medical Center',
    type: 'hospital' as const,
    lat: 35.7119,
    lng: 139.4048,
    address: 'Tokyo, Japan',
    phone: '+81425265511',
    purpose: 'Specialized National Earthquake and Disaster Center. Helicopter emergency medical system (HEMS) and seismic disaster triage.',
    capabilities: ['Earthquake Medicine', 'Airlift Evacuation', 'Mass Triage']
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

// Fetch nearby OpenStreetMap facilities around requested coordinates & merge with world hubs
export async function fetchNearbyEmergencyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number = 15000
): Promise<EmergencyPlace[]> {
  let localPlaces: EmergencyPlace[] = [];

  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|clinic|nursing_home|pharmacy|police|fire_station|shelter|social_facility"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"hospital|clinic|nursing_home|pharmacy|police|fire_station|shelter|social_facility"](around:${radiusMeters},${lat},${lng});
    );
    out center 40;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

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
        .filter((place: EmergencyPlace | null): place is EmergencyPlace => place !== null);
    }
  } catch (err) {
    console.warn('Overpass API query failed, generating offline fallback places for target coords:', err);
    localPlaces = generateOfflineFallback(lat, lng);
  }

  if (localPlaces.length === 0) {
    localPlaces = generateOfflineFallback(lat, lng);
  }

  // Calculate live distance for all registered global emergency hubs
  const globalHubsWithDistance: EmergencyPlace[] = WORLD_EMERGENCY_HUBS.map((hub) => ({
    ...hub,
    distanceKm: calculateDistance(lat, lng, hub.lat, hub.lng)
  }));

  // Combine and sort so the closest facilities (within 1-15 km) are ALWAYS at the top
  return [...localPlaces, ...globalHubsWithDistance].sort((a, b) => a.distanceKm - b.distanceKm);
}

function generateOfflineFallback(lat: number, lng: number): EmergencyPlace[] {
  const offlineTemplates = [
    { name: 'City Central Emergency Hospital & Trauma', type: 'hospital' as const, latOff: 0.012, lngOff: 0.010 },
    { name: 'Emergency Medical & Urgent Care Clinic', type: 'clinic' as const, latOff: -0.010, lngOff: 0.015 },
    { name: 'Central Police Station & Quick Response Post', type: 'police' as const, latOff: -0.015, lngOff: -0.012 },
    { name: 'Fire & Disaster Rescue Station', type: 'fire_station' as const, latOff: 0.018, lngOff: -0.016 },
    { name: 'Community Disaster Relief Shelter', type: 'shelter' as const, latOff: 0.007, lngOff: -0.020 }
  ];

  return offlineTemplates.map((t, idx) => {
    const pLat = lat + t.latOff;
    const pLng = lng + t.lngOff;
    const guide = getFacilityPurpose(t.type, t.name);
    return {
      id: `fallback-${idx + 1}-${lat.toFixed(2)}-${lng.toFixed(2)}`,
      name: t.name,
      type: t.type,
      lat: Number(pLat.toFixed(6)),
      lng: Number(pLng.toFixed(6)),
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
  radiusMeters: number = 15000
): Promise<Resource[]> {
  const places = await fetchNearbyEmergencyPlaces(lat, lng, radiusMeters);

  const resources: Resource[] = places.map((p) => ({
    id: `res-${p.id}`,
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
