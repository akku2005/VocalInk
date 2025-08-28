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

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-30 h-screen glassmorphism border-r border-border
        transition-all duration-300 ease-in-out
        ${open ? "transform translate-x-0" : "transform -translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "w-16" : "w-64"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Logo and Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border h-16">
            {!collapsed ? (
              <>
                <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  VocalInk
                </h1>
                <button
                  onClick={toggleCollapsed}
                  className="p-2 rounded-lg hover:bg-[var(--secondary-btn-hover)] cursor-pointer transition-all duration-200  "
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleCollapsed}
                className="p-2 rounded-lg hover:bg-[var(--secondary-btn-hover)] cursor-pointer   transition-all duration-200 mx-auto"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation - Fixed height, no scroll */}
          <nav aria-label="Primary" className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all hover:bg-[var(--secondary-btn-hover)] cursor-pointer  duration-200 group
                    ${
                      active
                        ? "bg-primary-50  text-primary-500 border-r-2 border-indigo-500 shadow-sm"
                        : "text-text-secondary hover:bg-primary-50  hover:text-primary-500 hover:shadow-sm border-r border-transparent"
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t border-border">
              <div className="glassmorphism-card p-4">
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  Pro Features
                </h3>
                <p className="text-xs text-primary-700 dark:text-primary-300 mb-3">
                  Unlock advanced AI tools and premium content
                </p>
                <button className="w-full px-3 py-2 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-200 dark:bg-white/20 rounded-lg hover:bg-primary-300 dark:hover:bg-white/30 transition-all duration-200 hover:shadow-sm">
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
