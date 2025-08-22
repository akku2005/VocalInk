export default function IconButton({
  icon: Icon,
  size = 29,
  iconSize = 20,
  textColor = "text-[var(--nav-links-color)]",
  className = "",
  onClick,
  ariaLabel = "icon-button",

  hoverColor = "[var(--btn-hover-color)]",
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`cursor-pointer ${textColor} hover:bg-[var(--btn-hover-color)] flex justify-center items-center rounded-xl  transition-colors duration-200 ${className}`}
      style={{
        width: 35,
        height: 36,
      }}
    >
      <Icon size={iconSize} />
    </button>
  );
}
