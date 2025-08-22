import React from "react";
import image from "../../assets/images/image2.jpg";

export default function EditorsPick() {
  return (
    <div className="px-4 pt-15 pb-20 max-w-[1220px] mx-auto">
      {/* Section Heading */}
      <h1 className="font-normal text-4xl mb-10 text-left text-[var(--headlines)]">
        Editor's Pick
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Image */}
        <div className="relative overflow-hidden rounded-2xl group w-full h-[400px] md:h-auto">
          <img
            src={image}
            alt="Editor's Pick"
            className="w-full h-full object-cover rounded-2xl shadow-md  cursor-pointer
                  transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        </div>

        {/* Right Content */}
        <div className="flex flex-col justify-center gap-5">
          <p className="text-[var(--details-text)] text-sm">May 12, 2025</p>
          <h1 className="text-2xl md:text-3xl font-normal tracking-tight leading-snug hover:underline cursor-pointer  text-[var(--main-headline-color)]">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga eum
            suscipit iste dolorem.
          </h1>
          <p className="text-[var(--sub-healine-color)] leading-relaxed">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem
            culpa doloribus alias voluptatibus amet distinctio officia sunt
          </p>
          <p className="flex gap-2 items-center font-normal text-[var(--main-headline-color)]">
            <span className="w-10 h-10 rounded-full bg-amber-500"></span>
            Hanna Felix
          </p>
        </div>
      </div>
    </div>
  );
}
