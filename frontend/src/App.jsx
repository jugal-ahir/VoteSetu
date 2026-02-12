import React from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Moon, SunMedium, LogOut, User, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingPage } from "./pages/LandingPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DigiLockerPage } from "./pages/DigiLockerPage.jsx";
import { VotingBoothPage } from "./pages/VotingBoothPage.jsx";
import { VoteSuccessPage } from "./pages/VoteSuccessPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { LogsViewerPage } from "./pages/LogsViewerPage.jsx";
import { UserHistoryPage } from "./pages/UserHistoryPage.jsx";
import { ResultsPage } from "./pages/ResultsPage.jsx";
import { UnauthorizedPage } from "./pages/UnauthorizedPage.jsx";
import { useThemeStore } from "./store/themeStore.js";
import { useAuthStore } from "./store/authStore.js";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

function ProtectedRoute({ children, role }) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user, clearAuth } = useAuthStore();

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500/30">
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to={user ? (user.role === "admin" ? "/admin" : "/vote") : "/"}
            className="group flex items-center gap-3"
          >
            <div className="rounded-lg bg-emerald-500/10 p-2 transition-transform group-hover:scale-110">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-50">
                VoteSetu
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Secure Academic E‑Voting
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="text-slate-400 transition-colors hover:text-emerald-400"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="rounded-full bg-emerald-600 px-5 py-2 text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                {user.role === "voter" && (
                  <>
                    <Link
                      to="/vote"
                      className="text-slate-400 transition-colors hover:text-emerald-400"
                    >
                      Voting Booth
                    </Link>
                    <Link
                      to="/vote/history"
                      className="text-slate-400 transition-colors hover:text-emerald-400 flex items-center gap-1"
                    >
                      <History className="h-4 w-4" /> History
                    </Link>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin"
                      className="text-slate-400 transition-colors hover:text-emerald-400"
                    >
                      Admin
                    </Link>
                    <Link
                      to="/admin/logs"
                      className="text-slate-400 transition-colors hover:text-emerald-400"
                    >
                      Logs
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden text-xs lg:inline-block">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="group rounded-full bg-slate-900 p-2 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="ml-2 rounded-full border border-slate-800 bg-slate-900/40 p-2 text-slate-400 transition-all hover:border-emerald-500/50 hover:text-emerald-400"
            >
              {theme === "dark" ? (
                <SunMedium className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </nav>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-slate-900/50 bg-slate-950/50 py-8 text-center backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
          Academic Cybersecurity Platform · End-to-End Encrypted
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/digilocker" element={
          <ProtectedRoute>
            <DigiLockerPage />
          </ProtectedRoute>
        } />
        <Route path="/vote" element={
          <ProtectedRoute role="voter">
            <VotingBoothPage />
          </ProtectedRoute>
        } />
        <Route path="/vote/success" element={
          <ProtectedRoute role="voter">
            <VoteSuccessPage />
          </ProtectedRoute>
        } />
        <Route path="/vote/history" element={
          <ProtectedRoute role="voter">
            <UserHistoryPage />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <ProtectedRoute role="admin">
            <LogsViewerPage />
          </ProtectedRoute>
        } />
        <Route path="/results/:id" element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        } />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
