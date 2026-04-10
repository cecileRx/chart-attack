export interface TradePlan {
  direction: 'BUY' | 'SELL';
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrRatio: number;
  rrTp1: number;
  rrTp2: number;
  rrTp3: number;
  confidence: 'LOW' | 'MEDIUM' | 'GOOD';
  confidenceScore: number;
  explanation: string;
  setupQuality: string;
  imageDataUrl: string;
  priceMin: number;
  priceMax: number;
  // AI-provided fields
  context: string;      // asset name, e.g. "EUR/USD", "BTC/USD"
  timeframe: string;    // chart timeframe, e.g. "4H", "Daily"
  keyLevels: string;    // description of key support/resistance
}

export interface ManualLevels {
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
}

export function calculateRiskReward(entry: number, sl: number, tp: number): number {
  if (entry === sl) return 0;
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  return Number((reward / risk).toFixed(2));
}

function getDecimals(price: number): number {
  if (price < 0.01) return 8;
  if (price < 10) return 5;
  if (price < 100) return 3;
  if (price < 10000) return 2;
  return 1;
}

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

/**
 * Build a TradePlan from the AI API response.
 * Maps the raw ChartAnalysisResult to a fully-typed TradePlan.
 */
export function buildPlanFromAIResponse(
  imageDataUrl: string,
  ai: {
    context: string;
    timeframe: string;
    priceMin: number;
    priceMax: number;
    direction: 'BUY' | 'SELL';
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    confidence: 'LOW' | 'MEDIUM' | 'GOOD';
    confidenceScore: number;
    explanation: string;
    setupQuality: string;
    keyLevels: string;
  },
): TradePlan {
  const decimals = getDecimals(ai.entry);

  // Recalculate TPs at 1R/2R/3R from actual entry and SL (AI may have been imprecise)
  const risk = Math.abs(ai.entry - ai.sl);
  const isBuy = ai.direction === 'BUY';
  const tp1 = round(isBuy ? ai.entry + risk * 1 : ai.entry - risk * 1, decimals);
  const tp2 = round(isBuy ? ai.entry + risk * 2 : ai.entry - risk * 2, decimals);
  const tp3 = round(isBuy ? ai.entry + risk * 3 : ai.entry - risk * 3, decimals);

  const rrTp1 = calculateRiskReward(ai.entry, ai.sl, tp1);
  const rrTp2 = calculateRiskReward(ai.entry, ai.sl, tp2);
  const rrTp3 = calculateRiskReward(ai.entry, ai.sl, tp3);

  return {
    direction: ai.direction,
    entry: round(ai.entry, decimals),
    sl: round(ai.sl, decimals),
    tp1,
    tp2,
    tp3,
    rrRatio: rrTp3,
    rrTp1,
    rrTp2,
    rrTp3,
    confidence: ai.confidence,
    confidenceScore: Math.max(0, Math.min(100, ai.confidenceScore)),
    explanation: ai.explanation,
    setupQuality: ai.setupQuality,
    imageDataUrl,
    priceMin: ai.priceMin,
    priceMax: ai.priceMax,
    context: ai.context,
    timeframe: ai.timeframe,
    keyLevels: ai.keyLevels,
  };
}

export function calculateRiskRewardValues(
  entry: number,
  sl: number,
  tp1: number,
  tp2: number,
  tp3: number,
) {
  return {
    rrTp1: calculateRiskReward(entry, sl, tp1),
    rrTp2: calculateRiskReward(entry, sl, tp2),
    rrTp3: calculateRiskReward(entry, sl, tp3),
  };
}

export function generateTradePlan(
  imageDataUrl: string,
  levels: ManualLevels,
  direction: 'BUY' | 'SELL',
  priceMin = 0,
  priceMax = 0,
  context = '',
  timeframe = '',
  keyLevels = '',
): TradePlan {
  const rrTp1 = calculateRiskReward(levels.entry, levels.sl, levels.tp1);
  const rrTp2 = calculateRiskReward(levels.entry, levels.sl, levels.tp2);
  const rrTp3 = calculateRiskReward(levels.entry, levels.sl, levels.tp3);

  const decimals = getDecimals(levels.entry);

  let explanation = '';
  if (rrTp3 >= 3) {
    explanation = `Excellent risk-to-reward ratio on the final target (${rrTp3}:1). ` +
      'This allows for a profitable strategy even with a lower win rate.';
  } else if (rrTp3 >= 2) {
    explanation = `Solid risk-to-reward ratio (${rrTp3}:1). ` +
      'This is a standard setup suitable for most trend-following strategies.';
  } else {
    explanation = `The risk-reward ratio (${rrTp3}:1) is a bit tight. ` +
      'Ensure this setup has a very high probability of success before entering.';
  }

  const isInvalid = direction === 'BUY' ? levels.sl >= levels.entry : levels.sl <= levels.entry;
  if (isInvalid) {
    explanation = 'WARNING: The stop loss is on the wrong side of the entry price for the selected direction. Please correct it.';
  }

  const risk = Math.abs(levels.entry - levels.sl);
  const riskPct = levels.entry > 0 ? ((risk / levels.entry) * 100).toFixed(2) : '—';

  explanation += ` Risk distance: ${risk.toFixed(decimals)} (${riskPct}% of entry).`;

  return {
    direction,
    entry: levels.entry,
    sl: levels.sl,
    tp1: levels.tp1,
    tp2: levels.tp2,
    tp3: levels.tp3,
    rrRatio: rrTp3,
    rrTp1,
    rrTp2,
    rrTp3,
    confidence: 'MEDIUM',
    confidenceScore: 65,
    explanation,
    setupQuality: 'Manually adjusted levels. Maintain discipline and stick to the plan once entered.',
    imageDataUrl,
    priceMin,
    priceMax,
    context,
    timeframe,
    keyLevels,
  };
}
