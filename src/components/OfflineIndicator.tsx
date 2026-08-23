import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing?: boolean;
}

export function OfflineIndicator({ isOnline, pendingSyncCount, isSyncing }: OfflineIndicatorProps) {
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(!isOnline);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowOnlineBanner(true);
      const timer = setTimeout(() => setShowOnlineBanner(false), 3000);
      setWasOffline(false);
      return () => clearTimeout(timer);
    }
    if (!isOnline) {
      setWasOffline(true);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="offline-banner offline" style={{ backgroundColor: '#ef4444', color: 'white', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.875rem', zIndex: 100 }}>
        <WifiOff size={16} />
        You are offline — reports are saved locally and will sync when connection returns
        {pendingSyncCount > 0 && (
          <span style={{ backgroundColor: 'white', color: '#ef4444', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {pendingSyncCount} pending
          </span>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="offline-banner syncing" style={{ backgroundColor: '#eab308', color: 'black', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.875rem', zIndex: 100 }}>
        <RefreshCw size={16} className="loading-spinner" />
        Syncing {pendingSyncCount} reports...
      </div>
    );
  }

  if (showOnlineBanner) {
    return (
      <div className="offline-banner online" style={{ backgroundColor: '#22c55e', color: 'white', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.875rem', zIndex: 100 }}>
        <Wifi size={16} />
        Connected
      </div>
    );
  }

  return null;
}
