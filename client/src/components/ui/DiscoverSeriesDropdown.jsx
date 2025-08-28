import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
export default function DiscoverSeriesDropDown({ sortBy, setSortBy }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const options = [
    { value: "recent", label: "Most Recent" },
    { value: "popular", label: "Most Popular" },
    { value: "episodes", label: "Most Episodes" },
    { value: "completion", label: "Best Rate" },
    { value: "rating", label: "Highest Rated" },
  ];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-12 w-40 flex items-center justify-between rounded-lg border border-[var(--border-color)]   px-3 text-sm cursor-pointer"
      >
        {options.find((o) => o.value === sortBy)?.label || "Sort"}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-40 rounded-lg border border-[var(--border-color)] bg-[var(--background)] shadow-lg z-50 p-2 flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-muted hover:bg-[var(--secondary-btn-hover2)] cursor-pointer rounded  ${
                sortBy === option.value ? "bg-muted/60 font-medium" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
