import React from 'react';
import { useApp } from '../components/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Calendar, TrendingUp, TrendingDown, Lock, BarChart2, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { Show } from '@clerk/react';
import { useGetUserHistory, useDeleteHistoryEntry } from '@workspace/api-client-react';
import type { HistoryEntry } from '@workspace/api-client-react';
import { buildPlanFromAIResponse } from '@/lib/analyzeChart';

function HistoryContent() {
  const { setCurrentPlan, setCurrentImage, setAnalysisMode } = useApp();
  const [, setLocation] = useLocation();

  const { data: entries = [], isLoading, refetch } = useGetUserHistory();
  const deleteMutation = useDeleteHistoryEntry();

  const handleReview = (entry: HistoryEntry) => {
    const plan = buildPlanFromAIResponse(entry.imageDataUrl, {
      context: entry.context,
      timeframe: entry.timeframe,
      priceMin: entry.priceMin,
      priceMax: entry.priceMax,
      direction: entry.direction as 'BUY' | 'SELL',
      entry: entry.entry,
      sl: entry.sl,
      tp1: entry.tp1,
      tp2: entry.tp2,
      tp3: entry.tp3,
      confidence: entry.confidence as 'LOW' | 'MEDIUM' | 'GOOD',
      confidenceScore: entry.confidenceScore,
      explanation: entry.explanation,
      setupQuality: entry.setupQuality,
      keyLevels: entry.keyLevels,
    });
    setCurrentPlan(plan);
    setCurrentImage(entry.imageDataUrl);
    setAnalysisMode('auto');
    setLocation('/analyze');
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analysis History</h1>
          <p className="text-slate-500 dark:text-slate-400">Your saved chart analyses — only visible to you.</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No analyses yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Every chart you analyze while signed in is automatically saved here for later review.
          </p>
          <Button onClick={() => setLocation('/analyze')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Analyze a Chart
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col group">
              <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                <img
                  src={entry.imageDataUrl}
                  alt="Chart thumbnail"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/40 transition-opacity">
                  <Button variant="secondary" onClick={() => handleReview(entry)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Review Plan
                  </Button>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                {entry.context && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.context}</span>
                    {entry.timeframe && entry.timeframe !== 'Unknown' && (
                      <>
                        <Clock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{entry.timeframe}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className={`px-2 py-1 rounded text-xs font-bold flex items-center ${entry.direction === 'BUY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                    {entry.direction === 'BUY' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {entry.direction}
                  </div>
                  <div className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                    {entry.rrRatio}:1 RR
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(entry.createdAt).toLocaleString()}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-blue-600 dark:text-blue-400"
                    onClick={() => handleReview(entry)}
                  >
                    Open details
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignedOutPrompt() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign in to view your history</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
        Your analysis history is private and tied to your account. Sign in to access all your previous chart analyses.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => setLocation('/sign-in')} className="bg-blue-600 hover:bg-blue-700 text-white">
          Sign in
        </Button>
        <Button variant="outline" onClick={() => setLocation('/sign-up')}>
          Create account
        </Button>
      </div>
    </div>
  );
}

export default function History() {
  return (
    <>
      <Show when="signed-in">
        <HistoryContent />
      </Show>
      <Show when="signed-out">
        <SignedOutPrompt />
      </Show>
    </>
  );
}
