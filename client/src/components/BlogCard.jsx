import React from "react";
import { SearchIcon } from "lucide-react";
import image1 from "./images/image1.jpg";
import image2 from "./images/image2.jpg";
import "./BlogCard.css";
export default function BlogCard() {
  const collection = [
    {
      name: "The Future of Work: Remote Collaboration ",
      discription:
        "Explore the latest trends in remote work and collaboration tools",
    },
    {
      name: "The Future of Work: Remote Collaboration ",
      discription:
        "Explore the latest trends in remote work and collaboration tools",
    },
    {
      name: "The Future of Work: Remote Collaboration ",
      discription:
        "Explore the latest trends in remote work and collaboration tools",
    },
  ];
  const topicNames = [
    "Remote Work Trends",
    "AI in Daily Life",
    "Future of Technology",
    "Health and Productivity",
  ];
  const buttonsText = ["Technology", "Lifestyle", "Travel", "Food", "Health"];
  return (
    <div className="m-5.5 mb-0 flex justify-center">
      <div className="w-full max-w-[990px] flex flex-col gap-6">
        {/* search bar */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search"
            className="bg-slate-100 text-blue-950 rounded-xl p-2 pl-12 w-full h-12"
          />
          <span className="absolute left-4 text-blue-950">
            <SearchIcon />
          </span>
        </div>

        {/* featured section */}
        <div className="flex flex-col">
          <h1 className="font-bold text-2xl">Featured</h1>
          <div className="flex flex-wrap gap-4 mt-6">
            {collection.map((item, index) => (
              <div
                key={index}
                className="w-full sm:w-[48%] lg:w-[32%] bg-white shadow rounded"
              >
                <img
                  src={image1}
                  className="w-full h-[170px] rounded-xl object-cover"
                />
                <h2 className="text-[18px] font-medium text-gray-800 mt-2">
                  {item.name}
                </h2>
                <p className="text-sky-800 text-[16px]">{item.discription}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trending topics section */}
        <div className="flex flex-col">
          <h1 className="font-bold text-2xl">Trending Topics</h1>
          <div className="flex flex-row gap-7 mt-5">
            {buttonsText.map((item, index) => (
              <button
                key={index}
                className="btn bg-slate-200 rounded-xl p-2 flex items-center"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Trending posts */}
          <div className="flex flex-row gap-4 mt-5">
            {topicNames.map((item, index) => (
              <div key={index} className=" flex flex-col items-center w-[20%]">
                <img src={image2} className="rounded-xl" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
