import React from "react";
import image from "./../../assets/images/featured-post-pic.jpg";

export default function TrendingPost() {
  return (
    <div className="flex justify-center w-full px-4 mt-15 mb-15">
      <div className="max-w-[1200px] flex flex-col gap-1 justify-center">
        {/* Header */}
        <div className="flex justify-between mb-13">
          <h1 className="font-normal text-4xl  text-[var(--headlines)]">
            Trending Today
          </h1>
          <button className="rounded shadow bg-[var(--buttons-color2)]  text-[var(--main-headline-color)] px-5 py-2 cursor-pointer">
            Explore more
          </button>
        </div>

        {/* Posts */}
        <div className="grid grid-cols-3 gap-6 rounded-2xl">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="flex flex-col justify-center rounded-2xl gap-1"
            >
              {/* Image with hover effect */}
              <div className="overflow-hidden rounded-2xl group">
                <img
                  src={image}
                  alt="photo"
                  className="w-full h-[220px] rounded-2xl object-cover 
                  transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              </div>

              <button className="bg-[var(--buttons-color2)]  text-[var(--details-text)]  tracking-wider px-1 mt-4 w-20">
                DESIGN
              </button>
              <h1 className="text-[1.4rem] font-normal tracking-tight mt-4 text-[var(--main-headline-color)]">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
              </h1>

              <div className="flex justify-between items-center mt-2 text-sm">
                <p className="flex gap-2 items-center text-[var(--sub-healine-color)]">
                  <span className="w-10 h-10 rounded-full bg-amber-500"></span>
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
