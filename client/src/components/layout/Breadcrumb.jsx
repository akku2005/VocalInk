import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { userService } from "../../services/userService";

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const [profileLabel, setProfileLabel] = useState(null);

  useEffect(() => {
    const fetchProfileLabel = async () => {
      if (pathnames[0] !== "profile" || !pathnames[1]) {
        setProfileLabel(null);
        return;
      }

      const identifier = pathnames[1];
      const sanitized = identifier.replace(/^@/, "");
      const fallbackHandle = sanitized || "user";

      // Skip legacy pseudo handles
      if (/^user-[a-f\d]{6}$/i.test(sanitized)) {
        setProfileLabel(fallbackHandle);
        return;
      }

      try {
        const profile = await userService.getUserProfile(sanitized);
        const handle =
          profile.username ||
          (profile._id ? String(profile._id) : fallbackHandle);
        const display =
          profile.displayName ||
          (profile.firstName || profile.lastName
            ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
            : profile.name ||
              profile.username ||
              (profile.email ? profile.email.split("@")[0] : null) ||
              null);

        const crumb = display
          ? profile.username
            ? `${display} (@${handle})`
            : display
          : handle;
        setProfileLabel(crumb);
      } catch (err) {
        // Fallback: show handle with @ prefix for uniqueness
        setProfileLabel(fallbackHandle);
      }
    };

    fetchProfileLabel();
  }, [pathnames]);

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

    // Special-case profile user segment
    if (pathnames[0] === "profile" && pathnames[1] === path) {
      return profileLabel || "Profile";
    }

    if (breadcrumbMap[path]) return breadcrumbMap[path];

    // Format slug: replace hyphens with spaces and capitalize words
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
              {isLast || name === 'article' || name === 'blog' ? (
                <span className={`font-medium ${isLast ? 'text-text-primary' : 'text-text-secondary'}`}>
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
