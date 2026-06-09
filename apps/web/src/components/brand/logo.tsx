import type { SVGProps } from "react";

/**
 * Onyx Propcare emblem — a flat, single-colour reinterpretation of the brand mark:
 * a rounded-triangle frame containing a tower skyline, a gabled house with a window,
 * and a ground wave. Drawn with `currentColor` so it renders navy on light surfaces
 * and white on the dark footer band without separate assets.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Rounded-triangle frame */}
      <path
        d="M29.5 7 Q32 4.5 34.5 7 L53 48 Q55.5 52 51 53 L13 53 Q8.5 52 11 48 L29.5 7 Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Tower skyline (left) */}
      <rect x="19.6" y="25" width="3.4" height="20" rx="1" fill="currentColor" />
      <rect x="23.8" y="19" width="3.4" height="26" rx="1" fill="currentColor" />
      <rect x="28" y="29" width="3.1" height="16" fill="currentColor" opacity="0.9" />
      {/* Antenna on tallest tower */}
      <path d="M25.5 19 L25.5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Gabled house (right) with a knocked-out window */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.5 30 L40 23.5 L45.5 30 L45.5 45 L34.5 45 Z M37.7 33.4 L37.7 38.4 L42.3 38.4 L42.3 33.4 Z"
        fill="currentColor"
      />
      {/* Ground wave */}
      <path
        d="M15 48 Q23.5 44.4 32 48 T49 48"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  variant?: "full" | "mark";
  className?: string;
  /** Height utility classes applied to the mark, e.g. "h-10 w-10". */
  markClassName?: string;
}

/**
 * Brand lockup. `mark` renders the emblem only; `full` renders the emblem
 * alongside the ONYX / PROPCARE wordmark. Colour follows the surrounding text
 * colour (currentColor), so set `text-cream` / `text-white` on the wrapper.
 */
export function Logo({ variant = "full", className = "", markClassName = "h-10 w-10" }: LogoProps) {
  if (variant === "mark") {
    return <LogoMark className={`${markClassName} ${className}`} />;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-2xl font-semibold tracking-[0.14em]">ONYX</span>
        <span className="font-body text-[0.6rem] uppercase tracking-[0.42em] text-gold">
          Propcare
        </span>
      </span>
    </span>
  );
}
