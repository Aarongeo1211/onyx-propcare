import Image from "next/image";

interface LogoProps {
  /** Height/size utility classes, e.g. "h-12 w-auto". */
  className?: string;
  priority?: boolean;
}

/**
 * Onyx Propcare brand logo (full lockup: emblem + ONYX / PROPCARE wordmark).
 * Renders the official artwork; size it via `className` (set a height, keep w-auto).
 */
export function Logo({ className = "h-12 w-auto", priority = false }: LogoProps) {
  return (
    <Image
      src="/brand/onyx-propcare-logo.png"
      alt="Onyx Propcare"
      width={767}
      height={600}
      priority={priority}
      className={className}
      sizes="220px"
    />
  );
}
