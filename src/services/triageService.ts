import { pipeline } from '@huggingface/transformers';
import { Priority, Category, TriageResult } from '../types';

// ═══════════════════════════════════════════════════════════════
// DUAL-MODE AI TRIAGE ENGINE
// Mode 1: ONLINE  — Featherless AI (OpenAI-compatible LLM API)
// Mode 2: OFFLINE — Transformers.js (runs in browser, no internet)
// Mode 3: FALLBACK — Rule-based keyword matching (instant, always works)
// ═══════════════════════════════════════════════════════════════

let classifier: any = null;
let featherlessReady = false;
let currentMode: 'featherless' | 'transformers' | 'fallback' = 'fallback';

// ─── Featherless AI Setup ────────────────────────────────────

const FEATHERLESS_API_KEY = import.meta.env.VITE_FEATHERLESS_API_KEY || '';
const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const FEATHERLESS_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

function initializeFeatherless(): boolean {
  if (!FEATHERLESS_API_KEY) {
    console.warn('No Featherless API key found. Set VITE_FEATHERLESS_API_KEY in .env');
    return false;
  }
  featherlessReady = true;
  console.log('✅ Featherless AI initialized (online mode ready)');
  return true;
}

async function triageWithFeatherless(text: string): Promise<TriageResult | null> {
  if (!featherlessReady || !navigator.onLine) return null;

  try {
    const systemPrompt = `You are an emergency 911/crisis dispatcher AI. Analyze the crisis message and respond with ONLY valid JSON (no markdown, no explanation).

JSON schema:
{
  "priority": "P1_CRITICAL" | "P2_URGENT" | "P3_SUPPLIES" | "P4_INFORMATIONAL",
  "category": "RESCUE" | "MEDICAL" | "FOOD_WATER" | "SHELTER" | "HAZARD",
  "peopleCount": number,
  "hasMedicalCondition": boolean,
  "medicalDetails": "string or empty",
  "extractedLocation": "location from message",
  "summary": "10-word tactical summary",
  "confidence": 0.0 to 1.0
}

Priority guide:
- P1_CRITICAL: Imminent drowning, trapped in fire/collapse, severe bleeding, cardiac arrest
- P2_URGENT: Medical needs (insulin/oxygen), vulnerable person, hypothermia
- P3_SUPPLIES: Food/water shortage, blankets, power for medical device
- P4_INFORMATIONAL: Road closure, damage report, general inquiry`;

    const response = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FEATHERLESS_API_KEY}`
      },
      body: JSON.stringify({
        model: FEATHERLESS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this emergency report and return JSON only:\n\n"${text}"` }
        ],
        max_tokens: 400,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.warn('Featherless API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as TriageResult;

    // Validate required fields
    const validPriorities: Priority[] = ['P1_CRITICAL', 'P2_URGENT', 'P3_SUPPLIES', 'P4_INFORMATIONAL'];
    const validCategories: Category[] = ['RESCUE', 'MEDICAL', 'FOOD_WATER', 'SHELTER', 'HAZARD'];

    if (!validPriorities.includes(parsed.priority)) parsed.priority = 'P4_INFORMATIONAL';
    if (!validCategories.includes(parsed.category)) parsed.category = 'HAZARD';

    return {
      priority: parsed.priority,
      category: parsed.category,
      peopleCount: parsed.peopleCount || 1,
      hasMedicalCondition: parsed.hasMedicalCondition || false,
      medicalDetails: parsed.medicalDetails || undefined,
      extractedLocation: parsed.extractedLocation || 'Unknown Location',
      summary: parsed.summary || text.slice(0, 60),
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.85))
    };
  } catch (error) {
    console.warn('Featherless triage failed, falling back:', error);
    return null;
  }
}

// ─── Transformers.js Setup (Offline AI) ──────────────────────

const PRIORITY_LABELS = [
  'critical life-threatening emergency requiring immediate rescue',
  'urgent situation with medical needs or vulnerable people',
  'request for supplies food water or shelter resources',
  'general information status update or non-emergency report'
];

const CATEGORY_LABELS = [
  'water rescue flooding drowning emergency',
  'medical emergency health crisis injury',
  'food water basic supplies shortage',
  'shelter housing displacement',
  'hazard danger fire chemical spill'
];

async function initializeTransformers(): Promise<boolean> {
  try {
    classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall', {
      progress_callback: (progress: any) => {
        document.dispatchEvent(new CustomEvent('triage-ai-progress', { detail: progress }));
      }
    });
    console.log('✅ Transformers.js model loaded (offline mode ready)');
    return true;
  } catch (error) {
    console.error('Transformers.js init failed:', error);
    return false;
  }
}

async function triageWithTransformers(text: string): Promise<TriageResult | null> {
  if (!classifier) return null;

  try {
    const priorityResult = await classifier(text, PRIORITY_LABELS);
    const categoryResult = await classifier(text, CATEGORY_LABELS);

    const winningPriorityIndex = PRIORITY_LABELS.indexOf(priorityResult.labels[0]);
    const priorities: Priority[] = ['P1_CRITICAL', 'P2_URGENT', 'P3_SUPPLIES', 'P4_INFORMATIONAL'];
    const priority = priorities[winningPriorityIndex] || 'P4_INFORMATIONAL';

    const winningCategoryIndex = CATEGORY_LABELS.indexOf(categoryResult.labels[0]);
    const categories: Category[] = ['RESCUE', 'MEDICAL', 'FOOD_WATER', 'SHELTER', 'HAZARD'];
    const category = categories[winningCategoryIndex] || 'HAZARD';

    return {
      priority,
      category,
      peopleCount: extractPeopleCount(text),
      hasMedicalCondition: extractMedicalCondition(text).hasMedical,
      medicalDetails: extractMedicalCondition(text).details,
      extractedLocation: extractLocation(text),
      summary: createSummary(text),
      confidence: priorityResult.scores[0]
    };
  } catch (error) {
    console.error('Transformers.js triage failed:', error);
    return null;
  }
}

// ─── Rule-Based Helpers (Always Work) ────────────────────────

const extractPeopleCount = (text: string): number => {
  const match = text.match(/(\d+)\s*(kids|people|persons|family of|children|adults|men|women|residents|students)/i);
  if (match && match[1]) return parseInt(match[1], 10);
  if (/family/i.test(text)) return 4;
  return 1;
};

const extractMedicalCondition = (text: string): { hasMedical: boolean; details?: string } => {
  const keywords = ['insulin', 'oxygen', 'pregnant', 'diabetic', 'heart', 'bleeding', 'injury', 'medicine', 'wheelchair', 'asthma', 'elderly', 'inhaler', 'dialysis', 'seizure', 'allergic', 'epipen', 'labor'];
  const lowerText = text.toLowerCase();
  const found = keywords.filter(kw => lowerText.includes(kw));
  return found.length > 0
    ? { hasMedical: true, details: `Medical needs: ${found.join(', ')}` }
    : { hasMedical: false };
};

const extractLocation = (text: string): string => {
  const streetMatch = text.match(/(?:at|near|on)\s+((?:\d+\s+)?[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Apartments|Apts|School|Center|Park|Highway|Route))/i);
  if (streetMatch?.[1]) return streetMatch[1].trim();
  const atMatch = text.match(/(?:at|near)\s+(?:the\s+)?([A-Z][a-zA-Z\s]{3,30})/);
  if (atMatch?.[1]) return atMatch[1].trim();
  return 'Unknown Location';
};

const createSummary = (text: string): string => {
  const words = text.split(/\s+/).slice(0, 10);
  return words.join(' ') + (text.split(/\s+/).length > 10 ? '...' : '');
};

export const fallbackTriage = (text: string): TriageResult => {
  const lowerText = text.toLowerCase();

  let priority: Priority = 'P4_INFORMATIONAL';
  if (lowerText.match(/trapped|drowning|dying|immediate|help now|can't breathe|collapsed|cardiac|fire spreading|swept away/)) priority = 'P1_CRITICAL';
  else if (lowerText.match(/injured|bleeding|medicine|elderly|pregnant|insulin|oxygen|asthma|labor|passed out|unconscious/)) priority = 'P2_URGENT';
  else if (lowerText.match(/food|water|blanket|shelter|hungry|thirsty|cold|formula|supplies/)) priority = 'P3_SUPPLIES';

  let category: Category = 'HAZARD';
  if (lowerText.match(/water|flood|boat|drowning|rising|creek|river|swept/)) category = 'RESCUE';
  else if (lowerText.match(/medical|injury|bleeding|medicine|doctor|pain|insulin|oxygen|hospital|pregnant|heart/)) category = 'MEDICAL';
  else if (lowerText.match(/food|water|hungry|thirsty|formula|drinking/)) category = 'FOOD_WATER';
  else if (lowerText.match(/shelter|home|house|roof|stay|displaced|destroyed/)) category = 'SHELTER';

  return {
    priority, category,
    peopleCount: extractPeopleCount(text),
    hasMedicalCondition: extractMedicalCondition(text).hasMedical,
    medicalDetails: extractMedicalCondition(text).details,
    extractedLocation: extractLocation(text),
    summary: createSummary(text),
    confidence: 0.5
  };
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export const initializeAI = async (): Promise<void> => {
  const featherlessOk = initializeFeatherless();
  if (featherlessOk) currentMode = 'featherless';

  const transformersOk = await initializeTransformers();
  if (transformersOk && !featherlessOk) currentMode = 'transformers';
  if (!featherlessOk && !transformersOk) currentMode = 'fallback';

  console.log(`🧠 AI Triage Mode: ${currentMode.toUpperCase()}`);
};

export const isModelLoaded = (): boolean => classifier !== null || featherlessReady;

export const getAIMode = (): 'featherless' | 'transformers' | 'fallback' => {
  if (navigator.onLine && featherlessReady) return 'featherless';
  if (classifier) return 'transformers';
  return 'fallback';
};

export const triageReport = async (text: string): Promise<TriageResult> => {
  // 1. Try Featherless AI (online, most accurate)
  if (navigator.onLine && featherlessReady) {
    const result = await triageWithFeatherless(text);
    if (result) { currentMode = 'featherless'; return result; }
  }
  // 2. Try Transformers.js (offline, good accuracy)
  if (classifier) {
    const result = await triageWithTransformers(text);
    if (result) { currentMode = 'transformers'; return result; }
  }
  // 3. Rule-based fallback (instant, always works)
  currentMode = 'fallback';
  return fallbackTriage(text);
};
