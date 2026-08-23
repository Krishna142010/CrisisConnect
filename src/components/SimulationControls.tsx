import React from 'react';

interface SimulationControlsProps {
  isVisible: boolean;
  isSimulating: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onReset: () => void;
  progress: number;
  eventsGenerated: number;
}

export function SimulationControls({ isVisible, isSimulating, onStartSimulation, onStopSimulation, onReset, progress, eventsGenerated }: SimulationControlsProps) {
  if (!isVisible) return null;

  return (
    <div className="sim-controls glass-card" style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 50, padding: '16px', borderRadius: '12px', width: '300px', backgroundColor: 'rgba(17, 24, 39, 0.9)', border: '1px solid #374151' }}>
      <h3 style={{ margin: '0 0 12px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🌀 Hurricane Simulation
      </h3>
      
      {!isSimulating ? (
        <button className="btn btn-primary" onClick={onStartSimulation} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
          Start Simulation
        </button>
      ) : (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
            <span>Generating events...</span>
            <span>{eventsGenerated}/40</span>
          </div>
          <div className="progress-bar" style={{ width: '100%', height: '6px', backgroundColor: '#374151', borderRadius: '3px', marginBottom: '12px' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
          <button className="btn btn-danger" onClick={onStopSimulation} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>
            Stop
          </button>
        </div>
      )}

      <button className="btn btn-ghost" onClick={() => { if(window.confirm('Reset all data?')) onReset(); }} style={{ width: '100%', padding: '8px', borderRadius: '6px', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid #ef4444', cursor: 'pointer', fontSize: '0.875rem' }}>
        Reset All Data
      </button>

      <div style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center', marginTop: '12px' }}>
        Press Ctrl+Shift+D to toggle this panel
      </div>
    </div>
  );
}
