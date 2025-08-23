export default function IconButton({
  icon: Icon,
  size = 52,
  iconSize = 26,
  textColor = "text-[#5A4A38]",
  className = "",
  onClick,
  ariaLabel = "icon-button",
  bgColor = "var(--btn-bg-color)",
  hoverColor = "var(--btn-hover-color)",
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`cursor-pointer ${textColor} flex justify-center items-center rounded-full transition-colors duration-200 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
    >
      <Icon size={iconSize} />
    </button>
  );
}
