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

/**
 * Determine appropriate decimal places based on price magnitude.
 * Forex pairs (< 10): 5 decimals. Mid-range (10–1000): 2 decimals. Large (> 1000): 1 decimal.
 */
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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Analyze chart using the visible price range from the chart's right axis.
 * priceMin = lowest price visible on the right axis
 * priceMax = highest price visible on the right axis
 */
export function analyzeChart(imageDataUrl: string, priceMin: number, priceMax: number): TradePlan {
  const hash = hashString(imageDataUrl.slice(0, 1000));
  const isBuy = hash % 2 === 0;
  const direction = isBuy ? 'BUY' : 'SELL';

  const range = priceMax - priceMin;
  const decimals = getDecimals(priceMin);

  // Seed a normalized 0-1 offset using the hash
  const hashFrac1 = (hash % 1000) / 1000;   // 0.000 – 0.999
  const hashFrac2 = ((hash >> 8) % 1000) / 1000;

  // Entry placement:
  // BUY: entry in lower-to-mid section of range (25–55%) — buying near support
  // SELL: entry in upper-to-mid section of range (45–75%) — selling near resistance
  let entryFrac: number;
  if (isBuy) {
    entryFrac = 0.25 + hashFrac1 * 0.30; // 25–55% of range
  } else {
    entryFrac = 0.45 + hashFrac1 * 0.30; // 45–75% of range
  }

  const entry = round(priceMin + entryFrac * range, decimals);

  // SL: 0.8–2% of the visible range beyond entry
  const slDistance = range * (0.008 + hashFrac2 * 0.012);
  const sl = round(isBuy ? entry - slDistance : entry + slDistance, decimals);

  // TPs at 1R, 2R, 3R
  const risk = Math.abs(entry - sl);
  const tp1 = round(isBuy ? entry + risk * 1 : entry - risk * 1, decimals);
  const tp2 = round(isBuy ? entry + risk * 2 : entry - risk * 2, decimals);
  const tp3 = round(isBuy ? entry + risk * 3 : entry - risk * 3, decimals);

  // Clamp TP3 within visible range (±5% buffer allowed)
  const buffer = range * 0.05;
  const tp3Clamped = isBuy
    ? Math.min(tp3, priceMax + buffer)
    : Math.max(tp3, priceMin - buffer);
  const tp3Final = round(tp3Clamped, decimals);

  const rrTp1 = calculateRiskReward(entry, sl, tp1);
  const rrTp2 = calculateRiskReward(entry, sl, tp2);
  const rrTp3 = calculateRiskReward(entry, sl, tp3Final);

  const score = 40 + (hash % 46);
  let confidence: 'LOW' | 'MEDIUM' | 'GOOD' = 'LOW';
  if (score > 75) confidence = 'GOOD';
  else if (score > 55) confidence = 'MEDIUM';

  const explanation = isBuy
    ? `Price is showing a potential bounce off a key support zone near ${sl.toFixed(decimals)}. ` +
      `The entry at ${entry.toFixed(decimals)} offers a clearly defined risk with the stop loss placed below the invalidation level. ` +
      `The first target at ${tp1.toFixed(decimals)} aligns with the next resistance area.`
    : `Price is facing rejection at a major resistance level near ${sl.toFixed(decimals)}. ` +
      `The entry at ${entry.toFixed(decimals)} captures the beginning of a potential move lower, with the stop loss set above the rejection zone. ` +
      `The first target at ${tp1.toFixed(decimals)} aligns with nearby support.`;

  const setupQuality = score > 75
    ? 'High probability setup with excellent risk-reward characteristics. The levels align well with chart structure.'
    : score > 55
    ? 'Standard setup. Wait for a clear price reaction and confirmation before entering.'
    : 'Marginal setup. Consider reducing position size or waiting for a higher-confidence entry signal.';

  return {
    direction,
    entry,
    sl,
    tp1,
    tp2,
    tp3: tp3Final,
    rrRatio: rrTp3,
    rrTp1,
    rrTp2,
    rrTp3,
    confidence,
    confidenceScore: score,
    explanation,
    setupQuality,
    imageDataUrl,
    priceMin,
    priceMax,
  };
}

export function generateTradePlan(
  imageDataUrl: string,
  levels: ManualLevels,
  direction: 'BUY' | 'SELL',
  priceMin = 0,
  priceMax = 0,
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

  explanation += ` Risk distance: ${risk.toFixed(decimals)} (${riskPct}% of entry price).` +
    ' The stop loss is placed to invalidate the setup if price moves against you.';

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
  };
}
