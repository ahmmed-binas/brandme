"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Clock, Loader2 } from "lucide-react";
import type { JournalPost } from "@/lib/content/journal";
import { PostBodyEditor } from "./PostBodyEditor";

/**
 * A member's writing form for the Journal (/blog/write), and the list of what
 * they've sent with its status. Posts go to /api/journal/submissions and wait
 * for an admin to publish them.
 */
export function JournalSubmit({ categories, initial }: { categories: string[]; initial: JournalPost[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories.includes("Career") ? "Career" : (categories[0] ?? ""));
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [posts, setPosts] = useState(initial);

  const send = async () => {
    setSending(true);
    setMessage(null);
    const response = await fetch("/api/journal/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, body }),
    }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setSending(false);
    if (!response?.ok) {
      setMessage({
        kind: "error",
        text: result?.error ?? "That didn’t send. Check your connection and try again.",
      });
      return;
    }
    setPosts(result.posts);
    setTitle("");
    setDescription("");
    setBody("");
    setMessage({
      kind: "ok",
      text: "Sent. We’ll read it and publish it if it’s a good fit; it appears in your list below.",
    });
  };

  const field =
    "w-full rounded-xl border border-rule bg-paper px-4 py-3 text-ink outline-none focus:border-ink";

  return (
    <div className="space-y-10">
      <section className="space-y-5 rounded-3xl border border-rule p-5 sm:p-7">
        <label className="block">
          <span className="text-[0.9rem] font-medium text-ink">Title</span>
          <input
            value={title}
            maxLength={160}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="How I got my first three clients from my website"
            className={`${field} mt-2 font-display text-xl`}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
          <label className="block">
            <span className="text-[0.9rem] font-medium text-ink">One-line summary (optional)</span>
            <input
              value={description}
              maxLength={300}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What readers will learn"
              className={`${field} mt-2`}
            />
          </label>
          <label className="block">
            <span className="text-[0.9rem] font-medium text-ink">Topic</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`${field} mt-2`}
            >
              {categories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <span className="text-[0.9rem] font-medium text-ink">Your post</span>
          <PostBodyEditor value={body} onChange={setBody} className="mt-2" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={sending || !title.trim() || !body.trim()}
            onClick={() => void send()}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-signal hover:text-signal-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending && <Loader2 size={16} className="animate-spin" />}
            Send for review
          </button>
          <p className="text-[0.85rem] text-ink-soft">Nothing is public until we publish it.</p>
        </div>
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`rounded-xl px-4 py-3 text-[0.92rem] ${message.kind === "error" ? "border border-red-300 bg-red-50 text-red-900" : "border border-emerald-300 bg-emerald-50 text-emerald-900"}`}
          >
            {message.text}
          </p>
        )}
      </section>

      {posts.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-ink">Your posts</h2>
          <ul className="mt-4 divide-y divide-rule rounded-2xl border border-rule">
            {posts.map((post) => (
              <li key={post.slug} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="min-w-0">
                  <span className="block truncate text-ink">{post.title}</span>
                  <span className="text-[0.8rem] text-ink-soft">{post.category}</span>
                </span>
                {post.publishedAt ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[0.88rem] text-emerald-700"
                  >
                    <Check size={15} /> Published
                  </Link>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.88rem] text-amber-700">
                    <Clock size={15} /> Waiting for review
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
