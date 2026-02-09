import { clsx } from "clsx";

export function Card({
  children,
  className,
  hover,
  gradient,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}) {
  return (
    <div
      className={clsx(
        "relative rounded-xl border border-gray-200/80 bg-white shadow-sm",
        hover && "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/60 hover:shadow-lg",
        gradient && "overflow-hidden",
        className
      )}
    >
      {gradient && (
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
          }}
        />
      )}
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("border-b border-gray-100 px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-6 py-5", className)}>{children}</div>;
}
