import { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ 
  className, 
  type = 'text',
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  showPasswordToggle = false,
  multiline = false,
  rows = 3,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type;

  const inputClasses = cn(
    "flex w-full rounded-md border bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 theme-transition",
    "border-border focus:border-primary-500",
    error && "border-error focus:border-error focus-visible:ring-error",
    isFocused && !error && "border-primary-500",
    multiline ? "min-h-[80px] resize-none" : "h-10",
    LeftIcon && "pl-10",
    (RightIcon || (showPasswordToggle && type === 'password')) && "pr-10",
    className
  );

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}
        
        <InputComponent
          ref={ref}
          type={inputType}
          className={inputClasses}
          rows={multiline ? rows : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        
        {RightIcon && !showPasswordToggle && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {hint && !error && (
        <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input; 