import React, { useMemo } from 'react';
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
  Users 
} from 'lucide-react';
import { 
  getCountryFromCoordinates, 
  getEmergencyNumbers, 
  getDefaultEmergencyNumbers,
  CountryEmergency,
  EmergencyContact
} from '../data/emergencyNumbers';

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
  const emergencyData: CountryEmergency = useMemo(() => {
    if (userLat !== null && userLng !== null) {
      const countryCode = getCountryFromCoordinates(userLat, userLng);
      const data = getEmergencyNumbers(countryCode);
      if (data) return data;
    }
    return getDefaultEmergencyNumbers();
  }, [userLat, userLng]);

  if (!isOpen) return null;

  const isGlobal = emergencyData.countryCode === 'GLOBAL';

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content flex flex-col shadow-2xl rounded-2xl"
        style={{ 
          backgroundColor: '#1f2937', 
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-col items-center justify-between p-6 border-b border-gray-700 bg-gray-800 rounded-t-2xl">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center mt-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Phone className="text-red-500 animate-pulse" size={28} />
              Emergency Numbers
            </h2>
            <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-gray-900 rounded-full">
              {isGlobal ? (
                <Globe size={16} className="text-blue-400" />
              ) : (
                <MapPin size={16} className="text-green-400" />
              )}
              <span className="text-sm font-medium text-gray-200">
                {emergencyData.country}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {isGlobal 
                ? "Location not available — showing international numbers"
                : "Based on your last synced location"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Main Emergency Call Action */}
          <div className="flex flex-col items-center p-8 bg-gray-900 rounded-xl border border-gray-700 shadow-inner">
            <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Main Emergency Number</span>
            <span className="text-6xl font-black text-white mb-6 tracking-widest">{emergencyData.generalEmergency}</span>
            <a 
              href={`tel:${emergencyData.generalEmergency}`}
              className="flex items-center gap-3 px-12 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
            >
              <Phone size={24} />
              CALL NOW
            </a>
          </div>

          <div className="h-px bg-gray-700 w-full my-2"></div>

          {/* Contacts Grid */}
          <h3 className="text-lg font-semibold text-gray-300 px-1">Specific Services</h3>
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
        
        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 rounded-b-2xl text-center">
          <p className="text-xs text-gray-500">
            Tap any number to call. Numbers are based on your last synced GPS location. Always verify local numbers when traveling.
          </p>
        </div>
      </div>
    </div>
  );
}
