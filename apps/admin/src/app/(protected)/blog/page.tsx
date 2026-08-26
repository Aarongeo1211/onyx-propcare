"use client";

import { motion } from "framer-motion";
import { Pencil, X, Save, AlertCircle, Check, Sparkles, Trash2, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  metaDescription: string | null;
  tags: string[];
  isPublished: boolean;
  authorName: string;
  generatedBy: string | null;
  sourceTopic: string | null;
  createdAt: string;
}

export default function BlogAdminPage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function fetchPosts() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/blog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function generateNow() {
    if (!token) return;
    setGenerating(true);
    setGenerateMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/blog/generate-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.generated) {
        setGenerateMsg({ type: "ok", text: `Published: ${data.data.slug}` });
        fetchPosts();
      } else if (data.success) {
        const reasons: Record<string, string> = {
          not_configured: "ANTHROPIC_API_KEY is not set",
          disabled: "Auto-publish is disabled (BLOG_AUTOPUBLISH_ENABLED)",
          no_topics: "No uncovered topics remain",
          error: "Generation failed -- check server logs",
        };
        setGenerateMsg({ type: "err", text: reasons[data.data.reason] || "Nothing generated" });
      } else {
        setGenerateMsg({ type: "err", text: data.error || "Failed to generate" });
      }
    } catch {
      setGenerateMsg({ type: "err", text: "Network error" });
    } finally {
      setGenerating(false);
    }
  }

  async function deletePost(post: BlogPost) {
    if (!token) return;
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const res = await fetch(`${API_URL}/api/v1/admin/blog/${post.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setPosts((prev) => prev.filter((p) => p.id !== post.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-cream">Blog</h1>
          <p className="text-sm text-cream/35 mt-1">
            Posts auto-published by the content pipeline, plus manual oversight -- edit, unpublish, or delete anything.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={generateNow}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold/15 hover:bg-gold/25 border border-gold/30 rounded-xl text-sm text-gold disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating..." : "Generate now"}
          </button>
          {generateMsg && (
            <p className={`text-xs ${generateMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {generateMsg.text}
            </p>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-cream/8 bg-onyx-900/25 overflow-hidden"
      >
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-cream/5">
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Post</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Source</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Created</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Status</th>
              <th className="text-right px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/[0.03]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 rounded bg-onyx-800/50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-cream/25">
                  No posts yet. Use "Generate now" to publish the first one.
                </td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <motion.tr
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-cream/[0.02]"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm text-cream">{post.title}</p>
                    <p className="text-xs text-cream/25">/{post.slug}</p>
                  </td>
                  <td className="px-5 py-4">
                    {post.generatedBy ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-400">
                        <Bot className="h-3 w-3" />
                        AI
                      </span>
                    ) : (
                      <span className="text-xs text-cream/40">Manual</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-cream/35">
                    {new Date(post.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-2 text-xs ${post.isPublished ? "text-emerald-400" : "text-cream/25"}`}>
                      <span className={`h-2 w-2 rounded-full ${post.isPublished ? "bg-emerald-400" : "bg-cream/20"}`} />
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(post)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-cream/60 hover:text-gold hover:bg-gold/5 border border-cream/10 hover:border-gold/30 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => deletePost(post)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-cream/60 hover:text-red-400 hover:bg-red-500/5 border border-cream/10 hover:border-red-500/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {editing && (
        <EditPostDrawer
          post={editing}
          token={token!}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditPostDrawer({
  post,
  token,
  onClose,
  onSaved,
}: {
  post: BlogPost;
  token: string;
  onClose: () => void;
  onSaved: (p: BlogPost) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [metaDescription, setMetaDescription] = useState(post.metaDescription || "");
  const [content, setContent] = useState(post.content);
  const [tags, setTags] = useState(post.tags.join(", "));
  const [isPublished, setIsPublished] = useState(post.isPublished);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          excerpt: excerpt || null,
          metaDescription: metaDescription || null,
          content,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          isPublished,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "ok", text: "Post updated" });
        onSaved(data.data);
      } else {
        const errText = Array.isArray(data.error) ? data.error[0]?.message : data.error;
        setMsg({ type: "err", text: errText || "Failed to update post" });
      }
    } catch {
      setMsg({ type: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-onyx-950/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        className="w-full max-w-lg bg-onyx-900 border-l border-cream/10 h-full overflow-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-cream">Edit post</h2>
            <p className="text-xs text-cream/40 mt-0.5">/{post.slug}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream/5 rounded-lg text-cream/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Meta description (SEO)</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">
              Content (HTML -- h2/h3/p/ul/ol/li/strong/em/blockquote only)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-xs font-mono text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPublished(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                  isPublished
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "border-cream/10 text-cream/40 hover:border-cream/20"
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setIsPublished(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                  !isPublished
                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "border-cream/10 text-cream/40 hover:border-cream/20"
                }`}
              >
                Unpublished
              </button>
            </div>
          </div>

          {msg && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                msg.type === "ok"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {msg.type === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold/15 hover:bg-gold/25 border border-gold/30 rounded-lg text-sm text-gold disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-cream/10 hover:border-cream/20 text-cream/60 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
