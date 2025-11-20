import Skeleton from "./Skeleton";
import SeriesCardSkeleton from "./SeriesCardSkeleton";

const SeriesPageSkeleton = ({ viewMode = "grid" }) => {
  const gridClasses =
    viewMode === "grid"
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 max-w-4xl mx-auto";

  const cardCount = viewMode === "grid" ? 6 : 4;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 sm:space-y-4 pt-4">
        <Skeleton className="h-10 w-48 sm:w-64 mx-auto" />
        <Skeleton className="h-4 w-72 sm:w-96 mx-auto" />
      </div>

      {/* Search + Actions */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr] bg-surface/30 border border-[var(--border-color)] rounded-2xl p-4 sm:p-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-28 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
          <Skeleton className="h-12 w-28 rounded-full" />
        </div>
      </div>

      {/* Filter pills */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, idx) => (
            <Skeleton key={idx} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div
            key={`highlight-${idx}`}
            className="bg-surface/40 border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 space-y-3"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-1/3 rounded-full" />
              <Skeleton className="h-3 w-1/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* CTA card */}
      <div className="bg-surface/40 border border-[var(--border-color)] rounded-2xl p-6 space-y-4 text-center">
        <Skeleton className="h-5 w-40 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
        <div className="flex flex-wrap justify-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Results summary */}
      <div className="border-b border-[var(--border-color)] py-4 flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Series cards */}
      <div className={`grid gap-4 sm:gap-6 ${gridClasses}`}>
        {Array.from({ length: cardCount }).map((_, idx) => (
          <SeriesCardSkeleton key={`series-skeleton-${idx}`} />
        ))}
      </div>
    </div>
  );
};

export default SeriesPageSkeleton;
