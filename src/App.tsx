import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { usePageTracking } from "@/hooks/usePageTracking";
import { OfflineBanner } from "@/components/OfflineBanner";

// Eager: landing + auth (first-paint critical)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy: everything behind auth or rarely visited
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Room = lazy(() => import("./pages/Room"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Recall = lazy(() => import("./pages/Recall"));
const JoinRoom = lazy(() => import("./pages/JoinRoom"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading page">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </ProtectedRoute>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  usePageTracking();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/join/:code" element={<PageTransition><JoinRoom /></PageTransition>} />
        <Route path="/dashboard" element={<ProtectedPage><PageTransition><Dashboard /></PageTransition></ProtectedPage>} />
        <Route path="/room/:roomId" element={<ProtectedPage><ErrorBoundary><PageTransition><Room /></PageTransition></ErrorBoundary></ProtectedPage>} />
        <Route path="/quiz/:quizId" element={<ProtectedRoute><ErrorBoundary><PageTransition><Quiz /></PageTransition></ErrorBoundary></ProtectedRoute>} />
        <Route path="/preferences" element={<ProtectedPage><PageTransition><Preferences /></PageTransition></ProtectedPage>} />
        <Route path="/bookmarks" element={<ProtectedPage><PageTransition><Bookmarks /></PageTransition></ProtectedPage>} />
        <Route path="/profile" element={<ProtectedPage><PageTransition><Profile /></PageTransition></ProtectedPage>} />
        <Route path="/recall" element={<ProtectedPage><PageTransition><Recall /></PageTransition></ProtectedPage>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineBanner />
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <AnimatedRoutes />
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
