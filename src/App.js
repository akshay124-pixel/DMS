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
import { getAuthData } from "./api/api";

const PrivateRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const { accessToken, user } = getAuthData();
    return !!accessToken && !!user?.email;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const { accessToken, user } = getAuthData();
      const authenticated = !!accessToken && !!user?.email;
      setIsAuthenticated(authenticated);
      console.log("App: Storage changed, isAuthenticated:", authenticated);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Router>
      <ConditionalNavbar isAuthenticated={isAuthenticated} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute
              element={<DashBoard />}
              isAuthenticated={isAuthenticated}
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
            />
          }
        />
        <Route
          path="/analytics/calls"
          element={
            <PrivateRoute
              element={<CallAnalyticsDashboard />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/admin/smartflo-mapping"
          element={
            <PrivateRoute
              element={<SmartfloUserMapping />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/scheduled-calls"
          element={
            <PrivateRoute
              element={<ScheduledCallsManager />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
      </Routes>
    </Router>
  );
}

const ConditionalNavbar = ({ isAuthenticated }) => {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/change-password";

  return isAuthenticated && !isAuthPage ? <Navbar /> : null;
};

export default App;
