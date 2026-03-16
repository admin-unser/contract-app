import Image from "next/image";

interface LogoProps {
  /** Height in pixels. Width auto-adjusts to maintain aspect ratio. */
  height?: number;
  className?: string;
}

/**
 * MUSUBI sign — official logo from Canva design.
 * Uses mix-blend-mode: multiply to make white background transparent,
 * preserving the exact design at any size.
 */
export function Logo({ height = 36, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="MUSUBI sign"
      width={Math.round(height * 2.6)}
      height={height}
      className={`object-contain ${className}`}
      style={{
        height,
        width: "auto",
        mixBlendMode: "multiply",
      }}
      priority
    />
  );
}
