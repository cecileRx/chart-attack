import { TradePlan } from './analyzeChart';

export function clearAnnotations(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function renderAnnotations(canvas: HTMLCanvasElement, plan: TradePlan, imageWidth: number, imageHeight: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  clearAnnotations(canvas);

  // Find min and max price to scale
  const prices = [plan.entry, plan.sl, plan.tp1, plan.tp2, plan.tp3];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const padding = (maxPrice - minPrice) * 0.1;
  const priceRange = (maxPrice + padding) - (minPrice - padding);
  
  const getY = (price: number) => {
    const normalizedPrice = price - (minPrice - padding);
    // Invert Y axis because canvas 0 is top
    return canvas.height - (normalizedPrice / priceRange) * canvas.height;
  };

  const entryY = getY(plan.entry);
  const slY = getY(plan.sl);
  const tp1Y = getY(plan.tp1);
  const tp2Y = getY(plan.tp2);
  const tp3Y = getY(plan.tp3);

  // Draw zones
  ctx.globalAlpha = 0.15;
  
  // Risk zone
  ctx.fillStyle = '#ef4444'; // red-500
  const riskY = Math.min(entryY, slY);
  const riskH = Math.abs(entryY - slY);
  ctx.fillRect(0, riskY, canvas.width, riskH);

  // Reward zone (Entry to TP1 at least)
  ctx.fillStyle = '#10b981'; // emerald-500
  const rewardY = Math.min(entryY, tp3Y);
  const rewardH = Math.abs(entryY - tp3Y);
  ctx.fillRect(0, rewardY, canvas.width, rewardH);

  ctx.globalAlpha = 1.0;

  const drawLine = (y: number, color: string, label: string, price: number, isDashed: boolean = false) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    if (isDashed) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();

    // Label background
    ctx.font = '600 12px Inter, sans-serif';
    const text = `${label}: ${price.toFixed(2)}`;
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(canvas.width - textWidth - 20, y - 10, textWidth + 20, 20);
    
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width - 10, y);
  };

  drawLine(slY, '#ef4444', 'SL', plan.sl, true);
  drawLine(entryY, '#f59e0b', 'ENTRY', plan.entry);
  drawLine(tp1Y, '#34d399', 'TP1 (1R)', plan.tp1);
  drawLine(tp2Y, '#10b981', 'TP2 (2R)', plan.tp2);
  drawLine(tp3Y, '#059669', 'TP3 (3R)', plan.tp3);
}
