// AuthModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SignupSteps from './SignupSteps';

const AuthModal = ({ type, onClose }) => {
  const { login, validateEmail, validatePassword, loading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignupSteps, setShowSignupSteps] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const toggleAuthType = () => {
    const newType = type === 'login' ? 'signup' : 'login';
    onClose();
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('openAuth', { detail: { type: newType } }));
    }, 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    switch (name) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = value !== formData.password ? 'Passwords do not match' : '';
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    let confirmPasswordError = '';

    if (type === 'signup') {
      confirmPasswordError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : '';
    }

    setErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });

    if (emailError || passwordError || confirmPasswordError) {
      return;
    }

    try {
      if (type === 'login') {
        await login(formData.email, formData.password);
        onClose();
      } else {
        // For signup, send OTP directly using backend endpoint
        setOtpLoading(true);
        const response = await fetch('http://localhost:5000/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        const data = await response.json();
        if (response.ok) {
          setShowSignupSteps(true);
        } else {
          console.error('Error sending OTP:', data.message);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-void-black border border-venom-purple/20 rounded-xl p-6 w-full max-w-md shadow-neon"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {type === 'login' ? 'Welcome Back' : 'Join Symbiote'}
          </h2>
          <button
            onClick={onClose}
            className="text-ghost-lilac/60 hover:text-ghost-lilac"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            {authError}
          </div>
        )}

        {type === 'signup' && showSignupSteps ? (
          <SignupSteps email={formData.email} password={formData.password} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border ${
                  errors.email ? 'border-red-500' : 'border-venom-purple/30'
                } focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20`}
                placeholder="your.email@somaiya.edu"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border ${
                    errors.password ? 'border-red-500' : 'border-venom-purple/30'
                  } focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost-lilac/60 hover:text-ghost-lilac"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {type === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-2 rounded-lg bg-symbiote-purple/20 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-venom-purple/30'
                    } focus:border-venom-purple focus:outline-none focus:ring-2 focus:ring-venom-purple/20`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost-lilac/60 hover:text-ghost-lilac"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-venom-purple rounded-lg font-semibold shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={type === 'signup' ? otpLoading : loading}
            >
              {type === 'login' ? (
                loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Log in'
                )
              ) : (
                otpLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Send OTP'
                )
              )}
            </button>
          </form>
        )}

        {!showSignupSteps && (
          <p className="mt-6 text-center text-sm text-ghost-lilac/60">
            {type === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={toggleAuthType}
                  className="text-venom-purple hover:text-venom-purple/80 font-medium"
                  disabled={loading}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={toggleAuthType}
                  className="text-venom-purple hover:text-venom-purple/80 font-medium"
                  disabled={loading}
                >
                  Log in
                </button>
              </>
            )}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;
