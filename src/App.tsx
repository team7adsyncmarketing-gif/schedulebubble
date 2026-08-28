import { useState, useEffect, useRef } from 'react';
import './index.css';
import HeroSection from './HeroSection';
import Dashboard from './pages/Dashboard';
import { Hexagon, LogOut, User, Sun, Moon, Menu, X } from 'lucide-react';
import { AppLayout, useTheme } from './components/layout/AppLayout';
import Queues from './pages/Queues';
import Analytics from './pages/Analytics';
import ProfileModal from './components/ProfileModal';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import InteractiveBentoGrid from './components/BentoGrid';

// ─────────────────────────────────────────────────────────────────────────────
// NAV LINK PILL
// ─────────────────────────────────────────────────────────────────────────────
const NavPill: React.FC<{ label: string; active?: boolean; onClick?: () => void }> = ({
  label,
  active = false,
  onClick,
}) => {
  const { isDark } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:scale-[1.04] active:scale-95 ${active
          ? 'bg-indigo-600/20 text-indigo-500 dark:text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          : isDark
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
        }`}
    >
      {label}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE in the persistent top navbar
// ─────────────────────────────────────────────────────────────────────────────
const NavThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${isDark
          ? 'bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-yellow-300'
          : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm'
        }`}
    >
      {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queues' | 'analytics'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const response = await fetch('https://schedulebubble.onrender.com/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token invalid or expired
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    document.cookie
      .split(';')
      .forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AppLayout>
      {/* ── Persistent Navbar ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-2xl border-b transition-all duration-300 border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 bg-white/80 dark:bg-[rgba(9,13,22,0.82)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo / Home toggle */}
            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-3 cursor-pointer group focus:outline-none"
              aria-label="Go to home"
            >
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-300 shadow-[0_0_18px_rgba(79,70,229,0.45)]">
                <Hexagon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-500 group-hover:to-indigo-500 transition-all duration-300">
                AdSync Marketing
              </span>
            </button>

            {/* Right side controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Nav links */}
                <div className="hidden md:flex items-center gap-1">
                  <NavPill label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <NavPill label="Queues" active={activeTab === 'queues'} onClick={() => setActiveTab('queues')} />
                  <NavPill label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                </div>

                {/* Theme toggle */}
                <NavThemeToggle />

                {/* Profile chip */}
                <div
                  className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 shadow-inner cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Open Profile Settings"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-1">
                    {user?.name || 'User'}
                  </span>
                </div>

                {/* Logout (desktop only) */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800/70 hover:bg-red-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavThemeToggle />
                <button
                  onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                  className="hidden sm:flex px-4 py-1.5 rounded-full text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  Start For Free
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile dropdown (authenticated) */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/60 dark:border-white/[0.06] bg-white/95 dark:bg-[rgba(9,13,22,0.97)] px-4 pb-4 pt-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <button onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Dashboard</button>
              <button onClick={() => { setActiveTab('queues'); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'queues' ? 'bg-indigo-600/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Queues</button>
              <button onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-600/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Analytics</button>
              <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="flex-grow flex flex-col relative z-10">
        {!isAuthenticated ? (
          <div className="flex-grow flex flex-col animate-in fade-in zoom-in-95 duration-500">
            <HeroSection onOpenAuth={(mode, email) => { setAuthMode(mode); setAuthEmail(email || ''); setIsAuthModalOpen(true); }} />
            <InteractiveBentoGrid />
          </div>
        ) : (
          <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'queues' && <Queues />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        )}
        <Footer />
      </main>

      {isAuthenticated && (
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          user={user} 
          onUserUpdate={(updatedUser) => setUser(updatedUser)} 
          onLogout={() => {
            setIsProfileModalOpen(false);
            handleLogout();
          }} 
        />
      )}

      {!isAuthenticated && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authMode}
          initialEmail={authEmail}
          isDark={true} 
          onSuccess={() => window.location.reload()} 
        />
      )}
    </AppLayout>
  );
}

export default App;
