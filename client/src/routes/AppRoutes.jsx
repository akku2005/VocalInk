import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import TestPage from "../pages/TestPage";
import BlogPage from "../pages/BlogPage.jsx";
import SeriesPage from "../pages/SeriesPage.jsx";
import ArticlePage from "../pages/ArticlePage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="test" element={<TestPage />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="series" element={<SeriesPage />} />
        <Route path="article/:id" element={<ArticlePage />} />
      </Route>
    </Routes>
  );
}
