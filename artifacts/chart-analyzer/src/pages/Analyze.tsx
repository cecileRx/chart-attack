import React, { useState } from 'react';
import { useApp } from '../components/AppContext';
import { ChartCanvas } from '../components/ChartCanvas';
import { ResultsPanel } from '../components/ResultsPanel';
import { ManualLevelsPanel } from '../components/ManualLevelsPanel';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Lightbulb } from 'lucide-react';
import { analyzeChart } from '@/lib/analyzeChart';
import { addToHistory } from '@/lib/sessionHistory';

const TIPS = [
  "Never risk more than 1-2% of your capital on a single trade.",
  "Wait for confirmation before entering a trade.",
  "A good trade is defined by a favorable risk/reward, not just direction.",
  "TP1 can be used to secure partial profits — reduce position size when hit.",
  "The stop loss is your safety net, not a sign of weakness."
];

export default function Analyze() {
  const { currentImage, setCurrentImage, currentPlan, setCurrentPlan, isAnalyzing, setIsAnalyzing, analysisMode } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentImage(e.target?.result as string);
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

  const runAnalysis = () => {
    if (!currentImage) return;
    
    setIsAnalyzing(true);
    setCurrentPlan(null);
    setLoadingStep(0);

    const steps = [
      "Detecting key levels...",
      "Calculating risk zones...",
      "Generating trade plan..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(currentStep);
      } else {
        clearInterval(interval);
        const plan = analyzeChart(currentImage);
        setCurrentPlan(plan);
        addToHistory(plan);
        setIsAnalyzing(false);
        // Rotate tip
        setTipIndex(prev => (prev + 1) % TIPS.length);
      }
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full gap-6">
      {!currentImage ? (
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-colors min-h-[60vh] ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Import Chart</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
            Drag and drop a TradingView, MT4, MT5, or similar screenshot here, or click to browse files.
          </p>
          
          <label htmlFor="file-upload">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-8">
              <span>Select File</span>
            </Button>
          </label>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileInput}
          />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[70vh]">
          {/* Main Workspace */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 md:p-4 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analysis Workspace</h2>
                {!currentPlan && !isAnalyzing && (
                  <Button onClick={runAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Analyze Chart
                  </Button>
                )}
              </div>
              
              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-xl min-h-[400px]">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-6" />
                  <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Analyzing Chart...</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {["Detecting key levels...", "Calculating risk zones...", "Generating trade plan..."][loadingStep]}
                  </p>
                </div>
              ) : (
                <ChartCanvas />
              )}
            </div>

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

          {/* Sidebar */}
          <div className="w-full lg:w-[400px] flex flex-col h-full lg:max-h-[calc(100vh-140px)]">
            {currentPlan ? (
              analysisMode === 'auto' ? <ResultsPanel /> : <ManualLevelsPanel />
            ) : !isAnalyzing ? (
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">Click "Analyze Chart" to generate a trade plan.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
