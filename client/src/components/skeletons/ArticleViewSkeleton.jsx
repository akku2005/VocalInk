import React from "react";
import Skeleton from "./Skeleton.jsx";

export default function ArticleViewSkeleton() {
  return (
    <div className="m-5.5 mb-0 flex justify-center ">
      <div className="w-full max-w-[780px] flex flex-col gap-3">
        {/* Breadcrumb Placeholder */}
        <Skeleton className=" h-5 w-40 mb-2 ml-4 mt-4" />

        {/* Title */}
        <div>
          <Skeleton className="  h-9 w-[70%] rounded-md ml-4 mt-7 " />
          <Skeleton className=" h-9 w-[50%] rounded-md ml-4 mt-2 " />
        </div>

        {/* Author + Date */}
        <Skeleton className="h-5 w-52 rounded ml-4 mt-5" />

        {/* Buttons */}
        <div className="flex gap-4 mt-3 px-4 py-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1.5 text-sm text-gray-600"
            >
              <Skeleton className="w-10 h-10   rounded-full" />
              <Skeleton className="w-10 h-4 rounded" />
            </div>
          ))}
        </div>

        {/* Content Text Blocks */}
        <div className="flex flex-col gap-3 mt-5 px-4 pt-0">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-[90%]" />
          <Skeleton className="h-5 w-[95%]" />
          <Skeleton className="h-5 w-[85%]" />
          <Skeleton className="h-5 w-[80%]" />
          <Skeleton className="h-5 w-[92%]" />
          <Skeleton className="h-5 w-[88%]" />
        </div>

        {/* Image */}
        <Skeleton className="w-full h-[300px] rounded-xl my-8" />

        {/* Caption */}
        <Skeleton className="w-1/2 h-4 mx-auto mb-4 rounded" />
      </div>
    </div>
  );
}
