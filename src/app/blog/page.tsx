import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

export default async function BlogListingPage() {
  let posts: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    author: { name: string };
  }[] = [];

  try {
    posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="text-center">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          RevBook Blog
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-500">
          Insights, tips, and updates for service businesses
        </p>
      </header>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="mx-auto mt-10 h-px w-16 bg-gray-300" />

      {/* ── Blog Post Grid ───────────────────────────────────────── */}
      {posts.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-gray-200 bg-white py-20 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-900">
            No blog posts yet.
          </p>
          <p className="mt-2 text-sm text-gray-500">Check back soon!</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="font-serif text-xl font-bold leading-snug text-gray-900 transition-colors group-hover:text-indigo-600 sm:text-2xl">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-medium text-gray-600">
                    {post.author.name}
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  {post.publishedAt && (
                    <time dateTime={post.publishedAt.toISOString()}>
                      {format(post.publishedAt, "MMMM d, yyyy")}
                    </time>
                  )}
                </div>

                <span className="mt-5 inline-block text-sm font-semibold text-indigo-600 transition-colors group-hover:text-indigo-700">
                  Read more &rarr;
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="mt-20 border-t border-gray-200 pt-8 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-gray-400 transition-colors hover:text-indigo-600"
        >
          &larr; Back to RevBook
        </Link>
      </footer>
    </div>
  );
}
