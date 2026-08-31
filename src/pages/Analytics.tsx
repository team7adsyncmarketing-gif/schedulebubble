import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Activity, Share2, TrendingUp } from 'lucide-react';

const COLORS_DARK = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const COLORS_LIGHT = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed'];

import { useTheme } from '../components/layout/AppLayout';

export default function Analytics() {
  const { isDark } = useTheme();
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;
  const [data, setData] = useState<{
    platformBreakdown: { name: string, value: number }[],
    timeline: { date: string, posts: number }[],
    successRate: number
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('https://schedulebubble-zjof.onrender.com/api/analytics/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-center py-20 animate-pulse">Loading Analytics...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Track your publishing performance and channel growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex items-center gap-4 transition-colors">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Publications</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {data?.timeline.reduce((acc, curr) => acc + curr.posts, 0) || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex items-center gap-4 transition-colors">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Success Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{data?.successRate}%</h3>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex items-center gap-4 transition-colors">
          <div className="w-14 h-14 rounded-full bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center border border-cyan-100 dark:border-cyan-500/20">
            <Share2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Channels</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {data?.platformBreakdown.filter(p => p.name !== 'None').length || 0}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg min-h-[400px] transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Publishing Timeline (Last 30 Days)</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                />
                <Line type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg min-h-[400px] flex flex-col transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Platform Breakdown</h3>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.platformBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(data?.platformBreakdown || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke={isDark ? '#0f172a' : '#ffffff'} 
                      strokeWidth={3}
                      style={{ filter: `drop-shadow(0px 4px 6px ${COLORS[index % COLORS.length]}40)` }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', color: isDark ? '#94a3b8' : '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
