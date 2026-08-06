"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image as ImageIcon, Video, Loader2, Pencil, X, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MAX_MEDIA = 5;

interface EventMedia {
  id: string;
  url: string;
  publicId: string;
  type: "IMAGE" | "VIDEO";
  order: number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  order: number;
  media: EventMedia[];
}

const emptyForm = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  category: "",
};

// Parses a fetch Response into { success, data, error }, never throws — a non-JSON
// body (proxy error page, rate-limit HTML, etc.) becomes a readable message instead
// of an opaque parse exception, and a non-2xx status always produces an error even
// if the body happens to be valid JSON with success left undefined.
async function parseApiResponse(res: Response): Promise<{ success: boolean; data?: any; error?: string }> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // fall through with body = null
  }
  if (!res.ok) {
    return { success: false, error: body?.error || `Request failed (${res.status})` };
  }
  if (body && typeof body.success === "boolean") return body;
  return { success: true, data: body };
}

export default function FortyPlusEventsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function flashSuccess(message: string) {
    setSuccess(message);
    setTimeout(() => setSuccess((s) => (s === message ? null : s)), 4000);
  }

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/40plus/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await parseApiResponse(res);
      if (result.success) {
        setEvents(result.data || []);
      } else {
        setError(result.error || "Failed to load events");
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed to load events: ${err.message}` : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(event: EventItem) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      eventDate: event.eventDate ? event.eventDate.slice(0, 10) : "",
      location: event.location || "",
      category: event.category || "",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Your session has expired. Please log out and log back in.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
        location: form.location || undefined,
        category: form.category || undefined,
      };
      const url = editingId
        ? `${API_URL}/api/v1/admin/40plus/events/${editingId}`
        : `${API_URL}/api/v1/admin/40plus/events`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await parseApiResponse(res);
      if (!result.success) throw new Error(result.error || "Failed to save event");
      setShowForm(false);
      flashSuccess(editingId ? "Event updated." : "Event created.");
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(event: EventItem) {
    if (!token) {
      setError("Your session has expired. Please log out and log back in.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/40plus/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
      });
      const result = await parseApiResponse(res);
      if (!result.success) throw new Error(result.error || "Failed to update status");
      flashSuccess(event.status === "PUBLISHED" ? "Event unpublished." : "Event published.");
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleDelete(event: EventItem) {
    if (!confirm(`Delete "${event.title}"? This removes all its media too.`)) return;
    if (!token) {
      setError("Your session has expired. Please log out and log back in.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/40plus/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await parseApiResponse(res);
      if (!result.success) throw new Error(result.error || "Failed to delete event");
      flashSuccess("Event deleted.");
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }

  async function handleFilesSelected(eventId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;
    if (!token) {
      setError("Your session has expired. Please log out and log back in.");
      return;
    }

    const event = events.find((ev) => ev.id === eventId);
    const remaining = MAX_MEDIA - (event?.media.length || 0);
    if (remaining <= 0) {
      setError(`This event already has the maximum of ${MAX_MEDIA} posters/videos.`);
      return;
    }

    const fileArray = Array.from(files).slice(0, remaining);
    setUploadingFor(eventId);
    setError(null);
    try {
      const images = fileArray.filter((f) => f.type.startsWith("image/"));
      const videos = fileArray.filter((f) => f.type.startsWith("video/"));
      const unrecognized = fileArray.length - images.length - videos.length;
      if (unrecognized > 0) {
        throw new Error(`${unrecognized} file(s) were not a recognized image or video type and were skipped.`);
      }

      const uploaded: { url: string; publicId: string; type: "IMAGE" | "VIDEO" }[] = [];

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((f) => formData.append("images", f));
        const res = await fetch(`${API_URL}/api/v1/upload/40plus/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await parseApiResponse(res);
        if (!result.success) throw new Error(result.error || "Image upload failed");
        (result.data || []).forEach((r: { url: string; publicId: string }) =>
          uploaded.push({ url: r.url, publicId: r.publicId, type: "IMAGE" })
        );
      }

      if (videos.length > 0) {
        const formData = new FormData();
        videos.forEach((f) => formData.append("videos", f));
        const res = await fetch(`${API_URL}/api/v1/upload/40plus/videos`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await parseApiResponse(res);
        if (!result.success) throw new Error(result.error || "Video upload failed");
        (result.data || []).forEach((r: { url: string; publicId: string }) =>
          uploaded.push({ url: r.url, publicId: r.publicId, type: "VIDEO" })
        );
      }

      if (uploaded.length > 0) {
        const attachRes = await fetch(`${API_URL}/api/v1/admin/40plus/events/${eventId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ media: uploaded }),
        });
        const attachResult = await parseApiResponse(attachRes);
        if (!attachResult.success) throw new Error(attachResult.error || "Failed to attach media");
      }

      flashSuccess(`${uploaded.length} file(s) uploaded.`);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFor(null);
    }
  }

  async function handleRemoveMedia(eventId: string, mediaId: string) {
    if (!confirm("Remove this poster/video?")) return;
    if (!token) {
      setError("Your session has expired. Please log out and log back in.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/40plus/events/${eventId}/media/${mediaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await parseApiResponse(res);
      if (!result.success) throw new Error(result.error || "Failed to remove media");
      flashSuccess("Media removed.");
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove media");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-cream">Onyx 40+ Events</h1>
          <p className="mt-1 text-sm text-cream/35">
            Manage events for the Onyx 40+ community landing page. Up to {MAX_MEDIA} posters/videos per event.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-onyx-950 hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-cream/8 bg-onyx-900/30 p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-cream">
              {editingId ? "Edit Event" : "New Event"}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-cream/40 hover:text-cream">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-cream/40">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-cream/10 bg-onyx-950 px-3 py-2 text-sm text-cream focus:border-gold/40 focus:outline-none"
                placeholder="Farm Visit — Nandi Hills"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-cream/40">Date</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                className="w-full rounded-lg border border-cream/10 bg-onyx-950 px-3 py-2 text-sm text-cream focus:border-gold/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-cream/40">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-cream/10 bg-onyx-950 px-3 py-2 text-sm text-cream focus:border-gold/40 focus:outline-none"
                placeholder="Nature Experience"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-cream/40">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-lg border border-cream/10 bg-onyx-950 px-3 py-2 text-sm text-cream focus:border-gold/40 focus:outline-none"
                placeholder="Nandi Hills, Bangalore"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-cream/40">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-cream/10 bg-onyx-950 px-3 py-2 text-sm text-cream focus:border-gold/40 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-onyx-950 hover:bg-gold/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? "Save Changes" : "Create Event"}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-10 text-center text-sm text-cream/35">
          No events yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-cream">{event.title}</p>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] ${
                        event.status === "PUBLISHED"
                          ? "border-emerald-500/20 text-emerald-400"
                          : "border-cream/10 text-cream/55"
                      }`}
                    >
                      {event.status}
                    </span>
                    {event.category && (
                      <span className="rounded-full border border-gold/15 px-3 py-1 text-[10px] text-gold/70">
                        {event.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-cream/25">
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "No date set"}
                    {event.location ? ` • ${event.location}` : ""}
                  </p>
                  {event.description && <p className="mt-2 max-w-2xl text-sm text-cream/55">{event.description}</p>}
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(event)}
                    className="flex items-center gap-1.5 rounded-lg border border-cream/10 px-3 py-2 text-xs text-cream/55 hover:border-gold/20 hover:text-gold"
                  >
                    {event.status === "PUBLISHED" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(event)}
                    className="flex items-center gap-1.5 rounded-lg border border-cream/10 px-3 py-2 text-xs text-cream/55 hover:border-gold/20 hover:text-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(event)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/15 px-3 py-2 text-xs text-red-400/80 hover:border-red-500/30 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Media */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cream/5 pt-4">
                {event.media.map((m) => (
                  <div key={m.id} className="group relative h-20 w-28 overflow-hidden rounded-lg border border-cream/10 bg-onyx-950">
                    {m.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Video className="h-6 w-6 text-cream/40" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(event.id, m.id)}
                      className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 group-hover:block"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {event.media.length < MAX_MEDIA && (
                  <label
                    className={`flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-cream/15 text-cream/35 hover:border-gold/30 hover:text-gold ${
                      uploadingFor === event.id ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }`}
                  >
                    {uploadingFor === event.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[10px]">{event.media.length}/{MAX_MEDIA} added</span>
                      </>
                    )}
                    {/* A label-wrapped input triggers via the browser's native label-click-through,
                        not a scripted .click() — privacy-hardened browsers (e.g. Brave Shields) can
                        silently swallow programmatic clicks on hidden file inputs, so this avoids
                        that failure mode entirely rather than working around it. */}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                      multiple
                      disabled={uploadingFor === event.id}
                      className="sr-only"
                      onChange={(e) => handleFilesSelected(event.id, e)}
                    />
                  </label>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
