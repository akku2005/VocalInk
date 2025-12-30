import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Page-level loading component
 */
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
        <p className="text-text-secondary">{message}</p>
      </div>
    </div>
  );
}

/**
 * Content-level loading component (doesn't fill screen)
 */
export function ContentLoader({ message = 'Loading content...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for blog cards
 */
export function BlogCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-surface-hover rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-surface-hover rounded w-full mb-2"></div>
      <div className="h-3 bg-surface-hover rounded w-5/6 mb-4"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-surface-hover rounded w-16"></div>
        <div className="h-6 bg-surface-hover rounded w-16"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for user profile
 */
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-surface-hover rounded-lg mb-4"></div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-24 h-24 bg-surface-hover rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-surface-hover rounded w-48 mb-2"></div>
          <div className="h-4 bg-surface-hover rounded w-32"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-surface-hover rounded w-full"></div>
        <div className="h-4 bg-surface-hover rounded w-5/6"></div>
        <div className="h-4 bg-surface-hover rounded w-4/6"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for dashboard stats
 */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-lg p-6">
          <div className="h-4 bg-surface-hover rounded w-24 mb-4"></div>
          <div className="h-8 bg-surface-hover rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-lg p-4">
          <div className="h-4 bg-surface-hover rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-surface-hover rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Route-specific loading components
 */
export const RouteLoaders = {
  blog: () => <PageLoader message="Loading blog post..." />,
  blogs: () => (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  ),
  profile: () => (
    <div className="max-w-4xl mx-auto p-6">
      <ProfileSkeleton />
    </div>
  ),
  dashboard: () => (
    <div className="max-w-7xl mx-auto p-6">
      <DashboardSkeleton />
    </div>
  ),
  settings: () => <PageLoader message="Loading settings..." />,
  default: () => <PageLoader />,
};

export default PageLoader;
