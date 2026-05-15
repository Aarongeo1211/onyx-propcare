import * as React from "react";
import { cn } from "../utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-cream/10 bg-onyx-900/60 px-4 py-2 text-sm text-cream placeholder:text-cream/30 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50",
          "hover:border-cream/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
