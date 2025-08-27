import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const getBreadcrumbName = (path) => {
    const breadcrumbMap = {
      dashboard: "Dashboard",
      blogs: "Blogs",
      series: "Series",
      article: "Article",
      login: "Login",
      register: "Register",
      profile: "Profile",
      analytics: "Analytics",
      rewards: "Rewards",
      notifications: "Notifications",
      "create-blog": "Create Blog",
      "edit-blog": "Edit Blog",
      search: "Search",
      settings: "Settings",
      leaderboard: "Leaderboard",
      badges: "Badges",
      timeline: "Timeline",
    };
    return breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div
      className="py-3 px-4 mb-4 bg-surface border border-[var(--border-color)]
 rounded-lg"
    >
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
        <Link
          to="/"
          className="flex items-center gap-1 text-text-secondary hover:text-primary-500 transition-colors duration-200"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <React.Fragment key={name}>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
              {isLast ? (
                <span className="text-text-primary font-medium">
                  {getBreadcrumbName(name)}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-200"
                >
                  {getBreadcrumbName(name)}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
