import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateTradePlan, ManualLevels } from '@/lib/analyzeChart';
import { Settings2, RefreshCcw, Save, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addToHistory } from '@/lib/sessionHistory';

export function ManualLevelsPanel() {
  const { currentPlan, setCurrentPlan, setAnalysisMode, currentImage } = useApp();
  
  const [levels, setLevels] = useState<ManualLevels>({
    entry: currentPlan?.entry || 0,
    sl: currentPlan?.sl || 0,
    tp1: currentPlan?.tp1 || 0,
    tp2: currentPlan?.tp2 || 0,
    tp3: currentPlan?.tp3 || 0,
  });

  const [direction, setDirection] = useState<'BUY' | 'SELL'>(currentPlan?.direction || 'BUY');

  useEffect(() => {
    if (currentPlan && currentImage) {
      const updatedPlan = generateTradePlan(currentImage, levels, direction);
      setCurrentPlan(updatedPlan);
    }
  }, [levels, direction, currentImage]);

  const handleChange = (key: keyof ManualLevels, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setLevels(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleSave = () => {
    if (currentPlan) {
      addToHistory(currentPlan);
    }
    setAnalysisMode('auto');
  };

  if (!currentPlan) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center text-slate-900 dark:text-white">
            <Settings2 className="w-4 h-4 mr-2" />
            Manual Adjustments
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setAnalysisMode('auto')} className="h-8">
            Done
          </Button>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Button 
            variant={direction === 'BUY' ? 'default' : 'ghost'} 
            size="sm" 
            className={`flex-1 ${direction === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            onClick={() => setDirection('BUY')}
          >
            <TrendingUp className="w-4 h-4 mr-1" /> BUY
          </Button>
          <Button 
            variant={direction === 'SELL' ? 'default' : 'ghost'} 
            size="sm" 
            className={`flex-1 ${direction === 'SELL' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
            onClick={() => setDirection('SELL')}
          >
            <TrendingDown className="w-4 h-4 mr-1" /> SELL
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry" className="text-amber-600 dark:text-amber-500 font-bold text-xs uppercase">Entry Price</Label>
            <Input 
              id="entry" 
              type="number" 
              step="0.0001" 
              value={levels.entry || ''} 
              onChange={(e) => handleChange('entry', e.target.value)} 
              className="font-mono text-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 focus-visible:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sl" className="text-rose-600 dark:text-rose-500 font-bold text-xs uppercase">Stop Loss</Label>
            </div>
            <Input 
              id="sl" 
              type="number" 
              step="0.0001" 
              value={levels.sl || ''} 
              onChange={(e) => handleChange('sl', e.target.value)} 
              className="font-mono text-lg bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 focus-visible:ring-rose-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tp1" className="text-emerald-500 dark:text-emerald-400 font-bold text-xs uppercase">Take Profit 1</Label>
              <Badge variant="outline" className="text-[10px] font-mono py-0">{currentPlan.rrTp1}:1 RR</Badge>
            </div>
            <Input 
              id="tp1" 
              type="number" 
              step="0.0001" 
              value={levels.tp1 || ''} 
              onChange={(e) => handleChange('tp1', e.target.value)} 
              className="font-mono bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
             <div className="flex items-center justify-between">
              <Label htmlFor="tp2" className="text-emerald-600 dark:text-emerald-500 font-bold text-xs uppercase">Take Profit 2</Label>
              <Badge variant="outline" className="text-[10px] font-mono py-0">{currentPlan.rrTp2}:1 RR</Badge>
            </div>
            <Input 
              id="tp2" 
              type="number" 
              step="0.0001" 
              value={levels.tp2 || ''} 
              onChange={(e) => handleChange('tp2', e.target.value)} 
              className="font-mono bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
             <div className="flex items-center justify-between">
              <Label htmlFor="tp3" className="text-emerald-700 dark:text-emerald-600 font-bold text-xs uppercase">Take Profit 3 (Final)</Label>
              <Badge variant="outline" className="text-[10px] font-mono py-0">{currentPlan.rrTp3}:1 RR</Badge>
            </div>
            <Input 
              id="tp3" 
              type="number" 
              step="0.0001" 
              value={levels.tp3 || ''} 
              onChange={(e) => handleChange('tp3', e.target.value)} 
              className="font-mono bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
           <p className="flex items-start text-sm text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-blue-500" />
              <span>{currentPlan.explanation}</span>
            </p>
        </div>
      </div>

      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save Adjustments
        </Button>
      </div>
    </div>
  );
}
