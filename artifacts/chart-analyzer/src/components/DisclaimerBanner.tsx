import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 p-3 mt-auto flex items-center justify-center text-xs text-slate-400 text-center">
      <AlertTriangle className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
      <span>
        This application is an educational tool and does not constitute financial advice. Trading involves risk of capital loss.
      </span>
    </div>
  );
}
