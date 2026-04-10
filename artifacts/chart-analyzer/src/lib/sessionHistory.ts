import { TradePlan } from './analyzeChart';

export interface HistoryEntry {
  id: string;
  direction: 'BUY' | 'SELL';
  rrRatio: number;
  confidence: string;
  timestamp: Date;
  plan: TradePlan;
  thumbnail: string;
}

const STORAGE_KEY = 'chartsense_history';

export function addToHistory(plan: TradePlan): void {
  const history = getHistory();
  
  // Create a tiny thumbnail
  const entry: HistoryEntry = {
    id: Math.random().toString(36).substring(2, 9),
    direction: plan.direction,
    rrRatio: plan.rrRatio,
    confidence: plan.confidence,
    timestamp: new Date(),
    plan,
    thumbnail: plan.imageDataUrl // In a real app we'd resize this
  };

  const updatedHistory = [entry, ...history].slice(0, 50); // Keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}

export function getHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch (e) {
    console.error('Failed to parse history', e);
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
