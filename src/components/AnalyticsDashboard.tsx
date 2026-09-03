import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, CalendarDays, FileText, Clock, Zap, Sparkles, Copy, CalendarPlus, Check, Hash } from 'lucide-react';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaTelegram } from 'react-icons/fa6';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledAt: string;
}

interface AnalyticsData {
  publishedCount: number;
  scheduledCount: number;
  totalPosts: number;
  successRate: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  glowColor: string;
}

const BaseCardClass = "relative rounded-3xl p-6 overflow-hidden bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-sm shadow-gray-200/50 dark:shadow-none transition-all duration-300";

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, glowColor }) => (
  <div className={`group ${BaseCardClass} hover:scale-[1.02] hover:border-gray-300 dark:hover:border-gray-700/80 hover:shadow-lg`}>
    <div
      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ boxShadow: `inset 0 0 0 1px ${glowColor}`, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${glowColor}18 0%, transparent 70%)` }}
    />
    <div className="relative z-10 flex items-center gap-4">
      <div className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold tracking-widest uppercase">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  </div>
);

const NextUpCard = ({ nextPost }: { nextPost?: ScheduledPost }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!nextPost) return;
    const updateTimer = () => {
      const now = new Date();
      const scheduled = new Date(nextPost.scheduledAt);
      const diffMs = scheduled.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeLeft('Publishing soon');
        return;
      }
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`Publishing in ${hrs}h ${mins}m`);
    };
    
    updateTimer();
    const int = setInterval(updateTimer, 60000);
    return () => clearInterval(int);
  }, [nextPost]);

  const platformIcons: Record<string, any> = {
    facebook: FaFacebook,
    instagram: FaInstagram,
    linkedin: FaLinkedin,
    twitter: FaXTwitter,
    telegram: FaTelegram
  };

  const platformColors: Record<string, string> = {
    facebook: 'bg-blue-100/80 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    instagram: 'bg-pink-100/80 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/20',
    linkedin: 'bg-sky-100/80 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
    twitter: 'bg-gray-100/80 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
    telegram: 'bg-sky-100/80 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
  };

  if (!nextPost) {
    return (
      <div className={`${BaseCardClass} md:col-span-2 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center justify-center min-h-[200px]`}>
        <Clock className="w-10 h-10 text-slate-400 mb-3 opacity-50" />
        <h3 className="text-slate-500 dark:text-slate-400 font-bold mb-1">Queue is Empty</h3>
        <p className="text-sm text-slate-400">You don't have any posts scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className={`${BaseCardClass} md:col-span-2 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" /> Next Up in Queue
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {timeLeft}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col justify-center">
        <p className="text-gray-900 dark:text-gray-100 text-lg font-medium leading-snug line-clamp-2 mb-3">
          "{nextPost.content}"
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {(nextPost.platforms || []).map((p: string) => {
            const Icon = platformIcons[p.toLowerCase()] || Activity;
            const colorClass = platformColors[p.toLowerCase()] || 'bg-gray-100 dark:bg-gray-800 text-gray-500';
            return (
              <span key={p} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${colorClass}`}>
                <Icon className="w-3 h-3" /> <span className="capitalize">{p}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-5 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
  );
};

const ChannelStatusCard = ({ connectedAccounts }: { connectedAccounts: string[] }) => {
  const platforms = [
    { name: 'Instagram', icon: FaInstagram, color: 'text-pink-500' },
    { name: 'Facebook', icon: FaFacebook, color: 'text-blue-500' },
    { name: 'Telegram', icon: FaTelegram, color: 'text-sky-500' },
    { name: 'X (Twitter)', icon: FaXTwitter, color: 'text-gray-400 dark:text-gray-500' },
    { name: 'LinkedIn', icon: FaLinkedin, color: 'text-gray-400 dark:text-gray-500' },
  ];

  return (
    <div className={`${BaseCardClass} flex flex-col`}>
      <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-amber-500" /> API Health
      </h3>
      <div className="grid grid-cols-2 gap-3 flex-grow">
        {platforms.map((p, i) => {
          const isActive = connectedAccounts.includes(p.name.split(' ')[0].toLowerCase());
          return (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${isActive ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50'}`}>
              <p.icon className={`w-5 h-5 ${p.color} ${!isActive ? 'opacity-40 grayscale' : ''}`} />
              <div className="flex-grow">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">{p.name}</p>
              </div>
              {isActive ? (
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BestTimeCard = ({ onAutoSchedule }: { onAutoSchedule: () => void }) => (
  <div className={`${BaseCardClass} md:row-span-2 flex flex-col`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-500" /> Peak Engagement
      </h3>
    </div>
    
    <div className="flex-grow flex flex-col justify-center gap-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 dark:to-gray-900/90 z-10 pointer-events-none" style={{ top: '60%' }} />
      
      <div className="flex items-end justify-between h-40 gap-1.5 px-2">
        {[40, 65, 30, 85, 100, 45, 20].map((h, i) => (
          <div key={i} className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-md relative group">
            <div 
              className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${h === 100 ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-indigo-300 dark:bg-indigo-500/40'}`} 
              style={{ height: `${h}%` }}
            >
              {h === 100 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap">
                  6:45 PM
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-semibold text-gray-400 px-2 uppercase">
        <span>M</span><span>T</span><span>W</span><span>T</span><span className="text-indigo-500">F</span><span>S</span><span>S</span>
      </div>
    </div>

    <div className="mt-8 z-20">
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
        <p className="text-indigo-900 dark:text-indigo-200 text-sm font-semibold mb-1">Today's Sweet Spot</p>
        <p className="text-indigo-600 dark:text-indigo-400 text-2xl font-black">6:45 PM <span className="text-sm font-medium">EST</span></p>
      </div>
      <button 
        onClick={onAutoSchedule}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
      >
        <CalendarPlus className="w-4 h-4" /> Auto-Schedule to Slot
      </button>
    </div>
  </div>
);

const VelocityCard = () => (
  <div className={`${BaseCardClass} flex flex-col items-center justify-center text-center`}>
    <h3 className="text-gray-900 dark:text-white font-bold absolute top-6 left-6 flex items-center gap-2">
      <FileText className="w-5 h-5 text-fuchsia-500" /> Bulk Velocity
    </h3>
    
    <div className="relative w-32 h-32 mt-6 mb-2">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-100 dark:text-gray-800"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="text-fuchsia-500"
          strokeDasharray="94, 100"
          strokeWidth="3"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">142</span>
        <span className="text-xs font-bold text-gray-400">/ 150</span>
      </div>
    </div>
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">Scheduled this week via Bulk CSV</p>
  </div>
);

const SmartCaptionCard = () => {
  const [copied, setCopied] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const captionText = "Ready to take your productivity to the next level? Our new automation features save you 10+ hours a week. Drop a 🚀 below if you're ready to scale!";
  const hashtags = ['GrowthHacking', 'SocialMediaTools', 'Productivity', 'SaaS'];

  const handleCopy = () => {
    const fullText = `${captionText}\n\n${hashtags.map(t => `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePolish = () => {
    setPolishing(true);
    setTimeout(() => setPolishing(false), 800);
  };

  return (
    <div className={`${BaseCardClass} md:col-span-2 flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" /> AI Caption Assist
        </h3>
        <button 
          onClick={handlePolish}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors"
        >
          <Sparkles className={`w-3.5 h-3.5 ${polishing ? 'animate-spin text-purple-500' : ''}`} /> 
          {polishing ? 'Polishing...' : 'One-click Polish'}
        </button>
      </div>
      
      <div className={`flex-grow p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 relative group transition-all duration-300 ${polishing ? 'opacity-50 blur-[1px]' : ''}`}>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          {captionText}
        </p>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, i) => (
            <span key={i} className="px-2.5 py-1 rounded-md bg-purple-100/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-medium flex items-center gap-1">
              <Hash className="w-3 h-3 opacity-50" /> {tag}
            </span>
          ))}
        </div>
        
        <button 
          onClick={handleCopy}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [queuedPosts, setQueuedPosts] = useState<ScheduledPost[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const [analyticsRes, queueRes, accountsRes] = await Promise.all([
          fetch('https://schedulebubble.onrender.com/api/analytics/summary', { headers, credentials: 'include' }),
          fetch('https://schedulebubble.onrender.com/api/posts/queue', { headers, credentials: 'include' }),
          fetch('https://schedulebubble.onrender.com/api/oauth/accounts', { headers, credentials: 'include' })
        ]);
        
        if (analyticsRes.ok) {
          const result = await analyticsRes.json().catch(() => null);
          if (result) setData(result);
        }
        
        if (queueRes.ok) {
          const queue = await queueRes.json().catch(() => null);
          if (Array.isArray(queue)) {
            const mappedQueue = queue.map(job => ({
              id: job.id,
              content: job.post?.content || '',
              platforms: [job.platform],
              scheduledAt: job.scheduledFor
            }));
            const sorted = mappedQueue.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
            setQueuedPosts(sorted);
          }
        }
        
        if (accountsRes.ok) {
           const accs = await accountsRes.json().catch(() => null);
           if (Array.isArray(accs)) {
             setConnectedAccounts(accs.map(a => a.platform?.toLowerCase() || a.provider?.toLowerCase()));
           }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAutoSchedule = () => {
    const composer = document.getElementById('composer-section');
    if (composer) {
      composer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-gray-200 dark:bg-gray-800/40 animate-pulse border border-gray-300 dark:border-gray-800/60" />
        ))}
        <div className="h-48 md:col-span-2 rounded-3xl bg-gray-200 dark:bg-gray-800/40 animate-pulse border border-gray-300 dark:border-gray-800/60" />
        <div className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-800/40 animate-pulse border border-gray-300 dark:border-gray-800/60" />
        <div className="h-[400px] md:row-span-2 rounded-3xl bg-gray-200 dark:bg-gray-800/40 animate-pulse border border-gray-300 dark:border-gray-800/60" />
      </div>
    );
  }

  const stats = data || { publishedCount: 0, scheduledCount: queuedPosts.length, totalPosts: 0, successRate: '0%' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {/* Row 1: Core Metrics */}
      <StatCard
        icon={<Activity className="w-6 h-6 text-indigo-400" />}
        iconBg="bg-indigo-500/10 border-indigo-500/20"
        label="Published Jobs"
        value={stats.publishedCount || 0}
        glowColor="rgba(99,102,241,1)"
      />
      <StatCard
        icon={<CalendarDays className="w-6 h-6 text-emerald-400" />}
        iconBg="bg-emerald-500/10 border-emerald-500/20"
        label="Scheduled"
        value={stats.scheduledCount || queuedPosts.length}
        glowColor="rgba(52,211,153,1)"
      />
      <StatCard
        icon={<BarChart2 className="w-6 h-6 text-fuchsia-400" />}
        iconBg="bg-fuchsia-500/10 border-fuchsia-500/20"
        label="Success Rate"
        value={stats.successRate || '0%'}
        glowColor="rgba(217,70,239,1)"
      />
      <StatCard
        icon={<FileText className="w-6 h-6 text-sky-400" />}
        iconBg="bg-sky-500/10 border-sky-500/20"
        label="Total Posts"
        value={stats.totalPosts}
        glowColor="rgba(56,189,248,1)"
      />

      {/* Row 2 */}
      <NextUpCard nextPost={queuedPosts[0]} />
      <ChannelStatusCard connectedAccounts={connectedAccounts} />
      <BestTimeCard onAutoSchedule={handleAutoSchedule} />

      {/* Row 3 */}
      <SmartCaptionCard />
      <VelocityCard />
    </div>
  );
};
