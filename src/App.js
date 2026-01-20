import React, { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import DashBoard from "./components/DashBoard";
import ChangePassword from "./Auth/ChangePassword";
import Login from "./Auth/Login";
import SignUp from "./Auth/SignUp";
import Navbar from "./components/Navbar";
import CallAnalyticsDashboard from "./components/Analytics/CallAnalyticsDashboard";
import SmartfloUserMapping from "./components/Smartflo/SmartfloUserMapping";
import ScheduledCallsManager from "./components/Dialer/ScheduledCallsManager";
import CallHistoryPage from "./components/CallHistory/CallHistoryPage";
import api, { getAuthData, logout } from "./api/api";

const PrivateRoute = ({ element, isAuthenticated, isLoading }) => {
  if (isLoading) return null;
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔐 Verify token on app load
  useEffect(() => {
    const verifyAuthOnLoad = async () => {
      const { accessToken, user } = getAuthData();

      if (!accessToken || !user?.email) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        await api.get("/auth/verify-token");
        setIsAuthenticated(true);
        console.log("Token verified on app load");
      } catch (error) {
        console.error("Token verification failed", error);
        if (error.response?.status === 401) {
          logout();
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthOnLoad();
  }, []);

  // 🔄 Sync auth across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const { accessToken, user } = getAuthData();
      setIsAuthenticated(!!accessToken && !!user?.email);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Router>
      <ConditionalNavbar
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />

     
      {isLoading ? (
        <div style={{ height: "100vh", background: "#fff" }} />
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute
                element={<DashBoard />}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
              />
            }
          />

          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />

          <Route
            path="/signup"
            element={<SignUp setIsAuthenticated={setIsAuthenticated} />}
          />

          <Route
            path="/change-password"
            element={
              <PrivateRoute
                element={
                  <ChangePassword setIsAuthenticated={setIsAuthenticated} />
                }
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
              />
            }
          />

          <Route
            path="/analytics/calls"
            element={
              <PrivateRoute
                element={<CallAnalyticsDashboard />}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
              />
            }
          />

          <Route
            path="/admin/smartflo-mapping"
            element={
              <PrivateRoute
                element={<SmartfloUserMapping />}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
              />
            }
          />

          <Route
            path="/scheduled-calls"
            element={
              <PrivateRoute
                element={<ScheduledCallsManager />}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
              />
            }
          />

          <Route
            path="/call-history"
            element={
              <PrivateRoute
                element={<CallHistoryPage />}
                isAuthenticated={isAuthenticated}
                isLoading={isLoading}
              />
            }
          />
        </Routes>
      )}
    </Router>
  );
}


const ConditionalNavbar = ({ isAuthenticated, isLoading }) => {
  const location = useLocation();

  if (isLoading) return null;

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/change-password";

  return isAuthenticated && !isAuthPage ? <Navbar /> : null;
};

export default App;
