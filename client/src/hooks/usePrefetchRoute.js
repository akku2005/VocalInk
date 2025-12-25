import { Suspense, lazy, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

/**
 * Route Prefetching Hook
 * Prefetches route components on hover for better UX
 */
const prefetchedRoutes = new Set();

export function usePrefetchRoute(to, component) {
  const prefetch = () => {
    if (!prefetchedRoutes.has(to) && component) {
      prefetchedRoutes.add(to);
      // Trigger the lazy component loading
      component._payload?._result || component();
    }
  };

  return { onMouseEnter: prefetch, onTouchStart: prefetch };
}

/**
 * Link component with route prefetching
 */
export function PrefetchLink({ to, children, component, className, ...props }) {
  const navigate = useNavigate();
  const prefetchProps = usePrefetchRoute(to, component);

  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      {...prefetchProps}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Route-specific loading components
 */
export const RouteLoadingStates = {
  default: () => (
    <div className="flex items-center justify-center p-10">
      <LoadingSpinner />
    </div>
  ),

  page: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-text-secondary">Loading page...</p>
      </div>
    </div>
  ),

  article: () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {/* Title skeleton */}
        <div className="h-12 bg-surface rounded animate-pulse" />
        {/* Meta skeleton */}
        <div className="flex gap-4">
          <div className="h-4 w-32 bg-surface rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface rounded animate-pulse" />
        </div>
        {/* Content skeleton */}
        <div className="space-y-3 mt-8">
          <div className="h-4 bg-surface rounded animate-pulse" />
          <div className="h-4 bg-surface rounded animate-pulse w-5/6" />
          <div className="h-4 bg-surface rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  ),

  profile: () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Cover skeleton */}
        <div className="h-48 bg-surface rounded-lg animate-pulse" />
        {/* Avatar skeleton */}
        <div className="flex gap-4 -mt-16">
          <div className="w-32 h-32 bg-surface rounded-full animate-pulse border-4 border-background" />
          <div className="mt-16 space-y-2 flex-1">
            <div className="h-8 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  ),

  dashboard: () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-8 w-64 bg-surface rounded animate-pulse" />
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  ),

  settings: () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <div className="w-64 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-surface rounded animate-pulse" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 bg-surface rounded animate-pulse" />
          <div className="h-64 bg-surface rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Route wrapper with specific loading state
 */
export function RouteWithLoading({ children, loadingType = 'default' }) {
  const LoadingComponent = RouteLoadingStates[loadingType] || RouteLoadingStates.default;

  return (
    <Suspense fallback={<LoadingComponent />}>
      {children}
    </Suspense>
  );
}

/**
 * Scroll to top on route change
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
}

export default usePrefetchRoute;
