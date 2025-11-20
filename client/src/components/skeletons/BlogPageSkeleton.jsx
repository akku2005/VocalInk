import Skeleton from "./Skeleton";
import BlogCardSkeleton from "./BlogCardSkeleton";

const BlogPageSkeleton = ({ viewMode = "grid" }) => {
  const cardCount = viewMode === "list" ? 4 : 6;
  const gridClasses =
    viewMode === "grid"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 max-w-4xl mx-auto";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero / Heading */}
      <div className="text-center space-y-3 sm:space-y-4 pt-4 sm:pt-0">
        <Skeleton className="h-10 w-48 sm:w-64 mx-auto" />
        <Skeleton className="h-4 w-64 sm:w-96 mx-auto" />
      </div>

      {/* Mobile Search + Actions */}
      <div className="sm:hidden space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>

      {/* Desktop Search + Filters */}
      <div className="hidden sm:block bg-surface/40 border border-[var(--border-color)] rounded-2xl p-5 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-12 w-28 rounded-xl ml-auto" />
        </div>
      </div>

      {/* Desktop Categories */}
      <div className="hidden sm:block space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={`desktop-cat-${idx}`} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Mobile Filters / Categories */}
      <div className="sm:hidden space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={`mobile-cat-${idx}`} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div className="border-b border-[var(--border-color)] py-4 flex flex-col xs:flex-row gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Blog Cards */}
      <div className={`grid gap-4 sm:gap-6 ${gridClasses}`}>
        {Array.from({ length: cardCount }).map((_, idx) => (
          <BlogCardSkeleton key={`blog-skeleton-${idx}`} />
        ))}
      </div>
    </div>
  );
};

export default BlogPageSkeleton;
