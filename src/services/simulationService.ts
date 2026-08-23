import { Incident, Resource, Priority, Category, ResourceCapability } from '../types';
import { fallbackTriage } from './triageService';

const SOS_MESSAGES = [
  'Water rising fast at 4210 Elm Street, 3 kids trapped on 2nd floor, need rescue boat NOW',
  'Elderly woman at Pine Ridge Apartments needs insulin urgently, diabetic shock imminent',
  'Power lines down on Oak Avenue, electrical fire spreading to adjacent homes',
  'Family of 5 stranded on roof at 789 Maple Drive, water at chest level',
  'Gas leak detected near Central Elementary School, 200 students sheltering in place',
  'Need drinking water for 15 people at the Community Center on Main St',
  'Severe asthma attack, out of inhalers, location is 550 West Ave',
  'Bridge washed out on County Road 4, two cars trapped in swift water',
  'Building collapsed at 3rd and Washington, multiple people trapped inside',
  'Shelter needed for 4 people, house destroyed by storm, currently at gas station on Route 9',
  'Medical emergency, pregnant woman in labor, roads flooded, cannot reach hospital',
  'Chemical spill on highway overpass, strong fumes, difficulty breathing',
  'Need blankets and warm clothes for 8 people stranded outdoors near the park',
  'Tree fell on house at 1024 Forest Lane, 2 people injured inside',
  'Nursing home generator failed, need oxygen and power immediately for 30 residents',
  'Out of food and baby formula, stuck in apartment at 88 Riverside Drive for 3 days',
  'Flash flood sweeping cars away near downtown intersection, please send boats',
  'Fire spreading rapidly towards subdivision off Highway 6, need evacuation assistance',
  'Diabetic person passed out, needs medical help at 440 Pine Street',
  'Drinking water contaminated, we have 12 people sick at the temporary camp',
  'Road blocked by debris, emergency supplies cannot reach 50 people at the church',
  'Roof caved in at warehouse, at least 5 workers trapped underneath',
  'Need urgent evacuation, water is entering the first floor of our house on River Road',
  'Transformer exploded, large fire threatening residential area on the east side',
  'Lost child wandering near the flooded creek by Oakwood Park, needs rescue',
  'Ran out of medication for heart condition, roads impassable, 70 year old man',
  'Temporary shelter at high school flooded, moving to second floor, need relocation',
  'Multiple traffic accidents due to zero visibility, injuries reported on I-95 North',
  'Need food and water for 25 people sheltering at the local library',
  'Chemical plant emitting yellow smoke, residents downwind complaining of burning eyes'
];

const VOLUNTEER_NAMES = [
  'John Smith', 'Sarah Davis', 'Mike Johnson', 'Emily Brown', 'Chris Wilson',
  'Jessica Taylor', 'David Miller', 'Ashley Moore', 'James Taylor', 'Lisa Anderson',
  'Robert Thomas', 'Megan Jackson', 'William White', 'Amanda Harris', 'Richard Martin',
  'Jennifer Thompson', 'Joseph Garcia', 'Elizabeth Martinez', 'Thomas Robinson', 'Maria Clark'
];

const RESOURCE_CAPABILITIES: ResourceCapability[] = ['BOAT', 'VEHICLE_4X4', 'MEDICAL_KIT', 'FOOD_WATER', 'GENERAL'];

export const generateSimulatedIncident = (center: {lat: number, lng: number}): Incident => {
  const randomLatOffset = (Math.random() - 0.5) * 0.2;
  const randomLngOffset = (Math.random() - 0.5) * 0.2;
  
  const rawText = SOS_MESSAGES[Math.floor(Math.random() * SOS_MESSAGES.length)];
  
  const triage = fallbackTriage(rawText);
  
  const rand = Math.random();
  let priority: Priority = 'P3_SUPPLIES';
  if (rand < 0.2) priority = 'P1_CRITICAL';
  else if (rand < 0.5) priority = 'P2_URGENT';
  else if (rand < 0.85) priority = 'P3_SUPPLIES';
  else priority = 'P4_INFORMATIONAL';

  triage.priority = priority;

  return {
    id: crypto.randomUUID(),
    rawText,
    triage,
    lat: center.lat + randomLatOffset,
    lng: center.lng + randomLngOffset,
    locationName: triage.extractedLocation,
    status: 'ACTIVE',
    createdAt: Date.now() - Math.floor(Math.random() * 3600000), // Within last hour
    updatedAt: Date.now()
  };
};

export const generateSimulatedResource = (center: {lat: number, lng: number}): Resource => {
  const randomLatOffset = (Math.random() - 0.5) * 0.3;
  const randomLngOffset = (Math.random() - 0.5) * 0.3;
  
  const numCapabilities = Math.floor(Math.random() * 3) + 1;
  const shuffledCaps = [...RESOURCE_CAPABILITIES].sort(() => 0.5 - Math.random());
  const capabilities = shuffledCaps.slice(0, numCapabilities);
  
  return {
    id: crypto.randomUUID(),
    name: VOLUNTEER_NAMES[Math.floor(Math.random() * VOLUNTEER_NAMES.length)],
    lat: center.lat + randomLatOffset,
    lng: center.lng + randomLngOffset,
    capabilities,
    capacityRemaining: Math.floor(Math.random() * 6) + 1,
    isActive: true,
    phone: `555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`
  };
};

export const generateInitialResources = (center: {lat: number, lng: number}, count: number): Resource[] => {
  const resources: Resource[] = [];
  for (let i = 0; i < count; i++) {
    resources.push(generateSimulatedResource(center));
  }
  return resources;
};
