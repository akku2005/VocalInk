import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";

const Layout = lazy(() => import("../components/layout/Layout"));
const ProtectedRoute = lazy(() => import("../components/auth/ProtectedRoute"));
const GuestRoute = lazy(() => import("../components/auth/GuestRoute"));
const Home = lazy(() => import("../pages/Home"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const TestPage = lazy(() => import("../pages/TestPage"));
const BlogPage = lazy(() => import("../pages/BlogPage.jsx"));
const SeriesPage = lazy(() => import("../pages/SeriesPage.jsx"));
const ArticlePage = lazy(() => import("../pages/ArticlePage.jsx"));
const Login = lazy(() => import("../components/auth/Login"));
const Register = lazy(() => import("../components/auth/Register"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage"));
const RewardsPage = lazy(() => import("../pages/RewardsPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const CreateBlogPage = lazy(() => import("../pages/CreateBlogPage"));
const EditBlogPage = lazy(() => import("../pages/EditBlogPage"));
const SeriesTimelinePage = lazy(() => import("../pages/SeriesTimelinePage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const LeaderboardPage = lazy(() => import("../pages/LeaderboardPage"));
const BadgeGalleryPage = lazy(() => import("../pages/BadgeGalleryPage"));
const BadgeDetailPage = lazy(() => import("../pages/badges/BadgeDetailPage.jsx"));
const CreateSeriesPage = lazy(() => import("../pages/CreateSeriesPage.jsx"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-10"><LoadingSpinner /></div>}>
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
          <Route path="badges/:slug" element={<BadgeDetailPage />} />
          
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
          <Route path="create-series" element={
            <ProtectedRoute>
              <CreateSeriesPage />
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
    </Suspense>
  );
}
