"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!editId);
  const [error, setError] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const fetchPost = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${id}`);
      if (!res.ok) throw new Error("Post not found");
      const data = await res.json();
      setTitle(data.post.title);
      setSlug(data.post.slug);
      setExcerpt(data.post.excerpt || "");
      setContent(data.post.content);
      setStatus(data.post.status);
      setSlugManual(true);
    } catch {
      setError("Failed to load post");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (editId) {
      fetchPost(editId);
    }
  }, [editId, fetchPost]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editId) {
        // Update existing post
        const res = await fetch(`/api/admin/posts/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, excerpt, content, status }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update post");
          return;
        }
      } else {
        // Create new post
        const res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, excerpt, content, status }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create post");
          return;
        }
      }

      router.push("/admin/posts");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="page-enter">
        <div className="mb-8">
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {editId ? "Edit Post" : "New Post"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {editId
              ? "Update the blog post content and settings."
              : "Create a new blog post for the RevBook blog."}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/posts")}
          className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
        >
          Back to Posts
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="My Awesome Blog Post"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Slug <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManual(true);
                  }}
                  required
                  placeholder="my-awesome-blog-post"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {slugManual && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManual(false);
                    setSlug(slugify(title));
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Auto-generate from title
                </button>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="A brief summary of the post..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Content (Markdown) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={16}
                placeholder="Write your blog post content in Markdown..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-mono text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
              />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Status
                </span>
                <Badge
                  variant={status === "PUBLISHED" ? "success" : "warning"}
                >
                  {status === "PUBLISHED" ? "Published" : "Draft"}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() =>
                  setStatus(status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  status === "PUBLISHED" ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                    status === "PUBLISHED" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => router.push("/admin/posts")}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <Button type="submit" loading={loading}>
              {editId ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
