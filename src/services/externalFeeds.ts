import { ExternalEvent } from '../types';

export const fetchUSGSEarthquakes = async (): Promise<ExternalEvent[]> => {
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson');
    if (!response.ok) throw new Error('Failed to fetch USGS earthquakes');
    
    const data = await response.json();
    
    return data.features.map((feature: any) => {
      const mag = feature.properties.mag;
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (mag >= 6) severity = 'high';
      else if (mag >= 4) severity = 'medium';
      
      return {
        id: feature.id,
        title: feature.properties.title,
        type: 'earthquake',
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        magnitude: mag,
        severity,
        source: 'USGS',
        url: feature.properties.url,
        timestamp: feature.properties.time
      } as ExternalEvent;
    });
  } catch (error) {
    console.error('Error fetching USGS data:', error);
    return [];
  }
};

export const fetchNASAEvents = async (): Promise<ExternalEvent[]> => {
  try {
    const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20');
    if (!response.ok) throw new Error('Failed to fetch NASA EONET events');
    
    const data = await response.json();
    
    return data.events.map((event: any) => {
      if (!event.geometry || event.geometry.length === 0) return null;
      
      let type: 'earthquake' | 'flood' | 'wildfire' | 'storm' | 'volcano' = 'storm';
      const categoryId = event.categories[0]?.id;
      
      if (categoryId === 'wildfires') type = 'wildfire';
      else if (categoryId === 'severeStorms') type = 'storm';
      else if (categoryId === 'volcanoes') type = 'volcano';
      else if (categoryId === 'floods') type = 'flood';
      else if (categoryId === 'earthquakes') type = 'earthquake';

      const geom = event.geometry[event.geometry.length - 1]; // Get latest geometry
      if (!geom || !geom.coordinates) return null;

      return {
        id: event.id,
        title: event.title,
        type,
        lat: geom.coordinates[1],
        lng: geom.coordinates[0],
        severity: 'medium',
        source: 'NASA EONET',
        url: event.sources?.[0]?.url,
        timestamp: new Date(geom.date).getTime()
      } as ExternalEvent;
    }).filter(Boolean) as ExternalEvent[];
  } catch (error) {
    console.error('Error fetching NASA data:', error);
    return [];
  }
};

export const fetchAllExternalEvents = async (): Promise<ExternalEvent[]> => {
  try {
    const [earthquakes, nasaEvents] = await Promise.all([
      fetchUSGSEarthquakes(),
      fetchNASAEvents()
    ]);
    
    return [...earthquakes, ...nasaEvents];
  } catch (error) {
    console.error('Error fetching all external events:', error);
    return [];
  }
};
