import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './components/layout/AppLayout';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp = (delay: number) => ({
  hidden:  { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
});

const sheetVariant = {
  hidden:  { x: '100%' },
  visible: { x: 0,      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit:    { x: '100%', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const backdropVariant = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADSYNC LOGO
// ─────────────────────────────────────────────────────────────────────────────
import logo from './assets/logo.png';

const AdSyncLogo: React.FC<{ size?: number; fill?: string }> = ({ size = 32, fill }) => {
  return (
    <img 
      src={logo} 
      alt="AdSync Logo" 
      style={{ width: size, height: 'auto', objectFit: 'contain' }}
      className="dark:brightness-0 dark:invert" 
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE BUTTON (Mock since forced dark)
// ─────────────────────────────────────────────────────────────────────────────
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <motion.button
      onClick={toggleTheme}
      className="flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
      style={{ width: 36, height: 36, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}
      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 350, damping: 22 }}
    >
      {isDark ? <Sun size={15} color="#94A3B8" strokeWidth={2} /> : <Moon size={15} color="#475569" strokeWidth={2} />}
    </motion.button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE MENU SHEET
// ─────────────────────────────────────────────────────────────────────────────
const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void; onOpenAuth: (mode: 'login' | 'register', email?: string) => void }> = ({ isOpen, onClose, onOpenAuth }) => {
  const NAV_LINKS = ['Dashboard', 'Queues', 'Integrations', 'Analytics', 'Enterprise'] as const;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop" className="fixed inset-0 z-40"
            style={{ background: 'rgba(8,11,17,0.6)', backdropFilter: 'blur(8px)' }}
            variants={backdropVariant} initial="hidden" animate="visible" exit="exit" onClick={onClose}
          />
          <motion.div
            key="sheet" className="fixed right-0 top-0 z-50 flex flex-col"
            style={{ width: 'min(88vw, 360px)', height: '100dvh', background: 'rgba(13,19,30,0.97)', borderLeft: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)', boxShadow: '-16px 0 60px rgba(0,0,0,0.18)' }}
            variants={sheetVariant} initial="hidden" animate="visible" exit="exit"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <AdSyncLogo size={26} />
              <button onClick={onClose} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X size={18} color="#94A3B8" />
              </button>
            </div>
            <div className="mx-6 h-px bg-white/10" />
            <nav className="flex flex-col px-6 pt-6 gap-1 flex-1">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link} className="text-base text-left font-medium py-3 px-3 rounded-xl transition-colors text-slate-400 hover:text-white"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 + i * 0.07, duration: 0.4 }}
                  onClick={() => { onClose(); onOpenAuth('register'); }}
                >{link}</motion.button>
              ))}
            </nav>
            <div className="px-6 pb-8 flex flex-col gap-3">
              <motion.button onClick={() => { onClose(); onOpenAuth('register'); }} className="w-full py-3.5 rounded-full font-semibold text-white text-sm bg-indigo-500">
                Start For Free
              </motion.button>
              <motion.button onClick={() => { onClose(); onOpenAuth('login'); }} className="w-full py-3.5 rounded-full font-medium text-sm text-white border border-white/10 bg-white/5">
                Sign In
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────
const HeroSection: React.FC<{ onOpenAuth?: (mode: 'login' | 'register', email?: string) => void }> = ({ onOpenAuth }) => {
  const [email, setEmail] = useState('');

  const handleStartForFree = () => {
    if (onOpenAuth) onOpenAuth('register', email);
  };

  return (
    <section className="relative w-full min-h-screen font-sans bg-transparent">
      
      {/* ── HERO CONTENT ─────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="min-h-[calc(100vh-72px)] flex flex-col justify-center px-5 sm:px-8" style={{ paddingTop: 'clamp(32px, 6vw, 64px)', paddingBottom: 'clamp(48px, 8vw, 80px)' }}>
          <div className="w-full max-w-xl">
            <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="inline-flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 backdrop-blur-sm">
                <motion.span className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ scale: [1, 1.7, 1], opacity: [1, 0.35, 1] }} transition={{ duration: 1.3, repeat: Infinity }} />
                AI-Powered Social Publishing
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp(0)} initial="hidden" animate="visible" className="text-slate-900 dark:text-white mb-6 font-bold" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Your social media workspace
            </motion.h1>
            <motion.p variants={fadeUp(0.15)} initial="hidden" animate="visible" className="text-slate-600 dark:text-slate-400 mb-10 max-w-xl leading-relaxed text-lg sm:text-xl">
              Connected to every platform and tool you use.
            </motion.p>
            <motion.div variants={fadeUp(0.30)} initial="hidden" animate="visible">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md p-1.5 rounded-full bg-slate-900 dark:bg-slate-800/50 border border-slate-800 dark:border-slate-700 shadow-xl shadow-slate-900/20 dark:shadow-none">
                <input 
                  type="email" 
                  placeholder="name@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 w-full bg-transparent px-5 py-3 sm:py-0 outline-none text-white placeholder-slate-400 text-sm sm:text-base"
                />
                <button
                  onClick={handleStartForFree}
                  className="w-full sm:w-auto inline-flex items-center justify-center font-semibold text-slate-900 bg-[#A3E635] hover:bg-[#84cc16] rounded-full px-6 py-3.5 transition-colors duration-200 text-sm sm:text-base flex-shrink-0"
                >
                  Get started for free &rarr;
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-5 px-4 text-center sm:text-left">
                By entering your email, you agree to receive emails from AdSync Marketing.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </section>
  );
};

export default HeroSection;
