import {
  Home,
  BookOpen,
  FileText,
  Mic,
  Users,
  Trophy,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Search,
  TrendingUp,
  Award,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = ({ open, setOpen, collapsed, toggleCollapsed }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Public navigation items (always visible)
  const publicNavigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Blogs", href: "/blogs", icon: BookOpen },
    { name: "Series", href: "/series", icon: Layers },
    { name: "Search", href: "/search", icon: Search },
    { name: "Leaderboard", href: "/leaderboard", icon: Users },
    { name: "Badges", href: "/badges", icon: Award },
  ];

  // Private navigation items (only visible when authenticated)
  const privateNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Rewards", href: "/rewards", icon: Trophy },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Combine navigation based on authentication status
  const navigation = isAuthenticated
    ? [...publicNavigation, ...privateNavigation]
    : publicNavigation;

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024) { // lg breakpoint
      setOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop - Higher z-index than header */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Higher z-index than backdrop */}
      <div
        className={`
        fixed top-0 left-0 h-screen border-r border-gray-300/30 dark:border-gray-600/30 backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${open ? "transform translate-x-0 z-[9999]" : "transform -translate-x-full z-[9999]"}
        lg:translate-x-0 lg:z-30 lg:glassmorphism
        ${collapsed ? "w-16" : "w-64"}
        ${open ? "bg-[var(--background)] lg:bg-transparent" : ""}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Logo and Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border h-14 sm:h-16">
            {!collapsed ? (
              <>
                <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  VocalInk
                </h1>
                <div className="flex items-center gap-2">
                  {/* Mobile close button */}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 lg:hidden rounded-lg hover:bg-[var(--secondary-btn-hover)] cursor-pointer transition-all duration-200 touch-target"
                    aria-label="Close sidebar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Desktop collapse button */}
                  <button
                    onClick={toggleCollapsed}
                    className="hidden lg:flex p-2 rounded-lg hover:bg-[var(--secondary-btn-hover)] cursor-pointer transition-all duration-200"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={toggleCollapsed}
                className="p-2 rounded-lg hover:bg-[var(--secondary-btn-hover)] cursor-pointer transition-all duration-200 mx-auto"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation - Scrollable on mobile for many items */}
          <nav 
            aria-label="Primary" 
            className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center space-x-3 px-3 py-3 sm:py-2.5 rounded-lg transition-all hover:bg-[var(--secondary-btn-hover)] cursor-pointer duration-200 group touch-target
                    ${
                      active
                        ? "bg-primary-50 text-primary-500 border-r-2 border-indigo-500 shadow-sm"
                        : "text-text-secondary hover:bg-primary-50 hover:text-primary-500 hover:shadow-sm border-r border-transparent"
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Show on both mobile and desktop when not collapsed */}
          {!collapsed && (
            <div className="p-3 sm:p-4 ">
              <div className="glassmorphism-card p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  Pro Features
                </h3>
                <p className="text-xs text-primary-700 dark:text-primary-300 mb-3">
                  Unlock advanced AI tools and premium content
                </p>
                <Link to="/upgrade">
                  <button className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] touch-target">
                    Upgrade Now
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;