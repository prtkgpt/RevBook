import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
type BadgeStyle = "solid" | "outline" | "pulse";

export function Badge({
  children,
  variant = "default",
  style = "solid",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: BadgeStyle;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none transition-colors duration-200",
        /* Solid fills */
        style === "solid" && {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20": variant === "success",
          "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20": variant === "warning",
          "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20": variant === "danger",
          "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20": variant === "info",
        },
        /* Outline style */
        style === "outline" && {
          "text-gray-600 ring-1 ring-inset ring-gray-300": variant === "default",
          "text-emerald-700 ring-1 ring-inset ring-emerald-400": variant === "success",
          "text-amber-700 ring-1 ring-inset ring-amber-400": variant === "warning",
          "text-rose-700 ring-1 ring-inset ring-rose-400": variant === "danger",
          "text-indigo-700 ring-1 ring-inset ring-indigo-400": variant === "info",
        },
        /* Pulse style -- live/active indicator */
        style === "pulse" && "badge-pulse",
        style === "pulse" && {
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20": variant === "success" || variant === "default",
          "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20": variant === "warning",
          "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20": variant === "danger",
          "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20": variant === "info",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
