import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export default function BlogCard() {
  return (
    <div className="flex justify-center items-center px-4 py-13 main-containerr ">
      <div className="w-full max-w-[690px] flex flex-col gap-8 text-center ">
        <div className="flex justify-center items-center flex-col gap-3">
          {/* Heading */}
          <div className="flex justify-center items-center mt-6 ">
            <h1
              className="main-heading flex items-center  tracking-tighter
              text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold 
              text-[var(--main-headline-color)] heading-text"
            >
              Write & Discover.
            </h1>
          </div>

          {/* Subtitle */}
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl 
            sub-heading font-semibold tracking-wider text-[var(--sub-healine-color)] "
          >
            All in one place.
          </h2>

          {/* Paragraph */}
          <p
            className="leading-tight sm:leading-loose mt-3 
            text-base sm:text-lg md:text-xl text-[var(--details-text)] px-2 sm:px-6"
          >
            Join a community where stories come alive. Write with AI, share your
            own words, or simply dive into fresh reads. Sign in to start writing
            or just explore and enjoy.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
            <button
              className="px-6 py-3 rounded-full hover:scale-105 
              hover:shadow-lg duration-300 ease-in-out cursor-pointer 
              text-[var(--details-text)] hover:bg-white transition border border-gray-300"
            >
              Browse Posts
            </button>

            <button
              className="flex items-center justify-center gap-2 
              bg-amber-600 rounded-full px-6 py-3 shadow-md hover:scale-105 
              hover:shadow-lg transition duration-300 ease-in-out 
              text-white cursor-pointer"
            >
              Sign In to Write
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
