import React, { useEffect } from 'react';
import { useApp } from '../components/AppContext';
import { getHistory, HistoryEntry, clearHistory } from '@/lib/sessionHistory';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useLocation } from 'wouter';

export default function History() {
  const { history, refreshHistory, setCurrentPlan, setCurrentImage, setAnalysisMode } = useApp();
  const [, setLocation] = useLocation();

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleReview = (entry: HistoryEntry) => {
    setCurrentPlan(entry.plan);
    setCurrentImage(entry.thumbnail); // We're using original image as thumbnail
    setAnalysisMode('auto');
    setLocation('/analyze');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your session history?')) {
      clearHistory();
      refreshHistory();
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Session History</h1>
          <p className="text-slate-500 dark:text-slate-400">Review your past analyses and track your progress.</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" onClick={handleClear} className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No history yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Your analyzed charts will appear here so you can review them later.
          </p>
          <Button onClick={() => setLocation('/analyze')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Analyze a Chart
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((entry) => (
            <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
              <div className="h-40 bg-slate-100 dark:bg-slate-800 relative group overflow-hidden">
                <img src={entry.thumbnail} alt="Chart thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/40 transition-opacity">
                  <Button variant="secondary" onClick={() => handleReview(entry)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Review Plan
                  </Button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
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
                  {entry.timestamp.toLocaleString()}
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" className="w-full justify-between text-blue-600 dark:text-blue-400" onClick={() => handleReview(entry)}>
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
