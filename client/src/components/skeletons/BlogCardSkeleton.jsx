import Skeleton from "./Skeleton.jsx";

export default function BlogCardSkeleton() {
  return (
    <div className="m-5.5 mb-0 flex justify-center">
      <div className="w-full max-w-[900px] flex flex-col gap-6">
        {/* search bar skeleton */}
        <div className="relative">
          <Skeleton className="w-full h-12 rounded-full" />
        </div>

        {/* featured skeleton cards */}
        <div className="flex flex-col">
          <Skeleton className="h-9 w-28 mt-2" />
          {/* title */}
          <div className="flex flex-wrap gap-3 mt-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="w-full sm:w-[48%] lg:w-[32.2%]  rounded "
              >
                <Skeleton className="w-full h-[170px] rounded-xl " />
                <Skeleton className="h-8 w-[95%] mb-3 mt-4" />
                <Skeleton className="h-7 w-[80%]" />
              </div>
            ))}
          </div>
        </div>

        {/* trending topics buttons */}
        <div className="flex flex-col">
          <Skeleton className="h-9 w-40 mb-3 mt-6 " />
          {/* title */}
          <div className="flex flex-row gap-4 mt-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-[85px] rounded-xl" />
            ))}
          </div>
          {/* trending posts skeletons */}
          <div className="flex flex-row gap-4 mt-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center w-[20%]">
                <Skeleton className="w-[100%] h-[110px] rounded-xl mb-2" />
                <Skeleton className="w-[80%] h-5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
