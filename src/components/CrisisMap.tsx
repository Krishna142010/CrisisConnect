import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Incident, Resource, ExternalEvent, MatchRecommendation, Priority, Category, PRIORITY_CONFIG } from '../types';
import { MAP_STYLE } from '../utils/constants';
import { calculateDistance, getFacilityPurpose, WORLD_EMERGENCY_HUBS } from '../services/emergencyPlacesService';

interface CrisisMapProps {
  incidents: Incident[];
  resources: Resource[];
  externalEvents: ExternalEvent[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident | null) => void;
  filters: { priorities: Priority[]; categories: Category[] };
  matches: MatchRecommendation[];
  userLocation?: [number, number] | null; // [lng, lat]
}

export function CrisisMap({
  incidents,
  resources,
  externalEvents,
  selectedIncident,
  onSelectIncident,
  filters,
  matches,
  userLocation
}: CrisisMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const incidentsRef = useRef(incidents);
  const onSelectRef = useRef(onSelectIncident);
  const userLocationRef = useRef(userLocation);

  incidentsRef.current = incidents;
  onSelectRef.current = onSelectIncident;
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initialLng = userLocation ? userLocation[0] : 78.57;
    const initialLat = userLocation ? userLocation[1] : 28.58;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [initialLng, initialLat],
      zoom: 12
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);

      map.current!.addSource('incidents', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40
      });

      map.current!.addSource('resources', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current!.addSource('matches', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current!.addSource('events', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // External Disaster Events Layer
      map.current!.addLayer({
        id: 'events-layer',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-color': '#a855f7',
          'circle-radius': 6,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Incident Clusters & Points
      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'incidents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#ef4444',
          'circle-radius': ['step', ['get', 'point_count'], 14, 5, 18, 15, 24],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current!.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'incidents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: { 'text-color': '#ffffff' }
      });

      map.current!.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'incidents',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 9,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Emergency Facilities Layer
      map.current!.addLayer({
        id: 'resources-layer',
        type: 'circle',
        source: 'resources',
        paint: {
          'circle-color': '#10b981',
          'circle-radius': 8.5,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current!.addLayer({
        id: 'resources-label',
        type: 'symbol',
        source: 'resources',
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#6ee7b7',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2
        }
      });

      // Dynamic Emergency Dispatch Lines
      map.current!.addLayer({
        id: 'matches-layer',
        type: 'line',
        source: 'matches',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 3,
          'line-dasharray': [3, 2]
        }
      });

      // Click on facility directly -> Shows Info Popup
      map.current!.on('click', 'resources-layer', (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const props = feature.properties as any;
        const coordinates = (feature.geometry as any).coordinates.slice();

        const uLoc = userLocationRef.current;
        const distText = uLoc
          ? `${calculateDistance(uLoc[1], uLoc[0], coordinates[1], coordinates[0])} km from your GPS`
          : 'Computing distance...';

        const matchedHub = WORLD_EMERGENCY_HUBS.find(h => h.name === props.name);
        const purposeText = matchedHub ? matchedHub.purpose : getFacilityPurpose('hospital', props.name).purpose;

        const popupContent = `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; color: #111827; max-width: 280px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px; color: #0f172a;">${props.name}</div>
            <div style="font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 6px;">📍 ${distText}</div>
            <div style="font-size: 12px; color: #334155; line-height: 1.35; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 7px; border-radius: 6px;">
              <strong style="color: #4f46e5;">What to use for:</strong><br/>
              ${purposeText}
            </div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="tel:${props.phone || '112'}" style="flex: 1; text-align: center; background: #10b981; color: white; padding: 7px 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">📞 Call</a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #3b82f6; color: white; padding: 7px 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">🧭 Route</a>
            </div>
          </div>
        `;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ offset: 12 })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current!);
      });

      // Click on incident directly -> Trigger selection
      map.current!.on('click', 'unclustered-point', (e) => {
        const feature = e.features![0];
        const incidentId = feature.properties!.id;
        const incident = incidentsRef.current.find(i => i.id === incidentId);
        if (incident) onSelectRef.current(incident);
      });

      map.current!.on('mouseenter', 'resources-layer', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'resources-layer', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // ── KEY FEATURE: When an issue is selected, frame BOTH the issue and its nearest emergency facility ──
  useEffect(() => {
    if (!map.current || !selectedIncident) return;

    // Find the matched resource or the closest facility
    const matchedLink = matches.find(m => m.incidentId === selectedIncident.id);
    let targetFacility = matchedLink ? resources.find(r => r.id === matchedLink.resourceId) : null;

    if (!targetFacility && resources.length > 0) {
      targetFacility = resources.reduce((closest, r) => {
        const d = calculateDistance(selectedIncident.lat, selectedIncident.lng, r.lat, r.lng);
        if (!closest) return { res: r, dist: d };
        return d < closest.dist ? { res: r, dist: d } : closest;
      }, null as { res: Resource; dist: number } | null)?.res || null;
    }

    if (targetFacility) {
      // Calculate bounding box containing BOTH the incident and the emergency facility
      const minLng = Math.min(selectedIncident.lng, targetFacility.lng);
      const maxLng = Math.max(selectedIncident.lng, targetFacility.lng);
      const minLat = Math.min(selectedIncident.lat, targetFacility.lat);
      const maxLat = Math.max(selectedIncident.lat, targetFacility.lat);

      map.current.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: { top: 90, bottom: 90, left: 90, right: 380 }, maxZoom: 15, duration: 1200 }
      );

      const distKm = calculateDistance(selectedIncident.lat, selectedIncident.lng, targetFacility.lat, targetFacility.lng);
      const guide = getFacilityPurpose('hospital', targetFacility.name);

      const popupHTML = `
        <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; color: #f8fafc; background: #0f172a; border-radius: 10px; max-width: 320px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px;">
              ${selectedIncident.triage.priority}
            </span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">📍 ${selectedIncident.locationName}</span>
          </div>

          <div style="font-size: 13px; font-weight: 600; color: #ffffff; line-height: 1.35; margin-bottom: 10px;">
            "${selectedIncident.rawText.slice(0, 110)}${selectedIncident.rawText.length > 110 ? '...' : ''}"
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 8px;">
            <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 2px;">
              🏥 Nearest Facility to Call / Go To:
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #34d399;">
              ${targetFacility.name}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin: 3px 0;">
              Distance: <strong style="color: #f1f5f9;">${distKm} km away</strong>
            </div>
            <div style="font-size: 11px; color: #cbd5e1; background: #1e293b; padding: 6px 8px; border-radius: 6px; margin: 6px 0; border: 1px solid #334155; line-height: 1.3;">
              <strong>What it is used for:</strong> ${guide.purpose}
            </div>

            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <a href="tel:${targetFacility.phone || '112'}" style="flex: 1; text-align: center; background: #10b981; color: white; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                📞 Call (${targetFacility.phone || '112'})
              </a>
              <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedIncident.lat},${selectedIncident.lng}&destination=${targetFacility.lat},${targetFacility.lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #3b82f6; color: white; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                🧭 Route
              </a>
            </div>
          </div>
        </div>
      `;

      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({ offset: 15, closeButton: true })
        .setLngLat([selectedIncident.lng, selectedIncident.lat])
        .setHTML(popupHTML)
        .addTo(map.current);
    } else {
      map.current.flyTo({ center: [selectedIncident.lng, selectedIncident.lat], zoom: 14, duration: 1000 });
    }
  }, [selectedIncident, matches, resources]);

  // Sync GPS user beacon
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.backgroundColor = '#38bdf8';
      el.style.borderRadius = '50%';
      el.style.boxShadow = '0 0 0 8px rgba(56, 189, 248, 0.4)';
      el.style.border = '2px solid #ffffff';

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(userLocation)
        .addTo(map.current);
    } else {
      userMarkerRef.current.setLngLat(userLocation);
    }
  }, [userLocation, mapLoaded]);

  // Sync Incidents
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const filteredIncidents = incidents.filter(i =>
      filters.priorities.includes(i.triage.priority) &&
      filters.categories.includes(i.triage.category)
    );

    const incidentFeatures = filteredIncidents.map(incident => ({
      type: 'Feature' as const,
      properties: {
        id: incident.id,
        priority: incident.triage.priority,
        color: PRIORITY_CONFIG[incident.triage.priority].color,
        category: incident.triage.category
      },
      geometry: { type: 'Point' as const, coordinates: [incident.lng, incident.lat] }
    }));

    (map.current.getSource('incidents') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: incidentFeatures
    });
  }, [incidents, filters, mapLoaded]);

  // Sync Resources
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const resourceFeatures = resources.map(r => ({
      type: 'Feature' as const,
      properties: { id: r.id, name: r.name, phone: r.phone || '112' },
      geometry: { type: 'Point' as const, coordinates: [r.lng, r.lat] }
    }));

    (map.current.getSource('resources') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: resourceFeatures
    });
  }, [resources, mapLoaded]);

  // Sync Matches Lines
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const matchFeatures = matches.map(match => {
      const incident = incidents.find(i => i.id === match.incidentId);
      const resource = resources.find(r => r.id === match.resourceId);
      if (!incident || !resource) return null;

      return {
        type: 'Feature' as const,
        properties: { id: `${match.incidentId}-${match.resourceId}` },
        geometry: {
          type: 'LineString' as const,
          coordinates: [[incident.lng, incident.lat], [resource.lng, resource.lat]]
        }
      };
    }).filter(Boolean) as any;

    (map.current.getSource('matches') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: matchFeatures
    });
  }, [matches, incidents, resources, mapLoaded]);

  // Sync External Events
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const eventFeatures = externalEvents.map(evt => ({
      type: 'Feature' as const,
      properties: { id: evt.id, type: evt.type, severity: evt.severity },
      geometry: { type: 'Point' as const, coordinates: [evt.lng, evt.lat] }
    }));
    (map.current.getSource('events') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: eventFeatures
    });
  }, [externalEvents, mapLoaded]);

  return <div ref={mapContainer} className="map-container" style={{ width: '100%', height: '100%' }} />;
}
