import React, { useState } from 'react';
import { useApp } from '../components/AppContext';
import { ChartCanvas } from '../components/ChartCanvas';
import { ResultsPanel } from '../components/ResultsPanel';
import { ManualLevelsPanel } from '../components/ManualLevelsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, Lightbulb, ChevronRight, AlertCircle } from 'lucide-react';
import { analyzeChart } from '@/lib/analyzeChart';
import { addToHistory } from '@/lib/sessionHistory';

const TIPS = [
  "Never risk more than 1-2% of your capital on a single trade.",
  "Wait for confirmation before entering a trade.",
  "A good trade is defined by a favorable risk/reward, not just direction.",
  "TP1 can be used to secure partial profits — reduce position size when hit.",
  "The stop loss is your safety net, not a sign of weakness.",
  "A high RR ratio means you can be wrong more often and still be profitable.",
];

const LOADING_STEPS = [
  "Detecting key price levels...",
  "Calculating risk zones...",
  "Generating trade plan...",
];

export default function Analyze() {
  const { currentImage, setCurrentImage, currentPlan, setCurrentPlan, isAnalyzing, setIsAnalyzing, analysisMode } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  // Price range state — user fills these from the chart's right axis
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [rangeError, setRangeError] = useState('');

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentImage(e.target?.result as string);
      setCurrentPlan(null);
      setPriceMin('');
      setPriceMax('');
      setRangeError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImage(e.target.files[0]);
    }
  };

  const validateRange = (): { min: number; max: number } | null => {
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);

    if (isNaN(min) || isNaN(max)) {
      setRangeError('Please enter both the lowest and highest price visible on your chart.');
      return null;
    }
    if (min <= 0 || max <= 0) {
      setRangeError('Prices must be positive numbers.');
      return null;
    }
    if (min >= max) {
      setRangeError('The lowest price must be smaller than the highest price.');
      return null;
    }
    if ((max - min) / max > 0.95) {
      setRangeError('The price range seems too large. Please check the values from the chart axis.');
      return null;
    }
    setRangeError('');
    return { min, max };
  };

  const runAnalysis = () => {
    const range = validateRange();
    if (!currentImage || !range) return;

    setIsAnalyzing(true);
    setCurrentPlan(null);
    setLoadingStep(0);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < LOADING_STEPS.length) {
        setLoadingStep(currentStep);
      } else {
        clearInterval(interval);
        const plan = analyzeChart(currentImage, range.min, range.max);
        setCurrentPlan(plan);
        addToHistory(plan);
        setIsAnalyzing(false);
        setTipIndex(prev => (prev + 1) % TIPS.length);
      }
    }, 800);
  };

  const canAnalyze = currentImage && priceMin && priceMax && !isAnalyzing;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full gap-6">
      {!currentImage ? (
        /* ── Drop zone ── */
        <div
          data-testid="drop-zone"
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-colors min-h-[60vh] cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Import Chart</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
            Drag and drop a TradingView, MT4, MT5, or similar screenshot here, or click to browse files.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-8"
            onClick={(e) => e.stopPropagation()}
          >
            <label htmlFor="file-upload" className="cursor-pointer">Select File</label>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/png,image/jpg,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileInput}
            data-testid="input-file-upload"
          />
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-4">PNG, JPG, JPEG, WEBP accepted</p>
        </div>
      ) : (
        /* ── Workspace ── */
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[70vh]">

          {/* Main chart panel */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 md:p-5 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analysis Workspace</h2>
                <label
                  htmlFor="file-upload-replace"
                  className="text-xs text-blue-500 hover:text-blue-400 cursor-pointer underline underline-offset-2"
                >
                  Replace chart
                  <input
                    id="file-upload-replace"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>

              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-xl min-h-[400px]">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-6" />
                  <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Analyzing Chart...</h3>
                  <p className="text-slate-500 dark:text-slate-400">{LOADING_STEPS[loadingStep]}</p>
                </div>
              ) : (
                <ChartCanvas />
              )}
            </div>

            {/* ── Price range input (shown when no plan yet) ── */}
            {!currentPlan && !isAnalyzing && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Enter the price range visible on your chart
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Look at the numbers on the right axis of your screenshot and enter the lowest and highest price shown.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price-min" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Lowest price (bottom of axis)
                    </Label>
                    <Input
                      id="price-min"
                      type="number"
                      step="any"
                      placeholder="e.g. 1.08200"
                      value={priceMin}
                      onChange={(e) => { setPriceMin(e.target.value); setRangeError(''); }}
                      className="font-mono text-sm"
                      data-testid="input-price-min"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-max" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Highest price (top of axis)
                    </Label>
                    <Input
                      id="price-max"
                      type="number"
                      step="any"
                      placeholder="e.g. 1.09500"
                      value={priceMax}
                      onChange={(e) => { setPriceMax(e.target.value); setRangeError(''); }}
                      className="font-mono text-sm"
                      data-testid="input-price-max"
                    />
                  </div>
                </div>

                {rangeError && (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-900/40">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{rangeError}</span>
                  </div>
                )}

                <Button
                  onClick={runAnalysis}
                  disabled={!canAnalyze}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white"
                  data-testid="button-analyze"
                >
                  Analyze Chart
                </Button>
              </div>
            )}

            {/* Tip Card */}
            {currentPlan && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm uppercase tracking-wide mb-1">Beginner Tip</h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">{TIPS[tipIndex]}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar panel */}
          <div className="w-full lg:w-[400px] flex flex-col h-full lg:max-h-[calc(100vh-140px)]">
            {currentPlan ? (
              analysisMode === 'auto' ? <ResultsPanel /> : <ManualLevelsPanel />
            ) : !isAnalyzing ? (
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Enter the price range from the chart's right axis, then click "Analyze Chart".
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
