import React from 'react';
import { useApp } from './AppContext';
import { LevelLine } from './LevelLine';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Settings2, Download, RefreshCcw, TrendingUp, TrendingDown, Clock, BarChart2, Layers, Calculator } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { addToHistory } from '@/lib/sessionHistory';
import { PnLCalculator } from './PnLCalculator';

export function ResultsPanel() {
  const { currentPlan, setAnalysisMode, setCurrentPlan, setCurrentImage } = useApp();

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
