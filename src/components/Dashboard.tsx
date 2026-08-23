import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { Incident, Resource, MatchRecommendation, PRIORITY_CONFIG, CATEGORY_CONFIG, Priority, Category } from '../types';

interface DashboardProps {
  incidents: Incident[];
  resources: Resource[];
  matches: MatchRecommendation[];
}

export function Dashboard({ incidents, resources, matches }: DashboardProps) {
  const total = incidents.length;
  const active = incidents.filter(i => i.status === 'ACTIVE').length;
  const resolved = incidents.filter(i => i.status === 'RESOLVED').length;
  const activeVolunteers = resources.filter(r => r.isActive).length;
  
  const priorityBreakdown = incidents.reduce((acc, inc) => {
    acc[inc.triage.priority] = (acc[inc.triage.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryBreakdown = incidents.reduce((acc, inc) => {
    acc[inc.triage.category] = (acc[inc.triage.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let conicGradient = '';
  let cumulativePercent = 0;
  if (total > 0) {
    const segments = Object.entries(priorityBreakdown).map(([key, count]) => {
      const percent = (count / total) * 100;
      const color = PRIORITY_CONFIG[key as Priority].color;
      const segment = `${color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
      cumulativePercent += percent;
      return segment;
    });
    conicGradient = segments.join(', ');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-card glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="stat-label" style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} /> Total Incidents</div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{total}</div>
        </div>
        <div className="stat-card glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="stat-label" style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} color="#ef4444" /> Active</div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{active}</div>
        </div>
        <div className="stat-card glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="stat-label" style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} color="#22c55e" /> Resolved</div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{resolved}</div>
        </div>
        <div className="stat-card glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="stat-label" style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} color="#3b82f6" /> Volunteers</div>
          <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{activeVolunteers}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Priority Breakdown</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div className="donut-chart" style={{ width: '150px', height: '150px', borderRadius: '50%', background: `conic-gradient(${conicGradient || '#374151 0% 100%'})` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(Object.entries(priorityBreakdown)).map(([key, count]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db', fontSize: '0.875rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: PRIORITY_CONFIG[key as Priority].color }} />
                  {PRIORITY_CONFIG[key as Priority].label}: <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Categories</h3>
          <div className="bar-chart" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.keys(CATEGORY_CONFIG).map(key => {
              const count = categoryBreakdown[key] || 0;
              const percent = total > 0 ? (count / total) * 100 : 0;
              const config = CATEGORY_CONFIG[key as Category];
              return (
                <div key={key} className="bar-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#d1d5db', marginBottom: '4px' }}>
                    <span>{config.label}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#374151', borderRadius: '4px' }}>
                    <div className="bar-fill" style={{ width: `${percent}%`, height: '100%', backgroundColor: config.color, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
