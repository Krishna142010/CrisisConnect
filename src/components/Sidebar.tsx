import React, { useState } from 'react';
import { Incident, Resource, MatchRecommendation, PRIORITY_CONFIG } from '../types';

interface SidebarProps {
  isOpen: boolean;
  incidents: Incident[];
  resources: Resource[];
  matches: MatchRecommendation[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident | null) => void;
  onResolveIncident: (id: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Sidebar({ isOpen, incidents, resources, matches, selectedIncident, onSelectIncident, onResolveIncident }: SidebarProps) {
  const [activePanel, setActivePanel] = useState<'incidents' | 'dispatch' | 'activity'>('incidents');

  if (!isOpen) return null;

  const sortedIncidents = [...incidents].sort((a, b) => {
    const pDiff = PRIORITY_CONFIG[b.triage.priority].weight - PRIORITY_CONFIG[a.triage.priority].weight;
    if (pDiff !== 0) return pDiff;
    return b.createdAt - a.createdAt;
  });

  const activeIncidents = sortedIncidents.filter(i => i.status === 'ACTIVE');

  return (
    <div className="sidebar glass-card" style={{ width: '320px', height: '100%', position: 'absolute', right: 0, top: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(17, 24, 39, 0.95)', borderLeft: '1px solid #374151' }}>
      <div style={{ display: 'flex', padding: '12px', gap: '8px', borderBottom: '1px solid #374151' }}>
        {['incidents', 'dispatch', 'activity'].map(panel => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel as any)}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: activePanel === panel ? '#374151' : 'transparent',
              color: activePanel === panel ? 'white' : '#9ca3af',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: '0.875rem'
            }}
          >
            {panel}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activePanel === 'incidents' && activeIncidents.map(incident => (
          <div
            key={incident.id}
            className={`incident-card ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
            onClick={() => onSelectIncident(incident)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#1f2937',
              border: `1px solid ${selectedIncident?.id === incident.id ? '#3b82f6' : '#374151'}`,
              cursor: 'pointer',
              borderLeft: `4px solid ${PRIORITY_CONFIG[incident.triage.priority].color}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="priority-badge" style={{ backgroundColor: PRIORITY_CONFIG[incident.triage.priority].color, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                {PRIORITY_CONFIG[incident.triage.priority].label}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{timeAgo(incident.createdAt)}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#f3f4f6', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {incident.rawText}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af' }}>
              <span>👥 {incident.triage.peopleCount}</span>
              <span>📍 {incident.locationName || 'Unknown'}</span>
            </div>
            {selectedIncident?.id === incident.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); onResolveIncident(incident.id); }}
                style={{ marginTop: '12px', width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#22c55e', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Mark Resolved
              </button>
            )}
          </div>
        ))}

        {activePanel === 'dispatch' && matches.map(match => {
          const incident = incidents.find(i => i.id === match.incidentId);
          const resource = resources.find(r => r.id === match.resourceId);
          if (!incident || !resource) return null;

          return (
            <div key={`${match.incidentId}-${match.resourceId}`} className="dispatch-card" style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#1f2937', border: '1px solid #374151' }}>
              <div style={{ fontSize: '0.875rem', color: '#f3f4f6', marginBottom: '8px' }}>
                <strong>{resource.name}</strong> to incident
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>
                <span>Distance: {match.distanceKm.toFixed(1)} km</span>
                <span>Match: {Math.min(100, Math.round((match.score / 120) * 100))}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#374151', borderRadius: '2px', marginBottom: '12px' }}>
                <div style={{ width: `${Math.min(100, (match.score / 120) * 100)}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ flex: 1, padding: '6px', textAlign: 'center', borderRadius: '4px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  Navigate
                </a>
                <button 
                  onClick={() => onResolveIncident(incident.id)}
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Resolve
                </button>
              </div>
            </div>
          );
        })}

        {activePanel === 'activity' && (
          <div className="feed-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incidents.slice(0, 10).map(incident => (
              <div key={`act-${incident.id}`} className="feed-item" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PRIORITY_CONFIG[incident.triage.priority].color, marginTop: '6px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#f3f4f6' }}>New {PRIORITY_CONFIG[incident.triage.priority].label} incident reported</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{timeAgo(incident.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
