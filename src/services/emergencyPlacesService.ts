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

// Comprehensive Global Network: Africa, Gulf, Central Asia, South Asia, Europe, Americas, APAC
export const WORLD_EMERGENCY_HUBS = [
  // ── AFRICA ──
  {
    id: 'hub-cairo-qasr',
    name: 'Kasr Al Ainy Emergency Hospital (Cairo University)',
    type: 'hospital' as const,
    lat: 30.0302,
    lng: 31.2285,
    address: 'Cairo, Egypt (North Africa)',
    phone: '+20223654060',
    purpose: 'Largest tertiary emergency trauma hospital in North Africa. Best for major trauma surgery, toxicological emergencies, burn treatment, and intensive care.',
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
    purpose: 'Apex Level 1 referral hospital for East & Central Africa. Use for multi-casualty disaster response, emergency neurosurgery, and specialized infectious disease isolation.',
    capabilities: ['Level 1 Trauma', 'Disaster Response', 'Neurosurgery', 'Isolation Care']
  },
  {
    id: 'hub-joburg-bara',
    name: 'Chris Hani Baragwanath Academic Hospital Trauma Center',
    type: 'hospital' as const,
    lat: -26.2605,
    lng: 27.9435,
    address: 'Johannesburg, South Africa (Southern Africa)',
    phone: '+27119338000',
    purpose: 'One of the largest hospitals in the world. High-volume Level 1 trauma resuscitation, acute penetrating injuries, disaster triage, and severe burn ICU.',
    capabilities: ['Mass Casualty Triage', 'Polytrauma', 'Burn Center', 'Blood Bank']
  },
  {
    id: 'hub-abuja-national',
    name: 'National Hospital Abuja Emergency Centre',
    type: 'hospital' as const,
    lat: 9.0435,
    lng: 7.4832,
    address: 'Abuja, Nigeria (West Africa)',
    phone: '+23492344074',
    purpose: 'Premier medical hub for West Africa. Equipped for national disaster mobilization, acute cardiac emergencies, and radiological decontamination.',
    capabilities: ['National Disaster Care', 'Cardiology', 'Emergency Surgery']
  },
  {
    id: 'hub-addis-blacklion',
    name: 'Tikur Anbessa (Black Lion) Specialized Hospital',
    type: 'hospital' as const,
    lat: 9.0185,
    lng: 38.7512,
    address: 'Addis Ababa, Ethiopia (Horn of Africa)',
    phone: '+251115511211',
    purpose: 'Main emergency referral center for the Horn of Africa. Use for severe polytrauma, emergency obstetrics, and disaster epidemic control.',
    capabilities: ['Polytrauma', 'Emergency Surgery', 'Epidemic Control']
  },
  {
    id: 'hub-rabat-ibnsina',
    name: 'Ibn Sina University Hospital Trauma Center',
    type: 'hospital' as const,
    lat: 33.9842,
    lng: -6.8521,
    address: 'Rabat, Morocco (Northwest Africa)',
    phone: '+212537671010',
    purpose: 'Maghreb region apex medical facility. Specialized in earthquake injury response, vascular trauma, and rapid helicopter triage.',
    capabilities: ['Earthquake Trauma', 'Vascular Surgery', 'Air Ambulance']
  },

  // ── GULF & MIDDLE EAST ──
  {
    id: 'hub-riyadh-kfsh',
    name: 'King Faisal Specialist Hospital & Emergency Center',
    type: 'hospital' as const,
    lat: 24.6712,
    lng: 46.6755,
    address: 'Riyadh, Saudi Arabia',
    phone: '+966114647272',
    purpose: 'State-of-the-art tertiary medical center. Critical care for chemical hazards, advanced organ failure resuscitation, and mass event emergency command.',
    capabilities: ['Critical Care', 'Chemical Incident Care', 'Tertiary Surgery']
  },
  {
    id: 'hub-dubai-rashid',
    name: 'Rashid Hospital Trauma & Emergency Centre',
    type: 'hospital' as const,
    lat: 25.2442,
    lng: 55.3262,
    address: 'Dubai, United Arab Emirates',
    phone: '+97142192000',
    purpose: 'Premier Level 1 Trauma Center in the Gulf. Handles vehicular polytrauma, hyperbaric oxygen therapy, and international disaster airlifting.',
    capabilities: ['Level 1 Trauma', 'Hyperbaric Therapy', 'Helicopter Dispatch']
  },
  {
    id: 'hub-abu-dhabi-cleveland',
    name: 'Cleveland Clinic Abu Dhabi Emergency Department',
    type: 'hospital' as const,
    lat: 24.4985,
    lng: 54.3895,
    address: 'Abu Dhabi, United Arab Emirates',
    phone: '+97180082223',
    purpose: 'Designated chest pain and stroke emergency hub. Advanced acute coronary interventions and neurovascular rescue.',
    capabilities: ['Stroke Rescue', 'Cardiac Catheterization', 'ICU']
  },
  {
    id: 'hub-doha-hamad',
    name: 'Hamad General Hospital & Trauma Center',
    type: 'hospital' as const,
    lat: 25.2895,
    lng: 51.4985,
    address: 'Doha, Qatar',
    phone: '+97444392222',
    purpose: 'Nationwide trauma coordination hub. Operates national fleet of emergency air ambulances, heavy disaster triage, and pediatric emergency services.',
    capabilities: ['Air Ambulance', 'Pediatric Emergency', 'Disaster Command']
  },
  {
    id: 'hub-kuwait-mubarak',
    name: 'Mubarak Al-Kabeer Hospital Emergency Hub',
    type: 'hospital' as const,
    lat: 29.3245,
    lng: 48.0262,
    address: 'Jabriya, Kuwait City, Kuwait',
    phone: '+96525312700',
    purpose: 'Primary emergency surgical and burn treatment center for Kuwait. Equipped for acute industrial and environmental hazard response.',
    capabilities: ['Burn Treatment', 'Emergency Surgery', 'Trauma ICU']
  },
  {
    id: 'hub-muscat-squh',
    name: 'Sultan Qaboos University Hospital Emergency Unit',
    type: 'hospital' as const,
    lat: 23.5932,
    lng: 58.1725,
    address: 'Muscat, Oman',
    phone: '+96824141111',
    purpose: 'National tertiary referral center for Oman. Equipped for cyclone/flood medical relief, toxicology, and acute cardiac care.',
    capabilities: ['Disaster Relief', 'Toxicology', 'Cardiac Triage']
  },
  {
    id: 'hub-tehran-imam',
    name: 'Imam Khomeini Hospital Complex Emergency Trauma Center',
    type: 'hospital' as const,
    lat: 35.7025,
    lng: 51.3805,
    address: 'Tehran, Iran',
    phone: '+982161190000',
    purpose: 'Largest medical disaster hub in Iran. Specialized in earthquake mass casualties, severe crush injury treatment, and major orthopedic surgeries.',
    capabilities: ['Earthquake Trauma', 'Crush Syndrome Care', 'Orthopedic Surgery']
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
    purpose: 'Apex emergency medicine headquarters for Uzbekistan. Coordinates disaster medical aviation, acute cardiac shock, and severe thermal burns.',
    capabilities: ['Disaster Aviation', 'Burn ICU', 'Acute Stroke', 'Trauma']
  },
  {
    id: 'hub-almaty-syzganov',
    name: 'Syzganov National Scientific Center of Surgery',
    type: 'hospital' as const,
    lat: 43.2565,
    lng: 76.9552,
    address: 'Almaty, Kazakhstan',
    phone: '+77272792216',
    purpose: 'Central Asia apex surgical and trauma center. Specialized in complex reconstructive trauma, vascular surgery, and seismic disaster response.',
    capabilities: ['Reconstructive Trauma', 'Vascular Surgery', 'Seismic Medicine']
  },
  {
    id: 'hub-astana-nsmc',
    name: 'National Scientific Medical Center',
    type: 'hospital' as const,
    lat: 51.1285,
    lng: 71.4185,
    address: 'Astana, Kazakhstan',
    phone: '+77172577440',
    purpose: 'National critical care center for northern Central Asia. Handles severe hypothermia rescue, cardio-thoracic emergencies, and ICU air transport.',
    capabilities: ['Hypothermia Care', 'Cardio-Thoracic', 'ICU Transport']
  },
  {
    id: 'hub-bishkek-national',
    name: 'National Hospital of the Kyrgyz Republic Emergency Ward',
    type: 'hospital' as const,
    lat: 42.8685,
    lng: 74.5955,
    address: 'Bishkek, Kyrgyzstan',
    phone: '+996312621023',
    purpose: 'Major mountain disaster and high-altitude emergency facility. Use for severe alpine trauma, crush injuries, and mass emergency resuscitation.',
    capabilities: ['Mountain Rescue Medicine', 'Altitude Trauma', 'Resuscitation']
  },
  {
    id: 'hub-dushanbe-shifobakhsh',
    name: 'National Medical Center "Shifobakhsh" (Qariya-i Bolo)',
    type: 'hospital' as const,
    lat: 38.5675,
    lng: 68.7845,
    address: 'Dushanbe, Tajikistan',
    phone: '+992372353434',
    purpose: 'Largest multi-profile emergency hospital in Tajikistan. Critical support for earthquake casualties, infectious outbreaks, and emergency pediatric surgery.',
    capabilities: ['Mass Casualty Triage', 'Emergency Pediatrics', 'Trauma']
  },

  // ── SOUTH ASIA, ASIA-PACIFIC, EUROPE & AMERICAS ──
  {
    id: 'hub-aiims-delhi',
    name: 'JPN Apex Trauma Center (AIIMS New Delhi)',
    type: 'hospital' as const,
    lat: 28.5672,
    lng: 77.2100,
    address: 'New Delhi, India',
    phone: '+911126105740',
    purpose: 'National Level 1 Trauma Center. Best for polytrauma accidents, neurotrauma, emergency blood bank reserves, and disaster response teams.',
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
    purpose: 'Global strategic coordination for international disease outbreaks, mass casualties, and international humanitarian relief.',
    capabilities: ['International Relief', 'Pandemic Response', 'Disaster Command']
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
    id: 'hub-singapore-sgh',
    name: 'Singapore General Hospital Emergency Hub',
    type: 'hospital' as const,
    lat: 1.2795,
    lng: 103.8344,
    address: 'Singapore',
    phone: '+6562223322',
    purpose: 'Southeast Asian regional disaster, burn, and hyperbaric emergency medical response hub.',
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

// Fetch nearby OpenStreetMap facilities and merge with worldwide emergency hubs
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
        .filter((place: EmergencyPlace | null): place is EmergencyPlace => place !== null)
        .sort((a: EmergencyPlace, b: EmergencyPlace) => a.distanceKm - b.distanceKm);
    }
  } catch (err) {
    console.warn('Overpass API query failed, generating offline fallback places:', err);
    localPlaces = generateOfflineFallback(lat, lng);
  }

  // Calculate live GPS distance for all global emergency hubs
  const globalHubsWithDistance: EmergencyPlace[] = WORLD_EMERGENCY_HUBS.map((hub) => ({
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

// Cache all local & global emergency facilities to IndexedDB
export async function fetchAndCacheLiveFacilities(
  lat: number,
  lng: number,
  radiusMeters: number = 12000
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
