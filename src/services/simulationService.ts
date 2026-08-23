import { Incident, Resource, Priority, ResourceCapability } from '../types';
import { fallbackTriage } from './triageService';
import { getReverseGeocodedLocation } from './emergencyPlacesService';
import { saveIncident } from './offlineDB';

const SOS_MESSAGES = [
  'Flash flood water rising rapidly, 3 people trapped on rooftop, urgent rescue needed',
  'Elderly patient with severe medical distress, roads flooded, urgent ambulance required',
  'Electrical line down and fire hazard spreading to residential structures',
  'Family stranded near riverbank with water level rising quickly, need boat rescue',
  'Structural damage and wall collapse reported, 2 people trapped under debris',
  'Emergency drinking water and medical supplies needed at local community center',
  'Severe asthma attack, oxygen supply depleted, cannot reach hospital due to road blockage',
  'Bridge submerged by flash flood, multiple vehicles stranded in swift water',
  'Relief shelter overflowing, urgent requirement for clean drinking water and food packets',
  'Tree fell on residential home, injuries reported, emergency triage needed',
  'Transformer explosion causing localized fire near residential block',
  'Flash flood sweeping across low-lying roads, urgent evacuation assistance requested'
];

const EMERGENCY_UNITS = [
  { name: 'District Emergency Medical Center', capabilities: ['MEDICAL_KIT', 'GENERAL'] as ResourceCapability[] },
  { name: 'Civil Defense & Quick Response Team', capabilities: ['BOAT', 'VEHICLE_4X4', 'GENERAL'] as ResourceCapability[] },
  { name: 'Red Cross Disaster Relief Post', capabilities: ['FOOD_WATER', 'MEDICAL_KIT'] as ResourceCapability[] },
  { name: 'Fire & Rescue Response Squad', capabilities: ['VEHICLE_4X4', 'GENERAL'] as ResourceCapability[] },
  { name: 'Community Emergency Clinic', capabilities: ['MEDICAL_KIT'] as ResourceCapability[] },
  { name: 'Flood Rescue & Boat Dispatch Unit', capabilities: ['BOAT', 'VEHICLE_4X4'] as ResourceCapability[] },
  { name: 'Emergency Supplies & Food Depot', capabilities: ['FOOD_WATER', 'GENERAL'] as ResourceCapability[] },
  { name: 'Disaster Volunteer Taskforce', capabilities: ['GENERAL', 'VEHICLE_4X4'] as ResourceCapability[] }
];

const RESOURCE_CAPABILITIES: ResourceCapability[] = ['BOAT', 'VEHICLE_4X4', 'MEDICAL_KIT', 'FOOD_WATER', 'GENERAL'];

// Precise geodesic radial offset calculator (1 degree lat ~= 111.32 km)
function calculateGeodesicOffset(
  centerLat: number,
  centerLng: number,
  minKm: number,
  maxKm: number
): { lat: number; lng: number } {
  const radiusKm = minKm + Math.random() * (maxKm - minKm);
  const angle = Math.random() * 2 * Math.PI;

  const latOffset = (radiusKm * Math.cos(angle)) / 111.32;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lngOffset = (radiusKm * Math.sin(angle)) / (111.32 * (Math.abs(cosLat) > 0.01 ? cosLat : 1));

  return {
    lat: Number((centerLat + latOffset).toFixed(6)),
    lng: Number((centerLng + lngOffset).toFixed(6))
  };
}

// Extracts lat/lng safely from either {lat, lng} or [lng, lat]
function parseCenter(center: { lat: number; lng: number } | [number, number]): { lat: number; lng: number } {
  if (Array.isArray(center)) {
    return { lat: center[1], lng: center[0] };
  }
  return { lat: center.lat, lng: center.lng };
}

export const generateSimulatedIncident = (
  center: { lat: number; lng: number } | [number, number],
  defaultLocationName?: string
): Incident => {
  const { lat: baseLat, lng: baseLng } = parseCenter(center);
  
  // Incidents placed within 1 to 6 km of the user's live position
  const coords = calculateGeodesicOffset(baseLat, baseLng, 1.0, 6.0);
  const rawText = SOS_MESSAGES[Math.floor(Math.random() * SOS_MESSAGES.length)];
  const triage = fallbackTriage(rawText);

  const rand = Math.random();
  let priority: Priority = 'P3_SUPPLIES';
  if (rand < 0.25) priority = 'P1_CRITICAL';
  else if (rand < 0.55) priority = 'P2_URGENT';
  else if (rand < 0.85) priority = 'P3_SUPPLIES';
  else priority = 'P4_INFORMATIONAL';

  triage.priority = priority;

  const initialLocation =
    defaultLocationName ||
    (triage.extractedLocation && triage.extractedLocation !== 'Unknown Location'
      ? triage.extractedLocation
      : `Sector (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`);

  const incident: Incident = {
    id: crypto.randomUUID(),
    rawText,
    triage,
    lat: coords.lat,
    lng: coords.lng,
    locationName: initialLocation,
    status: 'ACTIVE',
    createdAt: Date.now() - Math.floor(Math.random() * 1800000),
    updatedAt: Date.now()
  };

  // Asynchronously resolve real town/village name via OpenStreetMap Nominatim
  getReverseGeocodedLocation(coords.lat, coords.lng).then(async (resolvedName) => {
    if (resolvedName) {
      incident.locationName = resolvedName;
      // Persist updated locality name to offline IndexedDB
      await saveIncident(incident);
    }
  });

  return incident;
};

export const generateSimulatedResource = (
  center: { lat: number; lng: number } | [number, number],
  index: number = 0
): Resource => {
  const { lat: baseLat, lng: baseLng } = parseCenter(center);
  
  // Distributes local emergency response stations strictly between 2.0 km and 10.0 km
  const coords = calculateGeodesicOffset(baseLat, baseLng, 2.0, 10.0);
  const template = EMERGENCY_UNITS[index % EMERGENCY_UNITS.length];

  return {
    id: crypto.randomUUID(),
    name: template.name,
    lat: coords.lat,
    lng: coords.lng,
    capabilities: template.capabilities,
    capacityRemaining: Math.floor(Math.random() * 8) + 2,
    isActive: true,
    phone: '112'
  };
};

export const generateInitialResources = (
  center: { lat: number; lng: number } | [number, number],
  count: number = 8
): Resource[] => {
  const resources: Resource[] = [];
  for (let i = 0; i < count; i++) {
    resources.push(generateSimulatedResource(center, i));
  }
  return resources;
};
