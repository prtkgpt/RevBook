import Link from "next/link";

export const metadata = {
  title: "RevBook Blog",
  description: "Insights, tips, and updates for service businesses",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Navigation Bar ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/blog"
            className="text-xl font-bold tracking-tight text-gray-900"
          >
            RevBook
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
          >
            Back to RevBook
          </Link>
        </div>
      </nav>

      {/* ── Page Content ───────────────────────────────────────────── */}
      <main>{children}</main>
    </div>
  );
}
