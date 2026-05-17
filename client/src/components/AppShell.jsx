import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAutomationStore } from '../store/automationStore';
import { 
  Rocket, LayoutDashboard, Sliders, Briefcase, 
  BookOpen, Bookmark, User, Settings, Sun, Moon, Menu, X, Shield, LogOut
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, badge }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 mb-1 text-sm font-medium transition-colors border-l-4 ${
          isActive
            ? 'border-primary text-primary bg-primary-light dark:bg-primary-dark/20'
            : 'border-transparent text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
        }`
      }
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-3" />
          {label}
        </div>
        {badge}
      </div>
    </NavLink>
  );
};

export const AppShell = () => {
  const { user } = useAuthStore();
  const { config } = useAutomationStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="flex h-screen bg-bg-body overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border-default transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border-default">
            <div className="flex items-center text-primary">
              <Rocket className="w-6 h-6 mr-2" />
              <span className="text-xl font-bold">LaunchPad</span>
            </div>
            <button className="lg:hidden text-text-secondary" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
            <div>
              <p className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Main</p>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem 
                to="/control-panel" 
                icon={Sliders} 
                label="Control Panel" 
                badge={config?.active && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              />
              <NavItem to="/applications" icon={Briefcase} label="Applications" />
            </div>
            <div>
              <p className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Learn</p>
              <NavItem to="/prep-hub" icon={BookOpen} label="Prep Hub" />
              <NavItem to="/saved" icon={Bookmark} label="Saved" />
            </div>
            <div>
              <p className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Account</p>
              <NavItem to="/profile" icon={User} label="My Profile" />
              <NavItem to="/settings" icon={Settings} label="Settings" />
            </div>
            {user?.role === 'admin' && (
              <div>
                <hr className="mx-4 my-2 border-border-default" />
                <p className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Admin</p>
                <NavItem to="/admin" icon={Shield} label="Admin Panel" />
              </div>
            )}
          </nav>

          {/* User Pill */}
          <div className="p-4 border-t border-border-default">
            <div className="flex flex-col gap-3">
              <div className="flex items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm shrink-0">
                  {initials}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                  <p className="text-xs text-primary font-medium">Free plan</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  useAuthStore.getState().logout();
                }}
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 border-b border-border-default bg-surface lg:px-8">
          <div className="flex items-center">
            <button className="mr-4 lg:hidden text-text-secondary" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-text-primary capitalize">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-bg-body p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
