import React from "react";
import { SearchIcon } from "lucide-react";
import image1 from "../../assets/images/image1.jpg";
import image2 from "../../assets/images/image2.jpg";
import { Link } from "react-router-dom";

export default function BlogCard() {
  const bgColor = "var(--btn-bg-color2)";
  const hoverColor = "var(--btn-hover-color)";
  const collection = [
    {
      id: 1,
      name: "The Future of Work: Remote Collaboration ",
      discription:
        "Explore the latest trends in remote work and collaboration tools",
    },
    {
      id: 2,
      name: "The Future of Work: Remote Collaboration ",
      discription:
        "Explore the latest trends in remote work and collaboration tools",
    },
    {
      id: 3,
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
    <div className="m-5.5 mb-0 flex justify-center ">
      <div className="w-full max-w-[900px] flex justify-center items-center flex-col gap-8">
        {/* search bar */}
        <div className="relative w-full   flex items-center">
          <input
            type="text"
            placeholder="Search"
            className="bg-[#F5EFE8] text-[#5C4F3B] placeholder-[#948A7A] focus:ring-[#C6AD8F] rounded-full focus:outline-none focus:ring-1 shadow  p-4 pl-14 w-full py-4.5"
          />
          <span className="absolute left-4 text-gray-950">
            <SearchIcon size={27} />
          </span>
        </div>

        {/* featured section */}
        <div className="flex flex-col">
          <h2 className="font-bold" style={{ color: "var(--headings-color)" }}>
            Featured
          </h2>
          <div className="flex flex-wrap gap-3 mt-5">
            {collection.map((item) => (
              <div
                key={item.id}
                className="w-full sm:w-[48%] lg:w-[32.2%]  rounded"
              >
                <img
                  src={image1}
                  className="w-full h-[170px] rounded-xl object-cover"
                />
                <Link
                  to={`/article/${item.id}`}
                  className="text-[25px]   hover:underline mt-2.5 block"
                >
                  <h4 style={{ color: "var(--sub-heading-text)" }}>
                    {item.name}
                  </h4>
                </Link>
                <span style={{ color: "var(--paragraph-text-color)" }}>
                  {item.discription}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trending topics section */}
        <div className="flex flex-col">
          <h2
            className="font-bold text-2xl"
            style={{ color: "var(--headings-color)" }}
          >
            Trending Topics
          </h2>
          <div className="flex flex-row gap-7 mt-5">
            {buttonsText.map((item, index) => (
              <button
                key={index}
                className="bg-[var(--btn-bg-color2)] hover:bg-[var(--btn-hover-color2)] text-[var(--btn-text-color)] rounded-xl p-2.5 cursor-pointer flex items-center transition-colors duration-200"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Trending posts */}
          <div className="flex flex-row gap-4 mt-5">
            {topicNames.map((item, index) => (
              <div key={index} className=" flex flex-col items-center w-[20%]">
                <img src={image2} className="rounded-xl mb-1" />
                <span style={{ color: "var(--sub-heading-text)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
