import React from "react";
import ArticleViewSkeleton from "../components/skeletons/ArticleViewSkeleton";
import ArticleView from "../components/blog/ArticleView.jsx";
import ErrorBoundary from "../components/error/ErrorBoundary.jsx";
import { useState, useEffect } from "react";
export default function BlogPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  });
  return loading ? (
    <ArticleViewSkeleton />
  ) : (
    <ErrorBoundary>
      <ArticleView />
    </ErrorBoundary>
  );
}
