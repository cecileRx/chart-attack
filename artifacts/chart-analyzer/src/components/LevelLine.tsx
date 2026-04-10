import React from 'react';
import { Badge } from '@/components/ui/badge';

interface LevelLineProps {
  label: string;
  price: number;
  colorClass: string;
  badgeText?: string;
  description?: string;
  isMain?: boolean;
}

function formatPrice(price: number): string {
  if (price <= 0) return price.toString();
  if (price < 0.01) return price.toFixed(8);
  if (price < 10)   return price.toFixed(5);
  if (price < 100)  return price.toFixed(3);
  if (price < 10000) return price.toFixed(2);
  return price.toFixed(1);
}

export function LevelLine({ label, price, colorClass, badgeText, description, isMain }: LevelLineProps) {
  return (
    <div className={`flex flex-col p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${isMain ? 'ring-1 ring-slate-300 dark:ring-slate-700' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
          <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          {badgeText && (
            <Badge variant="outline" className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
              {badgeText}
            </Badge>
          )}
          <span className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatPrice(price)}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-5">
          {description}
        </p>
      )}
    </div>
  );
}
