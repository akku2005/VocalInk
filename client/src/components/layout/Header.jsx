import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Plus,
  BookOpen,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchExpanded(false);
    }
  };

  return (
    <header
      className={`fixed top-0 z-[9999] glassmorphism border-b border-border theme-transition transition-all duration-300 ${
        sidebarCollapsed
          ? "left-0 lg:left-16 right-0"
          : "left-0 lg:left-64 right-0"
      }`}
    >
      <div className="flex justify-between items-center h-14 sm:h-16 px-3 sm:px-4 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-white/10 transition-colors lg:hidden cursor-pointer touch-target"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center Search - Desktop */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4 lg:mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--light-text-color)]" />
            <input
              type="text"
              placeholder="Search blogs, series..."
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full pl-10 pr-10 py-2 glassmorphism backdrop-blur-sm 
              rounded-lg appearance-none placeholder:text-[var(--light-text-color)]
              text-[var(--text-color)] focus:outline-none focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)] cursor-pointer touch-target"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {searchExpanded && (
          <div className="fixed inset-0 bg-black/50 z-[10000] sm:hidden">
            <div className="bg-[var(--background)] p-4 border-b border-[var(--border-color)]">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--light-text-color)]" />
                <input
                  type="text"
                  placeholder="Search blogs, series..."
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="w-full pl-10 pr-20 py-3 glassmorphism backdrop-blur-sm 
                  rounded-lg appearance-none placeholder:text-[var(--light-text-color)]
                  text-[var(--text-color)] focus:outline-none focus:ring-0"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchExpanded(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)] cursor-pointer touch-target"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchExpanded(true)}
            className="p-2 sm:hidden rounded-lg transition-all duration-200 hover:bg-[var(--secondary-btn-hover)] text-[var(--text-color)] cursor-pointer touch-target"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-lg transition-all duration-200 hover:bg-[var(--secondary-btn-hover)] text-[var(--text-color)] cursor-pointer touch-target"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Create New Post Button - Hidden on mobile */}
              <Link
                to="/create-blog"
                className="hidden sm:flex p-2 rounded-lg hover:bg-primary-50 hover:bg-[var(--secondary-btn-hover)] text-[var(--text-color)] cursor-pointer touch-target"
                aria-label="Create new post"
              >
                <Plus className="w-5 h-5" />
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="p-2 rounded-lg hover:bg-primary-50 transition-all duration-200 relative hover:bg-[var(--secondary-btn-hover)] text-[var(--text-color)] cursor-pointer touch-target"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-lg transition-all duration-200 flex items-center gap-1 sm:gap-2 hover:bg-[var(--secondary-btn-hover)] text-[var(--text-color)] cursor-pointer touch-target"
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen ? "true" : "false"}
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  {user && (
                    <span className="hidden sm:block text-sm font-medium text-[var(--text-color)] max-w-[100px] truncate">
                      {user.displayName || user.name}
                    </span>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 sm:w-52 bg-[var(--background)] border border-[var(--border-color)] rounded-lg shadow-lg z-50 p-2"
                    role="menu"
                  >
                    <div className="py-1 flex flex-col gap-1">
                      {/* Mobile-only Create Post option */}
                      <Link
                        to="/create-blog"
                        className="sm:hidden flex items-center px-4 py-3 text-sm text-text-primary cursor-pointer hover:bg-[var(--secondary-btn-hover)] rounded touch-target"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Plus className="w-4 h-4 mr-3" />
                        Create Post
                      </Link>
                      
                      <Link
                        to="/profile/me"
                        className="flex items-center px-4 py-3 sm:py-2 text-sm text-text-primary cursor-pointer hover:bg-[var(--secondary-btn-hover)] rounded touch-target"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      
                      <Link
                        to="/analytics"
                        className="flex items-center px-4 py-3 sm:py-2 text-sm text-text-primary cursor-pointer hover:bg-[var(--secondary-btn-hover)] rounded touch-target"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <BookOpen className="w-4 h-4 mr-3" />
                        Analytics
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-3 sm:py-2 text-sm text-text-primary cursor-pointer hover:bg-[var(--secondary-btn-hover)] rounded touch-target"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      
                      <hr className="my-1 border-[var(--border-color)]" />
                      
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate("/");
                        }}
                        className="flex items-center w-full px-4 py-3 sm:py-2 text-sm text-error hover:bg-error/10 cursor-pointer hover:bg-[var(--secondary-btn-hover)] rounded touch-target"
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
              {/* Guest Actions - Mobile Responsive */}
              <Link
                to="/login"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-indigo-500 rounded-lg text-[var(--text-color)]  
                hover:text-white hover:bg-indigo-600 box-border 
                outline-none focus:outline-none focus:ring-0 touch-target"
                aria-label="Sign in"
              >
                <span className="hidden xs:inline">Sign In</span>
                <span className="xs:hidden">In</span>
              </Link>

              <Link
                to="/register"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors touch-target"
                aria-label="Sign up"
              >
                <span className="hidden xs:inline">Sign Up</span>
                <span className="xs:hidden">Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;