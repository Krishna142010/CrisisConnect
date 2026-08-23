import { Incident, Resource, MatchRecommendation, PRIORITY_CONFIG } from '../types';
import { haversineDistance } from '../utils/haversine';

export const matchIncidentsToResources = (
  incidents: Incident[], 
  resources: Resource[], 
  maxRadiusKm: number = 25
): MatchRecommendation[] => {
  const recommendations: MatchRecommendation[] = [];
  
  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
  
  const sortedIncidents = activeIncidents.sort((a, b) => {
    const weightA = PRIORITY_CONFIG[a.triage.priority].weight;
    const weightB = PRIORITY_CONFIG[b.triage.priority].weight;
    
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    return a.createdAt - b.createdAt;
  });

  const availableResources = resources.map(r => ({ ...r }));

  for (const incident of sortedIncidents) {
    let bestMatch: { resource: Resource; score: number; distance: number } | null = null;

    for (const resource of availableResources) {
      if (!resource.isActive || resource.capacityRemaining <= 0) continue;

      const distance = haversineDistance(incident.lat, incident.lng, resource.lat, resource.lng);
      if (distance > maxRadiusKm) continue;

      const waitingHours = (Date.now() - incident.createdAt) / (1000 * 60 * 60);
      const urgencyWeight = PRIORITY_CONFIG[incident.triage.priority].weight;
      
      let score = urgencyWeight - (distance * 2.5) + Math.min(waitingHours * 5, 25);

      let capabilityBonus = 0;
      const { category } = incident.triage;
      const caps = resource.capabilities;

      if (category === 'RESCUE' && (caps.includes('BOAT') || caps.includes('VEHICLE_4X4'))) capabilityBonus += 20;
      else if (category === 'MEDICAL' && caps.includes('MEDICAL_KIT')) capabilityBonus += 20;
      else if (category === 'FOOD_WATER' && caps.includes('FOOD_WATER')) capabilityBonus += 20;
      else if (category === 'SHELTER' && caps.includes('GENERAL')) capabilityBonus += 20;
      else if (category === 'HAZARD' && caps.includes('GENERAL')) capabilityBonus += 20;

      score += capabilityBonus;

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { resource, score, distance };
      }
    }

    if (bestMatch) {
      const allocatedAmount = Math.min(incident.triage.peopleCount, bestMatch.resource.capacityRemaining);
      bestMatch.resource.capacityRemaining -= allocatedAmount;
      
      recommendations.push({
        incidentId: incident.id,
        resourceId: bestMatch.resource.id,
        score: parseFloat(bestMatch.score.toFixed(2)),
        distanceKm: parseFloat(bestMatch.distance.toFixed(2)),
        allocatedCapacity: allocatedAmount
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score);
};
