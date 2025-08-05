// src/components/ui/Tooltip.jsx
import React, { useState } from "react";

const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      <span
        className={`
          absolute top-full mt-2 left-1/2 -translate-x-1/2 
          whitespace-nowrap rounded-md px-1.5 py-1 bg-[#413a2e] text-white
          transition-opacity duration-300 text-sm
          ${isVisible ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        {content}
      </span>
    </div>
  );
};

export default Tooltip;
