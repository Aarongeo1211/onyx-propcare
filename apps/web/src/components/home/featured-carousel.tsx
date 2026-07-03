"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";

const AUTOPLAY_MS = 4500;
const TRANSITION_MS = 600;

interface FeaturedCarouselProps {
  properties: PropertyCardData[];
}

export function FeaturedCarousel({ properties }: FeaturedCarouselProps) {
  const count = properties.length;
  // Three copies so the track can move a step in either direction and get
  // silently re-centered without ever showing an empty/wrong frame.
  const track = [...properties, ...properties, ...properties];

  const [index, setIndex] = useState(count);
  const [withTransition, setWithTransition] = useState(true);
  const [itemWidth, setItemWidth] = useState(0);
  const [paused, setPaused] = useState(false);

  const itemRef = useRef<HTMLDivElement>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function measure() {
      if (itemRef.current) setItemWidth(itemRef.current.getBoundingClientRect().width);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [count]);

  const step = useCallback(
    (direction: 1 | -1) => {
      setWithTransition(true);
      setIndex((i) => i + direction);
    },
    []
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => step(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count, step]);

  // Silently re-center the index once it drifts into the outer copies, so
  // the loop never runs out of cards to slide into.
  useEffect(() => {
    if (index < count || index >= count * 2) {
      resetTimeoutRef.current = setTimeout(() => {
        setWithTransition(false);
        setIndex((i) => (i < count ? i + count : i - count));
      }, TRANSITION_MS);
    }
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [index, count]);

  const activeDot = ((index % count) + count) % count;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden -mx-3">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * itemWidth}px)`,
            transition: withTransition ? `transform ${TRANSITION_MS}ms ease` : "none",
          }}
        >
          {track.map((property, i) => (
            <div
              key={`${property.id}-${i}`}
              ref={i === 0 ? itemRef : undefined}
              className="w-full flex-shrink-0 px-3 sm:w-1/2 xl:w-1/4"
            >
              <PropertyCard property={property} index={i % count} />
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous properties"
            className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 hidden lg:flex h-10 w-10 items-center justify-center rounded-full border border-cream/10 bg-onyx-900/80 text-cream/80 backdrop-blur hover:border-gold/40 hover:text-gold transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next properties"
            className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 hidden lg:flex h-10 w-10 items-center justify-center rounded-full border border-cream/10 bg-onyx-900/80 text-cream/80 backdrop-blur hover:border-gold/40 hover:text-gold transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-8 flex items-center justify-center gap-2">
            {properties.map((property, i) => (
              <button
                key={property.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  setWithTransition(true);
                  setIndex(count + i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeDot ? "w-6 bg-gold" : "w-1.5 bg-cream/20 hover:bg-cream/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
