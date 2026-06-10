import React, { useMemo } from 'react';
import { useApp } from './AppContext';
import { LevelLine } from './LevelLine';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Settings2, Download, RefreshCcw, TrendingUp, TrendingDown, Clock, BarChart2, Layers, Calculator, Zap, AlertTriangle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { addToHistory } from '@/lib/sessionHistory';
import { PnLCalculator } from './PnLCalculator';
import { useUser, SignInButton } from '@clerk/react';

export function ResultsPanel() {
  const { currentPlan, setAnalysisMode, setCurrentPlan, setCurrentImage } = useApp();
  const { isSignedIn } = useUser();

  // Recompute warnings live from current plan values (clears as user fixes levels in manual mode)
  const activeWarnings = useMemo<string[]>(() => {
    if (!currentPlan) return [];
    const { entry, sl, tp1, tp2, tp3, priceMin, priceMax, direction } = currentPlan;
    if (!entry || !sl || !priceMin || !priceMax) return currentPlan.levelWarnings ?? [];

    const range = priceMax - priceMin;
    const slDist = Math.abs(entry - sl);
    const warnings: string[] = [];

    if (range > 0) {
      const lo = priceMin - 0.1 * range;
      const hi = priceMax + 0.1 * range;
      for (const [name, v] of [['sl', sl], ['tp1', tp1], ['tp2', tp2], ['tp3', tp3]] as [string, number][]) {
        if (v < lo || v > hi) {
          warnings.push(`${name} (${v}) is outside the visible range [${priceMin}–${priceMax}]`);
        }
      }
      if (slDist > 0.4 * range) {
        warnings.push(`SL distance (${slDist.toFixed(2)}) exceeds 40% of the visible range (${range.toFixed(2)})`);
      }
    }
    if (entry > 0 && slDist / entry > 0.02) {
      warnings.push(`SL is ${(slDist / entry * 100).toFixed(1)}% from entry (> 2%) — likely miscalibrated`);
    }
    if (entry > 0 && sl > 0) {
      const isBuy = direction === 'BUY';
      const ordered = isBuy
        ? sl < entry && entry < tp1 && tp1 < tp2 && tp2 < tp3
        : sl > entry && entry > tp1 && tp1 > tp2 && tp2 > tp3;
      if (!ordered) warnings.push('Level order is inconsistent with the trade direction');
    }
    return warnings;
  }, [currentPlan]);

  if (!currentPlan) return null;

  const isBuy = currentPlan.direction === 'BUY';
  const confidenceColor =
    currentPlan.confidence === 'GOOD' ? 'bg-emerald-500' :
    currentPlan.confidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500';

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    const img = document.querySelector('img');
    if (img) {
      const containerRatio = canvas.clientWidth / canvas.clientHeight;
      const imageRatio = img.naturalWidth / img.naturalHeight;
      let width, height;
      if (imageRatio > containerRatio) {
        width = canvas.clientWidth;
        height = width / imageRatio;
      } else {
        height = canvas.clientHeight;
        width = height * imageRatio;
      }
      ctx.drawImage(img, 0, 0, width, height);
    }

    ctx.drawImage(canvas, 0, 0);

    const dataUrl = bgCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ChartAttack-${currentPlan.context || 'Plan'}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleExportEA = () => {
    if (!currentPlan) return;
    const symbol = (currentPlan.context || 'SYMBOL').split('(')[0].trim().replace(/[\s/]/g, '');
    const line = [symbol, currentPlan.direction, currentPlan.entry, currentPlan.sl,
                  currentPlan.tp1, currentPlan.tp2, currentPlan.tp3,
                  currentPlan.id ?? ''].join(',');
    const content = `# ChartAttack EA plan: symbol,direction,entry,sl,tp1,tp2,tp3,id\n${line}\n`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'chartattack_plan.csv';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNewAnalysis = () => {
    setCurrentPlan(null);
    setCurrentImage(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">

        {/* Asset context */}
        {currentPlan.context && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
                {currentPlan.context}
              </span>
            </div>
            {currentPlan.timeframe && currentPlan.timeframe !== 'Unknown' && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300">{currentPlan.timeframe}</span>
              </div>
            )}
          </div>
        )}

        {/* Direction + score row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-md text-sm font-bold flex items-center ${isBuy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
              {isBuy ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {currentPlan.direction}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <div className={`w-2 h-2 rounded-full ${confidenceColor} mr-2`} />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {currentPlan.confidenceScore}% Score
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This score is for educational purposes only and does not predict future results.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm font-mono text-slate-500 dark:text-slate-400">
            Final RR {currentPlan.rrRatio}:1
          </div>
        </div>

        <Progress value={currentPlan.confidenceScore} className="h-1.5" />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Level validation warnings */}
        {activeWarnings.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <h3 className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Level Validation Warnings</h3>
            </div>
            <ul className="space-y-1 mb-3">
              {activeWarnings.map((w, i) => (
                <li key={i} className="text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                  <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                  {w}
                </li>
              ))}
            </ul>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              EA export is disabled until levels are corrected.{' '}
              <button
                onClick={() => setAnalysisMode('manual')}
                className="font-semibold underline hover:no-underline"
              >
                Adjust levels manually
              </button>{' '}
              to clear warnings.
            </p>
          </div>
        )}

        {/* Multi-timeframe context (shown when multiple charts were analysed) */}
        {currentPlan.multiTimeframeContext && (
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <h3 className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Multi-Timeframe Context</h3>
            </div>
            <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">{currentPlan.multiTimeframeContext}</p>
          </div>
        )}

        {/* Trade levels */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trade Levels</h3>
          <div className="space-y-2">
            <LevelLine label="TP3" price={currentPlan.tp3} colorClass="bg-emerald-600" badgeText={`${currentPlan.rrTp3}:1`} />
            <LevelLine label="TP2" price={currentPlan.tp2} colorClass="bg-emerald-500" badgeText={`${currentPlan.rrTp2}:1`} />
            <LevelLine label="TP1" price={currentPlan.tp1} colorClass="bg-emerald-400" badgeText={`${currentPlan.rrTp1}:1`} description="Consider securing partial profits here." />
            <LevelLine label="ENTRY" price={currentPlan.entry} colorClass="bg-amber-500" isMain />
            <LevelLine label="STOP LOSS" price={currentPlan.sl} colorClass="bg-rose-500" description="Maximum risk level. Exit if price reaches this." />
          </div>
        </div>

        {/* Accordion: P&L calculator + explanation + key levels */}
        <Accordion type="multiple" defaultValue={['pnl', 'explanation']}>
          <AccordionItem value="pnl" className="border-slate-200 dark:border-slate-800">
            <AccordionTrigger className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:no-underline">
              <span className="flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5" />
                P&amp;L Calculator
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {isSignedIn ? (
                <PnLCalculator
                  entry={currentPlan.entry}
                  sl={currentPlan.sl}
                  tp1={currentPlan.tp1}
                  tp2={currentPlan.tp2}
                  tp3={currentPlan.tp3}
                  rrTp1={currentPlan.rrTp1}
                  rrTp2={currentPlan.rrTp2}
                  rrTp3={currentPlan.rrTp3}
                  direction={currentPlan.direction}
                  asset={currentPlan.context}
                />
              ) : (
                <div className="flex flex-col items-center text-center gap-3 py-4 px-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Sign in to unlock the P&amp;L Calculator
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                      Calculate your exact profit and loss in dollars for each take-profit target and stop loss level, based on the number of lots you plan to trade.
                    </p>
                  </div>
                  <SignInButton mode="modal">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white mt-1">
                      Sign in to calculate
                    </Button>
                  </SignInButton>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="explanation" className="border-slate-200 dark:border-slate-800">
            <AccordionTrigger className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:no-underline">
              Why this setup?
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
              <p className="text-sm">{currentPlan.explanation}</p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <p className="flex items-start text-xs text-blue-800 dark:text-blue-300">
                  <Info className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5" />
                  <span>{currentPlan.setupQuality}</span>
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {currentPlan.keyLevels && (
            <AccordionItem value="keylevels" className="border-slate-200 dark:border-slate-800">
              <AccordionTrigger className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:no-underline">
                Key Levels Identified
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentPlan.keyLevels}
              </AccordionContent>
            </AccordionItem>
          )}

          {(currentPlan.cisd || (currentPlan.fvgs && currentPlan.fvgs.length > 0)) && (
            <AccordionItem value="cisd-fvg" className="border-slate-200 dark:border-slate-800">
              <AccordionTrigger className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:no-underline">
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  CISD &amp; Fair Value Gaps
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">

                {/* CISD Signal */}
                {currentPlan.cisd && currentPlan.cisd.type !== 'none' && (
                  <div className={`rounded-xl border p-3 ${
                    currentPlan.cisd.type === 'bullish'
                      ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800'
                      : 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Zap className={`w-3.5 h-3.5 ${currentPlan.cisd.type === 'bullish' ? 'text-cyan-600 dark:text-cyan-400' : 'text-violet-600 dark:text-violet-400'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${currentPlan.cisd.type === 'bullish' ? 'text-cyan-700 dark:text-cyan-300' : 'text-violet-700 dark:text-violet-300'}`}>
                          {currentPlan.cisd.type === 'bullish' ? 'Bullish CISD' : 'Bearish CISD'}
                        </span>
                      </div>
                      {currentPlan.cisd.triggerPrice !== null && (
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                          @ {currentPlan.cisd.triggerPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentPlan.cisd.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      A Change in State of Delivery signals a structural shift after a liquidity sweep — the market reversed after triggering stop orders beyond a swing level.
                    </p>
                  </div>
                )}

                {currentPlan.cisd && currentPlan.cisd.type === 'none' && (
                  <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>No clear CISD signal detected on this chart.</span>
                  </div>
                )}

                {/* Fair Value Gaps */}
                {currentPlan.fvgs && currentPlan.fvgs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fair Value Gaps</p>
                    {currentPlan.fvgs.map((fvg, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 border text-xs ${
                          fvg.mitigated
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                            : fvg.type === 'bullish'
                            ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800'
                            : 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-sm shrink-0 ${fvg.type === 'bullish' ? 'bg-cyan-500' : 'bg-violet-500'} ${fvg.mitigated ? 'opacity-40' : ''}`} />
                          <span className={`font-semibold ${fvg.type === 'bullish' ? 'text-cyan-700 dark:text-cyan-300' : 'text-violet-700 dark:text-violet-300'} ${fvg.mitigated ? 'opacity-60' : ''}`}>
                            {fvg.type === 'bullish' ? 'Bullish' : 'Bearish'} FVG
                          </span>
                          {fvg.mitigated && (
                            <span className="text-slate-400 dark:text-slate-500 italic">filled</span>
                          )}
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {fvg.bottom} – {fvg.top}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed pt-1">
                      A Fair Value Gap (FVG) is a price imbalance zone where the market moved too fast for two-sided trading. Price often returns to these zones before continuing the trend.
                    </p>
                  </div>
                )}

                {currentPlan.fvgs && currentPlan.fvgs.length === 0 && (
                  <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>No visible Fair Value Gaps detected on this chart.</span>
                  </div>
                )}

              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Footer actions */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setAnalysisMode('manual')}
            className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            data-testid="button-adjust-levels"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Adjust Levels
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Plan
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    variant="outline"
                    onClick={handleExportEA}
                    disabled={activeWarnings.length > 0}
                    className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-export-ea"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export EA Plan
                  </Button>
                </span>
              </TooltipTrigger>
              {activeWarnings.length > 0 && (
                <TooltipContent>
                  <p>Fix level warnings before exporting to MT5</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          onClick={handleNewAnalysis}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-new-analysis"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>
    </div>
  );
}
