import React, { useState } from 'react';
import { useApp } from '../components/AppContext';
import { ChartCanvas } from '../components/ChartCanvas';
import { ResultsPanel } from '../components/ResultsPanel';
import { ManualLevelsPanel } from '../components/ManualLevelsPanel';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Lightbulb, AlertCircle, Plus, X, Star } from 'lucide-react';
import { buildPlanFromAIResponse } from '@/lib/analyzeChart';
import { useAnalyzeChartImage } from '@workspace/api-client-react';

const TIMEFRAME_OPTIONS = ['1M', '5M', '15M', '30M', '1H', '4H', 'Daily', 'Weekly', 'Monthly'];

const TIPS = [
  "Never risk more than 1-2% of your capital on a single trade.",
  "Wait for confirmation before entering a trade.",
  "A good trade is defined by a favorable risk/reward, not just direction.",
  "TP1 can be used to secure partial profits — reduce position size when hit.",
  "The stop loss is your safety net, not a sign of weakness.",
  "A high RR ratio means you can be wrong more often and still be profitable.",
];

const LOADING_STEPS = [
  "Reading price axis...",
  "Identifying key levels...",
  "Generating trade plan...",
];

export default function Analyze() {
  const {
    currentImage, setCurrentImage,
    currentPlan, setCurrentPlan,
    isAnalyzing, setIsAnalyzing,
    analysisMode,
    additionalCharts, setAdditionalCharts,
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [primaryTimeframe, setPrimaryTimeframe] = useState('');
  const [primaryTimeframeCustom, setPrimaryTimeframeCustom] = useState('');

  const analyzeChartMutation = useAnalyzeChartImage({
    mutation: {
      onSuccess: (result, variables) => {
        const imageDataUrl = variables.data.imageDataUrl;
        const plan = buildPlanFromAIResponse(imageDataUrl, result as Parameters<typeof buildPlanFromAIResponse>[1]);
        setCurrentPlan(plan);
        setIsAnalyzing(false);
        setApiError(null);
        setTipIndex(prev => (prev + 1) % TIPS.length);
      },
      onError: (error: unknown) => {
        setIsAnalyzing(false);
        const msg = (error as { message?: string })?.message ?? 'Analysis failed. Please try again.';
        setApiError(msg);
      },
    },
  });

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCurrentImage(dataUrl);
      setCurrentPlan(null);
      setApiError(null);
      setAdditionalCharts([]);
      setPrimaryTimeframe('');
      setPrimaryTimeframeCustom('');
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

  const handleAddAdditionalChart = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAdditionalCharts(prev => [...prev, { imageDataUrl: dataUrl, timeframe: '' }]);
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAddAdditionalChart(e.target.files[0]);
    }
    e.target.value = '';
  };

  const removeAdditionalChart = (index: number) => {
    setAdditionalCharts(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalChartTimeframe = (index: number, timeframe: string) => {
    setAdditionalCharts(prev =>
      prev.map((chart, i) => i === index ? { ...chart, timeframe } : chart)
    );
  };

  const getEffectivePrimaryTimeframe = () => {
    if (primaryTimeframe === '__custom__') return primaryTimeframeCustom.trim();
    return primaryTimeframe;
  };

  const runAnalysis = () => {
    if (!currentImage || isAnalyzing) return;

    setIsAnalyzing(true);
    setCurrentPlan(null);
    setApiError(null);
    setLoadingStep(0);

    // Animate loading steps while the API call runs
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) {
        setLoadingStep(step);
      } else {
        clearInterval(interval);
      }
    }, 900);

    const effectivePrimaryTf = getEffectivePrimaryTimeframe();

    // Send all additional charts — server uses "Unknown" as fallback for missing timeframe
    const additionalImages = additionalCharts.map(c => ({
      imageDataUrl: c.imageDataUrl,
      timeframe: c.timeframe.trim() || 'Unknown',
    }));

    analyzeChartMutation.mutate(
      {
        data: {
          imageDataUrl: currentImage,
          ...(effectivePrimaryTf ? { primaryTimeframe: effectivePrimaryTf } : {}),
          ...(additionalImages.length > 0 ? { additionalImages } : {}),
        },
      },
      {
        onSettled: () => clearInterval(interval),
      },
    );
  };

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
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-8"
            onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}
            data-testid="button-select-file"
          >
            Select File
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
                <div className="flex items-center gap-3">
                  {!currentPlan && !isAnalyzing && (
                    <Button
                      onClick={runAnalysis}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-analyze"
                    >
                      Analyze Chart{additionalCharts.length > 0 ? ` (${additionalCharts.length + 1} charts)` : ''}
                    </Button>
                  )}
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
              </div>

              {/* Multi-timeframe thumbnail strip */}
              {!currentPlan && (
                <div className="mb-4 flex flex-wrap items-start gap-3">
                  {/* Primary chart thumbnail */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-blue-500 shadow-sm">
                      <img src={currentImage} alt="Primary chart" className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-blue-600 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                        <Star className="w-2.5 h-2.5" />
                        Primary
                      </div>
                      {getEffectivePrimaryTimeframe() && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-semibold px-1 py-0.5 rounded">
                          {getEffectivePrimaryTimeframe()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 items-center">
                      <select
                        value={primaryTimeframeCustom ? '__custom__' : primaryTimeframe}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setPrimaryTimeframe('__custom__');
                            setPrimaryTimeframeCustom('');
                          } else {
                            setPrimaryTimeframe(e.target.value);
                            setPrimaryTimeframeCustom('');
                          }
                        }}
                        className="text-[11px] border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-20"
                      >
                        <option value="">TF...</option>
                        {TIMEFRAME_OPTIONS.map(tf => (
                          <option key={tf} value={tf}>{tf}</option>
                        ))}
                        <option value="__custom__">Custom...</option>
                      </select>
                      {primaryTimeframe === '__custom__' && (
                        <input
                          type="text"
                          placeholder="e.g. 2H"
                          value={primaryTimeframeCustom}
                          onChange={(e) => setPrimaryTimeframeCustom(e.target.value)}
                          className="text-[11px] border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-14"
                        />
                      )}
                    </div>
                  </div>

                  {/* Additional chart thumbnails */}
                  {additionalCharts.map((chart, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5" data-testid={`additional-chart-${idx}`}>
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                        <img src={chart.imageDataUrl} alt={`Chart ${idx + 2}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeAdditionalChart(idx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600"
                          data-testid={`remove-chart-${idx}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                        {chart.timeframe && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-semibold px-1 py-0.5 rounded">
                            {chart.timeframe}
                          </div>
                        )}
                      </div>
                      <TimeframeSelector
                        value={chart.timeframe}
                        onChange={(tf) => updateAdditionalChartTimeframe(idx, tf)}
                      />
                    </div>
                  ))}

                  {/* Add another timeframe button */}
                  <div className="flex flex-col items-center gap-1.5">
                    <label
                      htmlFor="add-chart-upload"
                      className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                      data-testid="add-chart-button"
                    >
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 mt-0.5 text-center leading-tight px-1">Add timeframe</span>
                    </label>
                    <input
                      id="add-chart-upload"
                      type="file"
                      accept="image/png,image/jpg,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAdditionalFileInput}
                      data-testid="input-add-chart"
                    />
                    <div className="w-20 h-5" />
                  </div>
                </div>
              )}

              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-xl min-h-[400px] gap-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">AI Analysis in Progress</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{LOADING_STEPS[loadingStep]}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i <= loadingStep ? 'w-6 bg-blue-500' : 'w-2 bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <ChartCanvas />
              )}
            </div>

            {/* Error banner */}
            {apiError && !isAnalyzing && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-rose-700 dark:text-rose-300">{apiError}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runAnalysis}
                  className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-400"
                >
                  Retry
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
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Click "Analyze Chart" to let the AI read the chart and generate a trade plan automatically.
                </p>
                {additionalCharts.length > 0 && (
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    {additionalCharts.length} additional timeframe{additionalCharts.length > 1 ? 's' : ''} added — the AI will cross-reference all charts.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeframeSelector({ value, onChange }: { value: string; onChange: (tf: string) => void }) {
  const [isCustom, setIsCustom] = useState(!TIMEFRAME_OPTIONS.includes(value) && value !== '');
  const [customVal, setCustomVal] = useState(isCustom ? value : '');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__custom__') {
      setIsCustom(true);
      setCustomVal('');
      onChange('');
    } else {
      setIsCustom(false);
      setCustomVal('');
      onChange(e.target.value);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomVal(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="flex gap-1 items-center">
      <select
        value={isCustom ? '__custom__' : value}
        onChange={handleSelectChange}
        className="text-[11px] border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-20"
      >
        <option value="">TF...</option>
        {TIMEFRAME_OPTIONS.map(tf => (
          <option key={tf} value={tf}>{tf}</option>
        ))}
        <option value="__custom__">Custom...</option>
      </select>
      {isCustom && (
        <input
          type="text"
          placeholder="e.g. 2H"
          value={customVal}
          onChange={handleCustomChange}
          className="text-[11px] border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-14"
        />
      )}
    </div>
  );
}
