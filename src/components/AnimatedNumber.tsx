import {useEffect, useRef, useState} from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    const start = currentRef.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.0001) {
      setDisplay(value);
      return;
    }

    const duration = 260;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + diff * eased;
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        currentRef.current = value;
        setDisplay(value);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
