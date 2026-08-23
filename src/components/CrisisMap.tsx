import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Incident, Resource, ExternalEvent, MatchRecommendation, Priority, Category, PRIORITY_CONFIG } from '../types';
import { MAP_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from '../utils/constants';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const incidentsRef = useRef(incidents);
  const onSelectRef = useRef(onSelectIncident);

  incidentsRef.current = incidents;
  onSelectRef.current = onSelectIncident;

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const startLng = userLocation ? userLocation[0] : (typeof DEFAULT_CENTER === 'object' && 'lng' in DEFAULT_CENTER ? (DEFAULT_CENTER as any).lng : 78.57);
    const startLat = userLocation ? userLocation[1] : (typeof DEFAULT_CENTER === 'object' && 'lat' in DEFAULT_CENTER ? (DEFAULT_CENTER as any).lat : 28.58);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [startLng, startLat],
      zoom: userLocation ? 12.5 : DEFAULT_ZOOM
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);

      // Sources
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

      // 1. External Global Hazard Events (Purple)
      map.current!.addLayer({
        id: 'events-layer',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-color': '#a855f7',
          'circle-radius': 7,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // 2. Incident Clusters & Points (Red / Orange / Yellow)
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

      // 3. Local Emergency Services & Facilities Layer (Bright Emerald Green)
      map.current!.addLayer({
        id: 'resources-layer',
        type: 'circle',
        source: 'resources',
        paint: {
          'circle-color': '#10b981',
          'circle-radius': 8,
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
          'text-offset': [0, 1.3],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#34d399',
          'text-halo-color': '#0f172a',
          'text-halo-width': 2
        }
      });

      // 4. Dispatch Match Routing Lines
      map.current!.addLayer({
        id: 'matches-layer',
        type: 'line',
        source: 'matches',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });

      // Click Interactions
      map.current!.on('click', 'unclustered-point', (e) => {
        const feature = e.features![0];
        const incidentId = feature.properties!.id;
        const incident = incidentsRef.current.find(i => i.id === incidentId);
        if (incident) onSelectRef.current(incident);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Center camera directly onto user's location with street/city zoom
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-beacon';
      el.style.width = '18px';
      el.style.height = '18px';
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

    map.current.flyTo({
      center: userLocation,
      zoom: 12.5,
      essential: true
    });
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
      properties: { id: r.id, name: r.name },
      geometry: { type: 'Point' as const, coordinates: [r.lng, r.lat] }
    }));

    (map.current.getSource('resources') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: resourceFeatures
    });
  }, [resources, mapLoaded]);

  // Sync Matches
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
