export interface PeerMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'sos' | 'chat' | 'resource' | 'status';
  location?: { lat: number; lng: number };
}

export interface NearbyPeer {
  id: string;
  name: string;
  lastSeen: number;
  rssi?: number;
}

const CHANNEL_NAME = 'crisisconnect-mesh';
let channel: BroadcastChannel | null = null;
let messageListener: ((message: PeerMessage) => void) | null = null;
let knownPeers: Map<string, NearbyPeer> = new Map();

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('crisisconnect-peer-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('crisisconnect-peer-id', id);
  }
  return id;
}

function getOrCreateDeviceName(): string {
  let name = localStorage.getItem('crisisconnect-peer-name');
  if (!name) {
    name = 'Rescuer-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    localStorage.setItem('crisisconnect-peer-name', name);
  }
  return name;
}

export function getDeviceId(): string {
  return getOrCreateDeviceId();
}

export function getDeviceName(): string {
  return getOrCreateDeviceName();
}

export function setDeviceName(name: string): void {
  localStorage.setItem('crisisconnect-peer-name', name);
}

function initChannel() {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const message = event.data as PeerMessage;
      
      if (message.senderId !== getDeviceId()) {
        knownPeers.set(message.senderId, {
          id: message.senderId,
          name: message.senderName,
          lastSeen: Date.now()
        });
      }

      if (messageListener) {
        messageListener(message);
      }
    };
  }
}

export function sendMessage(text: string, type: PeerMessage['type'], location?: {lat: number, lng: number}): void {
  try {
    initChannel();
    const msg: PeerMessage = {
      id: crypto.randomUUID(),
      senderId: getDeviceId(),
      senderName: getDeviceName(),
      text,
      timestamp: Date.now(),
      type,
      location
    };
    
    if (channel) {
      channel.postMessage(msg);
    }
  } catch (error) {
    console.warn('Failed to send message:', error);
  }
}

export function onMessage(callback: (message: PeerMessage) => void): void {
  messageListener = callback;
  initChannel();
}

export function removeMessageListener(): void {
  messageListener = null;
}

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export async function scanForDevices(): Promise<NearbyPeer[]> {
  const peers: NearbyPeer[] = [];
  try {
    if (isBluetoothSupported()) {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access']
      });
      
      if (device) {
        peers.push({
          id: device.id || crypto.randomUUID(),
          name: device.name || 'Unknown Device',
          lastSeen: Date.now()
        });
      }
    } else {
      console.warn('Bluetooth is not supported on this device.');
    }
  } catch (error) {
    console.warn('Bluetooth scan failed or was cancelled:', error);
  }
  return peers;
}

export function getKnownPeers(): NearbyPeer[] {
  return Array.from(knownPeers.values());
}

export function announcePresence(): void {
  sendMessage('Device online', 'status');
}

export function destroyService(): void {
  removeMessageListener();
  if (channel) {
    channel.close();
    channel = null;
  }
}
