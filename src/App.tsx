import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy-load pages for code splitting (faster initial load)
const Landing     = lazy(() => import("@/pages/Landing"));
const Auth        = lazy(() => import("@/pages/Auth"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const ItemDetail  = lazy(() => import("@/pages/ItemDetail"));
const SellItem    = lazy(() => import("@/pages/SellItem"));
const MyItems     = lazy(() => import("@/pages/MyItems"));
const Chat        = lazy(() => import("@/pages/Chat"));
const Admin       = lazy(() => import("@/pages/Admin"));
const Profile     = lazy(() => import("@/pages/Profile"));
const NotFound    = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 min cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Page loading spinner
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>
  );
}

// The protected app shell (Navbar + inner routes)
function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/home"       element={<Marketplace />} />
            <Route path="/"          element={<Navigate to="/home" replace />} />
            <Route path="/item/:id"  element={<ItemDetail />} />
            <Route path="/sell"      element={<SellItem />} />
            <Route path="/my-items"  element={<MyItems />} />
            <Route path="/chat"      element={<Chat />} />
            <Route path="/profile"   element={<Profile />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// Inner app: knows about auth state to decide which layout to render
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Starting SwapCampus…</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Root: Landing for guests, Marketplace for logged-in users ── */}
        <Route
          path="/"
          element={user ? <Navigate to="/home" replace /> : <Landing />}
        />

        {/* ── Auth page: redirect away if already logged in ── */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/home" replace /> : <Auth />}
        />

        {/* ── Protected app routes ── */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster
            position="top-right"
            richColors
            expand={false}
            duration={4000}
            toastOptions={{
              classNames: {
                toast: "font-body rounded-xl! shadow-elevated!",
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}