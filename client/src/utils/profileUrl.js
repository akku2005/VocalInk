// Utility to build canonical profile handles and URLs
export const getProfileHandle = (userLike) => {
  if (!userLike) return "user";

  // If passed a string, treat as id/handle and strip leading @
  if (typeof userLike === "string") {
    const raw = userLike.replace(/^@/, "");
    return raw || "user";
  }

  const id = userLike._id || userLike.id || "";
  const username = userLike.username || userLike.handle || "";
  const displayName = userLike.displayName || userLike.name;

  if (username) return username;
  if (displayName) return displayName.replace(/\s+/g, "").toLowerCase();
  if (id) return String(id);

  return "user";
};

export const getProfilePath = (userLike) => {
  const handle = getProfileHandle(userLike);
  const normalized = handle.replace(/^@/, "");
  const looksLikeId = /^[a-f\d]{24}$/i.test(normalized);

  if (looksLikeId) {
    return `/profile/${normalized}`;
  }

  // Username-style path
  return `/profile/${normalized}`;
};
