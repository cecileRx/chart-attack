// Expectancy model for ChartAttack trade plans.
//
// The EA manages every position the same way: risk = 1R on the full size, then
// scales out 50% / 30% / 20% at TP1 / TP2 / TP3 and moves the stop to breakeven
// after TP1. So the realized R is fully determined by the exit level reached:
//
//   SL  : full stop, no TP   -> -1.0R
//   BE  : closed at entry     ->  0.0R
//   TP1 : 50% @ +1R, rest BE  -> +0.5R
//   TP2 : TP1 + 30% @ +2R     -> +1.1R   (0.5 + 0.6)
//   TP3 : TP2 + 20% @ +3R     -> +1.7R   (0.5 + 0.6 + 0.6)
//
// NOTE: max realized is ~1.7R, NOT the "3:1" shown on the plan — only the last
// 20% ever reaches 3R. These are model values; a precise `realizedR` (from MT5)
// always overrides them.

export type ExitLevel = 'SL' | 'BE' | 'TP1' | 'TP2' | 'TP3';

export const EXIT_LEVELS: ExitLevel[] = ['SL', 'BE', 'TP1', 'TP2', 'TP3'];

export const R_BY_EXIT: Record<ExitLevel, number> = {
  SL: -1.0,
  BE: 0,
  TP1: 0.5,
  TP2: 1.1,
  TP3: 1.7,
};

export function isExitLevel(v: unknown): v is ExitLevel {
  return typeof v === 'string' && (EXIT_LEVELS as string[]).includes(v);
}

/** Realized R for one entry: precise value if known (MT5), else the model value from the exit level, else null (ungraded). */
export function entryR(e: { exit?: string | null; realizedR?: number | null }): number | null {
  if (e.realizedR != null) return e.realizedR;
  if (isExitLevel(e.exit)) return R_BY_EXIT[e.exit];
  return null;
}

export interface ExpectancyStats {
  graded: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number | null; // % of graded trades with R > 0
  expectancy: number | null; // mean R per graded trade — the headline number
  profitFactor: number | null; // gross win R / |gross loss R|
  avgWinR: number | null;
  avgLossR: number | null; // negative
  totalR: number;
}

export function computeExpectancy(
  entries: Array<{ exit?: string | null; realizedR?: number | null }>,
): ExpectancyStats {
  const rs = entries.map(entryR).filter((r): r is number => r != null);
  const graded = rs.length;
  const winRs = rs.filter((r) => r > 0);
  const lossRs = rs.filter((r) => r < 0);
  const grossWin = winRs.reduce((a, b) => a + b, 0);
  const grossLoss = lossRs.reduce((a, b) => a + b, 0); // negative
  const totalR = rs.reduce((a, b) => a + b, 0);

  return {
    graded,
    wins: winRs.length,
    losses: lossRs.length,
    breakeven: rs.filter((r) => r === 0).length,
    winRate: graded > 0 ? (winRs.length / graded) * 100 : null,
    expectancy: graded > 0 ? totalR / graded : null,
    profitFactor:
      grossLoss !== 0 ? grossWin / Math.abs(grossLoss) : grossWin > 0 ? Infinity : null,
    avgWinR: winRs.length > 0 ? grossWin / winRs.length : null,
    avgLossR: lossRs.length > 0 ? grossLoss / lossRs.length : null,
    totalR,
  };
}
