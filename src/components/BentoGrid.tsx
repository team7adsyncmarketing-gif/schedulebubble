import React, { useRef, MouseEvent, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA GENERATION
// ─────────────────────────────────────────────────────────────────────────────
const generateAnalyticsData = () => {
  const data = [];
  const now = new Date();
  let baseImpressions = 5000;
  let baseClicks = 300;
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Add some realistic noise/trends
    baseImpressions += Math.floor((Math.random() - 0.4) * 800);
    baseClicks += Math.floor((Math.random() - 0.4) * 50);
    
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: Math.max(1000, baseImpressions),
      clicks: Math.max(50, baseClicks),
      engagementRate: (Math.random() * 4 + 2).toFixed(1), // 2.0 to 6.0 %
    });
  }
  return data;
};

const mockData = generateAnalyticsData();

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP COMPONENT FOR RECHARTS (THEME AWARE)
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xl flex flex-col gap-2">
        <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{entry.name}:</span>
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {entry.name === 'Engagement Rate' ? `${entry.value}%` : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// BENTO CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface BentoCardProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

const BentoCard: React.FC<BentoCardProps> = ({ title, description, className = "", children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate percentage offset from center (-0.5 to 0.5)
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={itemVariants}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative group rounded-3xl p-8 flex flex-col justify-between overflow-hidden
        bg-white dark:bg-neutral-900 
        border border-neutral-200 dark:border-neutral-800
        hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5
        transition-all duration-300 ease-out
        ${className}`}
    >
      {/* Subtle dynamic border glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ring-1 ring-inset ring-indigo-500/20 dark:ring-indigo-500/30" />
      
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400" />
      
      <div className="relative z-10 w-full flex-grow flex flex-col" style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>

      <div className="relative z-20 mt-8 pointer-events-none" style={{ transform: "translateZ(30px)" }}>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE BENTO GRID
// ─────────────────────────────────────────────────────────────────────────────
export const InteractiveBentoGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8" ref={containerRef}>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(380px,auto)]"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.15 } }
        }}
      >
        
        {/* Large Featured Card: Impressions Over Time (Area Chart) */}
        <BentoCard
          title="Growth & Impressions"
          description="Watch your reach expand with real-time interactive analytics. Scrub across the timeline to view daily impression volume and growth trends."
          className="md:col-span-2 md:row-span-2"
        >
          <div className="w-full h-full min-h-[300px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={12}
                  className="text-xs fill-neutral-500 dark:fill-neutral-400 font-medium"
                  minTickGap={30}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={12}
                  className="text-xs fill-neutral-500 dark:fill-neutral-400 font-medium"
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="impressions" 
                  name="Impressions"
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorImpressions)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Regular Card: Engagement Rate (Line Chart) */}
        <BentoCard
          title="Engagement Rate"
          description="Monitor how actively your audience interacts with your published content."
        >
          <div className="w-full h-48 -ml-4 mt-auto">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-100 dark:stroke-neutral-800/50" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Line 
                    type="monotone" 
                    dataKey="engagementRate" 
                    name="Engagement Rate"
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: '#a855f7', strokeWidth: 0 }}
                  />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Regular Card: Click-Throughs (Bar Chart) */}
        <BentoCard
          title="Click-Through Volume"
          description="Daily link clicks and profile visits driven by your active campaigns."
        >
           <div className="w-full h-48 -ml-4 mt-auto">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.slice(-14)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-100 dark:stroke-neutral-800/50" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                  <Bar 
                    dataKey="clicks" 
                    name="Clicks"
                    fill="#14b8a6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Wide Card: Combined Overview */}
        <BentoCard
          title="Aggregated Performance Summary"
          description="A holistic view of your top metrics side-by-side over the last two weeks."
          className="md:col-span-2"
        >
          <div className="w-full h-64 -ml-4 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.slice(-14)} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                  className="text-xs fill-neutral-500 dark:fill-neutral-400"
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                  className="text-xs fill-neutral-500 dark:fill-neutral-400"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#14b8a6', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  name="Clicks"
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  fill="url(#colorClicks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

      </motion.div>
    </div>
  );
};

export default InteractiveBentoGrid;
