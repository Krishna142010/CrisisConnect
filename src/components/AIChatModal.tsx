import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export function AIChatModal({ isOpen, onClose, isOnline }: AIChatModalProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your CrisisConnect AI Assistant. Ask me about first aid procedures, flood/earthquake safety protocols, shelter guidelines, or disaster survival steps.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const quickPrompts = [
    'What should I do during an earthquake?',
    'How do I treat severe bleeding?',
    'Emergency supply checklist',
    'Flood evacuation safety tips'
  ];

  const generateOfflineResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('flood') || q.includes('water')) {
      return '⚠️ **Flood Safety:**\n• Move to higher ground immediately.\n• Do not walk, swim, or drive through flood waters.\n• Disconnect electrical appliances and main switches if safe to do so.\n• Keep emergency food and clean drinking water sealed in waterproof containers.';
    }
    if (q.includes('earthquake') || q.includes('quake')) {
      return '⚠️ **Earthquake Protocol:**\n• **Drop, Cover, and Hold On!** Get under a sturdy table or desk.\n• Stay away from glass, windows, and exterior walls.\n• If outdoors, move to an open area away from power lines and collapsing structures.\n• Do not use elevators.';
    }
    if (q.includes('bleed') || q.includes('wound') || q.includes('first aid')) {
      return '🩹 **First Aid - Severe Bleeding:**\n1. Apply firm, direct pressure on the wound using a clean cloth or bandage.\n2. Maintain continuous pressure for at least 5-10 minutes.\n3. Elevate the injured limb above heart level if possible.\n4. If bleeding does not stop, apply a pressure bandage and call emergency rescue immediately.';
    }
    if (q.includes('kit') || q.includes('supplies') || q.includes('checklist')) {
      return '🎒 **Emergency Kit Essentials:**\n• Water (at least 3 liters per person per day for 3 days)\n• Non-perishable food & can opener\n• Battery-powered or hand-crank radio & flashlight\n• First aid kit, whistle, power bank, and vital medications.';
    }
    return `Understood. For emergencies involving "${query}", prioritize personal safety first, move away from immediate hazards, and dial regional emergency dispatch. Keep your battery conserved and monitor local radio channels for updates.`;
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateOfflineResponse(messageText);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ width: '90%', maxWidth: '600px', height: '80vh', backgroundColor: '#111827', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                AI Disaster Copilot <Sparkles size={16} color="#818cf8" />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {isOnline ? 'Online Assistant • Real-time guidance' : 'Offline Mode • Local triage intelligence'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Message Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '8px',
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {m.sender === 'ai' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <Bot size={16} />
                </div>
              )}
              <div
                style={{
                  backgroundColor: m.sender === 'user' ? '#4f46e5' : '#1f2937',
                  color: '#f1f5f9',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-line',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {m.text}
                <div style={{ fontSize: '0.65rem', color: m.sender === 'user' ? '#c7d2fe' : '#64748b', textAlign: 'right', marginTop: '4px' }}>
                  {m.timestamp}
                </div>
              </div>
              {m.sender === 'user' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
              <Bot size={16} /> Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid #1f2937', backgroundColor: '#0f172a' }}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1f2937', backgroundColor: '#1e293b', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Ask AI for emergency advice, first aid steps..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'white',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0 16px',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              opacity: input.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
