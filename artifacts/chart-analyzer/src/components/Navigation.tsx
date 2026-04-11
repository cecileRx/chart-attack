import React from 'react';
import { Link, useLocation } from 'wouter';
import { BarChart3, Clock, Moon, Sun, LogOut, LogIn, UserPlus, ChevronDown } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Show, useUser, useClerk } from '@clerk/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.emailAddresses?.[0]?.emailAddress ?? 'Account';

  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] ?? '')).toUpperCase()
    : displayName[0]?.toUpperCase() ?? '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 h-9 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{displayName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-600 dark:text-rose-400 cursor-pointer"
          onClick={() => signOut({ redirectUrl: `${basePath}/` })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">ChartAttack</span>
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

          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:flex">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Sign up
                </Button>
              </Link>
            </div>
          </Show>

          <Show when="signed-in">
            <UserMenu />
          </Show>
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
        <Show when="signed-out">
          <Link href="/sign-in">
            <Button variant="ghost" className="flex-1 text-sm font-medium">
              Sign in
            </Button>
          </Link>
        </Show>
      </div>
    </nav>
  );
}
