import React from "react";
import SidebarTags from "../SidebarTags";

const SidebarTagsWrapper = ({ collapsed }) => {
  if (collapsed) return null;
  return (
    <div className="mt-6 px-2">
      <SidebarTags />
    </div>
  );
};

export default SidebarTagsWrapper;
