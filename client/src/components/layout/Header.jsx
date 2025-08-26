import { Menu, Search, Bell, Sun, Moon, User, Plus, BookOpen, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`fixed top-0 z-[9999] glassmorphism border-b border-border theme-transition transition-all duration-300 ${
      sidebarCollapsed ? 'left-0 lg:left-16 right-0' : 'left-0 lg:left-64 right-0'
    }`}>
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center Search */}
        <div className="flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search blogs, series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200 text-gray-900 dark:text-white"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Create New Post Button */}
              <Link
                to="/create-blog"
                className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200 text-gray-900 dark:text-white"
                aria-label="Create new post"
              >
                <Plus className="w-5 h-5" />
              </Link>
              
              <Link
                to="/notifications"
                className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200 relative text-gray-900 dark:text-white"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200 flex items-center gap-2 text-gray-900 dark:text-white"
                  aria-label="User menu"
                >
                  <User className="w-5 h-5" />
                  {user && <span className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName || user.name}</span>}
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        to="/profile/me"
                        className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-primary-50 dark:hover:bg-white/10"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/analytics"
                        className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-primary-50 dark:hover:bg-white/10"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <BookOpen className="w-4 h-4 mr-3" />
                        Analytics
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-primary-50 dark:hover:bg-white/10"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-error/10"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Guest Actions */}
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 