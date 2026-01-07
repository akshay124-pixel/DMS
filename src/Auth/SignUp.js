import React, { useState } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { setAuthData } from "../api/api";

function Signup({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [form, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Others",
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password || !form.role) {
      toast.error("Please fill out all the fields before signing up.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_URL}/user/signup`,
        form
      );

      if (response.status === 201) {
        const { accessToken, refreshToken, user } = response.data;

        // Store all tokens and user data using setAuthData
        setAuthData({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });

        // Update authentication state
        if (setIsAuthenticated) {
          setIsAuthenticated(true);
        }

        toast.success("Your account has been created! Redirecting...", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        navigate("/dashboard");
      } else {
        toast.error("Something unexpected happened. Please try again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Error during signup", error);

      if (error.response?.data?.message) {
        let userFriendlyMessage = error.response.data.message;

        if (userFriendlyMessage.includes("duplicate") || userFriendlyMessage.includes("already exists")) {
          userFriendlyMessage = "An account with this email already exists.";
        } else if (userFriendlyMessage.toLowerCase().includes("invalid email")) {
          userFriendlyMessage = "Please enter a valid email address.";
        } else if (userFriendlyMessage.toLowerCase().includes("password")) {
          userFriendlyMessage = "Your password must meet the security requirements.";
        } else {
          userFriendlyMessage = "We couldn't create your account. Please try again.";
        }

        setError(userFriendlyMessage);
        toast.error(userFriendlyMessage, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } else {
        setError("We couldn't connect to the server. Please check your internet and try again.");
        toast.error("We couldn't connect to the server. Please check your internet and try again.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div className="form-box">
        <form className="form" onSubmit={handleSubmit}>
          <span className="title">Sign Up</span>
          <span className="subtitle">Create a free account with your email.</span>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="form-box">
            <input
              type="text"
              style={{ backgroundColor: "white" }}
              className="input"
              placeholder="Full Name"
              name="username"
              value={form.username}
              onChange={handleInput}
              required
            />
            <input
              type="email"
              style={{ backgroundColor: "white" }}
              className="input"
              placeholder="Email"
              name="email"
              value={form.email}
              onChange={handleInput}
              required
            />
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                style={{ backgroundColor: "white", paddingRight: "80px" }}
                className="input"
                placeholder="Password"
                name="password"
                value={form.password}
                onChange={handleInput}
                required
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
            <select
              name="role"
              style={{ backgroundColor: "white" }}
              value={form.role}
              onChange={handleInput}
              className="input"
              required
            >
              <option value="Others">User</option>
            </select>
          </div>
          <button
            type="submit"
            style={{ background: "linear-gradient(90deg, #6a11cb, #2575fc)" }}
          >
            Sign Up
          </button>
        </form>
        <div className="form-section">
          <p>
            Have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
