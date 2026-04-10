import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/components/AppContext";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Navigation } from "@/components/Navigation";

// Pages
import Home from "@/pages/Home";
import Analyze from "@/pages/Analyze";
import History from "@/pages/History";

const queryClient = new QueryClient();

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

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="chartsense-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <div className="min-h-[100dvh] flex flex-col font-sans bg-slate-50 dark:bg-slate-950">
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Navigation />
                <main className="flex-1 flex flex-col">
                  <Router />
                </main>
                <DisclaimerBanner />
              </WouterRouter>
            </div>
            <Toaster />
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
