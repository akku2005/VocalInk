import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation";

    const variants = {
      primary:
        "bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500 shadow-sm hover:shadow-md",
      secondary:
        "bg-secondary-100 dark:bg-white/20 hover:bg-secondary-200 dark:hover:bg-white/30 text-secondary-900 dark:text-white focus:ring-secondary-500 border border-secondary-200 dark:border-white/20",
      ghost:
        "hover:bg-primary-50 dark:hover:bg-white/10 text-text-primary focus:ring-primary-500",
      outline:
        "border border-[var(--border-color)] hover:bg-[var(--secondary-btn-hover2)] text-text-primary backdrop-blur-sm",
      danger:
        "bg-error hover:bg-red-600 text-white focus:ring-error shadow-sm hover:shadow-md",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm rounded-md min-h-[36px]",
      md: "px-4 py-2.5 text-sm rounded-lg min-h-[40px]",
      lg: "px-6 py-3 text-base rounded-lg min-h-[48px]",
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
