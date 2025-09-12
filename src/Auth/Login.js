import React, { useState } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in both fields.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_URL}/auth/login`,
        formData
      );

      if (response.status === 200) {
        const { token, user } = response.data;

        // Ensure user object includes email
        const userData = {
          id: user.id,
          username: user.username,
          email: formData.email, // Use the email from formData to ensure consistency
          role: user.role,
          isAdmin: user.isAdmin,
          isSuperadmin: user.isSuperadmin,
        };

        console.log("Login: Storing user data", userData);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsAuthenticated(true);

        toast.success("Login successful! Redirecting...", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });

        navigate("/dashboard");
      } else {
        toast.error("Something went wrong. Please try again later.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Error while logging in:", error);

      if (error.response?.status === 401) {
        toast.error("Invalid email or password. Please check and try again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } else if (error.code === "ERR_NETWORK") {
        toast.error("Unable to connect. Please check your internet.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } else {
        toast.error("Login failed. Please try again later.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="login-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div className="form-box">
        <form className="form" onSubmit={handleSubmit}>
          <h2 className="title">Login</h2>
          <p className="subtitle">Access your account.</p>

          <div className="form-inputs">
            <input
              autoComplete="off"
              style={{ backgroundColor: "white" }}
              className="input"
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInput}
              required
              aria-label="Email Address"
            />
            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ backgroundColor: "white", paddingRight: "80px" }}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInput}
                required
                aria-label="Password"
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "blue",
                  cursor: "pointer",
                }}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="button1"
            disabled={loading}
            aria-label="Login"
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Login"}
          </button>
        </form>

        <div className="form-section">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
