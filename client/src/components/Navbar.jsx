import React, { useState } from "react";
import "./Navbar.css";
import { SearchIcon, LucideBell, UserCircle, Menu } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full px-4 py-3 shadow-sm bg-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="text-[1.4rem] font-bold flex flex-row items-center text-black gap-8">
          Bloggr
          <div className="hidden md:flex  items-center gap-8 text-[16px]">
            <a href="#" className="font-[500]">
              Home
            </a>
            <a href="#" className="font-[500]">
              Explore
            </a>
            <a href="#" className="font-[500]">
              Create
            </a>
          </div>
        </div>

        {/* Desktop Menu */}

        {/* Right: Search + Icons */}
        <div className="flex items-center gap-4">
          {/* Search input */}
          <div className="relative hidden sm:flex items-center">
            <input
              type="text"
              placeholder="Search"
              className="bg-slate-100 text-blue-950 rounded-xl p-2 pl-10 w-[150px] md:w-[180px]"
            />
            <span className="absolute left-3 text-blue-950">
              <SearchIcon size={16} />
            </span>
          </div>

          {/* Bell */}
          <a
            href="#"
            className="text-gray-700 bg-slate-100 flex justify-center items-center rounded-xl w-[40px] h-10"
          >
            <LucideBell size={20} />
          </a>

          {/* Avatar */}
          <a
            href="#"
            className="text-gray-700 bg-slate-100 flex justify-center items-center rounded-xl w-[40px] h-10"
          >
            <UserCircle size={21} />
          </a>

          {/* Hamburger for Mobile */}
          <button
            className="md:hidden text-blue-950"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-4 text-center text-[16px]">
          <a href="#" className="font-[500]">
            Home
          </a>
          <a href="#">Explore</a>
          <a href="#">Create</a>
        </div>
      )}
    </nav>
  );
}
