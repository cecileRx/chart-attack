import React from 'react';
import { Link, useLocation } from 'wouter';
import { BarChart3, Clock, Moon, Sun, Settings } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">ChartSense</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="/analyze">
              <Button variant={location === '/analyze' ? 'secondary' : 'ghost'} className="text-sm font-medium">
                Workspace
              </Button>
            </Link>
            <Link href="/history">
              <Button variant={location === '/history' ? 'secondary' : 'ghost'} className="text-sm font-medium">
                <Clock className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-slate-500 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 gap-2">
        <Link href="/analyze">
          <Button variant={location === '/analyze' ? 'secondary' : 'ghost'} className="flex-1 text-sm font-medium">
            Workspace
          </Button>
        </Link>
        <Link href="/history">
          <Button variant={location === '/history' ? 'secondary' : 'ghost'} className="flex-1 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            History
          </Button>
        </Link>
      </div>
    </nav>
  );
}
