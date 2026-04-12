import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/components/AppContext";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/context/AuthContext";

import Home from "@/pages/Home";
import Analyze from "@/pages/Analyze";
import History from "@/pages/History";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();

function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <div className="min-h-[100dvh] flex flex-col font-sans bg-slate-50 dark:bg-slate-950">
              <Navigation />
              <main className="flex-1 flex flex-col">
                <Router />
              </main>
              <DisclaimerBanner />
            </div>
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="chartattack-theme">
      <WouterRouter base={basePath}>
        <AppShell />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
