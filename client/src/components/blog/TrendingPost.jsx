import React from "react";
import image from "./../../assets/images/featured-post-pic.jpg";

export default function TrendingPost() {
  return (
    <div className="w-full pt-10 md:pt-15 pb-10 md:pb-15 bg-[var(--bg-color)]">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-4 justify-center px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 md:mb-13 items-start sm:items-center gap-4 sm:gap-0">
          <h1 className="font-normal text-3xl sm:text-4xl md:text-4xl text-[var(--headlines)]">
            Trending Today
          </h1>
          <button className="rounded shadow bg-[var(--buttons-color2)] text-[var(--main-headline-color)] px-4 py-2 cursor-pointer text-sm sm:text-base">
            Explore more
          </button>
        </div>

        {/* Posts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 rounded-2xl">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="flex flex-col justify-center rounded-2xl gap-2 overflow-hidden cursor-pointer"
            >
              {/* Image with hover effect */}
              <div className="overflow-hidden rounded-2xl group">
                <img
                  src={image}
                  alt="photo"
                  className="w-full h-[180px] sm:h-[200px] md:h-[220px] rounded-2xl object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              </div>

              <button className="bg-[var(--buttons-color2)] text-[var(--details-text)] tracking-wider px-2 mt-2 w-20 text-xs sm:text-sm">
                DESIGN
              </button>

              <h1 className="text-lg sm:text-[1.2rem] md:text-[1.4rem] font-normal tracking-tight mt-2 text-[var(--main-headline-color)]">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
              </h1>

              <div className="flex justify-start items-center mt-2 text-xs sm:text-sm">
                <p className="flex gap-2 items-center text-[var(--sub-healine-color)]">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500"></span>
                  Hanna Felix
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
