import { useState, useEffect } from "react";
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
import { checkAuthStatus } from "./api/api";

const PrivateRoute = ({ element, isAuthenticated, isLoading }) => {
  // ✅ Loading state handle karo
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
       
      </div>
    );
  }
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ Loading state add kiya

  // ✅ App load hone par auth status check karo
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { isAuthenticated: authStatus } = await checkAuthStatus();
        setIsAuthenticated(authStatus);
        console.log("App: Auth status checked:", authStatus);
      } catch (error) {
        console.error("App: Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const authenticated = !!token && !!user.email;
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
