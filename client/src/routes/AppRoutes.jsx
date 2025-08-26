import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import GuestRoute from "../components/auth/GuestRoute";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import TestPage from "../pages/TestPage";
import BlogPage from "../pages/BlogPage.jsx";
import SeriesPage from "../pages/SeriesPage.jsx";
import ArticlePage from "../pages/ArticlePage.jsx";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import ProfilePage from "../pages/ProfilePage";
import AnalyticsPage from "../pages/AnalyticsPage";
import RewardsPage from "../pages/RewardsPage";
import NotificationsPage from "../pages/NotificationsPage";
import CreateBlogPage from "../pages/CreateBlogPage";
import EditBlogPage from "../pages/EditBlogPage";
import SeriesTimelinePage from "../pages/SeriesTimelinePage";
import SearchPage from "../pages/SearchPage";
import SettingsPage from "../pages/SettingsPage";
import LeaderboardPage from "../pages/LeaderboardPage";
import BadgeGalleryPage from "../pages/BadgeGalleryPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes - Accessible to everyone */}
        <Route index element={<Home />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="series" element={<SeriesPage />} />
        <Route path="article/:id" element={<ArticlePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="badges" element={<BadgeGalleryPage />} />
        
        {/* Guest Routes - Only for non-authenticated users */}
        <Route path="login" element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } />
        <Route path="register" element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } />
        
        {/* Protected Routes - Require authentication */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="test" element={
          <ProtectedRoute>
            <TestPage />
          </ProtectedRoute>
        } />
        <Route path="profile/:username" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="rewards" element={
          <ProtectedRoute>
            <RewardsPage />
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="create-blog" element={
          <ProtectedRoute>
            <CreateBlogPage />
          </ProtectedRoute>
        } />
        <Route path="edit-blog/:id" element={
          <ProtectedRoute>
            <EditBlogPage />
          </ProtectedRoute>
        } />
        <Route path="series/:id/timeline" element={
          <ProtectedRoute>
            <SeriesTimelinePage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
