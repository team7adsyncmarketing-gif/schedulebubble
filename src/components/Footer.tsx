import React from 'react';
import { useTheme } from './layout/AppLayout';
import { Hexagon } from 'lucide-react';
export const Footer: React.FC = () => {
  const { isDark } = useTheme();
  
  // Theme Inversion Rule:
  // If app theme is Dark Mode, render footer in Light Mode styling
  // If app theme is Light Mode, render footer in Dark Mode styling
  
  return (
    <footer className={`mt-auto border-t py-8 transition-colors duration-500 z-10 relative ${
      isDark 
        ? 'bg-slate-50 border-slate-200 text-slate-600' // Inverted to Light Mode
        : 'bg-[#0f172a] border-slate-800 text-slate-300' // Inverted to Dark Mode
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
            <Hexagon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-widest text-lg hidden sm:block">ADSYNC</span>
        </div>
        
        <div className="text-sm font-medium text-center">
          &copy; 2026 AdSync Marketing. All rights reserved.
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All Systems Operational</span>
          </div>
          <a href="#" className="hover:text-indigo-500 transition-colors">Documentation</a>
          <div className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-inner">
            Sandbox Environment
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
