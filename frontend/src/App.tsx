import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { getToken, getUser, setToken, setUser, clearAuth } from "./lib/storage";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";
import BriefingPage from "./pages/BriefingPage";
import CategoriesPage from "./pages/CategoriesPage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import LoginPage from "./pages/LoginPage";
import { useStats } from "./hooks/useStats";

interface AuthContextValue {
  isAuthenticated: boolean;
  userName: string | null;
  logIn: (token: string, name: string) => void;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  userName: null,
  logIn: () => {},
  logOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthenticatedApp() {
  const { stats, fetchStats } = useStats();

  return (
    <>
      <TopBar streak={stats?.current_streak ?? 0} />
      <main className="mx-auto max-w-[480px] pt-14 pb-20 min-h-screen">
        <Routes>
          <Route path="/" element={<BriefingPage onReviewComplete={fetchStats} />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [userName, setUserName] = useState<string | null>(
    () => getUser()?.name ?? null
  );
  const location = useLocation();

  const logIn = useCallback((token: string, name: string) => {
    setToken(token);
    setUser({ name });
    setIsAuthenticated(true);
    setUserName(name);
  }, []);

  const logOut = useCallback(() => {
    clearAuth();
    setIsAuthenticated(false);
    setUserName(null);
  }, []);

  useEffect(() => {
    if (!getToken() && isAuthenticated) {
      setIsAuthenticated(false);
      setUserName(null);
    }
  }, [location, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, logIn, logOut }}>
      {isAuthenticated ? (
        <AuthenticatedApp />
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </AuthContext.Provider>
  );
}
