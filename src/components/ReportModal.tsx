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
  const [errorMsg, setErrorMsg] = useState('');

  // Sync GPS from App.tsx
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

  const handleLatChange = (val: string) => {
    setErrorMsg('');
    if (val.includes(',')) {
      const parts = val.split(',').map((s) => s.trim());
      setManualLat(parts[0]);
      if (parts[1]) setManualLng(parts[1]);
    } else {
      setManualLat(val);
    }
  };

  const handleGetLocation = () => {
    setUseMyLocation(true);
    setErrorMsg('');

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

  const defaultLat = typeof DEFAULT_CENTER === 'object' && 'lat' in DEFAULT_CENTER ? (DEFAULT_CENTER as any).lat : 28.58;
  const defaultLng = typeof DEFAULT_CENTER === 'object' && 'lng' in DEFAULT_CENTER ? (DEFAULT_CENTER as any).lng : 78.57;

  const parseTargetCoords = (): { lat: number; lng: number } => {
    if (useMyLocation && userLat !== null && userLng !== null) {
      return { lat: userLat, lng: userLng };
    }

    const parsedLat = parseFloat(manualLat.trim());
    const parsedLng = parseFloat(manualLng.trim());

    const lat = !isNaN(parsedLat) ? parsedLat : defaultLat;
    const lng = !isNaN(parsedLng) ? parsedLng : defaultLng;

    return { lat, lng };
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) {
      setErrorMsg('Please enter a description of the emergency.');
      return;
    }

    if (!useMyLocation) {
      const parsedLat = parseFloat(manualLat.trim());
      const parsedLng = parseFloat(manualLng.trim());

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        setErrorMsg('Please enter valid numerical Latitude and Longitude.');
        return;
      }
      if (parsedLat < -90 || parsedLat > 90) {
        setErrorMsg('Latitude must be between -90 and 90.');
        return;
      }
      if (parsedLng < -180 || parsedLng > 180) {
        setErrorMsg('Longitude must be between -180 and 180.');
        return;
      }
    }

    setErrorMsg('');
    setIsTriaging(true);
    try {
      const result = await triageReport(reportText);
      setTriageResult(result);
      setStep('review');
    } catch (e) {
      console.error(e);
      // Fallback with all required TriageResult fields
      setTriageResult({
        priority: 'P1_CRITICAL',
        category: 'RESCUE',
        summary: reportText.slice(0, 100),
        peopleCount: 1,
        hasMedicalCondition: false,
        extractedLocation: locationName || 'Target Zone',
        confidence: 0.95
      });
      setStep('review');
    } finally {
      setIsTriaging(false);
    }
  };

  const handleConfirm = () => {
    if (!triageResult) return;

    const { lat, lng } = parseTargetCoords();

    let locLabel = locationName.trim();
    if (!locLabel) {
      if (useMyLocation && resolvedLocName) {
        locLabel = resolvedLocName;
      } else {
        locLabel = `Zone (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
      }
    }

    const incident: Incident = {
      id: crypto.randomUUID(),
      rawText: reportText,
      triage: triageResult,
      lat,
      lng,
      locationName: locLabel,
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onSubmit(incident);

    if (!useMyLocation && !locationName.trim()) {
      getReverseGeocodedLocation(lat, lng).then((resolved) => {
        if (resolved) incident.locationName = resolved;
      });
    }

    setStep('submitted');
    setTimeout(() => {
      onClose();
      setStep('input');
      setReportText('');
      setTriageResult(null);
      setGeoStatus('idle');
      setLocationName('');
      setManualLat('');
      setManualLng('');
      setErrorMsg('');
    }, 1500);
  };

  const targetCoords = parseTargetCoords();

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ width: '90%', maxWidth: '520px', backgroundColor: '#1f2937', borderRadius: '14px', overflow: 'hidden', padding: '24px', border: '1px solid #374151' }}>
        {step === 'input' && (
          <>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h2 style={{ color: '#ef4444', margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span role="img" aria-label="sos">🆘</span> Report Emergency
              </h2>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '0.875rem' }}>Describe the emergency</label>
                <textarea
                  className="form-textarea"
                  value={reportText}
                  onChange={(e) => {
                    setReportText(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Describe the emergency... e.g., 'Flooding near 5th Ave, family trapped on roof, urgent medical team needed'"
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white', fontSize: '0.9rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '0.875rem' }}>Location Coordinates</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button 
                    type="button"
                    className={`btn ${useMyLocation ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={handleGetLocation} 
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: useMyLocation ? '#3b82f6' : '#374151', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    📍 {geoStatus === 'loading' ? 'Locating...' : 'Use My GPS'}
                  </button>
                  <button 
                    type="button"
                    className={`btn ${!useMyLocation ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => {
                      setUseMyLocation(false);
                      setErrorMsg('');
                    }} 
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: !useMyLocation ? '#3b82f6' : '#374151', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    ✏️ Manual Lat/Lng
                  </button>
                </div>

                {useMyLocation && (
                  <div style={{ fontSize: '0.8rem', color: '#10b981', background: '#064e3b33', padding: '8px', borderRadius: '6px', border: '1px solid #065f46' }}>
                    {resolvedLocName ? `📍 ${resolvedLocName}` : `GPS Fix: ${targetCoords.lat.toFixed(4)}, ${targetCoords.lng.toFixed(4)}`}
                  </div>
                )}

                {!useMyLocation && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        className="form-input" 
                        placeholder="Latitude (e.g. 40.7128)" 
                        value={manualLat} 
                        onChange={e => handleLatChange(e.target.value)} 
                        style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white', fontSize: '0.85rem' }} 
                      />
                      <input 
                        className="form-input" 
                        placeholder="Longitude (e.g. -74.0060)" 
                        value={manualLng} 
                        onChange={e => {
                          setManualLng(e.target.value);
                          setErrorMsg('');
                        }} 
                        style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white', fontSize: '0.85rem' }} 
                      />
                    </div>
                    <input 
                      className="form-input" 
                      placeholder="Optional Landmark / Place Name (e.g. Manhattan, NYC)" 
                      value={locationName} 
                      onChange={e => setLocationName(e.target.value)} 
                      style={{ padding: '9px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white', fontSize: '0.85rem' }} 
                    />
                  </div>
                )}
              </div>

              {errorMsg && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', backgroundColor: '#7f1d1d33', padding: '8px', borderRadius: '6px', border: '1px solid #991b1b' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={handleAnalyze} 
                disabled={!reportText || isTriaging} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                {isTriaging ? 'Analyzing with AI...' : 'Analyze & Submit'}
              </button>
              <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getAIMode() === 'featherless' ? '#6366f1' : getAIMode() === 'transformers' ? '#22c55e' : '#eab308' }}></span>
                {getAIMode() === 'featherless' ? '✨ Featherless AI (Online)' : getAIMode() === 'transformers' ? '🧠 Offline AI (Local)' : '⚡ Rule-based (Instant)'}
              </div>
              <button type="button" className="btn btn-ghost" onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: '8px', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        )}

        {step === 'review' && triageResult && (
          <>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h2 style={{ color: '#f3f4f6', margin: 0, fontSize: '1.25rem' }}>Review Report</h2>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #374151' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="priority-badge" style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{triageResult.priority}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{triageResult.category}</span>
                </div>
                <p style={{ color: '#f3f4f6', fontSize: '0.875rem', margin: '6px 0', lineHeight: 1.4 }}>{triageResult.summary}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#9ca3af' }}>
                  <span>People: {triageResult.peopleCount}</span>
                  {triageResult.hasMedicalCondition && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Medical Need</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '4px', borderTop: '1px solid #1f2937', paddingTop: '6px' }}>
                  📍 Target Location: <strong>{targetCoords.lat.toFixed(4)}, {targetCoords.lng.toFixed(4)}</strong> {locationName && `(${locationName})`}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep('input')} style={{ flex: 1, padding: '12px', borderRadius: '8px', color: '#9ca3af', backgroundColor: '#374151', border: 'none', cursor: 'pointer' }}>Edit</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirm} style={{ flex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Confirm & Dispatch 🚀</button>
            </div>
          </>
        )}

        {step === 'submitted' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ color: '#22c55e', margin: 0, fontSize: '1.3rem' }}>Report Submitted!</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '6px' }}>Routing to the nearest emergency facility...</p>
          </div>
        )}
      </div>
    </div>
  );
}
