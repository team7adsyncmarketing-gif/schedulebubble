import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form and mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormData({ name: '', email: initialEmail, password: '' });
      setIsLoading(false);
      setShowPassword(false);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validation rules
    if (!formData.email.trim() || !formData.password.trim() || (mode === 'register' && !formData.name.trim())) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    
    // Email basic regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    
    // Password rules
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setErrorMessage('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setErrorMessage('Password must contain at least one uppercase letter.');
      return;
    }

    setIsLoading(true);
    
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload = mode === 'login` 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };
        
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${endpoint}`, {
        method: `POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        setSuccessMessage(mode === 'login' ? 'Successfully logged in! Redirecting...' : 'Account successfully created! Logging you in...');
        
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setErrorMessage(data.message || 'An error occurred during authentication.');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again later.');
      console.error("Network or Server error:", error);
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
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          
          {/* Modal Card */}
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
                <div className="mb-8 pr-8">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-sm" style={{ color: textSecondary }}>
                {mode === 'login' 
                  ? 'Enter your details to access your dashboard.' 
                  : 'Start automating your social publishing today.'}
              </p>
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: textSecondary }}>
                  Password
                </label>
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
                style={{ background: '#6366F1' }}
                whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm" style={{ color: textSecondary }}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="font-medium hover:underline transition-all"
                style={{ color: '#6366F1' }}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
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
