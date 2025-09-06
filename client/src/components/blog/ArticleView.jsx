import React, { useState, useEffect, useRef } from "react";
import { Volume2, MessageCircle, BookmarkIcon, ShareIcon } from "lucide-react";
import image3 from "../../assets/images/image3.jpg";
import Breadcrumb from "../layout/Breadcrumb.jsx";
import { useParams } from "react-router-dom";
import IconButton from "../ui/IconButton.jsx";
import EngagementButtons from "../engagement/EngagementButtons";
import AudioPlayer from "../audio/AudioPlayer";
import CommentList from "../comment/CommentList";

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
  const [article, setArticle] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const commentsSectionRef = useRef(null);
  
  useEffect(() => {
    // Simulate fetching article data
    const foundArticle = articles.find((a) => a.id === id);
    if (foundArticle) {
      setArticle(foundArticle);
    }
  }, [id]);

  // Handle hash navigation to comments
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setShowComments(true);
      // Scroll to comments after a short delay to ensure it's rendered
      setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    }
  }, [id]);

  const handleCommentClick = () => {
    setShowComments(true);
    
    // Auto-scroll to comments section after a short delay to ensure it's rendered
    setTimeout(() => {
      if (commentsSectionRef.current) {
        commentsSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

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
        {/* Engagement Buttons */}
        <div className="px-4 py-3 mt-3">
          <EngagementButtons
            blogId={id}
            initialLikes={156}
            initialComments={31}
            initialBookmarks={23}
            isLiked={false}
            isBookmarked={false}
            onCommentClick={handleCommentClick}
          />
        </div>

        {/* Audio Player */}
        <div className="px-4 py-3">
          <AudioPlayer
            blogId={id}
            blogTitle={article.title}
            initialAudioUrl={audioUrl}
            onAudioGenerated={setAudioUrl}
          />
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

        {/* Comments Section */}
        <div ref={commentsSectionRef} id="comments" className="mt-8 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-text-primary">Comments</h3>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </button>
          </div>
          
          {showComments && (
            <CommentList
              blogId={id}
              blogTitle={article.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
