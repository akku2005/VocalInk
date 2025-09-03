import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
export default function CustomDropdown({
  label,
  value,
  onChange,
  options,
  optionLabelKey = "name",
  optionValueKey = "id",
  placeholder = "Select...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  useEffect(() => {
    if (!open) return;

    const handlePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(options.length * 40, 300);
      if (spaceBelow < dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    };

    handlePosition();
    window.addEventListener("resize", handlePosition);
    window.addEventListener("scroll", handlePosition, true);
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handlePosition);
      window.removeEventListener("scroll", handlePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, options.length]);

  const selectedOption = options.find((opt) => opt[optionValueKey] === value);

  return (
    <div className="flex flex-col w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <div
        className={`relative w-full border border-[var(--border-color)] rounded-lg  text-text-primary cursor-pointer ${className}`}
      >
        {/* Selected value */}
        <div
          onClick={() => setOpen((prev) => !prev)}
          className="px-3 py-1.5 flex justify-between items-center z-50"
        >
          <span>
            {selectedOption ? selectedOption[optionLabelKey] : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Dropdown menu */}
        {open && (
          <div
            className={`absolute left-0 w-full mt-1 border border-[var(--border-color)] bg-[var(--background)] rounded-lg shadow-lg z-[9999] overflow-y-auto`}
            style={{
              top: dropdownPosition === "bottom" ? "100%" : "auto",
              bottom: dropdownPosition === "top" ? "100%" : "auto",
              maxHeight: "300px",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt[optionValueKey]}
                onClick={() => {
                  onChange(opt[optionValueKey]);
                  setOpen(false);
                }}
                className={`px-3 py-1 m-1.5 rounded 
                     cursor-pointer 
                    bg-[--background] ${
                      value === opt[optionValueKey]
                        ? "bg-[var(--secondary-btn-hover3)]  text-text-primary font-medium "
                        : " hover:bg-[var(--secondary-btn-hover2)]"
                    }`}
              >
                {opt[optionLabelKey]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
