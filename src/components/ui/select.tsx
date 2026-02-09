"use client";

import { clsx } from "clsx";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, required, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          required={required}
          className={clsx(
            "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-250",
            "focus:border-indigo-500 focus:bg-indigo-50/30 focus:outline-none focus:ring-[3px] focus:ring-indigo-500/15",
            error
              ? "border-red-300 focus:border-red-500 focus:bg-rose-50/30 focus:ring-red-500/15"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
