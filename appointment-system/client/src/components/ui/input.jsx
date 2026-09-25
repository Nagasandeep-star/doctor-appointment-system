import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200',
        'bg-white dark:bg-slate-900',
        'border-slate-200 dark:border-slate-700',
        'text-slate-900 dark:text-slate-100',
        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-400 focus:ring-red-400',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
