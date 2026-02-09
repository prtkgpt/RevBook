import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Markdown-to-HTML helper                                            */
/* ------------------------------------------------------------------ */

function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities (but preserve markdown syntax characters)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings (must come before paragraph processing)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic (bold first to avoid conflict with italic)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-indigo-600 underline underline-offset-2 hover:text-indigo-700" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Process unordered list blocks: consecutive lines starting with "- "
  html = html.replace(
    /(^- .+(?:\n- .+)*)/gm,
    (match) => {
      const items = match
        .split("\n")
        .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
        .join("\n");
      return `<ul>${items}</ul>`;
    }
  );

  // Split into blocks by double newlines for paragraph wrapping
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap block-level elements in <p>
      if (
        trimmed.startsWith("<h1") ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<h3") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<blockquote")
      ) {
        return trimmed;
      }
      // Replace single newlines with <br> inside paragraphs
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post: {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string | null;
    publishedAt: Date | null;
    author: { name: string };
  } | null = null;

  try {
    post = await prisma.blogPost.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: { author: { select: { name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
  }

  if (!post) {
    notFound();
  }

  const contentHtml = markdownToHtml(post.content);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      {/* ── Back Navigation ──────────────────────────────────────── */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
      >
        &larr; Back to Blog
      </Link>

      {/* ── Article ──────────────────────────────────────────────── */}
      <article className="mx-auto mt-10 max-w-[720px]">
        {/* Title */}
        <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>

        {/* Author and date */}
        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{post.author.name}</span>
          <span aria-hidden="true">&middot;</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {format(post.publishedAt, "MMMM d, yyyy")}
            </time>
          )}
        </div>

        {/* Divider */}
        <div className="mt-8 h-px w-full bg-gray-200" />

        {/* Content */}
        <div
          className="blog-content mt-8 text-base leading-relaxed text-gray-700 sm:text-lg sm:leading-relaxed [&>h1]:mb-4 [&>h1]:mt-10 [&>h1]:font-serif [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 sm:[&>h1]:text-3xl [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:font-serif [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 sm:[&>h2]:text-2xl [&>h3]:mb-3 [&>h3]:mt-6 [&>h3]:font-serif [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-gray-900 sm:[&>h3]:text-xl [&>hr]:my-8 [&>hr]:border-gray-200 [&>p]:mb-6 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-indigo-600 [&_strong]:font-semibold [&_strong]:text-gray-900"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {/* ── Bottom Navigation ────────────────────────────────────── */}
      <div className="mx-auto mt-16 max-w-[720px] border-t border-gray-200 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
        >
          &larr; Back to Blog
        </Link>
      </div>
    </div>
  );
}
