import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Rocket, Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Monitor scroll positioning to update styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Monitor dark mode preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  // Stop pulsing "Get started" button after 2.5s
  useEffect(() => {
    const pulseTimer = setTimeout(() => {
      setPulse(false);
    }, 2500);
    return () => clearTimeout(pulseTimer);
  }, []);

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 shadow-sm border-b border-gray-200 dark:border-gray-800 backdrop-blur-md py-3'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Left: Branding Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#185FA5] text-white shadow-md group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-[#185FA5] to-gray-900 dark:from-white dark:via-[#60A5FA] dark:to-white bg-clip-text text-transparent">
              LaunchPad
            </span>
          </Link>

          {/* Center/Right Navigation links for Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/prep-hub"
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'text-[#185FA5] dark:text-[#60A5FA]' 
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              Prep Hub
            </NavLink>
            <a
              href="/prep-hub#blog"
              onClick={(e) => {
                // If on prep-hub already, let the hash change naturally.
                if (window.location.pathname !== '/prep-hub') {
                  e.preventDefault();
                  navigate('/prep-hub#blog');
                }
              }}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Blog
            </a>
          </div>

          {/* Right Action buttons for Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-border-default hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-secondary hover:text-text-primary"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-300 ${
                    pulse ? 'animate-pulse scale-[1.03] ring-4 ring-[#185FA5]/30' : ''
                  }`}
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Right: Mobile toggles */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-border-default hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-secondary"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg border border-border-default hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-text-secondary"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-2 pb-6 space-y-3">
          <NavLink
            to="/prep-hub"
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-base font-semibold ${
                isActive 
                  ? 'bg-primary-light text-primary dark:bg-gray-800 dark:text-white' 
                  : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-text-primary'
              }`
            }
          >
            Prep Hub
          </NavLink>
          <a
            href="/prep-hub#blog"
            onClick={(e) => {
              setIsMobileMenuOpen(false);
              if (window.location.pathname !== '/prep-hub') {
                e.preventDefault();
                navigate('/prep-hub#blog');
              }
            }}
            className="block px-3 py-2.5 rounded-lg text-base font-semibold text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-text-primary"
          >
            Blog
          </a>
          <div className="border-t border-gray-200 dark:border-gray-800 my-2 pt-3 flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 text-base font-semibold text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 bg-[#185FA5] hover:bg-[#15508a] text-white text-base font-semibold rounded-lg shadow-sm"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
