import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, CalendarDays, FileText } from 'lucide-react';

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

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, glowColor }) => (
  <div
    className="group relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-md dark:shadow-2xl transition-all duration-300 cursor-default hover:scale-[1.02] hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-lg overflow-hidden bg-white/80 dark:bg-[rgba(15,20,35,0.6)]"
  >
    {/* Neon hover glow */}
    <div
      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ boxShadow: `inset 0 0 0 1px ${glowColor}`, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${glowColor}18 0%, transparent 70%)` }}
    />

    <div className="relative z-10 flex items-center gap-4">
      <div className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-widest uppercase">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  </div>
);

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://schedulebubble.onrender.com/api/analytics/summary', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/40 animate-pulse border border-slate-300 dark:border-slate-800/60" />
        ))}
      </div>
    );
  }

  const stats = data || { totalReach: 0, scheduledCount: 0, totalPosts: 0, engagementRate: '0%' };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
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
        value={stats.scheduledCount}
        glowColor="rgba(52,211,153,1)"
      />
      <StatCard
        icon={<BarChart2 className="w-6 h-6 text-fuchsia-400" />}
        iconBg="bg-fuchsia-500/10 border-fuchsia-500/20"
        label="Success Rate"
        value={stats.successRate || '100%'}
        glowColor="rgba(217,70,239,1)"
      />
      <StatCard
        icon={<FileText className="w-6 h-6 text-sky-400" />}
        iconBg="bg-sky-500/10 border-sky-500/20"
        label="Total Posts"
        value={stats.totalPosts}
        glowColor="rgba(56,189,248,1)"
      />
    </div>
  );
};
