import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20": variant === "success",
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20": variant === "warning",
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
