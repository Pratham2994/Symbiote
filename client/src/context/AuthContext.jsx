import { createContext, useContext, useState, useEffect } from "react";
import { validateEmail, validatePassword } from "../utils/validations";
import { authService } from "../services/auth.service";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Will be implemented when backend is ready
      // const { user } = await authService.fetchProfile();
      // setUser(user);
      
      // Remove this dummy profile when backend is implemented
      const dummyProfile = {
        email: user?.email,
        name: user?.email?.split('@')[0],
        role: 'user',
        avatar: null,
        createdAt: new Date().toISOString(),
        resume: user?.resume,
        githubLink: user?.githubLink,
        otherLinks: user?.otherLinks || [],
        eqAnswers: user?.eqAnswers || {}
      };
      setUser(dummyProfile);
      
      return dummyProfile;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user profile');
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Will be implemented when backend is ready
      // await authService.login(email, password);
      
      // Temporary dummy login
      setUser({ email });
      
      // Fetch complete user profile after successful login
      await fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      // Will be implemented when backend is ready
      // await authService.sendOtp(email);
      
      console.log('OTP send attempt for:', email);
      return true; // Remove this when backend is implemented
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while sending OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, otp, profile, eqAnswers) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate profile data
      if (!profile.resume) {
        throw new Error('Resume is required');
      }
      if (!profile.githubLink) {
        throw new Error('GitHub profile link is required');
      }
      if (!profile.resume.type.includes('pdf')) {
        throw new Error('Resume must be in PDF format');
      }
      if (!profile.githubLink.includes('github.com')) {
        throw new Error('Please provide a valid GitHub profile URL');
      }
      
      // Validate EQ answers
      if (Object.values(eqAnswers).some(answer => answer === null)) {
        throw new Error('Please answer all EQ questions');
      }
      
      // Will be implemented when backend is ready
      // await authService.signup(email, password, otp, profile, eqAnswers);
      
      // Temporary dummy signup
      setUser({
        email,
        ...profile,
        eqAnswers
      });
      
      // Fetch complete user profile after successful signup
      await fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during signup');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Will be implemented when backend is ready
      // await authService.logout();
      
      setUser(null);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during logout');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check for existing session on app load
  useEffect(() => {
    fetchUserProfile().catch(() => {
      // Silently fail if no session exists
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
