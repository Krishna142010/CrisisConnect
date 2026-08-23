import React, { useState, useEffect } from 'react';
import { Incident, TriageResult } from '../types';
import { triageReport, getAIMode } from '../services/triageService';
import { DEFAULT_CENTER } from '../utils/constants';
import { getReverseGeocodedLocation } from '../services/emergencyPlacesService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Incident) => void;
  aiModelLoaded: boolean;
  userLat?: number | null;
  userLng?: number | null;
}

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  aiModelLoaded,
  userLat: initialLat,
  userLng: initialLng
}: ReportModalProps) {
  const [reportText, setReportText] = useState('');
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [locationName, setLocationName] = useState('');
  const [resolvedLocName, setResolvedLocName] = useState('');
  const [step, setStep] = useState<'input' | 'review' | 'submitted'>('input');
  const [userLat, setUserLat] = useState<number | null>(initialLat ?? null);
  const [userLng, setUserLng] = useState<number | null>(initialLng ?? null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Sync GPS coordinates from App.tsx
  useEffect(() => {
    if (initialLat && initialLng) {
      setUserLat(initialLat);
      setUserLng(initialLng);
      setGeoStatus('success');
      getReverseGeocodedLocation(initialLat, initialLng).then((name) => {
        if (name) setResolvedLocName(name);
      });
    }
  }, [initialLat, initialLng]);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    setUseMyLocation(true);

    if (initialLat && initialLng) {
      setUserLat(initialLat);
      setUserLng(initialLng);
      setGeoStatus('success');
      getReverseGeocodedLocation(initialLat, initialLng).then((name) => {
        if (name) setResolvedLocName(name);
      });
      return;
    }

    setGeoStatus('loading');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          setGeoStatus('success');

          const name = await getReverseGeocodedLocation(lat, lng);
          if (name) setResolvedLocName(name);
        },
        async (err) => {
          console.warn('GPS failed in modal, querying IP fallback:', err.message);
          try {
            const res = await fetch('https://ipwho.is/');
            const data = await res.json();
            if (data && data.latitude && data.longitude) {
              setUserLat(data.latitude);
              setUserLng(data.longitude);
              setGeoStatus('success');

              const name = await getReverseGeocodedLocation(data.latitude, data.longitude);
              if (name) setResolvedLocName(name);
              return;
            }
          } catch (e) {
            console.error('IP fallback failed:', e);
          }
          setGeoStatus('error');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setGeoStatus('error');
    }
  };

  const handleAnalyze = async () => {
    setIsTriaging(true);
    try {
      const result = await triageReport(reportText);
      setTriageResult(result);
      setStep('review');
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriaging(false);
    }
  };

  const defaultLat = typeof DEFAULT_CENTER === 'object' && 'lat' in DEFAULT_CENTER ? (DEFAULT_CENTER as any).lat : 28.58;
  const defaultLng = typeof DEFAULT_CENTER === 'object' && 'lng' in DEFAULT_CENTER ? (DEFAULT_CENTER as any).lng : 78.57;

  const getLat = (): number => {
    if (useMyLocation && userLat !== null) return userLat;
    if (!useMyLocation && manualLat) return parseFloat(manualLat) || defaultLat;
    return defaultLat;
  };

  const getLng = (): number => {
    if (useMyLocation && userLng !== null) return userLng;
    if (!useMyLocation && manualLng) return parseFloat(manualLng) || defaultLng;
    return defaultLng;
  };

  const handleConfirm = async () => {
    if (!triageResult) return;

    const reportedLat = getLat();
    const reportedLng = getLng();

    // Determine location name based strictly on whether manual entry or GPS was used
    let finalLocName = locationName.trim();
    if (!finalLocName) {
      if (useMyLocation && resolvedLocName) {
        finalLocName = resolvedLocName;
      } else {
        // For manual entry, dynamically geocode the manual coordinates (e.g. NYC)
        finalLocName = await getReverseGeocodedLocation(reportedLat, reportedLng);
      }
    }

    const incident: Incident = {
      id: crypto.randomUUID(),
      rawText: reportText,
      triage: triageResult,
      lat: reportedLat,
      lng: reportedLng,
      locationName: finalLocName || 'Local Sector',
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onSubmit(incident);
    setStep('submitted');
    setTimeout(() => {
      onClose();
      setStep('input');
      setReportText('');
      setTriageResult(null);
      setGeoStatus('idle');
      setLocationName('');
    }, 2000);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ width: '90%', maxWidth: '500px', backgroundColor: '#1f2937', borderRadius: '12px', overflow: 'hidden', padding: '24px' }}>
        {step === 'input' && (
          <>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#ef4444', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span role="img" aria-label="sos">🆘</span> Report Emergency
              </h2>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>Describe the emergency</label>
                <textarea
                  className="form-textarea"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe the emergency... e.g., 'Severe building collapse on 5th Avenue, people trapped, medical team required'"
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>Location</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <button className={`btn ${useMyLocation ? 'btn-primary' : 'btn-ghost'}`} onClick={handleGetLocation} style={{ padding: '8px 16px', borderRadius: '6px' }}>
                    📍 {geoStatus === 'loading' ? 'Getting Location...' : geoStatus === 'success' ? 'Location Found ✓' : 'Use My Location'}
                  </button>
                  <button className={`btn ${!useMyLocation ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUseMyLocation(false)} style={{ padding: '8px 16px', borderRadius: '6px' }}>Manual Entry</button>
                </div>

                {geoStatus === 'success' && resolvedLocName && useMyLocation && (
                  <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px', fontWeight: 500 }}>
                    📍 Detected GPS Region: {resolvedLocName}
                  </div>
                )}

                {!useMyLocation && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="form-input" placeholder="Latitude (e.g. 40.7128)" value={manualLat} onChange={e => setManualLat(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
                      <input className="form-input" placeholder="Longitude (e.g. -74.0060)" value={manualLng} onChange={e => setManualLng(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
                    </div>
                    <input className="form-input" placeholder="Optional place name (e.g. Manhattan, NYC)" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={!reportText || isTriaging} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>
                {isTriaging ? 'Analyzing...' : 'Analyze & Submit'}
              </button>
              <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getAIMode() === 'featherless' ? '#6366f1' : getAIMode() === 'transformers' ? '#22c55e' : '#eab308' }}></span>
                {getAIMode() === 'featherless' ? '✨ Featherless AI (Online)' : getAIMode() === 'transformers' ? '🧠 Offline AI (Local)' : '⚡ Rule-based (Instant)'}
              </div>
              <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: '8px', color: '#9ca3af' }}>Cancel</button>
            </div>
          </>
        )}

        {step === 'review' && triageResult && (
          <>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#f3f4f6', margin: 0, fontSize: '1.25rem' }}>Review Report</h2>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="priority-badge" style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{triageResult.priority}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{triageResult.category}</span>
                </div>
                <p style={{ color: '#f3f4f6', fontSize: '0.875rem', margin: '8px 0' }}>{triageResult.summary}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#9ca3af' }}>
                  <span>People: {triageResult.peopleCount}</span>
                  {triageResult.hasMedicalCondition && <span style={{ color: '#ef4444' }}>Medical Need</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Target Coords: <strong style={{ color: '#38bdf8' }}>{getLat().toFixed(4)}, {getLng().toFixed(4)}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setStep('input')} style={{ flex: 1, padding: '12px', borderRadius: '8px', color: '#9ca3af' }}>Edit</button>
              <button className="btn btn-primary" onClick={handleConfirm} style={{ flex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Confirm & Report</button>
            </div>
          </>
        )}

        {step === 'submitted' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#22c55e', margin: 0, fontSize: '1.25rem' }}>Report Submitted!</h3>
          </div>
        )}
      </div>
    </div>
  );
}
