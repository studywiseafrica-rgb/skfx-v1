import {useState} from 'react';
import {CandlestickChart} from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ResilientImage({src, alt, className = ''}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0D2448] via-[#133262] to-[#08162D] text-slate-200 p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <CandlestickChart className="w-8 h-8 text-emerald-400 mb-2" />
        <span className="text-xs font-medium text-center text-white max-w-[220px]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
