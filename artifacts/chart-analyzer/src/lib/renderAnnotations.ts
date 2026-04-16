import { TradePlan } from './analyzeChart';

export function clearAnnotations(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getDecimals(price: number): number {
  if (price < 0.01) return 8;
  if (price < 10) return 5;
  if (price < 100) return 3;
  if (price < 10000) return 2;
  return 1;
}

/**
 * Maps a price to a Y coordinate using the chart's actual visible price range.
 * priceMin  → bottom of canvas
 * priceMax  → top of canvas
 * A small vertical padding (8% each side) matches most chart layouts where
 * the axis labels don't land at the absolute edge of the image.
 */
function makePriceToY(priceMin: number, priceMax: number, canvasHeight: number) {
  const EDGE_PADDING = 0.08; // 8% top/bottom — matches typical chart padding
  const usableTop = canvasHeight * EDGE_PADDING;
  const usableBottom = canvasHeight * (1 - EDGE_PADDING);
  const usableHeight = usableBottom - usableTop;

  return (price: number): number => {
    if (priceMax === priceMin) return canvasHeight / 2;
    const fraction = (price - priceMin) / (priceMax - priceMin);
    // Higher prices → smaller Y (top of canvas)
    return usableBottom - fraction * usableHeight;
  };
}

export function renderAnnotations(
  canvas: HTMLCanvasElement,
  plan: TradePlan,
  _imageWidth: number,
  _imageHeight: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  clearAnnotations(canvas);

  const decimals = getDecimals(plan.entry);

  // Use the user-supplied chart price range for accurate positioning.
  // Fall back to a range derived from the trade levels if no range was provided.
  let refMin = plan.priceMin;
  let refMax = plan.priceMax;
  if (!refMin || !refMax || refMin >= refMax) {
    const prices = [plan.entry, plan.sl, plan.tp1, plan.tp2, plan.tp3];
    const spread = Math.max(...prices) - Math.min(...prices);
    refMin = Math.min(...prices) - spread * 0.2;
    refMax = Math.max(...prices) + spread * 0.2;
  }

  const getY = makePriceToY(refMin, refMax, canvas.height);

  const entryY = getY(plan.entry);
  const slY    = getY(plan.sl);
  const tp1Y   = getY(plan.tp1);
  const tp2Y   = getY(plan.tp2);
  const tp3Y   = getY(plan.tp3);

  // ── FVG Zones (drawn first, behind everything) ─────────────────────────
  if (plan.fvgs && plan.fvgs.length > 0) {
    for (const fvg of plan.fvgs) {
      const topY    = getY(fvg.top);
      const bottomY = getY(fvg.bottom);
      const zoneY   = Math.min(topY, bottomY);
      const zoneH   = Math.abs(topY - bottomY);

      // Skip if too thin to be visible
      if (zoneH < 1) continue;

      const isBull    = fvg.type === 'bullish';
      const fillColor = isBull ? '#facc15' : '#3b82f6';
      const fillAlpha = fvg.mitigated ? 0.06 : 0.16;
      const lineAlpha = fvg.mitigated ? 0.20 : 0.55;

      // Fill
      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle   = fillColor;
      ctx.fillRect(0, zoneY, canvas.width, zoneH);

      // Top & bottom borders (dashed if mitigated)
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = fillColor;
      ctx.lineWidth   = 1;
      ctx.setLineDash(fvg.mitigated ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(canvas.width, topY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(canvas.width, bottomY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // Label pill on the left edge
      const label    = (isBull ? 'BULL' : 'BEAR') + ' FVG' + (fvg.mitigated ? ' ✓' : '');
      const midY     = zoneY + zoneH / 2;
      const fontSize = Math.max(9, Math.min(11, zoneH * 0.55));
      ctx.font        = `700 ${fontSize}px "Inter", monospace`;
      const tw        = ctx.measureText(label).width;
      const padX      = 6;
      const padY      = 3;
      const boxW      = tw + padX * 2;
      const boxH      = fontSize + padY * 2;

      // Pill background
      ctx.fillStyle   = '#0f172a';
      ctx.globalAlpha = 0.82;
      roundRect(ctx, 4, midY - boxH / 2, boxW, boxH, 3);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Pill text
      ctx.fillStyle    = fillColor;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 4 + padX, midY);
    }
  }

  // ── Shaded zones ──────────────────────────────────────────────────────────
  ctx.globalAlpha = 0.12;

  // Risk zone (entry ↔ SL)
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, Math.min(entryY, slY), canvas.width, Math.abs(entryY - slY));

  // Reward zone (entry ↔ TP3)
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, Math.min(entryY, tp3Y), canvas.width, Math.abs(entryY - tp3Y));

  ctx.globalAlpha = 1.0;

  // ── Helper: draw a level line + label ────────────────────────────────────
  const drawLine = (
    y: number,
    color: string,
    label: string,
    price: number,
    isDashed = false,
    lineWidth = 2,
  ) => {
    // Guard against drawing off-canvas
    if (y < -20 || y > canvas.height + 20) return;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.setLineDash(isDashed ? [6, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label box — right-aligned, sits right on the line
    ctx.font = `700 11px "Inter", "Roboto Mono", monospace`;
    const priceStr = price.toFixed(decimals);
    const text = `${label}  ${priceStr}`;
    const textWidth = ctx.measureText(text).width;
    const boxH = 18;
    const boxW = textWidth + 16;
    const boxX = canvas.width - boxW - 4;
    const boxY = y - boxH / 2;

    // Background pill
    ctx.fillStyle = '#0f172a';
    ctx.globalAlpha = 0.88;
    roundRect(ctx, boxX, boxY, boxW, boxH, 4);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Text
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, boxX + 8, y);
  };

  // ── Draw levels (bottom to top to avoid overlapping labels) ──────────────
  // SL — crimson dashed
  drawLine(slY,    '#f87171', 'SL',          plan.sl,    true,  2);
  // Entry — amber solid
  drawLine(entryY, '#fbbf24', 'ENTRY',       plan.entry, false, 2.5);
  // TPs — progressively lighter green
  drawLine(tp1Y,   '#34d399', 'TP1 (1R)',    plan.tp1,   false, 2);
  drawLine(tp2Y,   '#10b981', 'TP2 (2R)',    plan.tp2,   false, 2);
  drawLine(tp3Y,   '#059669', 'TP3 (3R)',    plan.tp3,   false, 2);
}

// Tiny helper — CanvasRenderingContext2D.roundRect is not available in all browsers
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
