import React from 'react';
import { useApp } from '../components/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Calendar, TrendingUp, TrendingDown, Lock, BarChart2, Clock, Trophy, Target, Info } from 'lucide-react';
import { useLocation } from 'wouter';
import { Show } from '@clerk/react';
import { useGetUserHistory, useDeleteHistoryEntry, useUpdateHistoryOutcome } from '@workspace/api-client-react';
import type { HistoryEntry } from '@workspace/api-client-react';
import { buildPlanFromAIResponse } from '@/lib/analyzeChart';

function WinRateBanner({ entries }: { entries: HistoryEntry[] }) {
  const graded = entries.filter((e) => e.outcome === 'profit' || e.outcome === 'loss');
  const profits = graded.filter((e) => e.outcome === 'profit').length;
  const losses = graded.filter((e) => e.outcome === 'loss').length;
  const winRate = graded.length > 0 ? Math.round((profits / graded.length) * 100) : null;

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{entries.length}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Analyses</div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profits}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Profitable</div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{losses}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Loss</div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
        {winRate !== null ? (
          <>
            <div className={`text-2xl font-bold ${winRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {winRate}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Win Rate</div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">—</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Win Rate</div>
          </>
        )}
      </div>
    </div>
  );
}

function OutcomeButtons({ entry, onUpdate }: { entry: HistoryEntry; onUpdate: (id: string, outcome: 'profit' | 'loss' | null) => void }) {
  const isPending = false;

  const toggle = (value: 'profit' | 'loss') => {
    onUpdate(entry.id, entry.outcome === value ? null : value);
  };

  return (
    <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
      <button
        onClick={() => toggle('profit')}
        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border ${
          entry.outcome === 'profit'
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
        }`}
        title="Mark as profit"
      >
        <Trophy className="w-3 h-3" />
        Profit
      </button>
      <button
        onClick={() => toggle('loss')}
        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border ${
          entry.outcome === 'loss'
            ? 'bg-rose-500 border-rose-500 text-white'
            : 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
        }`}
        title="Mark as loss"
      >
        <Target className="w-3 h-3" />
        Loss
      </button>
    </div>
  );
}

function HistoryContent() {
  const { setCurrentPlan, setCurrentImage, setAnalysisMode } = useApp();
  const [, setLocation] = useLocation();

  const { data: entries = [], isLoading, refetch } = useGetUserHistory();
  const deleteMutation = useDeleteHistoryEntry();
  const outcomeMutation = useUpdateHistoryOutcome();

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

  const handleOutcome = (id: string, outcome: 'profit' | 'loss' | null) => {
    outcomeMutation.mutate(
      { id, outcome },
      {
        onSuccess: () => refetch(),
      }
    );
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analysis History</h1>
          <p className="text-slate-500 dark:text-slate-400">Your saved chart analyses — only visible to you. Mark each trade to track your win rate.</p>
        </div>
      </div>

      <WinRateBanner entries={entries} />

      {entries.length > 0 && (
        <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
          <span>
            The more trades you mark as Profit or Loss, the more ChartAttack learns from your real results and refines its analyses to match your trading style.
          </span>
        </div>
      )}

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
            <div
              key={entry.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden shadow-sm flex flex-col group transition-colors ${
                entry.outcome === 'profit'
                  ? 'border-emerald-300 dark:border-emerald-700'
                  : entry.outcome === 'loss'
                  ? 'border-rose-300 dark:border-rose-700'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
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
                {entry.outcome && (
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold ${entry.outcome === 'profit' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {entry.outcome === 'profit' ? 'PROFIT' : 'LOSS'}
                  </div>
                )}
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

                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(entry.createdAt).toLocaleString()}
                </div>

                <button
                  className="w-full text-left text-blue-600 dark:text-blue-400 text-xs flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800 hover:opacity-80 transition-opacity mb-1"
                  onClick={() => handleReview(entry)}
                >
                  Open details
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <OutcomeButtons entry={entry} onUpdate={handleOutcome} />
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
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign in to ChartAttack to view your history</h2>
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
