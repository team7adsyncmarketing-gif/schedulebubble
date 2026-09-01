import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialEmail?: string;
  isDark: boolean;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', initialEmail = '', isDark, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormData({ name: '', email: initialEmail, password: '' });
      setIsLoading(false);
      setIsGoogleLoading(false);
      setShowPassword(false);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen, initialMode]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to authenticate with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!formData.email.trim() || !formData.password.trim() || (mode === 'register' && !formData.name.trim())) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });
        
        if (error) throw error;
        
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        setSuccessMessage('Successfully logged in! Redirecting...');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const bg = isDark ? 'rgba(13, 19, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.09)';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#475569';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.03)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.1)';
  const focusRing = isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          
          <motion.div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-7 sm:p-8"
            style={{
              background: bg,
              border: border,
              boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              color: textPrimary
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: textSecondary }}
            >
              <X size={20} />
            </button>

            {successMessage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <CheckCircle2 size={32} color="#22c55e" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>Success</h3>
                <p className="text-sm" style={{ color: textSecondary }}>{successMessage}</p>
                <Loader2 size={24} className="animate-spin mt-6" style={{ color: '#6366F1' }} />
              </motion.div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    {mode === 'login' ? 'Welcome back' : 'Create an account'}
                  </h2>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-3 transition-colors mb-6 font-medium hover:bg-white/5"
                  style={{ 
                    borderColor: inputBorder, 
                    background: inputBg,
                    color: textPrimary
                  }}
                >
                  {isGoogleLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px" style={{ background: inputBorder }}></div>
                  <span className="text-xs font-medium uppercase" style={{ color: textSecondary }}>Or</span>
                  <div className="flex-1 h-px" style={{ background: inputBorder }}></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout">
                    {mode === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-sm font-medium mb-1.5" style={{ color: textSecondary }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                          style={{
                            background: inputBg,
                            border: `1px solid ${inputBorder}`,
                            color: textPrimary,
                          }}
                          onFocus={(e) => e.target.style.boxShadow = `0 0 0 3px ${focusRing}`}
                          onBlur={(e) => e.target.style.boxShadow = 'none'}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: textSecondary }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                      style={{
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        color: textPrimary,
                      }}
                      onFocus={(e) => e.target.style.boxShadow = `0 0 0 3px ${focusRing}`}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-sm font-medium" style={{ color: textSecondary }}>
                        Password
                      </label>
                      {mode === 'login' && (
                        <a href="#" className="text-xs hover:underline" style={{ color: textSecondary }}>Forgot password?</a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 pr-12"
                        style={{
                          background: inputBg,
                          border: `1px solid ${inputBorder}`,
                          color: textPrimary,
                        }}
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 3px ${focusRing}`}
                        onBlur={(e) => e.target.style.boxShadow = 'none'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors opacity-70 hover:opacity-100"
                        style={{ color: textSecondary }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="text-red-500 text-sm font-medium mt-1">
                      {errorMessage}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-white mt-3 flex items-center justify-center gap-2"
                    style={{ background: '#0F172A' }}
                    whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                    <span>{mode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                  </motion.button>
                </form>

                <div className="mt-6 text-center text-sm" style={{ color: textSecondary }}>
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
