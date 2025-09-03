import React from 'react';

const Textarea = React.forwardRef(({ 
  className = '', 
  variant = 'default',
  size = 'default',
  error,
  ...props 
}, ref) => {
  const baseClasses = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    default: 'border-input',
    error: 'border-destructive focus-visible:ring-destructive'
  };
  
  const sizeClasses = {
    default: 'px-3 py-2 text-sm',
    sm: 'px-2 py-1 text-xs',
    lg: 'px-4 py-3 text-base'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    error && 'border-destructive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      <textarea
        ref={ref}
        className={classes}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea; 