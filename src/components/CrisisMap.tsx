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
}

export function CrisisMap({
  incidents,
  resources,
  externalEvents,
  selectedIncident,
  onSelectIncident,
  filters,
  matches
}: CrisisMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const incidentsRef = useRef(incidents);
  const onSelectRef = useRef(onSelectIncident);

  // Keep refs up to date with latest props
  incidentsRef.current = incidents;
  onSelectRef.current = onSelectIncident;

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add sources
      map.current!.addSource('incidents', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 50,
        clusterProperties: {
          hasCritical: ['max', ['case', ['==', ['get', 'priority'], 'P1_CRITICAL'], 1, 0]]
        }
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

      // Add layers
      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'incidents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'hasCritical'], 1], '#ef4444',
            ['step', ['get', 'point_count'], '#eab308', 20, '#f97316']
          ],
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 20, 25],
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
        paint: {
          'text-color': '#ffffff'
        }
      });

      map.current!.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'incidents',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current!.addLayer({
        id: 'resources-layer',
        type: 'circle',
        source: 'resources',
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current!.addLayer({
        id: 'matches-layer',
        type: 'line',
        source: 'matches',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [5, 5]
        }
      });

      map.current!.addLayer({
        id: 'events-layer',
        type: 'circle',
        source: 'events',
        paint: {
          'circle-color': '#8b5cf6',
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Interactions
      map.current!.on('click', 'clusters', async (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties!.cluster_id;
        try {
          const zoom = await (map.current!.getSource('incidents') as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId);
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        } catch (err) {
          console.error('Cluster zoom failed:', err);
        }
      });

      map.current!.on('click', 'unclustered-point', (e) => {
        const feature = e.features![0];
        const incidentId = feature.properties!.id;
        const incident = incidentsRef.current.find(i => i.id === incidentId);
        if (incident) {
          onSelectRef.current(incident);
        }
      });

      map.current!.on('mouseenter', 'clusters', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'clusters', () => {
        map.current!.getCanvas().style.cursor = '';
      });
      map.current!.on('mouseenter', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      geometry: {
        type: 'Point' as const,
        coordinates: [incident.lng, incident.lat]
      }
    }));

    (map.current.getSource('incidents') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: incidentFeatures
    });
  }, [incidents, filters, mapLoaded]);

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

  useEffect(() => {
    if (!mapLoaded || !map.current || !selectedIncident) return;
    map.current.flyTo({
      center: [selectedIncident.lng, selectedIncident.lat],
      zoom: 14,
      essential: true
    });
  }, [selectedIncident, mapLoaded]);

  return <div ref={mapContainer} className="map-container" style={{ width: '100%', height: '100%' }} />;
}
