import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CrisisMap } from './components/CrisisMap';
import { MapControls } from './components/MapControls';
import { ReportModal } from './components/ReportModal';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SimulationControls } from './components/SimulationControls';
import { EmergencyNumbers } from './components/EmergencyNumbers';
import { PeerChat } from './components/PeerChat';
import { AIChatModal } from './components/AIChatModal';
import { initializeAI, isModelLoaded, getAIMode } from './services/triageService';
import { matchIncidentsToResources } from './services/matcherService';
import { generateSimulatedIncident } from './services/simulationService';
import { fetchAndCacheLiveFacilities } from './services/emergencyPlacesService';
import { fetchAllExternalEvents } from './services/externalFeeds';
import { saveIncident, getAllIncidents, saveResource, getAllResources, clearAllData } from './services/offlineDB';
import { DEFAULT_CENTER, SIMULATION_INTERVAL_MS, SIMULATION_TOTAL_EVENTS } from './utils/constants';
import type { Incident, Resource, MatchRecommendation, ExternalEvent, Priority, Category } from './types';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'resources'>('map');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  const [aiModelLoaded, setAiModelLoaded] = useState(false);
  const [aiModelLoading, setAiModelLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationEventsGenerated, setSimulationEventsGenerated] = useState(0);

  const [filters, setFilters] = useState<{ priorities: Priority[], categories: Category[] }>({
    priorities: ['P1_CRITICAL', 'P2_URGENT', 'P3_SUPPLIES', 'P4_INFORMATIONAL'],
    categories: ['RESCUE', 'MEDICAL', 'FOOD_WATER', 'SHELTER', 'HAZARD']
  });

  // Feature modals and live tracking state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isEmergencyNumbersOpen, setIsEmergencyNumbersOpen] = useState(false);
  const [isPeerChatOpen, setIsPeerChatOpen] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const simulationIntervalRef = useRef<number | null>(null);

  const currentCenter = (userLat !== null && userLng !== null)
    ? { lat: userLat, lng: userLng }
    : DEFAULT_CENTER;

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeAI();
      } catch (e) {
        console.error("AI init failed", e);
      }
      setAiModelLoaded(isModelLoaded());
      setAiModelLoading(false);

      // Load offline cached data on start
      const savedIncidents = await getAllIncidents();
      const savedResources = await getAllResources();
      setIncidents(savedIncidents);
      setResources(savedResources);

      if (navigator.onLine) {
        try {
          const events = await fetchAllExternalEvents();
          setExternalEvents(events);
        } catch (e) {
          console.error("Failed to fetch events", e);
        }
      }
    };
    initApp();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsDevMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // IP Geolocation Fallback
    const fetchIPLocation = async () => {
      try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data && data.success !== false && data.latitude && data.longitude) {
          setUserLat(data.latitude);
          setUserLng(data.longitude);
        }
      } catch (err) {
        console.warn('IP geolocation fallback failed:', err);
      }
    };

    // Live GPS tracking
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => {
          console.warn('GPS initial fix failed, attempting IP fallback:', err.message);
          fetchIPLocation();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => console.warn('GPS tracking unavailable:', err.message),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
      );
    } else {
      fetchIPLocation();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch real OpenStreetMap hospitals/emergency facilities for current GPS coordinates
  useEffect(() => {
    if (userLat === null || userLng === null) return;

    const loadLocalEmergencyData = async () => {
      try {
        const facilities = await fetchAndCacheLiveFacilities(userLat, userLng, 15000);
        setResources(facilities);

        const currentIncidents = await getAllIncidents();
        if (currentIncidents.length === 0) {
          const initialIncidents = [
            generateSimulatedIncident({ lat: userLat, lng: userLng }),
            generateSimulatedIncident({ lat: userLat, lng: userLng }),
            generateSimulatedIncident({ lat: userLat, lng: userLng })
          ];
          for (const inc of initialIncidents) {
            await saveIncident(inc);
          }
          setIncidents(initialIncidents);
        }
      } catch (err) {
        console.warn('Could not sync live OpenStreetMap data, loading cached resources:', err);
        const cached = await getAllResources();
        setResources(cached);
      }
    };

    loadLocalEmergencyData();
  }, [userLat, userLng]);

  // Recalculate resource-incident allocation matches
  useEffect(() => {
    const newMatches = matchIncidentsToResources(incidents.filter(i => i.status === 'ACTIVE'), resources);
    setMatches(newMatches);
  }, [incidents, resources]);

  // ── KEY FIX: Instant submission & background resource discovery ──
  const handleNewIncident = useCallback((incident: Incident) => {
    // 1. Immediately update state and IndexedDB without waiting for network calls
    setIncidents(prev => [incident, ...prev]);
    saveIncident(incident);

    // 2. Immediately switch to map view and focus on the incident
    setActiveTab('map');
    setSelectedIncident(incident);

    // 3. In the background, fetch facilities for the new target area (e.g. NYC / London) and recompute routing
    fetchAndCacheLiveFacilities(incident.lat, incident.lng, 15000)
      .then((extraFacilities) => {
        if (extraFacilities && extraFacilities.length > 0) {
          setResources((prev) => {
            const existingIds = new Set(prev.map(r => r.id));
            const newlyDiscovered = extraFacilities.filter(f => !existingIds.has(f.id));
            const merged = [...newlyDiscovered, ...prev];

            // Recompute dispatch routing matches with the newly discovered facilities
            const directMatches = matchIncidentsToResources([incident], merged);
            setMatches(prevMatches => {
              const filtered = prevMatches.filter(m => m.incidentId !== incident.id);
              return [...directMatches, ...filtered];
            });

            return merged;
          });
        }
      })
      .catch((err) => console.warn('Background facilities fetch error:', err));
  }, []);
  
  const handleStartSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimulationEventsGenerated(0);
    setSimulationProgress(0);

    let count = 0;
    simulationIntervalRef.current = window.setInterval(() => {
      count++;
      const newInc = generateSimulatedIncident(currentCenter as any);
      handleNewIncident(newInc);

      setSimulationEventsGenerated(count);
      setSimulationProgress((count / SIMULATION_TOTAL_EVENTS) * 100);

      if (count >= SIMULATION_TOTAL_EVENTS) {
        if (simulationIntervalRef.current) window.clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
      }
    }, SIMULATION_INTERVAL_MS);
  }, [handleNewIncident, currentCenter]);

  const handleStopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) window.clearInterval(simulationIntervalRef.current);
    setIsSimulating(false);
  }, []);

  const handleReset = useCallback(async () => {
    handleStopSimulation();
    await clearAllData();
    setIncidents([]);
    const facilities = await fetchAndCacheLiveFacilities(currentCenter.lat, currentCenter.lng, 10000);
    setResources(facilities);
    setMatches([]);
    setSelectedIncident(null);
  }, [handleStopSimulation, currentCenter]);

  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#111827' }}>
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        aiModelLoaded={aiModelLoaded}
        aiModelLoading={aiModelLoading}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <OfflineIndicator isOnline={isOnline} pendingSyncCount={pendingSyncCount} />

      <div className="app-body" style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'map' && (
          <div className="map-container" style={{ flex: 1, position: 'relative' }}>
            <CrisisMap 
              incidents={incidents}
              resources={resources}
              externalEvents={externalEvents}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
              filters={filters}
              matches={matches}
              userLocation={userLat !== null && userLng !== null ? [userLng, userLat] : null}
            />
            <MapControls 
              filters={filters}
              onFilterChange={setFilters}
              incidentCount={incidents.length}
              activeCount={incidents.filter(i => i.status === 'ACTIVE').length}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <Dashboard incidents={incidents} resources={resources} matches={matches} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <h2 className="accent-text" style={{ marginBottom: '16px', color: 'white' }}>Active Volunteers & Emergency Facilities</h2>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {resources.filter(r => r.isActive).map(resource => (
                <div key={resource.id} className="glass-card" style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#1f2937' }}>
                  <div className="resource-card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="resource-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                      {resource.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white' }}>{resource.name}</div>
                      <div className="resource-capabilities" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {resource.capabilities.map(cap => (
                          <span key={cap} className="capability-tag" style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#374151', color: '#d1d5db' }}>
                            {cap.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                      <div className="text-muted text-sm" style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '4px' }}>
                        Capacity: {resource.capacityRemaining} Available
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <Sidebar 
            isOpen={isSidebarOpen}
            incidents={incidents}
            resources={resources}
            matches={matches}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            onResolveIncident={handleResolveIncident}
          />
        )}
      </div>

      {/* ── Floating Action Buttons (Bottom Right) ── */}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '12px', 
          zIndex: 999 
        }}
      >
        {/* 1. AI Assistant Button */}
        <button
          onClick={() => setIsAIChatOpen(true)}
          title="Talk with AI Assistant"
          style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#8b5cf6', color: 'white', fontSize: '22px', border: 'none', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          🤖
        </button>

        {/* 2. Bluetooth Mesh Chat Button */}
        <button
          onClick={() => setIsPeerChatOpen(true)}
          title="Bluetooth Mesh Chat"
          style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', fontSize: '20px', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          📡
        </button>

        {/* 3. Emergency Numbers & Facilities Button */}
        <button
          onClick={() => setIsEmergencyNumbersOpen(true)}
          title="Emergency Helplines & Nearby Centers"
          style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#22c55e', color: 'white', fontSize: '20px', border: 'none', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          📞
        </button>

        {/* 4. SOS Emergency Report Button */}
        <button 
          onClick={() => setIsReportModalOpen(true)} 
          title="Report Emergency"
          style={{ 
            position: 'relative',
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#ef4444', 
            color: 'white', 
            fontSize: '22px', 
            fontWeight: 'bold',
            border: 'none', 
            boxShadow: '0 0 16px rgba(239, 68, 68, 0.7)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          🆘
        </button>
      </div>

      {/* Modals */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        isOnline={isOnline}
      />

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleNewIncident}
        aiModelLoaded={aiModelLoaded}
        userLat={userLat}
        userLng={userLng}
      />

      <EmergencyNumbers
        isOpen={isEmergencyNumbersOpen}
        onClose={() => setIsEmergencyNumbersOpen(false)}
        userLat={userLat}
        userLng={userLng}
      />

      <PeerChat
        isOpen={isPeerChatOpen}
        onClose={() => setIsPeerChatOpen(false)}
        userLat={userLat}
        userLng={userLng}
      />

      <SimulationControls 
        isVisible={isDevMode}
        isSimulating={isSimulating}
        onStartSimulation={handleStartSimulation}
        onStopSimulation={handleStopSimulation}
        onReset={handleReset}
        progress={simulationProgress}
        eventsGenerated={simulationEventsGenerated}
      />

      {aiModelLoading && (
        <div className="model-loading" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(31, 41, 55, 0.9)', padding: '8px 16px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 100, color: 'white', fontSize: '0.875rem' }}>
          <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Loading AI Model for offline triage...</span>
        </div>
      )}
    </div>
  );
}
