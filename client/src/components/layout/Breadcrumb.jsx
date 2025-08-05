import React from "react";
import { Link } from "react-router-dom";
export default function Breadcrumb() {
  return (
    <div className="py-4 text-sm p-4 mb-4 bg-[#F5EFE8] dark:bg-[#1C1814] rounded-md">
      <nav className="text-[#BCA988] dark:text-[#A68C6D] flex items-center space-x-2">
        <Link
          to="/"
          className="custom-hover-link flex gap-2 font-medium transition-colors duration-300"
          style={{ color: "var(--links-color)" }}
        >
          <span className="hover:underline underline-offset-2">Home</span>
          <span>/</span>
        </Link>

        <span className="text-[#5C4F3B] dark:text-[#C6AD8F] font-medium">
          Article
        </span>
      </nav>
    </div>
  );
}
