import React, { createContext, useContext, useState, useEffect } from 'react';
import { TradePlan } from '@/lib/analyzeChart';
import { HistoryEntry, getHistory } from '@/lib/sessionHistory';

interface AppContextType {
  currentPlan: TradePlan | null;
  setCurrentPlan: React.Dispatch<React.SetStateAction<TradePlan | null>>;
  currentImage: string | null;
  setCurrentImage: React.Dispatch<React.SetStateAction<string | null>>;
  analysisMode: 'auto' | 'manual';
  setAnalysisMode: React.Dispatch<React.SetStateAction<'auto' | 'manual'>>;
  isAnalyzing: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  history: HistoryEntry[];
  refreshHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<TradePlan | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'auto' | 'manual'>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPlan,
        setCurrentPlan,
        currentImage,
        setCurrentImage,
        analysisMode,
        setAnalysisMode,
        isAnalyzing,
        setIsAnalyzing,
        history,
        refreshHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
