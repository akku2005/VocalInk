import { Menu, Search, Bell, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const Header = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className={`fixed top-0 z-50 glassmorphism border-b border-border theme-transition transition-all duration-300 ${
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search blogs, series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background/50 backdrop-blur-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent theme-transition placeholder:text-text-secondary"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          
          <button className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200 relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full animate-pulse"></span>
          </button>

          <button className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-all duration-200" aria-label="User menu">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 