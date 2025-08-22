import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "../components/auth/Login.jsx";

import LayoutWrapper from "../components/layout/LayoutWrapper.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
