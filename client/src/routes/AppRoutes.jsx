import React from "react";
import { Routes, Route } from "react-router-dom";
import BlogPage from "../pages/BlogPage.jsx";
import ArticlePage from "../pages/ArticlePage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BlogPage />} />
      <Route path="/article/:id" element={<ArticlePage />} />
    </Routes>
  );
}
