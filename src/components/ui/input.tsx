"use client";

import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          className={clsx(
            "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-250 placeholder:text-gray-400",
            "focus:border-indigo-500 focus:bg-indigo-50/30 focus:outline-none focus:ring-[3px] focus:ring-indigo-500/15",
            error
              ? "border-red-300 focus:border-red-500 focus:bg-rose-50/30 focus:ring-red-500/15"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
