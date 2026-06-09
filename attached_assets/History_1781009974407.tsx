import React from 'react';
import { useApp } from '../components/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Calendar, TrendingUp, TrendingDown, Lock, BarChart2, Clock, Info } from 'lucide-react';
import { useLocation } from 'wouter';
import { Show } from '@clerk/react';
import { useGetUserHistory, useDeleteHistoryEntry, useUpdateHistoryOutcome } from '@workspace/api-client-react';
import type { HistoryEntry } from '@workspace/api-client-react';
import { buildPlanFromAIResponse } from '@/lib/analyzeChart';
import { EXIT_LEVELS, R_BY_EXIT, entryR, computeExpectancy, type ExitLevel } from '@/lib/expectancy';

function fmtR(r: number | null): string {
  if (r === null) return '—';
  if (!isFinite(r)) return '∞';
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`;
}

function StatCard({ value, label, tone }: { value: string; label: string; tone?: 'pos' | 'neg' | 'neutral' }) {
  const color =
    tone === 'pos'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'neg'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-900 dark:text-white';
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function ExpectancyBanner({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) return null;
  const s = computeExpectancy(entries);

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          value={fmtR(s.expectancy)}
          label="Expectancy / trade"
          tone={s.expectancy == null ? 'neutral' : s.expectancy > 0 ? 'pos' : s.expectancy < 0 ? 'neg' : 'neutral'}
        />
        <StatCard
          value={s.profitFactor == null ? '—' : !isFinite(s.profitFactor) ? '∞' : s.profitFactor.toFixed(2)}
          label="Profit Factor"
          tone={s.profitFactor == null ? 'neutral' : s.profitFactor >= 1 ? 'pos' : 'neg'}
        />
        <StatCard
          value={s.winRate == null ? '—' : `${Math.round(s.winRate)}%`}
          label="Win Rate"
        />
        <StatCard
          value={fmtR(s.totalR)}
          label="Total R"
          tone={s.totalR > 0 ? 'pos' : s.totalR < 0 ? 'neg' : 'neutral'}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 px-1 text-xs text-slate-500 dark:text-slate-400">
        <span>{s.graded} trade{s.graded > 1 ? 's' : ''} noté{s.graded > 1 ? 's' : ''} / {entries.length}</span>
        <span>Gain moyen: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{fmtR(s.avgWinR)}</span></span>
        <span>Perte moyenne: <span className="text-rose-600 dark:text-rose-400 font-medium">{fmtR(s.avgLossR)}</span></span>
        <span className="opacity-70">R modélisé sur le partiel 50/30/20 (max ~1.7R)</span>
      </div>
    </div>
  );
}

const EXIT_STYLE: Record<ExitLevel, { on: string; off: string }> = {
  SL: { on: 'bg-rose-500 border-rose-500 text-white', off: 'border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' },
  BE: { on: 'bg-slate-400 border-slate-400 text-white', off: 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40' },
  TP1: { on: 'bg-emerald-400 border-emerald-400 text-white', off: 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
  TP2: { on: 'bg-emerald-500 border-emerald-500 text-white', off: 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
  TP3: { on: 'bg-emerald-600 border-emerald-600 text-white', off: 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
};

function ExitButtons({ entry, onSet }: { entry: HistoryEntry; onSet: (id: string, exit: ExitLevel | null) => void }) {
  const current = entry.exit as ExitLevel | null | undefined;
  return (
    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="flex gap-1.5">
        {EXIT_LEVELS.map((lvl) => {
          const active = current === lvl;
          const st = EXIT_STYLE[lvl];
          return (
            <button
              key={lvl}
              onClick={() => onSet(entry.id, active ? null : lvl)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${active ? st.on : st.off}`}
              title={`${lvl} → ${fmtR(R_BY_EXIT[lvl])}`}
            >
              {lvl}
            </button>
          );
        })}
      </div>
      <div className="text-center text-[11px] mt-1.5 text-slate-400 dark:text-slate-500">
        {current ? `Résultat: ${fmtR(entryR(entry))}` : 'Marque la sortie atteinte'}
      </div>
    </div>
  );
}

function HistoryContent() {
  const { setCurrentPlan, setCurrentImage, setAnalysisMode } = useApp();
  const [, setLocation] = useLocation();

  const { data: entries = [], isLoading, refetch } = useGetUserHistory();
  const deleteMutation = useDeleteHistoryEntry();
  const exitMutation = useUpdateHistoryOutcome();

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

  const handleExit = (id: string, exit: ExitLevel | null) => {
    exitMutation.mutate({ id, exit }, { onSuccess: () => refetch() });
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
          <p className="text-slate-500 dark:text-slate-400">Marque le niveau de sortie de chaque trade — l'expectancy en R se calcule toute seule.</p>
        </div>
      </div>

      <ExpectancyBanner entries={entries} />

      {entries.length > 0 && (
        <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
          <span>
            L'expectancy (R moyen par trade) est le seul juge de l'edge : positive = le système gagne sur la durée, négative = il perd, quel que soit le win rate.
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
          {entries.map((entry) => {
            const r = entryR(entry);
            const borderTone =
              r == null
                ? 'border-slate-200 dark:border-slate-800'
                : r > 0
                ? 'border-emerald-300 dark:border-emerald-700'
                : r < 0
                ? 'border-rose-300 dark:border-rose-700'
                : 'border-slate-300 dark:border-slate-600';
            return (
              <div
                key={entry.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border overflow-hidden shadow-sm flex flex-col group transition-colors ${borderTone}`}
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
                  {entry.exit && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold ${r != null && r > 0 ? 'bg-emerald-500 text-white' : r != null && r < 0 ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {entry.exit} · {fmtR(r)}
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

                  <ExitButtons entry={entry} onSet={handleExit} />
                </div>
              </div>
            );
          })}
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
