import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  X, 
  MapPin, 
  Shield, 
  Heart, 
  Flame, 
  AlertTriangle, 
  Globe, 
  Baby, 
  Users,
  Building,
  Navigation
} from 'lucide-react';
import { 
  getCountryFromCoordinates, 
  getEmergencyNumbers, 
  getDefaultEmergencyNumbers,
  CountryEmergency,
  EmergencyContact
} from '../data/emergencyNumbers';
import { fetchNearbyEmergencyPlaces, EmergencyPlace } from '../services/emergencyPlacesService';

export interface EmergencyNumbersProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number | null;
  userLng: number | null;
}

function getServiceIcon(serviceName: string) {
  const lowerName = serviceName.toLowerCase();
  if (lowerName.includes('police')) return <Shield size={24} className="text-blue-400" />;
  if (lowerName.includes('ambulance') || lowerName.includes('medical') || lowerName.includes('health')) return <Heart size={24} className="text-red-400" />;
  if (lowerName.includes('fire')) return <Flame size={24} className="text-orange-400" />;
  if (lowerName.includes('child')) return <Baby size={24} className="text-pink-400" />;
  if (lowerName.includes('women')) return <Users size={24} className="text-purple-400" />;
  if (lowerName.includes('coast guard') || lowerName.includes('rescue')) return <Globe size={24} className="text-cyan-400" />;
  return <AlertTriangle size={24} className="text-yellow-400" />;
}

export function EmergencyNumbers({ isOpen, onClose, userLat, userLng }: EmergencyNumbersProps) {
  const [activeTab, setActiveTab] = useState<'hotlines' | 'facilities'>('hotlines');
  const [places, setPlaces] = useState<EmergencyPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [facilityFilter, setFacilityFilter] = useState<'ALL' | 'hospital' | 'police' | 'fire_station'>('ALL');
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [detectedCountryName, setDetectedCountryName] = useState<string | null>(null);

  // Dynamic OpenStreetMap Reverse Geocoding to determine Country
  useEffect(() => {
    if (!isOpen || userLat === null || userLng === null) return;

    const resolveCountry = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=5`
        );
        const data = await res.json();
        if (data && data.address && data.address.country_code) {
          setDetectedCountryCode(data.address.country_code.toUpperCase());
          setDetectedCountryName(data.address.country || 'Detected Region');
        }
      } catch (err) {
        console.warn('OpenStreetMap reverse geocode failed, using local lookup:', err);
      }
    };

    resolveCountry();
  }, [isOpen, userLat, userLng]);

  // Load nearby facilities via Overpass API
  useEffect(() => {
    if (isOpen && activeTab === 'facilities' && userLat !== null && userLng !== null) {
      setIsLoadingPlaces(true);
      fetchNearbyEmergencyPlaces(userLat, userLng, 15000)
        .then((res) => setPlaces(res))
        .finally(() => setIsLoadingPlaces(false));
    }
  }, [isOpen, activeTab, userLat, userLng]);

  const emergencyData: CountryEmergency = useMemo(() => {
    // 1. Check dynamic OSM country code first
    if (detectedCountryCode) {
      const data = getEmergencyNumbers(detectedCountryCode);
      if (data) return data;
    }

    // 2. Check coordinates bounding lookup
    if (userLat !== null && userLng !== null) {
      const countryCode = getCountryFromCoordinates(userLat, userLng);
      const data = getEmergencyNumbers(countryCode);
      if (data) return data;

      // Built-in Indian subcontinental bounding fallback
      if (userLat >= 8.0 && userLat <= 37.0 && userLng >= 68.0 && userLng <= 97.5) {
        const inData = getEmergencyNumbers('IN');
        if (inData) return inData;
      }
    }

    return getDefaultEmergencyNumbers();
  }, [userLat, userLng, detectedCountryCode]);

  if (!isOpen) return null;

  const isGlobal = emergencyData.countryCode === 'GLOBAL' && !detectedCountryName;
  const filteredPlaces = facilityFilter === 'ALL'
    ? places
    : places.filter((p) => p.type === facilityFilter || (facilityFilter === 'hospital' && p.type === 'clinic'));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden modal-content flex flex-col shadow-2xl rounded-2xl"
        style={{ 
          backgroundColor: '#1f2937', 
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-between p-6 border-b border-gray-700 bg-gray-800 rounded-t-2xl relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center mt-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Phone className="text-red-500 animate-pulse" size={28} />
              Emergency Services & Hotlines
            </h2>
            <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-gray-900 rounded-full">
              {isGlobal ? (
                <Globe size={16} className="text-blue-400" />
              ) : (
                <MapPin size={16} className="text-green-400" />
              )}
              <span className="text-sm font-medium text-gray-200">
                {detectedCountryName || emergencyData.country}
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 mt-4 bg-gray-900 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setActiveTab('hotlines')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'hotlines' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              📞 Official Helplines
            </button>
            <button
              onClick={() => setActiveTab('facilities')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'facilities' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              🏥 Nearby Facilities (OSM)
            </button>
          </div>
        </div>

        {/* Tab 1: Helplines */}
        {activeTab === 'hotlines' && (
          <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Main Emergency Call Action */}
            <div className="flex flex-col items-center p-8 bg-gray-900 rounded-xl border border-gray-700 shadow-inner">
              <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Primary Emergency Number</span>
              <span className="text-6xl font-black text-white mb-6 tracking-widest">{emergencyData.generalEmergency}</span>
              <a 
                href={`tel:${emergencyData.generalEmergency}`}
                className="flex items-center gap-3 px-12 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
              >
                <Phone size={24} />
                CALL NOW
              </a>
            </div>

            <div className="h-px bg-gray-700 w-full my-1"></div>

            {/* Contacts Grid */}
            <h3 className="text-lg font-semibold text-gray-300 px-1">Specialized Emergency Lines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyData.contacts.map((contact: EmergencyContact, index: number) => (
                <div 
                  key={index} 
                  className="glass-card flex flex-col justify-between p-5 rounded-xl transition-all hover:bg-gray-800"
                  style={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid #374151'
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      {getServiceIcon(contact.service)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{contact.service}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{contact.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-800">
                    <span className="text-2xl font-bold text-gray-200">{contact.number}</span>
                    <a 
                      href={`tel:${contact.number}`}
                      className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors shadow-md"
                    >
                      <Phone size={16} />
                      CALL
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Nearby OpenStreetMap Facilities */}
        {activeTab === 'facilities' && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto">
            {/* Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['ALL', 'hospital', 'police', 'fire_station'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFacilityFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    facilityFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filter === 'ALL' ? 'All Facilities' : filter.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            {isLoadingPlaces && (
              <div className="py-12 text-center text-gray-400">
                Finding nearby hospitals, police stations, and fire services from OpenStreetMap...
              </div>
            )}

            {!isLoadingPlaces && filteredPlaces.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                No facilities found within a 15 km radius. Dial the official helplines above.
              </div>
            )}

            {!isLoadingPlaces && filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-white text-base">
                    {place.type === 'hospital' || place.type === 'clinic' ? (
                      <Heart size={18} className="text-red-400" />
                    ) : place.type === 'police' ? (
                      <Shield size={18} className="text-blue-400" />
                    ) : place.type === 'fire_station' ? (
                      <Flame size={18} className="text-orange-400" />
                    ) : (
                      <Building size={18} className="text-green-400" />
                    )}
                    {place.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {place.distanceKm} km away
                    </span>
                    {place.address && <span>• {place.address}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {place.phone && (
                    <a
                      href={`tel:${place.phone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold"
                    >
                      <Phone size={12} /> Call
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    <Navigation size={12} /> Route
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 rounded-b-2xl text-center">
          <p className="text-xs text-gray-500">
            Open-source global crisis routing. Direct dial connects over your native carrier network.
          </p>
        </div>
      </div>
    </div>
  );
}
