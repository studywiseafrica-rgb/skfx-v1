interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export const OFFICIAL_LOGO_SRC =
  '/assets/aistudio/PHOTO-2026-11-21-21-54-06_330b652f.jpg';

export function BrandLogo({
  className = 'w-8 h-8 rounded-full',
  alt = 'SKFX Academy Official Logo',
}: BrandLogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden bg-[#1D2430] ring-1 ring-slate-300/80 dark:ring-white/20 shrink-0 ${className}`}
    >
      <img
        src={OFFICIAL_LOGO_SRC}
        alt={alt}
        className="w-full h-full object-cover object-top"
        decoding="async"
      />
    </span>
  );
}
