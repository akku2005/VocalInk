import React, { useState, useRef } from "react";
import "../../styles/Navbar.css";
import Tooltip from "../ui/Tooltip";
import { useTheme } from "../context/ThemeContext";

import IconButton from "../ui/IconButton";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  SearchIcon,
  LucideBell,
  UserCircle,
  Menu,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [themeIcon, setThemeIcon] = useState(false);
  const { toggleTheme, theme } = useTheme();
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };
  const handleMouseClick = () => {
    setThemeIcon((prev) => !prev);
  };
  return (
    <nav
      className={`w-full  px-3 py-1   backdrop-blur-md navbar-container  
  fixed top-0 left-0 z-50 ${
    theme === "light"
      ? "bg-[#f7ede1]/80 border-gray-200"
      : "bg-[#1A1A1A]/80 border-gray-700"
  }`}
    >
      <div className=" mx-auto    flex items-center justify-between  px-4 py-1.5 rounded-full">
        {/* Left: Logo */}
        <div className="text-[1.2rem] font-bold flex flex-row items-center  gap-8">
          <Link to="/" className="cursor-pointer ">
            <h3
              className="text-[var(--main-headline-color)] font-semibold tracking-tight   text-[1.3rem]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {" "}
              VocalLink
            </h3>
          </Link>

          <div className="hidden md:flex  items-center gap-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `relative ${
                  isActive ? "text-[#ca7308]" : "text-[var(--nav-links-color)]"
                } hover:!text-[var(--nav-links-hover-color)] font-normal tracking-wide text-[0.89rem] transition-colors duration-300 ease-out group`
              }
            >
              Home
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#ca7308] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
            </NavLink>

            <div
              className=" relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex  cursor-pointer items-center gap-1 p-2">
                <NavLink
                  to="/explore"
                  className={({ isActive }) =>
                    `relative ${
                      isActive
                        ? "text-[#ca7308]"
                        : "text-[var(--nav-links-color)]"
                    } hover:!text-[var(--nav-links-hover-color)] font-normal tracking-wide text-[0.89rem] transition-colors duration-300 ease-out group`
                  }
                >
                  Explore
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#ca7308] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                </NavLink>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-[var(--nav-links-color)]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[var(--nav-links-color)]" />
                )}
              </div>

              {isOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-gray-300 ring-opacity-1 z-10">
                  <div className="p-4">
                    <h5 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-2">
                      Trending
                    </h5>
                    <ul className="space-y-1 mb-4">
                      <li>
                        <a
                          href="/topics/technology"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Technology
                        </a>
                      </li>
                      <li>
                        <a
                          href="/topics/remote-work"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Remote Work
                        </a>
                      </li>
                      <li>
                        <a
                          href="/topics/productivity"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Productivity
                        </a>
                      </li>
                    </ul>

                    <h5 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-2">
                      Categories
                    </h5>
                    <ul className="space-y-1">
                      <li>
                        <a
                          href="/categories/career"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Career Development
                        </a>
                      </li>
                      <li>
                        <a
                          href="/categories/culture"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Company Culture
                        </a>
                      </li>
                      <li>
                        <a
                          href="/categories/ai"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          AI & Automation
                        </a>
                      </li>
                      <li>
                        <a
                          href="/categories/business"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Business & Entrepreneurship
                        </a>
                      </li>
                    </ul>
                  </div>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `relative ${
                        isActive
                          ? "text-[#ca7308]"
                          : "text-[var(--nav-links-color)]"
                      } hover:!text-[var(--nav-links-hover-color)] font-normal tracking-wide text-[0.89rem] transition-colors duration-300 ease-out group`
                    }
                  >
                    Home
                    <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#ca7308] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                  </NavLink>
                </div>
              )}
            </div>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `relative ${
                  isActive ? "text-[#ca7308]" : "text-[var(--nav-links-color)]"
                } hover:!text-[var(--nav-links-hover-color)] font-normal tracking-wide text-[0.89rem] transition-colors duration-300 ease-out group`
              }
            >
              About
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#ca7308] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `relative ${
                  isActive ? "text-[#ca7308]" : "text-[var(--nav-links-color)]"
                } hover:!text-[var(--nav-links-hover-color)] font-normal tracking-wide text-[0.89rem] transition-colors duration-300 ease-out group`
              }
            >
              Contact
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#ca7308] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
            </NavLink>
          </div>
        </div>

        {/* Desktop Menu */}

        {/* Right: Search + Icons */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative hidden sm:flex items-center">
            <input
              type="text"
              placeholder="Search"
              className=" bg-[var(--nav-searchbar)] text-[var(--nav-searchbar-text)] placeholder-[var(--navbar-placeholder-text)] 
              focus:ring-1 focus:ring-[var(--navbar-searchbar-focus-ring)] text-[0.89rem] focus:outline-none
              
             rounded-full px-4 pl-11.5 py-2.5 text-sm w-[190px] md:w-[290px]"
            />

            <span className="absolute left-3 text-[var(--nav-searchbar-text)]">
              <SearchIcon size={24} />
            </span>
          </div>

          {/* change theme icon */}

          {/* Bell */}
          {/* <Tooltip content="Notifications">
            <IconButton icon={LucideBell} className="   " />
          </Tooltip> */}

          {/* Avatar */}
          {/* <Tooltip content="Profile">
            <IconButton icon={UserCircle} />
          </Tooltip> */}

          {/* Login button */}
          <button className="      border border-gray-300 text-[var(--nav-links-color)]   px-4 py-[6px] rounded-lg transition-colors duration-300 cursor-pointer text-[0.89rem]">
            Sign In
          </button>

          <button className="  bg-amber-600   text-white   px-4 py-[6.5px] rounded-lg transition-colors duration-300 cursor-pointer text-[0.89rem]">
            Sign Up
          </button>

          <Tooltip content="Theme">
            <IconButton
              icon={theme === "light" ? Sun : Moon}
              onClick={toggleTheme}
            />
          </Tooltip>
          {/* Hamburger for Mobile */}
          <button
            className="md:hidden text-blue-950"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={23} />
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
