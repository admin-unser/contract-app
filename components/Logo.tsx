import Image from "next/image";

interface LogoProps {
  /** Height in pixels. Width auto-adjusts to maintain aspect ratio. */
  height?: number;
  className?: string;
}

/**
 * MUSUBI sign official logo (Canva design).
 * Knot icon + "MUSUBI .sign" text.
 */
export function Logo({ height = 36, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="MUSUBI sign"
      width={Math.round(height * 3)}
      height={height}
      className={`object-contain ${className}`}
      style={{ height, width: "auto" }}
      priority
    />
  );
}
