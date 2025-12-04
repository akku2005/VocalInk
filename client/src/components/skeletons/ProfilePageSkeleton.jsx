import Skeleton from "./Skeleton";

const StatSkeleton = () => (
  <div className="bg-surface rounded-xl border border-[var(--border-color)] p-6 text-center space-y-2">
    <Skeleton className="h-6 w-8 mx-auto" />
    <Skeleton className="h-3 w-20 mx-auto" />
  </div>
);

const BadgeSkeleton = () => (
  <div className="bg-surface rounded-2xl border border-[var(--border-color)] p-5 flex items-center gap-3">
    <Skeleton className="h-10 w-10 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-8 w-20 rounded-full" />
  </div>
);

const ListSkeleton = () => (
  <div className="bg-surface rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="flex gap-3">
        <Skeleton className="h-14 w-20 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const ProfilePageSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <StatSkeleton key={idx} />
        ))}
      </div>

      {/* Level */}
      <div className="bg-surface rounded-2xl border border-[var(--border-color)] p-5">
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Badges */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <BadgeSkeleton />
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {["Posts", "Series", "Likes", "Bookmarks"].map((label) => (
          <Skeleton key={label} className="h-10 w-24 rounded-full" />
        ))}
      </div>

      {/* List */}
      <ListSkeleton />
    </div>
  );
};

export default ProfilePageSkeleton;
