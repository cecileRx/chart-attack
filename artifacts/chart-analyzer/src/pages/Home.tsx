import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, Upload, ShieldCheck, Activity, TrendingUp, Target, BookOpen } from 'lucide-react';
import { SharkIcon } from '@/components/SharkIcon';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-24 pb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">
          ChartAttack
        </h1>

        <div className="mb-6 inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
          <SharkIcon className="w-16 h-16" />
        </div>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10">
          Tired of endless analysis? Just bite your trading instantly!
        </p>

        <p className="text-base text-slate-500 dark:text-slate-500 max-w-xl mb-10 -mt-6">
          Upload any chart screenshot from TradingView, MT4, or MT5 and get an AI trade plan with entry, stop loss, and TP1/TP2/TP3 in seconds.
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
              Upload a chart screenshot from TradingView, MT4, MT5, or any broker platform.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Analyze</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              AI identifies key levels, support and resistance, and generates a risk/reward trade plan.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Understand</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Learn why the setup makes sense with clear, plain-English educational explanations.
            </p>
          </div>
          
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mt-12">
          <div className="flex items-start gap-3 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Target className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Entry, SL, TP1/TP2/TP3</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Precise price levels for every trade setup, including three take-profit targets.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Risk/Reward Ratio</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automatically calculated R/R ratio so you know your risk before entering any trade.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Built for Beginners</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Every plan comes with an educational explanation — learn trading while you trade.</p>
            </div>
          </div>
        </div>

        {/* SEO text block — keyword-rich, helpful for crawlers and users */}
        <section className="max-w-3xl w-full mt-16 text-left p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">What is ChartAttack?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            ChartAttack is a free AI-powered chart analysis tool designed for beginner and intermediate traders. Instead of spending hours analyzing charts manually, you simply upload a screenshot from TradingView, MetaTrader 4 (MT4), MetaTrader 5 (MT5), or any broker platform — and ChartAttack's AI instantly reads the chart and generates a complete, structured trade plan.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Each trade plan includes a recommended entry price, a stop loss level, three take-profit targets (TP1, TP2, TP3), and a risk/reward ratio for each — plus a plain-English explanation of why the setup makes sense technically. ChartAttack is the fastest way to go from a raw chart to a clear, actionable trade decision.
          </p>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 dark:text-slate-600 max-w-2xl mt-10 leading-relaxed">
          ChartAttack is an educational tool. All trade plans are AI-generated and for informational purposes only. They do not constitute financial advice. Always conduct your own research before making any trading decisions.
        </p>
      </main>

    </div>
  );
}
