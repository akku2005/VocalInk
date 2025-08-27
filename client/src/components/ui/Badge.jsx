import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Badge = forwardRef(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default:
        "bg-secondary-100 dark: text-secondary-700 dark:text-white hover:bg-[var(--secondary-btn-hover)]",
      secondary:
        "bg-secondary-100 dark:bg-white/20 text-secondary-900  hover:bg-[var(--secondary-btn-hover)]",
      destructive: "bg-error text-white hover:bg-red-600",
      outline:
        "text-text-primary border border-border hover:bg-surface dark:hover:bg-white/10",
      success: "bg-success text-white hover:bg-green-600",
      warning: "bg-warning text-white hover:bg-yellow-600",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full text-[var(--text-color)]  font-medium border px-2.5 py-0.5 text-xs  transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
