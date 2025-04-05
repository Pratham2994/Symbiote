import { createContext, useContext, useState, useEffect } from "react";
import { validateEmail, validatePassword } from "../utils/validations";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the full user profile by hitting the verify endpoint
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("AuthContext: Fetching user profile from /api/auth/verify");
      const response = await fetch(`${import.meta.env.VITE_API_DOMAIN}/api/auth/verify`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include" // important to include cookies
      });
      console.log("AuthContext: fetchUserProfile response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("AuthContext: fetchUserProfile error data:", errorData);
        setUser(null);
        return null;
      }
      const data = await response.json();
      console.log("AuthContext: Fetched user profile:", data);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("AuthContext: Error fetching user profile:", err);
      setError(err.message || "Failed to fetch user profile");
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function calls the login route then uses verify endpoint to get full profile
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_DOMAIN}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensure cookie is set
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Login failed");
      }
      // Login route returns minimal user info and sets a JWT cookie
      await response.json();
      // Now fetch the complete profile via verify endpoint
      const userProfile = await fetchUserProfile();
      return userProfile;
    } catch (err) {
      setError(err.message || "An error occurred during login");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function calls the logout route which clears the cookie on the server
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("AuthContext: Logging out...");
      const response = await fetch(`${import.meta.env.VITE_API_DOMAIN}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      console.log("AuthContext: Logout response status:", response.status);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Logout failed");
      }
      setUser(null);
      console.log("AuthContext: User logged out successfully.");
    } catch (err) {
      setError(err.message || "An error occurred during logout");
      console.error("AuthContext: Logout error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email) => {
    try {
      setLoading(true);
      setError(null);
      console.log("AuthContext: OTP send attempt for:", email);
      // Replace with actual OTP API call when available
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while sending OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, otp, profile, eqAnswers) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!profile.resume) {
        throw new Error("Resume is required");
      }
      if (!profile.githubLink) {
        throw new Error("GitHub profile link is required");
      }
      if (!profile.resume.type.includes("pdf")) {
        throw new Error("Resume must be in PDF format");
      }
      if (!profile.githubLink.includes("github.com")) {
        throw new Error("Please provide a valid GitHub profile URL");
      }
      if (Object.values(eqAnswers).some(answer => answer === null)) {
        throw new Error("Please answer all EQ questions");
      }
      
      // Dummy signup; replace with actual API call when available
      setUser({
        email,
        ...profile,
        eqAnswers
      });
      await fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred during signup");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check for an existing session on app load.
  // This helps rehydrate the user state if a valid JWT cookie is present.
  useEffect(() => {
    fetchUserProfile().catch(() => {
      console.log("AuthContext: No active session found.");
      setUser(null);
    });
  }, []);
  
  return (
    <AuthContext.Provider 
      value={{ 
        user,
        loading,
        error,
        login,
        signup,
        logout,
        sendOtp,
        validateEmail,
        validatePassword,
        fetchUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
