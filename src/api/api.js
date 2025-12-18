import axios from "axios";


const BASE_URL = process.env.REACT_APP_URL || "http://localhost:4000";

// Instance fro all apis
const api = axios.create({
    baseURL:BASE_URL,
    timeout:30000,
    headers:{
        "Content-Type":"application/json",
    }
})

// * ✅ FLAG: Refresh ho raha hai ya nahi
let isRefreshing = false;
//  * ✅ QUEUE: Failed requests jo refresh ke baad retry hongi
let failedQueue= [];

// * ✅ QUEUE PROCESS KARNA
const processQueue = (error,token = null)=>{
    failedQueue.forEach((prom)=>{
        if (error) {
      prom.reject(error); // Refresh fail - sabko reject karo
    } else {
      prom.resolve(token); // Refresh success - sabko naya token do
    }
  });
  failedQueue = []; // Queue clear karo
}

// ✅ REQUEST INTERCEPTOR add access Token in all Request
api.interceptors.request.use(
    (config) => {
    // LocalStorage se access token lo
    const accessToken = localStorage.getItem("accessToken");
    
    // Agar token hai toh header me add karo
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error)=>{
  console.error("📤 Request Error:", error);
  return Promise.reject(error)
  }    
)

// ✅ RESPONSE INTERCEPTOR - MAIN LOGIC ⭐ add Refresh Token in all 401 req
api.interceptors.response.use(
    // ✅ SUCCESS RESPONSE - Seedha return karo
    (response)=>{
    console.log(`📥 API Response: ${response.status} ${response.config.url}`);
    return response},
 // ✅ ERROR RESPONSE - Yahan magic hota hai
async(error)=>{
 const originalRequest = error.config; 
 console.log(`❌ API Error: ${error.response?.status} ${originalRequest?.url}`);
 // ✅ CHECK 1: Kya yeh 401 error hai?
 if(error.response?.status ===401){
    // ✅ CHECK 2: Kya yeh refresh-token endpoint ki request thi?
    if(originalRequest.url?.includes("/refresh-token")){
         console.log("🚫 Refresh token bhi expire ho gaya - Logout required");
         handleLogout();
         return Promise.reject(error)
    }
   // ✅ CHECK 3: Kya yeh request pehle retry ho chuki hai?
   if(originalRequest._retry){
      console.log("🚫 Request already retried - Logout required");
      handleLogout();
      return Promise.reject(error);
   }
  // ✅ CHECK 4: Kya refresh already progress me hai?
  if(isRefreshing){
    console.log("⏳ Refresh in progress - Adding to queue");
    return new Promise((resolve,reject)=>{
        failedQueue.push({resolve,reject});
    }).then((token)=>{
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest)
    })
    .catch((err)=>{
        return Promise.reject(err)
    })
  }
     // ✅ REFRESH PROCESS START
    originalRequest._retry = true; // Mark: yeh request retry ho rahi hai
      isRefreshing = true; // Flag: refresh ho raha hai

      console.log("🔄 Starting token refresh...");

      try {
        // ✅ Refresh token lo localStorage se
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // ✅ Refresh endpoint call karo
        // Note: axios.post use karo, api.post nahi - warna interceptor loop
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken: refreshToken,
        });

        // ✅ Naye tokens save karo
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        console.log("✅ Token refresh successful!");

        // ✅ Queue me pending requests ko process karo
        processQueue(null, newAccessToken);

        // ✅ Original request retry karo naye token ke saath
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // ✅ Refresh fail ho gaya
        console.error("❌ Token refresh failed:", refreshError.message);
        
        // Queue me pending requests ko reject karo
        processQueue(refreshError, null);
        
        // User ko logout karo
        handleLogout();
        
        return Promise.reject(refreshError);
      } finally {
        // ✅ Refresh complete - flag reset karo
        isRefreshing = false;
      }
    }

    // ✅ Non-401 errors - seedha reject karo
    return Promise.reject(error);
  }
);

//   ✅ LOGOUT HANDLER
const handleLogout = ()=>{
     console.log("🚪 Logging out user...");
  
  // Saare tokens aur user data clear karo
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("token"); // Purana token bhi clear karo (backward compatibility)
  
  // Login page par redirect karo
  // Note: React Router use nahi kar sakte yahan, toh window.location use karo
  window.location.href = "/login";
}

export const logout= async()=>{
    try {
        await api.post("/auth/logout")
    } catch (error) {
        console.error("Logout API error:", error);
    } finally{
        handleLogout()
    }

}
// ✅ CHECK AUTH STATUS
export const checkAuthStatus = async () => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  
  // Koi token nahi hai - user logged out hai
  if (!accessToken && !refreshToken) {
    return { isAuthenticated: false, user: null };
  }
  
  try {
    // Access token verify karo - interceptor automatically refresh karega agar needed
    const response = await api.get("/auth/verify-token");
    return {
      isAuthenticated: true,
      user: response.data.user
    };
  } catch (error) {
    console.error("Auth check failed:", error);
    return { isAuthenticated: false, user: null };
  }
};

// / ✅ GET CURRENT USER
export const  getCurrentUser = ()=>{
    const userStr = localStorage.getItem("user");
    if(userStr){
        try {
            return JSON.parse(userStr)
        } catch (error) {
            return null
        }
    }
    return null
}

export const setAuthData = (accessToken,refreshToken,user)=>{
     localStorage.setItem("accessToken", accessToken);
     localStorage.setItem("refreshToken", refreshToken);
     localStorage.setItem("user", JSON.stringify(user));
     localStorage.setItem("token", accessToken);
}

export default api;