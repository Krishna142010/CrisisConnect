import React from 'react';
import { Map, BarChart3, Users, Brain, Wifi, WifiOff, Sparkles, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { getAIMode } from '../services/triageService';

interface HeaderProps {
  activeTab: 'map' | 'dashboard' | 'resources';
  onTabChange: (tab: 'map' | 'dashboard' | 'resources') => void;
  isOnline: boolean;
  pendingSyncCount: number;
  aiModelLoaded: boolean;
  aiModelLoading: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const AI_MODE_DISPLAY: Record<string, { label: string; color: string; icon: any }> = {
  featherless: { label: 'Featherless AI', color: '#6366f1', icon: Sparkles },
  transformers: { label: 'Offline AI', color: '#22c55e', icon: Brain },
  fallback: { label: 'Rule-based', color: '#eab308', icon: Brain }
};

export function Header({
  activeTab,
  onTabChange,
  isOnline,
  pendingSyncCount,
  aiModelLoaded,
  aiModelLoading,
  onToggleSidebar,
  isSidebarOpen
}: HeaderProps) {
  const aiMode = getAIMode();
  const modeInfo = AI_MODE_DISPLAY[aiMode];
  const ModeIcon = modeInfo.icon;

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', width: '32px', height: '32px', borderRadius: '50%' }}></div>
        <span className="accent-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>CrisisConnect</span>
      </div>
      
      <nav className="header-nav">
        <button 
          className={`header-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => onTabChange('map')}
        >
          <Map size={18} /> Map
        </button>
        <button 
          className={`header-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <BarChart3 size={18} /> Dashboard
        </button>
        <button 
          className={`header-tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => onTabChange('resources')}
        >
          <Users size={18} /> Resources
        </button>
      </nav>

      <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${modeInfo.color}33` }}>
          <ModeIcon
            size={14} 
            color={aiModelLoading ? '#eab308' : modeInfo.color} 
            className={aiModelLoading ? 'loading-spinner' : ''}
          />
          <span style={{ fontSize: '0.75rem', color: modeInfo.color, fontWeight: 500 }}>
            {aiModelLoading ? 'Loading AI...' : modeInfo.label}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <div className="status-dot" style={{ backgroundColor: isOnline ? '#22c55e' : '#ef4444', width: '8px', height: '8px', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{isOnline ? 'Online' : 'Offline'}</span>
          {pendingSyncCount > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-16px', background: '#ef4444', color: 'white', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '12px' }}>
              {pendingSyncCount}
            </span>
          )}
        </div>

        <button onClick={onToggleSidebar} className="btn-ghost" style={{ padding: '8px' }}>
          {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      </div>
    </header>
  );
}
