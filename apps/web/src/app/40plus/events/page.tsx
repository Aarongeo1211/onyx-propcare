import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, PartyPopper } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://onyx-api-production-b3da.up.railway.app";

const PAGE_TITLE = "Events | Onyx 40+";
const PAGE_DESCRIPTION =
  "Photos and videos from Onyx 40+ community events — farm visits, networking meetups, wellness retreats, and celebrations for people above 40.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/40plus/events",
  },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [{ url: absoluteUrl("/40plus/hero.jpg"), width: 1240, height: 1860, alt: "Onyx 40+ events" }],
  },
};

interface EventMedia {
  id: string;
  url: string;
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
  media: EventMedia[];
}

async function getEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/40plus/events`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function FortyPlusEventsPage() {
  const events = await getEvents();

  const eventsSchema = events.map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: event.eventDate || undefined,
    location: event.location
      ? { "@type": "Place", name: event.location }
      : undefined,
    image: event.media.filter((m) => m.type === "IMAGE").map((m) => m.url),
    organizer: { "@type": "Organization", name: "Onyx 40+" },
  }));

  return (
    <div className="min-h-screen bg-onyx-950">
      {eventsSchema.length > 0 && <JsonLd data={eventsSchema} />}

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-20">
        <Link
          href="/40plus"
          className="inline-flex items-center gap-2 text-sm font-body text-cream/50 hover:text-cream/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Onyx 40+
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <PartyPopper className="h-7 w-7" style={{ color: "#F2791E" }} />
          <h1 className="font-display text-3xl font-semibold text-cream md:text-4xl">Community Events</h1>
        </div>
        <p className="mt-3 max-w-2xl font-body text-cream/55">{PAGE_DESCRIPTION}</p>

        {events.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-cream/8 bg-onyx-900/40 p-12 text-center">
            <p className="font-body text-cream/45">No events published yet — check back soon.</p>
          </div>
        ) : (
          <div className="mt-12 space-y-16">
            {events.map((event) => (
              <article key={event.id} className="border-b border-cream/8 pb-16 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl font-semibold text-cream">{event.title}</h2>
                  {event.category && (
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] font-body"
                      style={{ borderColor: "#F2791E33", color: "#F2791E" }}
                    >
                      {event.category}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-cream/45">
                  {event.eventDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.eventDate)}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="mt-4 max-w-3xl font-body text-sm leading-relaxed text-cream/65">{event.description}</p>
                )}

                {event.media.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {event.media.map((m) =>
                      m.type === "IMAGE" ? (
                        <div key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-onyx-900">
                          <Image src={m.url} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                        </div>
                      ) : (
                        <div key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-onyx-900">
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video src={m.url} controls className="h-full w-full object-cover" preload="none" />
                        </div>
                      )
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
