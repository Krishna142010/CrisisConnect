import React, { useState, useEffect, useRef } from 'react';
import { Bluetooth, Send, X, Radio, Users, MapPin, MessageCircle, Wifi, Signal, ScanLine, AlertTriangle } from 'lucide-react';
import {
  PeerMessage,
  NearbyPeer,
  getDeviceId,
  getDeviceName,
  setDeviceName as updateDeviceName,
  sendMessage,
  onMessage,
  removeMessageListener,
  announcePresence,
  scanForDevices,
  getKnownPeers,
  isBluetoothSupported,
  destroyService
} from '../services/bluetoothService';

interface PeerChatProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number | null;
  userLng: number | null;
}

export function PeerChat({ isOpen, onClose, userLat, userLng }: PeerChatProps) {
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [deviceName, setDeviceNameState] = useState('');
  const [nearbyPeers, setNearbyPeers] = useState<NearbyPeer[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'peers'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myDeviceId = useRef('');

  useEffect(() => {
    if (isOpen) {
      myDeviceId.current = getDeviceId();
      setDeviceNameState(getDeviceName());
      
      onMessage((message) => {
        setMessages((prev) => [...prev, message]);
        setNearbyPeers(getKnownPeers());
      });

      announcePresence();
      setNearbyPeers(getKnownPeers());
    }

    return () => {
      removeMessageListener();
    };
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const location = userLat && userLng ? { lat: userLat, lng: userLng } : undefined;
    sendMessage(inputText, 'chat', location);
    
    const localMsg: PeerMessage = {
      id: crypto.randomUUID(),
      senderId: myDeviceId.current,
      senderName: deviceName,
      text: inputText,
      timestamp: Date.now(),
      type: 'chat',
      location
    };
    setMessages((prev) => [...prev, localMsg]);
    setInputText('');
  };

  const handleSOS = () => {
    const location = userLat && userLng ? { lat: userLat, lng: userLng } : undefined;
    const text = 'EMERGENCY SOS: I need immediate assistance!';
    sendMessage(text, 'sos', location);
    
    const localMsg: PeerMessage = {
      id: crypto.randomUUID(),
      senderId: myDeviceId.current,
      senderName: deviceName,
      text,
      timestamp: Date.now(),
      type: 'sos',
      location
    };
    setMessages((prev) => [...prev, localMsg]);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDeviceNameState(newName);
    updateDeviceName(newName);
  };

  const handleScan = async () => {
    setIsScanning(true);
    const devices = await scanForDevices();
    
    if (devices.length > 0) {
      setNearbyPeers(prev => {
        const updated = [...prev];
        devices.forEach(d => {
          if (!updated.find(p => p.id === d.id)) {
            updated.push(d);
          }
        });
        return updated;
      });
    }
    setIsScanning(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      color: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: '#111827',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #374151',
        borderRight: '1px solid #374151',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              backgroundColor: '#3b82f6', 
              padding: '8px', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bluetooth size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Mesh Network</h2>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} />
                <span>{nearbyPeers.length} Peers Nearby</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#9ca3af', 
              cursor: 'pointer',
              padding: '4px' 
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #374151' }}>
          <button
            onClick={() => setActivePanel('chat')}
            style={{
              flex: 1,
              padding: '12px',
              background: activePanel === 'chat' ? '#1f2937' : 'transparent',
              border: 'none',
              borderBottom: activePanel === 'chat' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activePanel === 'chat' ? '#3b82f6' : '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 500
            }}
          >
            <MessageCircle size={18} />
            Chat
          </button>
          <button
            onClick={() => setActivePanel('peers')}
            style={{
              flex: 1,
              padding: '12px',
              background: activePanel === 'peers' ? '#1f2937' : 'transparent',
              border: 'none',
              borderBottom: activePanel === 'peers' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activePanel === 'peers' ? '#3b82f6' : '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 500
            }}
          >
            <Radio size={18} />
            Peers
          </button>
        </div>

        {/* Identity Bar */}
        <div style={{ padding: '12px 16px', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Your ID:</span>
          <input
            type="text"
            value={deviceName}
            onChange={handleNameChange}
            style={{
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              outline: 'none',
              flex: 1
            }}
          />
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          {activePanel === 'chat' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '20px' }}>
                  <Bluetooth size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
                  <p>No messages yet. Send a message to discover nearby peers.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === myDeviceId.current;
                  const isSos = msg.type === 'sos';
                  
                  return (
                    <div 
                      key={msg.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px', padding: '0 4px' }}>
                        {isMe ? 'You' : msg.senderName} • {formatTime(msg.timestamp)}
                      </span>
                      <div style={{
                        backgroundColor: isSos ? 'rgba(239, 68, 68, 0.2)' : (isMe ? '#3b82f6' : '#1f2937'),
                        border: isSos ? '1px solid #ef4444' : 'none',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        borderBottomRightRadius: isMe ? '2px' : '12px',
                        borderBottomLeftRadius: isMe ? '12px' : '2px',
                        maxWidth: '85%',
                        wordBreak: 'break-word'
                      }}>
                        {isSos && <AlertTriangle size={16} color="#ef4444" style={{ marginBottom: '4px' }} />}
                        <div style={{ fontSize: '0.9375rem' }}>{msg.text}</div>
                        {msg.location && (
                          <div style={{ 
                            marginTop: '8px', 
                            fontSize: '0.75rem', 
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            width: 'fit-content'
                          }}>
                            <MapPin size={12} />
                            {msg.location.lat.toFixed(4)}, {msg.location.lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isBluetoothSupported() && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '0.875rem'
                }}>
                  Bluetooth not available on this device. Chat works between app windows on the same network using BroadcastChannel API.
                </div>
              )}
              
              <button
                onClick={handleScan}
                disabled={isScanning || !isBluetoothSupported()}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: (isScanning || !isBluetoothSupported()) ? 'not-allowed' : 'pointer',
                  opacity: (isScanning || !isBluetoothSupported()) ? 0.5 : 1
                }}
              >
                <ScanLine size={18} />
                {isScanning ? 'Scanning...' : 'Scan for Nearby Devices (BLE)'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '8px 0', textTransform: 'uppercase' }}>
                  Known Peers ({nearbyPeers.length})
                </h3>
                {nearbyPeers.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                    No peers found yet. Wait for announcements.
                  </div>
                ) : (
                  nearbyPeers.map(peer => (
                    <div key={peer.id} style={{
                      backgroundColor: '#1f2937',
                      padding: '12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: '#10b981' 
                        }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{peer.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            Last seen: {formatTime(peer.lastSeen)}
                          </div>
                        </div>
                      </div>
                      {peer.rssi !== undefined && (
                        <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Signal size={14} />
                          <span style={{ fontSize: '0.75rem' }}>{peer.rssi} dBm</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        {activePanel === 'chat' && (
          <div style={{ 
            padding: '16px', 
            borderTop: '1px solid #374151',
            backgroundColor: '#111827',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleSOS}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}
              title="Send SOS"
            >
              SOS
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message nearby peers..."
              style={{
                flex: 1,
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                backgroundColor: inputText.trim() ? '#3b82f6' : '#374151',
                color: inputText.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                padding: '0 16px',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
