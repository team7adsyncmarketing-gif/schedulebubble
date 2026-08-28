import React, { useRef } from 'react';
import { ContentComposer } from '../components/ContentComposer';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ScheduleCalendar } from '../components/ScheduleCalendar';
import IntegrationsPanel from '../components/IntegrationsPanel';
import { MediaLibrary } from '../components/MediaLibrary';
import { TrendingUp, Layers, CalendarRange, Link2, Image } from 'lucide-react';

// ── Dot-grid SVG substrate ────────────────────────────────────────────────────
const DotGrid = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ opacity: 0.04 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="dash-dotgrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="0.9" fill="#818CF8" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dash-dotgrid)" />
  </svg>
);

// ── Ambient corner glows ──────────────────────────────────────────────────────
const AmbientGlows = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)',
      }}
    />
    <div
      className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 60%)',
      }}
    />
  </div>
);

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 mb-5">
    <div className="text-indigo-500 dark:text-indigo-400">{icon}</div>
    <span className="text-xs font-bold tracking-widest uppercase text-slate-500">{label}</span>
    <div className="flex-grow h-px bg-slate-300 dark:bg-slate-800/80 ml-2" />
  </div>
);

// ── Dashboard page ────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(800px circle at ${e.clientX}px ${e.clientY}px, rgba(99,102,241,0.13), transparent 42%)`;
    }
  };

  return (
    <div
      className="relative flex-grow flex flex-col"
      onMouseMove={handleMouseMove}
    >
      {/* Background layers */}
      <DotGrid />
      <AmbientGlows />
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-0"
        style={{ willChange: 'background' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 space-y-16">

        {/* Page heading */}
        <div className="space-y-1 pt-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Welcome back! Manage your social presence from one beautiful hub.
          </p>
        </div>

        {/* Analytics */}
        <section>
          <SectionLabel icon={<TrendingUp className="w-4 h-4" />} label="Analytics Overview" />
          <AnalyticsDashboard />
        </section>

        {/* Composer */}
        <section>
          <SectionLabel icon={<Layers className="w-4 h-4" />} label="Create & Publish" />
          <ContentComposer />
        </section>

        {/* Calendar */}
        <section>
          <SectionLabel icon={<CalendarRange className="w-4 h-4" />} label="Content Calendar" />
          <ScheduleCalendar />
        </section>

        {/* Media Library */}
        <section>
          <SectionLabel icon={<Image className="w-4 h-4" />} label="Media Vault" />
          <MediaLibrary />
        </section>

        {/* Integrations */}
        <section className="pb-24">
          <SectionLabel icon={<Link2 className="w-4 h-4" />} label="Social Integrations" />
          <IntegrationsPanel />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
