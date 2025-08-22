import React from "react";
import image from "./../../assets/images/featured-post-pic.jpg";
export default function FeaturedStories() {
  return (
    <div className="flex  justify-center w-full px-4 mt-20 pt-15 pb-15 bg-[var(--bg-color)]">
      <div className=" max-w-[1200px] flex flex-col gap-1 justify-center ">
        <div className="flex justify-between mb-13">
          {" "}
          <h1 className="font-normal text-[var(--headlines)] text-4xl">
            Featured Articles
          </h1>
          <button className="   rounded bg-[var(--buttons-color)]  text-[var(--main-headline-color)] px-5 py-2 cursor-pointer">
            View more articles
          </button>
        </div>

        <div className="   grid grid-cols-3 gap-6 rounded-2xl">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="group flex flex-col justify-center rounded-2xl gap-1 overflow-hidden cursor-pointer"
            >
              <img
                src={image}
                alt="photo"
                className="w-full h-[220px] rounded-2xl object-cover 
               transition-transform duration-500 ease-in-out group-hover:scale-105"
              />
              <button className="bg-[var(--buttons-color)]  text-[var(--details-text)] px-1 mt-4 w-20">
                DESIGN
              </button>
              <h1 className="text-[1.4rem] font-normal tracking-tight mt-4  text-[var(--main-headline-color)]">
                Lorem ipsum dolor sit amet consectetur
              </h1>
              <p className="line-clamp-3 mt-1 text-base text-[var(--sub-healine-color)]">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Vero
                laborum, facilis sit, quis non aperiam tempore consectetur
              </p>
              <div className="flex justify-between items-center mt-2 text-sm">
                <p className="flex gap-2 items-center text-[var(--main-headline-color)]  ">
                  <span className="w-10 h-10 rounded-full bg-amber-500"></span>
                  Hanna Felix
                </p>
                <h3 className="text-[var(--details-text)]">May 25, 2025</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
