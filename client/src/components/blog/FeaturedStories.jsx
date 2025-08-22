import React from "react";
import image from "./../../assets/images/featured-post-pic.jpg";

export default function FeaturedStories() {
  return (
    <div className="flex justify-center w-full px-4 mt-10 md:mt-20 pt-10 md:pt-15 pb-10 md:pb-15 bg-[var(--bg-color)]">
      <div className="max-w-[1200px] flex flex-col gap-4 justify-center">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 md:mb-13 items-start sm:items-center gap-4 sm:gap-0">
          <h1 className="font-normal text-[var(--headlines)] text-3xl sm:text-4xl md:text-4xl">
            Featured Articles
          </h1>
          <button className="rounded bg-[var(--buttons-color)] text-[var(--main-headline-color)] px-4 py-2 cursor-pointer text-sm sm:text-base">
            View more articles
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 rounded-2xl">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="group flex flex-col justify-center rounded-2xl gap-2 overflow-hidden cursor-pointer"
            >
              <img
                src={image}
                alt="photo"
                className="w-full h-[200px] sm:h-[220px] md:h-[250px] rounded-2xl object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              />
              <button className="bg-[var(--buttons-color)] text-[var(--details-text)] px-2 mt-2 w-20 text-xs sm:text-sm">
                DESIGN
              </button>
              <h1 className="text-lg sm:text-[1.2rem] md:text-[1.4rem] font-normal tracking-tight mt-2 text-[var(--main-headline-color)]">
                Lorem ipsum dolor sit amet consectetur
              </h1>
              <p className="line-clamp-3 mt-1 text-sm sm:text-base text-[var(--sub-healine-color)]">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vero
                laborum, facilis sit, quis non aperiam tempore consectetur
              </p>
              <div className="flex justify-between items-center mt-2 text-xs sm:text-sm">
                <p className="flex gap-2 items-center text-[var(--main-headline-color)]">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500"></span>
                  Hanna Felix
                </p>
                <h3 className="text-[var(--details-text)] text-[10px] sm:text-sm">
                  May 25, 2025
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
