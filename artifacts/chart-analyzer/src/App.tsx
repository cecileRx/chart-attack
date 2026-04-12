import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/components/AppContext";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Navigation } from "@/components/Navigation";

import Home from "@/pages/Home";
import Analyze from "@/pages/Analyze";
import History from "@/pages/History";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Compute the Clerk proxy URL dynamically so it works on both the Replit
// preview domain and any custom production domain (e.g. chartattack.net)
// without requiring a build-time env var.
// The proxy backend middleware is active only in production (NODE_ENV=production),
// so skip the proxy on local/Replit-dev origins where it would be a no-op.
const clerkProxyUrl = (() => {
  if (import.meta.env.VITE_CLERK_PROXY_URL) return import.meta.env.VITE_CLERK_PROXY_URL;
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  // Skip proxy for localhost and Replit dev-preview (*.worf.repl.co, *.replit.dev)
  const isDevHost =
    host === "localhost" ||
    host.includes(".worf.repl.co") ||
    host.includes(".replit.dev") ||
    host.includes(".janeway.replit.dev");
  return isDevHost ? undefined : `${window.location.origin}/api/__clerk`;
})();

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{ elements: { card: "shadow-xl" } }}
      />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{ elements: { card: "shadow-xl" } }}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/history" component={History} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      afterSignInUrl={`${basePath}/`}
      afterSignUpUrl={`${basePath}/`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      localization={{
        signIn: {
          start: {
            title: "Sign in to ChartAttack",
            subtitle: "Welcome back! Please sign in to continue.",
          },
        },
        signUp: {
          start: {
            title: "Sign up for ChartAttack",
            subtitle: "Create your free account to get started.",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
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
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="chartattack-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
