import React from "react";
import { Volume2, MessageCircle, BookmarkIcon, ShareIcon } from "lucide-react";
import image3 from "../../assets/images/image3.jpg";
import Breadcrumb from "../layout/Breadcrumb.jsx";
import { useParams } from "react-router-dom";
import IconButton from "../ui/IconButton.jsx";
const buttonsText = [
  { name: "Listen", icon: Volume2 },
  { name: "Comment", icon: MessageCircle },
  { name: "Save", icon: BookmarkIcon },
  { name: "Share", icon: ShareIcon },
];

const articles = [
  {
    id: "1",
    title: "The Future of Work: Remote Collaboration",
    aurthor: "Nico Vale",
    content:
      " Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores, sed eligendi quod, eveniet exercitationem minus corrupti ducimus natus quo, culpa magni assumenda dolor eos iste illum placeat enim consequatur eaque? Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque dolorum voluptatem atque vero a veniam aliquam ab, unde reprehenderit laborum numquam inventore odit eos nulla excepturi suscipit sequi officia sed? Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque dolorum voluptatem atque vero a veniam aliquam ab, unde reprehenderit laborum numquam inventore odit eos nulla excepturi suscipit sequi officia sed?",
  },
  {
    id: "2",
    title: "AI and Us",
    aurthor: "Ezra Knox",
    content:
      " Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores, sed eligendi quod, eveniet exercitationem minus corrupti ducimus natus quo, culpa magni assumenda dolor eos iste illum placeat enim consequatur eaque? Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque dolorum voluptatem atque vero a veniam aliquam ab, unde reprehenderit laborum numquam inventore odit eos nulla excepturi suscipit sequi officia sed?",
  },
  {
    id: "3",
    title: "AI and You",
    aurthor: "Lyra Bloom",
    content:
      " Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores, sed eligendi quod, eveniet exercitationem minus corrupti ducimus natus quo, culpa magni assumenda dolor eos iste illum placeat enim consequatur eaque?Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque dolorum voluptatem atque vero a veniam aliquam ab, unde reprehenderit laborum numquam inventore odit eos nulla excepturi suscipit sequi officia sed?Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque dolorum voluptatem atque vero a veniam aliquam ab, unde reprehenderit laborum numquam inventore odit eos nulla excepturi suscipit sequi officia sed?",
  },
];

export default function ArticleView() {
  const { id } = useParams();
  const article = articles.find((a) => a.id === id);
  if (!article) {
    return <div className="p-6 text-red-500">Article not found!</div>;
  }
  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="m-5.5 mb-0 flex justify-center ">
      <div className="w-full max-w-[780px] flex flex-col gap-3 ">
        <Breadcrumb />
        <h1
          className="text-3xl md:text-4xl font-bold leading-tight mb-2 p-4 pb-0 pt-0 mt-4 "
          style={{ color: "var(--headings-color)" }}
        >
          {article.title}
        </h1>
        <span
          className="text-sm  mb-0 p-4 pb-0 pt-0"
          style={{ color: "var( --sub-heading-text)" }}
        >
          By{" "}
          <span
            style={{ color: "var( --links-color)" }}
            className=" font-medium"
          >
            {article.aurthor}
          </span>{" "}
          . Published on {formattedDate}
        </span>
        <div className="flex gap-4 px-4 py-3 mt-3">
          {buttonsText.map((item, index) => (
            <button
              key={index}
              className="flex cursor-pointer flex-col gap-1.5 items-center text-sm transition-colors"
            >
              <IconButton icon={item.icon} />
              <span className="mt-1 text-[#5C4F3B] hover:text-[#534735]">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        <p
          style={{ color: "var(--paragraph-text-color)" }}
          className=" p-4 pt-0 leading-loose"
        >
          {article.content}
        </p>
        <figure className="my-7">
          <img
            src={image3}
            alt="A vibrant, modern office space with plants and natural light."
            className="w-full h-fit rounded-xl shadow-md"
          />
          <figcaption className="mt-2 text-center text-sm text-gray-500">
            A caption
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
