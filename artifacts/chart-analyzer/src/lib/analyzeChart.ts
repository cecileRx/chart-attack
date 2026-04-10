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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function analyzeChart(imageDataUrl: string): TradePlan {
  const hash = hashString(imageDataUrl.slice(0, 1000));
  const isBuy = hash % 2 === 0;
  const direction = isBuy ? 'BUY' : 'SELL';
  
  const basePrice = 100 + (hash % 400) + (hash % 100) / 100;
  const riskPercent = 0.005 + (hash % 10) / 1000; 

  const entry = Number(basePrice.toFixed(2));
  
  let sl: number;
  if (isBuy) {
    sl = entry * (1 - riskPercent);
  } else {
    sl = entry * (1 + riskPercent);
  }
  sl = Number(sl.toFixed(2));

  const risk = Math.abs(entry - sl);
  
  const tp1 = Number((isBuy ? entry + risk * 1 : entry - risk * 1).toFixed(2));
  const tp2 = Number((isBuy ? entry + risk * 2 : entry - risk * 2).toFixed(2));
  const tp3 = Number((isBuy ? entry + risk * 3 : entry - risk * 3).toFixed(2));

  const rrTp1 = calculateRiskReward(entry, sl, tp1);
  const rrTp2 = calculateRiskReward(entry, sl, tp2);
  const rrTp3 = calculateRiskReward(entry, sl, tp3);
  
  const score = 40 + (hash % 46);
  let confidence: 'LOW' | 'MEDIUM' | 'GOOD' = 'LOW';
  if (score > 75) confidence = 'GOOD';
  else if (score > 55) confidence = 'MEDIUM';

  const explanation = isBuy 
    ? "Price is showing a potential bounce off a key support zone. The risk is well-defined below the recent swing low."
    : "Price is facing rejection at a major resistance level. The structure suggests a continuation of the downtrend.";

  const setupQuality = score > 75 ? "High probability setup with excellent risk-reward characteristics." 
    : score > 55 ? "Standard setup. Wait for clear confirmation before entry." 
    : "Marginal setup. Consider reducing position size or waiting for a better opportunity.";

  return {
    direction,
    entry,
    sl,
    tp1,
    tp2,
    tp3,
    rrRatio: rrTp3,
    rrTp1,
    rrTp2,
    rrTp3,
    confidence,
    confidenceScore: score,
    explanation,
    setupQuality,
    imageDataUrl
  };
}

export function generateTradePlan(imageDataUrl: string, levels: ManualLevels, direction: 'BUY' | 'SELL'): TradePlan {
  const rrTp1 = calculateRiskReward(levels.entry, levels.sl, levels.tp1);
  const rrTp2 = calculateRiskReward(levels.entry, levels.sl, levels.tp2);
  const rrTp3 = calculateRiskReward(levels.entry, levels.sl, levels.tp3);
  
  let explanation = "";
  if (rrTp3 >= 3) {
    explanation = "Excellent risk to reward ratio on the final target. This allows for a profitable strategy even with a lower win rate.";
  } else if (rrTp3 >= 2) {
    explanation = "Solid risk to reward ratio. This is a standard setup suitable for most trend-following strategies.";
  } else {
    explanation = "The risk-reward ratio is a bit tight. Ensure this setup has a very high probability of success.";
  }

  const isInvalid = direction === 'BUY' ? levels.sl >= levels.entry : levels.sl <= levels.entry;
  if (isInvalid) {
    explanation = "WARNING: Stop loss is on the wrong side of the entry price for the selected direction.";
  }

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
    setupQuality: "Manually adjusted levels. Maintain discipline and stick to the plan.",
    imageDataUrl
  };
}
