/**
 * API Configuration with Axios Interceptors
 * Implements automatic token refresh on 401 responses
 */
import axios from "axios";

const BASE_URL = process.env.REACT_APP_URL || "http://localhost:4000";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes timeout for bulk operations
  headers: {
    "Content-Type": "application/json",
  },
});

// Queue management for concurrent requests during refresh
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 * @param {Error|null} error - Error if refresh failed
 * @param {string|null} token - New access token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Navigation context for API interceptors
let navigationFunction = null;

/**
 * Set navigation function for API interceptors
 * This should be called from components that need to handle logout navigation
 * @param {Function} navigate - React Router navigate function
 */
export const setNavigationFunction = (navigate) => {
  navigationFunction = navigate;
};

/**
 * Clear navigation function
 */
export const clearNavigationFunction = () => {
  navigationFunction = null;
};

/**
 * Set authentication data in localStorage
 * @param {Object} data - { accessToken, refreshToken, user }
 */
export const setAuthData = (data) => {
  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("token", data.accessToken); // Backward compatibility
  }
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("username", data.user.username);
  }
};

/**
 * Get authentication data from localStorage
 * @returns {Object} - { accessToken, refreshToken, user }
 */
export const getAuthData = () => {
  const accessToken = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  return { accessToken, refreshToken, user };
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
};

/**
 * Logout user - clear data and redirect
 * Note: This function now returns a promise to allow components to handle navigation
 */
export const logout = async (navigate = null) => {
  const { accessToken } = getAuthData();
  
  // Try to call logout endpoint (fire and forget)
  if (accessToken) {
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (error) {
      // Ignore logout endpoint errors
      console.log("Logout endpoint error (ignored):", error.message);
    }
  }
  
  clearAuthData();
  
  // Use React Router navigation if available, otherwise fallback to window.location
  if (navigate && typeof navigate === 'function') {
    navigate("/login", { replace: true });
  } else {
    // Fallback for cases where navigate is not available
    window.location.href = "/login";
  }
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<string>} - New access token
 */
const refreshAccessToken = async () => {
  const { refreshToken } = getAuthData();
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // CRITICAL: Use axios.post directly, NOT api.post to avoid interceptor loop
  const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
    refreshToken,
  });

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

  // Store new tokens
  setAuthData({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });

  return newAccessToken;
};

// Request interceptor - attach access token to all requests
api.interceptors.request.use(
  (config) => {
    const { accessToken } = getAuthData();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized
    if (error.response?.status === 401) {
      // Check if this is the refresh endpoint itself - if so, logout
      if (originalRequest.url?.includes("/refresh-token")) {
        console.log("Refresh token failed, logging out");
        logout(navigationFunction);
        return Promise.reject(error);
      }

      // Check if request was already retried - if so, logout
      if (originalRequest._retry) {
        console.log("Request already retried, logging out");
        logout(navigationFunction);
        return Promise.reject(error);
      }

      // If refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark request as retried
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const newToken = await refreshAccessToken();
        
        // Process queued requests with new token
        processQueue(null, newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - process queue with error and logout
        processQueue(refreshError, null);
        logout(navigationFunction);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { BASE_URL };
