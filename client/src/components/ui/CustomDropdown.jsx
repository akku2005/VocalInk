import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Capture trigger position when opening
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  const selectedOption = options.find((opt) => opt[optionValueKey] === value);

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <div
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative w-full border border-[var(--border-color)] 
          rounded-lg bg-background text-text-primary cursor-pointer ${className}`}
      >
        <div className="px-3 py-1.5 flex justify-between items-center">
          <span>
            {selectedOption ? selectedOption[optionLabelKey] : placeholder}
          </span>
          <span className="ml-2 text-gray-400">▾</span>
        </div>
      </div>

      {open &&
        createPortal(
          <div
            className="absolute border border-[var(--border-color)] bg-background 
              rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              position: "absolute",
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
                  hover:bg-[var(--secondary-btn-hover2)] cursor-pointer 
                  bg-[--background] ${
                    value === opt[optionValueKey]
                      ? "bg-[var(--secondary-btn-hover3)] text-text-primary font-medium"
                      : ""
                  }`}
              >
                {opt[optionLabelKey]}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
