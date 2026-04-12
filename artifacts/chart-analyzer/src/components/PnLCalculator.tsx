import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ContractConfig {
  size: number;
  label: string;
  unit: string;
  currency: string;
  note?: string;
}

function getContractConfig(asset: string): ContractConfig {
  const a = asset.toUpperCase();

  if (a.includes('XAU') || a.includes('GOLD'))
    return { size: 100, label: 'Gold', unit: '100 oz / lot', currency: 'USD' };

  if (a.includes('XAG') || a.includes('SILVER'))
    return { size: 100, label: 'Silver', unit: '100 oz / lot', currency: 'USD' };

  if (a.includes('BTC') || a.includes('BITCOIN'))
    return { size: 1, label: 'Bitcoin', unit: '1 BTC / lot', currency: 'USD' };

  if (a.includes('ETH') || a.includes('ETHEREUM'))
    return { size: 1, label: 'Ethereum', unit: '1 ETH / lot', currency: 'USD' };

  if (a.includes('LTC') || a.includes('LITECOIN'))
    return { size: 1, label: 'Litecoin', unit: '1 LTC / lot', currency: 'USD' };

  if (a.includes('XRP') || a.includes('RIPPLE'))
    return { size: 10000, label: 'XRP', unit: '10,000 XRP / lot', currency: 'USD' };

  if (a.includes('OIL') || a.includes('WTI') || a.includes('XTI') || a.includes('USOIL'))
    return { size: 100, label: 'WTI Oil', unit: '100 bbl / lot', currency: 'USD' };

  if (a.includes('BRENT') || a.includes('XBR') || a.includes('UKOIL'))
    return { size: 100, label: 'Brent Oil', unit: '100 bbl / lot', currency: 'USD' };

  if (a.includes('NAS') || a.includes('NDX') || a.includes('US100'))
    return { size: 1, label: 'NASDAQ 100', unit: '$1 / point / lot', currency: 'USD', note: 'Approximate — verify with your broker.' };

  if (a.includes('SPX') || a.includes('SP500') || a.includes('US500'))
    return { size: 1, label: 'S&P 500', unit: '$1 / point / lot', currency: 'USD', note: 'Approximate — verify with your broker.' };

  if (a.includes('US30') || a.includes('DOW') || a.includes('DJI') || a.includes('WALL'))
    return { size: 1, label: 'Dow Jones', unit: '$1 / point / lot', currency: 'USD', note: 'Approximate — verify with your broker.' };

  if (a.includes('DAX') || a.includes('GER') || a.includes('DE30') || a.includes('DE40'))
    return { size: 1, label: 'DAX', unit: '€1 / point / lot', currency: 'EUR', note: 'Result in EUR — convert to USD at current rate.' };

  if (a.includes('FTSE') || a.includes('UK100'))
    return { size: 1, label: 'FTSE 100', unit: '£1 / point / lot', currency: 'GBP', note: 'Result in GBP — convert to USD at current rate.' };

  // JPY pairs — result in JPY (divide by rate for USD)
  if (a.includes('JPY'))
    return { size: 100000, label: 'JPY Pair', unit: '100K units / lot', currency: 'JPY', note: 'Result in JPY — divide by current rate for USD.' };

  // Default: standard forex lot, USD-quoted (EURUSD, GBPUSD, AUDUSD, etc.)
  return { size: 100000, label: 'Forex', unit: '100,000 units / lot', currency: 'USD' };
}

function formatPnL(value: number, currency: string): string {
  const abs = Math.abs(value);
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  if (abs >= 1000000) return `${symbol}${(value / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${symbol}${(value / 1000).toFixed(2)}K`;
  return `${symbol}${value.toFixed(2)}`;
}

interface PnLRow {
  label: string;
  price: number;
  pnl: number;
  rrLabel: string;
  isLoss?: boolean;
}

interface Props {
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrTp1: number;
  rrTp2: number;
  rrTp3: number;
  direction: 'BUY' | 'SELL';
  asset: string;
}

export function PnLCalculator({ entry, sl, tp1, tp2, tp3, rrTp1, rrTp2, rrTp3, direction, asset }: Props) {
  const [lots, setLots] = useState<string>('1');

  const config = useMemo(() => getContractConfig(asset), [asset]);

  const lotsNum = parseFloat(lots) || 0;

  const calcPnL = (targetPrice: number): number => {
    const diff = Math.abs(targetPrice - entry);
    return diff * config.size * lotsNum;
  };

  const rows: PnLRow[] = [
    { label: 'TP3', price: tp3, pnl: calcPnL(tp3), rrLabel: `${rrTp3}:1`, isLoss: false },
    { label: 'TP2', price: tp2, pnl: calcPnL(tp2), rrLabel: `${rrTp2}:1`, isLoss: false },
    { label: 'TP1', price: tp1, pnl: calcPnL(tp1), rrLabel: `${rrTp1}:1`, isLoss: false },
    { label: 'Stop Loss', price: sl, pnl: calcPnL(sl), rrLabel: '—', isLoss: true },
  ];

  return (
    <div className="space-y-3">
      {/* Instrument info + lot input */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Instrument:</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {config.label} <span className="font-normal text-slate-400">({config.unit})</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Lots:</label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={lots}
            onChange={e => setLots(e.target.value)}
            className="w-24 h-8 text-sm text-right font-mono"
          />
        </div>
      </div>

      {/* P&L table */}
      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-3 py-2 text-sm ${
              i < rows.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
            } ${row.isLoss ? 'bg-rose-50 dark:bg-rose-900/10' : 'bg-emerald-50 dark:bg-emerald-900/10'}`}
          >
            <div className="flex items-center gap-2">
              {row.isLoss
                ? <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                : <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              }
              <span className={`font-semibold text-xs ${row.isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {row.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">{row.price}</span>
            </div>
            <div className="flex items-center gap-2">
              {row.rrLabel !== '—' && (
                <span className="text-xs text-slate-400">{row.rrLabel}</span>
              )}
              <span className={`font-bold font-mono text-sm ${row.isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {row.isLoss ? '−' : '+'}{formatPnL(row.pnl, config.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Risk/reward summary */}
      {lotsNum > 0 && (
        <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
          <DollarSign className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Max risk: <strong className="text-rose-500">{formatPnL(calcPnL(sl), config.currency)}</strong>
            {' · '}
            Best reward (TP3): <strong className="text-emerald-500">{formatPnL(calcPnL(tp3), config.currency)}</strong>
          </span>
        </div>
      )}

      {/* Broker disclaimer / currency note */}
      {config.note && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/15 rounded-lg border border-amber-200 dark:border-amber-800/30">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{config.note}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        Results are estimates based on standard lot sizes. Actual P&amp;L may vary depending on your broker, leverage, spreads, and swap fees.
      </p>
    </div>
  );
}
