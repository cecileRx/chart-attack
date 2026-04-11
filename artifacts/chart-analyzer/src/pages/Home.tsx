import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, BarChart3, Upload, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-24 pb-16">
        <div className="mb-6 inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
          <BarChart3 className="w-8 h-8" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
          ChartAttack
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10">
          The calm, precise trading coach for beginners. Turn any chart screenshot into a clear, educational trade plan.
        </p>
        
        <Link href="/analyze">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all">
            Import a Chart
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>

        {/* 3-Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mt-24 text-left">
          
          <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Import</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Upload a screenshot of any chart from TradingView, MT4, or your broker.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Analyze</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Our engine identifies key levels and creates a structured risk/reward plan.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Understand</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Learn why the setup makes sense with clear, educational explanations.
            </p>
          </div>
          
        </div>
      </main>

    </div>
  );
}
