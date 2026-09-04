import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, useSpring, useAnimationFrame } from 'framer-motion';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGoogle } from 'react-icons/fa6';

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}
export const ThemeCtx = createContext<ThemeContextType>({ isDark: true, toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeCtx);

type SocialPlatform = 'x' | 'linkedin' | 'facebook' | 'instagram' | 'gmb';

interface CoinDef {
  bg: string;
  borderColor: string;
  label: string;
  icon?: React.FC<any>;
}

interface CoinConfig {
  id: number;
  platform: SocialPlatform;
  trackIndex: number;
  delay: number;
}

interface MousePosition {
  x: number;
  y: number;
}

const COIN_DEFS: Record<SocialPlatform, CoinDef> = {
  x:         { bg: '#1a1a1a',  borderColor: 'rgba(255,255,255,0.18)', label: 'X',  icon: FaXTwitter },
  linkedin:  { bg: '#0A66C2',  borderColor: 'rgba(10,102,194,0.5)',   label: 'in', icon: FaLinkedin },
  facebook:  { bg: '#1877F2',  borderColor: 'rgba(24,119,242,0.5)',   label: 'f',  icon: FaFacebook },
  instagram: { bg: '#E1306C',  borderColor: 'rgba(225,48,108,0.5)',   label: '▣',  icon: FaInstagram },
  gmb:       { bg: '#4285F4',  borderColor: 'rgba(66,133,244,0.5)',   label: 'G',  icon: FaGoogle },
};

const TRACKS: { d: string }[] = [
  { d: 'M -60 200 Q 450 280 893 450' },
  { d: 'M -60 340 Q 400 380 893 450' },
  { d: 'M -60 490 Q 430 468 893 450' },
  { d: 'M 1440 160 Q 1150 310 893 450' },
  { d: 'M 1440 400 Q 1200 430 893 450' },
];

const COIN_CONFIGS: CoinConfig[] = [
  { id: 1,  platform: 'x',         trackIndex: 0, delay: 0.0 },
  { id: 2,  platform: 'linkedin',   trackIndex: 1, delay: 0.6 },
  { id: 3,  platform: 'facebook',   trackIndex: 2, delay: 1.2 },
  { id: 4,  platform: 'instagram',  trackIndex: 3, delay: 0.3 },
  { id: 5,  platform: 'gmb',        trackIndex: 4, delay: 0.9 },
  { id: 6,  platform: 'x',         trackIndex: 1, delay: 2.5 },
  { id: 7,  platform: 'linkedin',   trackIndex: 0, delay: 3.1 },
  { id: 8,  platform: 'facebook',   trackIndex: 4, delay: 1.8 },
  { id: 9,  platform: 'instagram',  trackIndex: 2, delay: 3.6 },
  { id: 10, platform: 'gmb',        trackIndex: 3, delay: 2.1 },
];

const REPULSION_RADIUS = 200;
const MAX_REPEL        = 72;
const SPRING_CONFIG    = { stiffness: 180, damping: 22, mass: 1 };

const TrackSystem: React.FC = () => {
  const trackOpacity    = 0.32;
  const trackHaloColor  = 'rgba(99,102,241,0.10)';
  const nodeColor       = '#818CF8';
  const nodeOpacity     = 0.5;
  const strokeColor     = '#6366F1';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="trkL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={strokeColor} stopOpacity="0" />
          <stop offset="25%"  stopColor={strokeColor} stopOpacity={trackOpacity} />
          <stop offset="65%"  stopColor={strokeColor} stopOpacity={trackOpacity * 0.75} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="trkR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor={strokeColor} stopOpacity="0" />
          <stop offset="25%"  stopColor={strokeColor} stopOpacity={trackOpacity * 0.9} />
          <stop offset="65%"  stopColor={strokeColor} stopOpacity={trackOpacity * 0.65} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
        <filter id="trkGlow" x="-20%" y="-100%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Left tracks */}
      {[
        { d: 'M -60 200 Q 450 280 893 450', g: 'trkL', o: 0.8 },
        { d: 'M -60 340 Q 400 380 893 450', g: 'trkL', o: 0.65 },
        { d: 'M -60 490 Q 430 468 893 450', g: 'trkL', o: 0.5 },
      ].map(({ d, g, o }, i) => (
        <g key={i} filter="url(#trkGlow)" opacity={o}>
          <path d={d} stroke={`url(#${g})`} strokeWidth="1.5" fill="none" />
          <path d={d} stroke={trackHaloColor} strokeWidth="9" fill="none" />
        </g>
      ))}

      {/* Right tracks */}
      {[
        { d: 'M 1440 160 Q 1150 310 893 450', g: 'trkR', o: 0.6 },
        { d: 'M 1440 400 Q 1200 430 893 450', g: 'trkR', o: 0.5 },
      ].map(({ d, g, o }, i) => (
        <g key={i} filter="url(#trkGlow)" opacity={o}>
          <path d={d} stroke={`url(#${g})`} strokeWidth="1.5" fill="none" />
          <path d={d} stroke={trackHaloColor} strokeWidth="9" fill="none" />
        </g>
      ))}

      {/* Exit track */}
      <g opacity={0.3}>
        <path d="M 893 450 Q 1150 500 1440 650" stroke={`url(#trkR)`} strokeWidth="1.2" fill="none" />
      </g>

      {/* Junction nodes */}
      {([
        [209, 256], [378, 322], [547, 376],
        [1073, 305], [1180, 428],
      ] as [number, number][]).map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2" fill={nodeColor} opacity={nodeOpacity} />
          <motion.circle
            cx={cx} cy={cy} r={5}
            fill="none" stroke={nodeColor} strokeWidth="0.5" opacity="0"
            animate={{ r: [5, 10, 5], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.55 }}
          />
        </g>
      ))}
    </svg>
  );
};

const AdsyncLogo: React.FC = () => {
  return (
    <div
      className="absolute hidden md:block md:left-[66%] md:top-[52%] md:-translate-x-1/2 md:-translate-y-1/2 scale-75 md:scale-100 transition-all duration-500"
      style={{
        zIndex: 5,
      }}
    >
      {/* Ambient glow — dark only */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '130%',
          paddingTop: '80%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -58%)',
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Card Wrapper with Hover Animation */}
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-2xl p-6 cursor-pointer flex items-center justify-center gap-4"
        style={{
          background: 'rgba(13,19,30,0.86)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Adsync Symbol */}
        <div style={{ width: 48, height: 48 }}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#2563EB" />
            <path d="M50 20 L75 75 L60 75 L50 48 L40 75 L25 75 Z" fill="white" />
            <polygon points="50,38 58,58 42,58" fill="#2563EB" />
          </svg>
        </div>

        {/* Adsync Text */}
        <div className="flex flex-col justify-center">
          <span 
            className="font-bold tracking-widest leading-none text-[22px]" 
            style={{ color: '#2563EB', fontFamily: 'Inter, sans-serif' }}
          >
            ADSYNC
          </span>
          <span 
            className="font-semibold tracking-widest leading-none mt-1.5 text-[11px]" 
            style={{ color: '#60A5FA', fontFamily: 'Inter, sans-serif' }}
          >
            MARKETING
          </span>
        </div>
      </motion.div>
    </div>
  );
};

const RepellableCoin: React.FC<{ config: CoinConfig; mouseRef: React.RefObject<MousePosition> }> = ({ config, mouseRef }) => {
  const coinRef = useRef<SVGGElement>(null);
  const repelX      = useSpring(0, SPRING_CONFIG);
  const repelY      = useSpring(0, SPRING_CONFIG);
  const repelRotate = useSpring(0, SPRING_CONFIG);
  const repelScale  = useSpring(1, { stiffness: 200, damping: 28 });
  const def      = COIN_DEFS[config.platform];
  const fill     = config.platform === 'instagram' ? 'url(#igGrad)' : def.bg;
  const duration = 4.5 + config.trackIndex * 0.28;

  useAnimationFrame(() => {
    if (!coinRef.current) return;
    const rect = coinRef.current.getBoundingClientRect();
    const coinCx = rect.left + rect.width  * 0.5;
    const coinCy = rect.top  + rect.height * 0.5;
    const dx     = coinCx - mouseRef.current.x;
    const dy     = coinCy - mouseRef.current.y;
    const dist   = Math.sqrt(dx * dx + dy * dy);

    if (dist < REPULSION_RADIUS && dist > 1) {
      const t = 1 - dist / REPULSION_RADIUS;
      repelX.set((dx / dist) * t * MAX_REPEL);
      repelY.set((dy / dist) * t * MAX_REPEL);
      repelRotate.set(-9 * t);
      repelScale.set(1 - 0.07 * t);
    } else {
      repelX.set(0);
      repelY.set(0);
      repelRotate.set(0);
      repelScale.set(1);
    }
  });

  return (
    <motion.g
      ref={coinRef}
      style={{ x: repelX, y: repelY, rotate: repelRotate, scale: repelScale }}
      filter="url(#coinShadow)"
    >
      <motion.g
        style={{ offsetPath: `path("${TRACKS[config.trackIndex].d}")`, offsetRotate: '0deg' }}
        animate={{ offsetDistance: ['0%', '97%'] }}
        transition={{ duration, delay: config.delay, repeat: Infinity, repeatDelay: 1.6, ease: [0.25, 0.1, 0.55, 1] }}
      >
        <circle cx="0" cy="0" r="17" fill={fill} />
        <circle cx="0" cy="0" r="17" fill="none" stroke={def.borderColor} strokeWidth="1.5" />
        <ellipse cx="-4" cy="-5.5" rx="6" ry="3.5" fill="white" opacity="0.12" transform="rotate(-28)" />
        {def.icon ? (
          <g transform="translate(-8, -8)" style={{ userSelect: 'none', pointerEvents: 'none' }}>
            <def.icon size={16} color="white" />
          </g>
        ) : (
          <text
            x="0" y="0" textAnchor="middle" dominantBaseline="central"
            fontSize={config.platform === 'gmb' ? '14' : '12'} fontWeight="800"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fill="white" opacity="0.95"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {def.label}
          </text>
        )}
      </motion.g>
    </motion.g>
  );
};

const SocialCoins: React.FC<{ mouseRef: React.RefObject<MousePosition> }> = ({ mouseRef }) => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <radialGradient id="igGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%"   stopColor="#f09433" />
        <stop offset="25%"  stopColor="#e6683c" />
        <stop offset="50%"  stopColor="#dc2743" />
        <stop offset="75%"  stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </radialGradient>
      <filter id="coinShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {COIN_CONFIGS.map(cfg => (
      <RepellableCoin key={cfg.id} config={cfg} mouseRef={mouseRef} />
    ))}
  </svg>
);

const STARFIELD_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i, x: 58 + Math.random() * 36, y: 8 + Math.random() * 82, size: 0.7 + Math.random() * 1.6,
  delay: Math.random() * 5, duration: 2.5 + Math.random() * 3.5, dy: 40 + Math.random() * 50,
  color: ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#94A3B8'][Math.floor(Math.random() * 5)],
}));

const DataStarfield: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {STARFIELD_PARTICLES.map(p => (
      <motion.div
        key={p.id} className="absolute rounded-full"
        style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 4}px ${p.color}55` }}
        animate={{ opacity: [0, 0.85, 0], scale: [0, 1.4, 0], y: [0, -p.dy] }}
        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
      />
    ))}
  </div>
);

const CursorGlow: React.FC<{ glowRef: React.RefObject<HTMLDivElement> }> = ({ glowRef }) => (
  <div
    ref={glowRef} className="pointer-events-none"
    style={{ position: 'fixed', inset: 0, zIndex: 2, transition: 'opacity 0.6s ease', willChange: 'background' }}
  />
);

const AnimatedScene: React.FC<{ mouseRef: React.RefObject<MousePosition>; glowRef: React.RefObject<HTMLDivElement>; isDark: boolean }> = ({ mouseRef, glowRef, isDark }) => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Dark obsidian base — only visible in dark mode */}
    {isDark && <div className="absolute inset-0 bg-[#090d16]" />}
    {/* Subtle indigo ambient glow */}
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-500"
      style={{ background: 'radial-gradient(ellipse 60% 50% at 66% 52%, rgba(99,102,241,0.07) 0%, transparent 70%)', opacity: isDark ? 1 : 0.3 }}
    />
    {/* Dot grid */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isDark ? 0.04 : 0.06 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dotgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="0.9" fill={isDark ? '#818CF8' : '#6366F1'} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
    <TrackSystem />
    <AdsyncLogo />
    <SocialCoins mouseRef={mouseRef} />
    <DataStarfield />
    {/* Dark vignette edge — only in dark mode */}
    {isDark && (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 38%, rgba(9,13,22,0.85) 100%)' }}
      />
    )}
    <CursorGlow glowRef={glowRef} />
  </div>
);

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme ? savedTheme === 'dark' : false; // Default to light
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    
    // Apply/remove 'dark' class on <html> — required for Tailwind darkMode: 'class'
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const mouseRef = useRef<MousePosition>({ x: -9999, y: -9999 });
  const glowRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(0,229,255,0.065) 0%, rgba(99,102,241,0.03) 200px, transparent 420px)`;
        glowRef.current.style.opacity = '1';
      }
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      if (glowRef.current) glowRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <ThemeCtx.Provider value={{ isDark, toggleTheme }}>
      <div className={`relative w-full min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-[#090d16] text-white' : 'bg-[#e8edf2] text-slate-900'}`}>
        <div className="fixed inset-0 z-0">
          <AnimatedScene mouseRef={mouseRef} glowRef={glowRef} isDark={isDark} />
        </div>
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          {children}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
};
