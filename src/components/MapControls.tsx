import React from 'react';
import { Priority, Category, PRIORITY_CONFIG } from '../types';

interface MapControlsProps {
  filters: { priorities: Priority[]; categories: Category[] };
  onFilterChange: (filters: { priorities: Priority[]; categories: Category[] }) => void;
  incidentCount: number;
  activeCount: number;
}

export function MapControls({ filters, onFilterChange, incidentCount, activeCount }: MapControlsProps) {
  const togglePriority = (priority: Priority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onFilterChange({ ...filters, priorities: newPriorities });
  };

  return (
    <div className="filter-bar glass-card" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e5e7eb' }}>
        {activeCount} active incidents ({incidentCount} total)
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(priority => {
          const config = PRIORITY_CONFIG[priority];
          const isActive = filters.priorities.includes(priority);
          return (
            <button
              key={priority}
              className="filter-chip"
              onClick={() => togglePriority(priority)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                border: `1px solid ${isActive ? config.color : '#374151'}`,
                backgroundColor: isActive ? `${config.color}20` : 'transparent',
                color: '#e5e7eb',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }}></div>
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
