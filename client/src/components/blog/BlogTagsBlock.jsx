import React from "react";
import "../SidebarTags.css";

const blogCategories = [
  "Technology",
  "Design",
  "Lifestyle",
  "Travel",
  "Productivity",
];

const blogTopics = [
  "React",
  "TypeScript",
  "UI/UX",
  "CSS",
  "JavaScript",
  "Minimalism",
  "Remote Work",
  "Photography",
  "Creativity",
  "Tools",
];

const BlogTagsBlock = () => (
  <div className="sidebar-tags mb-8">
    <div className="section">
      <h3 className="section-title">Categories</h3>
      <div className="tags">
        {blogCategories.map((cat) => (
          <span className="tag" key={cat}>{cat}</span>
        ))}
      </div>
    </div>
    <hr className="divider" />
    <div className="section">
      <h3 className="section-title">Topics</h3>
      <div className="tags">
        {blogTopics.map((topic) => (
          <span className="tag" key={topic}>{topic}</span>
        ))}
      </div>
    </div>
    <hr className="divider" />
  </div>
);

export default BlogTagsBlock;
