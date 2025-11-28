import React from 'react';
import { LayoutDashboard, Monitor, Printer, Box, PlayCircle, BarChart2, Download, Users, Settings, HelpCircle, User, Clapperboard } from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItemClass = (active: boolean) => 
    `p-3 mb-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${active ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`;

  // Custom Logo Component matching the user's image
  const CustomLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L12 12L6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12V20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" fill="white" />
      <circle cx="18" cy="6" r="3" fill="white" />
      <circle cx="6" cy="6" r="3" fill="white" />
      <circle cx="12" cy="20" r="3" fill="white" />
    </svg>
  );

  return (
    <div className="w-16 bg-[#1e1f22] flex flex-col items-center py-4 border-r border-gray-800 h-screen sticky top-0">
      {/* Logo Placeholder */}
      <div className="mb-8 p-2 bg-cyan-500 rounded-lg text-white shadow-lg shadow-cyan-900/50">
        <CustomLogo />
      </div>

      <nav className="flex-1 w-full px-2">
        <div className={navItemClass(currentView === 'DASHBOARD')} onClick={() => onViewChange('DASHBOARD')}>
          <LayoutDashboard size={20} />
        </div>
        <div className={navItemClass(currentView === 'DEVICES')} onClick={() => onViewChange('DEVICES')}>
          <Monitor size={20} />
        </div>
        <div className={navItemClass(currentView === 'VEO_STUDIO')} onClick={() => onViewChange('VEO_STUDIO')} title="Veo Studio">
          <Clapperboard size={20} />
        </div>
        <div className={navItemClass(false)}>
          <Printer size={20} />
        </div>
        <div className={navItemClass(false)}>
          <Box size={20} />
        </div>
        <div className={navItemClass(false)}>
          <PlayCircle size={20} />
        </div>
        <div className={navItemClass(false)}>
          <BarChart2 size={20} />
        </div>
        <div className={navItemClass(false)}>
          <Download size={20} />
        </div>
        <div className={navItemClass(false)}>
          <Users size={20} />
        </div>
        <div className={navItemClass(false)}>
          <Settings size={20} />
        </div>
      </nav>

      <div className="w-full px-2 mt-auto">
        <div className={navItemClass(false)}>
          <HelpCircle size={20} />
        </div>
        <div className={navItemClass(false)}>
          <User size={20} />
        </div>
        <div className="text-[10px] text-gray-500 text-center mt-2 font-mono">
          v4.0.1
        </div>
      </div>
    </div>
  );
};

export default Sidebar;