import React from "react";
import BlogCard from "../components/ui/WelcomeText.jsx";
import BlogCardSkeleton from "../components/skeletons/BlogCardSkeleton";
import { useState, useEffect } from "react";
export default function BlogPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  });
  return loading ? <BlogCardSkeleton /> : <BlogCard />;
}
