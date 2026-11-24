interface BackgroundTopologyProps {
  subtle?: boolean;
}

export function BackgroundTopology({subtle = false}: BackgroundTopologyProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Clean airy light-mode backdrop */}
      <div
        className={`absolute inset-0 dark:hidden ${
          subtle
            ? 'bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC] to-[#F1F5F9]'
            : 'bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_60%),linear-gradient(to_bottom,#F8FAFC,#F1F5F9)]'
        }`}
      />

      {/* Dark-mode glowing candlestick backdrop (full uncropped image with extended horizon aura) */}
      <div className="hidden dark:flex absolute inset-0 items-center justify-center bg-[#070B14]">
        <div
          className="absolute inset-x-0 bottom-0 h-[32%] bg-[radial-gradient(ellipse_at_bottom,rgba(37,99,235,0.28),rgba(56,189,248,0.12)_45%,transparent_75%)]"
        />
        <img
          src="/assets/aistudio/image_2f4bf932.png"
          alt=""
          decoding="async"
          className={`relative max-h-full max-w-full w-auto h-full object-contain object-center feather-mask-x transition-opacity duration-500 ${
            subtle ? 'opacity-[0.28]' : 'opacity-[0.62]'
          }`}
        />
      </div>

      {/* Dark-mode atmospheric scrim preserving typography contrast */}
      <div
        className={`hidden dark:block absolute inset-0 ${
          subtle
            ? 'bg-gradient-to-b from-[#070B14]/75 via-[#070B14]/65 to-[#070B14]/82'
            : 'bg-gradient-to-b from-[#070B14]/35 via-[#070B14]/20 to-[#070B14]/60'
        }`}
      />
    </div>
  );
}
