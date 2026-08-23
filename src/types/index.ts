export type Priority = 'P1_CRITICAL' | 'P2_URGENT' | 'P3_SUPPLIES' | 'P4_INFORMATIONAL';
export type Category = 'RESCUE' | 'MEDICAL' | 'FOOD_WATER' | 'SHELTER' | 'HAZARD';
export type IncidentStatus = 'ACTIVE' | 'DISPATCHED' | 'RESOLVED';
export type ResourceCapability = 'BOAT' | 'VEHICLE_4X4' | 'MEDICAL_KIT' | 'FOOD_WATER' | 'GENERAL';

export interface TriageResult {
  priority: Priority;
  category: Category;
  peopleCount: number;
  hasMedicalCondition: boolean;
  medicalDetails?: string;
  extractedLocation: string;
  summary: string;
  confidence: number;
}

export interface Incident {
  id: string;
  rawText: string;
  triage: TriageResult;
  lat: number;
  lng: number;
  locationName: string;
  status: IncidentStatus;
  createdAt: number;
  updatedAt: number;
  assignedResourceId?: string;
}

export interface Resource {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capabilities: ResourceCapability[];
  capacityRemaining: number;
  isActive: boolean;
  phone?: string;
}

export interface MatchRecommendation {
  incidentId: string;
  resourceId: string;
  score: number;
  distanceKm: number;
  allocatedCapacity: number;
}

export interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  activeVolunteers: number;
  avgResponseTimeMin: number;
  priorityBreakdown: Record<Priority, number>;
  categoryBreakdown: Record<Category, number>;
}

export interface ExternalEvent {
  id: string;
  title: string;
  type: 'earthquake' | 'flood' | 'wildfire' | 'storm' | 'volcano';
  lat: number;
  lng: number;
  magnitude?: number;
  severity: 'low' | 'medium' | 'high';
  source: string;
  url?: string;
  timestamp: number;
}

export const PRIORITY_CONFIG: Record<Priority, { color: string; label: string; icon: string; weight: number }> = {
  P1_CRITICAL: { color: '#ef4444', label: 'Critical', icon: 'AlertTriangle', weight: 100 },
  P2_URGENT: { color: '#f97316', label: 'Urgent', icon: 'Clock', weight: 60 },
  P3_SUPPLIES: { color: '#3b82f6', label: 'Supplies', icon: 'Package', weight: 30 },
  P4_INFORMATIONAL: { color: '#22c55e', label: 'Info', icon: 'Info', weight: 10 },
};

export const CATEGORY_CONFIG: Record<Category, { color: string; label: string; icon: string }> = {
  RESCUE: { color: '#dc2626', label: 'Rescue', icon: 'Anchor' },
  MEDICAL: { color: '#f59e0b', label: 'Medical', icon: 'Heart' },
  FOOD_WATER: { color: '#3b82f6', label: 'Food/Water', icon: 'Droplets' },
  SHELTER: { color: '#8b5cf6', label: 'Shelter', icon: 'Home' },
  HAZARD: { color: '#ef4444', label: 'Hazard', icon: 'AlertOctagon' },
};
