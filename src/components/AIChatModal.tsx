import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, ShieldCheck } from 'lucide-react';

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

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your Local Disaster Assistant. I operate 100% on-device (zero server API / zero credit usage) to provide instant first-aid, evacuation, and emergency guidelines.',
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

  // 100% Local On-Device Knowledge Base — Consumes 0 API Credits
  const generateLocalResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('flood') || q.includes('water') || q.includes('drown')) {
      return '🌊 **Flood Safety Protocol:**\n' +
        '• Move immediately to higher ground or upper floors.\n' +
        '• Never drive, walk, or swim through moving water (6 inches can knock you down).\n' +
        '• Turn off main electrical breakers if safe before water rises.\n' +
        '• Boil all tap water before drinking until authorities declare it safe.';
    }

    if (q.includes('earthquake') || q.includes('quake') || q.includes('tremor') || q.includes('shake')) {
      return '🏚️ **Earthquake Safety Protocol:**\n' +
        '• **DROP, COVER, and HOLD ON!** Get under heavy furniture.\n' +
        '• Stay clear of glass, exterior walls, and tall furniture.\n' +
        '• If outdoors, move to an open area away from buildings, streetlights, and utility wires.\n' +
        '• Do NOT use elevators after shaking stops.';
    }

    if (q.includes('bleed') || q.includes('wound') || q.includes('cut') || q.includes('blood')) {
      return '🩹 **First Aid: Severe Bleeding:**\n' +
        '1. Apply direct, firm pressure on the wound with a clean cloth or gauze.\n' +
        '2. Do NOT remove soaked cloth—add more layers on top.\n' +
        '3. Elevate the wounded area above the level of the heart if possible.\n' +
        '4. If blood spurts continuously, apply a tourniquet 2-3 inches above the wound (not on a joint) and note the time applied.';
    }

    if (q.includes('burn') || q.includes('fire') || q.includes('smoke')) {
      return '🔥 **Burn & Fire First Aid:**\n' +
        '• Cool the burn under gentle, cold running water for at least 10–20 minutes.\n' +
        '• Do NOT apply ice, butter, or oil to burns.\n' +
        '• Cover loosely with a sterile, non-stick dressing.\n' +
        '• If trapped in smoke, stay low near the floor where air is cleaner.';
    }

    if (q.includes('cpr') || q.includes('unconscious') || q.includes('breathing')) {
      return '🫀 **Emergency CPR Protocol:**\n' +
        '1. Check responsiveness and breathing.\n' +
        '2. Place hands centered on chest and push hard and fast (100–120 beats per minute, matching the beat of "Stayin\' Alive").\n' +
        '3. Allow chest to fully recoil between compressions.\n' +
        '4. Do not stop until paramedics or emergency help arrives.';
    }

    if (q.includes('kit') || q.includes('supplies') || q.includes('bag') || q.includes('checklist')) {
      return '🎒 **Essential Disaster Go-Bag:**\n' +
        '• Water (at least 3 liters per person/day for 3 days)\n' +
        '• Non-perishable food & manual can opener\n' +
        '• Battery-operated or hand-crank flashlight & radio\n' +
        '• First aid kit, prescription medicines, and power bank\n' +
        '• Whistle, dust mask, and copies of important documents in a waterproof pouch.';
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('who are you')) {
      return 'Hello! I am your local disaster response copilot. Ask me about first aid, disaster response steps, CPR, evacuation protocols, or emergency checklists.';
    }

    return `Safety Advice for "${query}":\n• Prioritize moving away from any active hazard.\n• Keep battery usage minimal and monitor official regional radio frequencies.\n• For urgent rescue, use the red SOS button on the bottom right to dispatch responders.`;
  };

  const handleSend = (textToSend?: string) => {
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

    // Instant local evaluation without calling external paid APIs
    setTimeout(() => {
      const reply = generateLocalResponse(messageText);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 350);
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
                Local AI Assistant
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> 100% Offline • Zero API Credit Usage
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
              <Bot size={16} /> Retrieving local protocol...
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
            placeholder="Ask for first-aid, evacuation, or safety steps..."
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
