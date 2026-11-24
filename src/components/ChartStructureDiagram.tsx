import {motion} from 'motion/react';
import type {Signal} from '../types';
import {formatPrice} from '../lib/forexMath';

interface ChartStructureDiagramProps {
  mode: 'signal' | 'lesson';
  signal?: Signal;
  diagramType?:
    | 'liquidity_sweep'
    | 'bos_choch'
    | 'fvg_imbalance'
    | 'order_block'
    | 'gold_killzone'
    | 'risk_curve';
}

export function ChartStructureDiagram({
  mode,
  signal,
  diagramType = 'liquidity_sweep',
}: ChartStructureDiagramProps) {
  const isBuy = signal ? signal.direction === 'BUY' : true;
  const activePattern = signal ? signal.chartPattern : diagramType;
  const animKey = signal ? signal.id : activePattern;

  const candles = isBuy
    ? [
        {x: 34, o: 120, c: 138, h: 112, l: 144, bull: false},
        {x: 60, o: 138, c: 130, h: 124, l: 148, bull: true},
        {x: 86, o: 130, c: 152, h: 126, l: 162, bull: false},
        {x: 112, o: 152, c: 184, h: 148, l: 196, bull: false},
        {x: 138, o: 184, c: 146, h: 138, l: 190, bull: true},
        {x: 164, o: 146, c: 112, h: 104, l: 150, bull: true},
        {x: 190, o: 112, c: 128, h: 106, l: 134, bull: false},
        {x: 216, o: 128, c: 150, h: 122, l: 158, bull: false},
        {x: 242, o: 150, c: 118, h: 110, l: 156, bull: true},
        {x: 268, o: 118, c: 82, h: 74, l: 122, bull: true},
        {x: 294, o: 82, c: 54, h: 46, l: 88, bull: true},
        {x: 320, o: 54, c: 38, h: 30, l: 60, bull: true},
      ]
    : [
        {x: 34, o: 100, c: 82, h: 74, l: 108, bull: true},
        {x: 60, o: 82, c: 92, h: 76, l: 98, bull: false},
        {x: 86, o: 92, c: 68, h: 62, l: 96, bull: true},
        {x: 112, o: 68, c: 36, h: 24, l: 74, bull: true},
        {x: 138, o: 36, c: 76, h: 30, l: 82, bull: false},
        {x: 164, o: 76, c: 114, h: 72, l: 122, bull: false},
        {x: 190, o: 114, c: 96, h: 90, l: 120, bull: true},
        {x: 216, o: 96, c: 72, h: 64, l: 102, bull: true},
        {x: 242, o: 72, c: 108, h: 68, l: 116, bull: false},
        {x: 268, o: 108, c: 142, h: 104, l: 148, bull: false},
        {x: 294, o: 142, c: 170, h: 136, l: 178, bull: false},
        {x: 320, o: 170, c: 188, h: 164, l: 196, bull: false},
      ];

  const zoneLabel =
    activePattern === 'liquidity_sweep'
      ? 'Liquidity Sweep + OB'
      : activePattern === 'bos_choch'
        ? 'CHoCH + BOS Structure'
        : activePattern === 'fvg_imbalance'
          ? '50% FVG Imbalance'
          : activePattern === 'gold_killzone'
            ? 'Killzone Execution Model'
            : activePattern === 'risk_curve'
              ? 'Asymmetric 1:4 R:R Projection'
              : 'Institutional Order Block';

  return (
    <div className="liquid-glass-card w-full rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
        <span className="font-semibold text-[#0F172A] dark:text-white">
          {mode === 'signal' && signal
            ? `${signal.pair} · ${signal.timeframe} · ${zoneLabel}`
            : zoneLabel}
        </span>
        <span className="font-mono tabular-nums text-[#1D4ED8] dark:text-sky-300 font-semibold">
          {mode === 'signal' && signal ? `${signal.riskReward} R:R` : 'SK Structural Model'}
        </span>
      </div>

      <svg
        key={animKey}
        viewBox="0 0 420 220"
        className="w-full h-auto block"
        role="img"
        aria-label={zoneLabel}
      >
        <g stroke="currentColor" className="text-slate-900/10 dark:text-blue-300/15" strokeWidth="1">
          <line x1="16" y1="40" x2="345" y2="40" />
          <line x1="16" y1="85" x2="345" y2="85" />
          <line x1="16" y1="130" x2="345" y2="130" />
          <line x1="16" y1="175" x2="345" y2="175" />
        </g>

        <motion.rect
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.28}}
          x="104"
          y={isBuy ? 142 : 56}
          width="235"
          height="22"
          fill="#2563EB"
          fillOpacity="0.12"
          stroke="#2563EB"
          strokeOpacity="0.45"
          strokeDasharray="3 3"
          rx="2"
        />

        <line
          x1="28"
          y1={isBuy ? 162 : 62}
          x2="132"
          y2={isBuy ? 162 : 62}
          stroke="#64748B"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <text
          x="28"
          y={isBuy ? 175 : 54}
          fill="#64748B"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
        >
          {isBuy ? 'SELL-SIDE LIQ SWEPT' : 'BUY-SIDE LIQ SWEPT'}
        </text>

        {/* Animated Institutional Price Trajectory */}
        <motion.path
          key={`${animKey}-trace`}
          d={
            isBuy
              ? 'M 34 128 L 112 184 L 164 114 L 216 148 L 268 82 L 320 38'
              : 'M 34 92 L 112 36 L 164 114 L 216 74 L 268 142 L 320 188'
          }
          fill="none"
          stroke={isBuy ? '#38BDF8' : '#F87171'}
          strokeWidth="1.4"
          strokeOpacity="0.65"
          strokeDasharray="4 4"
          initial={{pathLength: 0}}
          animate={{pathLength: [0, 1, 1]}}
          transition={{duration: 4.5, repeat: Infinity, ease: 'easeInOut'}}
        />

        {candles.map((c, idx) => {
          const top = Math.min(c.o, c.c);
          const height = Math.max(4, Math.abs(c.c - c.o));
          const color = c.bull ? '#16A34A' : '#DC2626';
          const isLatest = idx >= candles.length - 2;
          return (
            <motion.g
              key={idx}
              initial={{opacity: 0, y: 6}}
              animate={
                isLatest
                  ? {opacity: 1, y: [0, isBuy ? -2.5 : 2.5, 0]}
                  : {opacity: 1, y: 0}
              }
              transition={
                isLatest
                  ? {
                      opacity: {duration: 0.22, delay: idx * 0.025},
                      y: {duration: 2.4, repeat: Infinity, ease: 'easeInOut'},
                    }
                  : {
                      duration: 0.22,
                      delay: idx * 0.025,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
            >
              <line
                x1={c.x}
                y1={c.h}
                x2={c.x}
                y2={c.l}
                stroke={color}
                strokeWidth="1.5"
              />
              <rect
                x={c.x - 5}
                y={top}
                width="10"
                height={height}
                fill={color}
                rx="1"
              />
            </motion.g>
          );
        })}

        {mode === 'signal' && signal ? (
          <motion.g
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.25, delay: 0.15}}
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
          >
            <line
              x1="210"
              y1={isBuy ? 34 : 192}
              x2="345"
              y2={isBuy ? 34 : 192}
              stroke="#16A34A"
              strokeWidth="1.3"
              strokeDasharray="3 2"
            />
            <text x="350" y={isBuy ? 37 : 195} fill="#15803D" fontWeight="600">
              TP3 {formatPrice(signal.pair, signal.tp3)}
            </text>

            <line
              x1="210"
              y1={isBuy ? 82 : 144}
              x2="345"
              y2={isBuy ? 82 : 144}
              stroke="#16A34A"
              strokeWidth="1"
              strokeOpacity="0.7"
              strokeDasharray="2 3"
            />
            <text x="350" y={isBuy ? 85 : 147} fill="#16A34A">
              TP1 {formatPrice(signal.pair, signal.tp1)}
            </text>

            <line
              x1="210"
              y1={isBuy ? 150 : 72}
              x2="345"
              y2={isBuy ? 150 : 72}
              stroke="#1D4ED8"
              strokeWidth="1.5"
            />
            <text x="350" y={isBuy ? 153 : 75} fill="#1D4ED8" fontWeight="600">
              ENT {formatPrice(signal.pair, signal.entry)}
            </text>

            <line
              x1="210"
              y1={isBuy ? 196 : 26}
              x2="345"
              y2={isBuy ? 196 : 26}
              stroke="#DC2626"
              strokeWidth="1.3"
            />
            <text x="350" y={isBuy ? 199 : 29} fill="#DC2626" fontWeight="600">
              SL  {formatPrice(signal.pair, signal.stopLoss)}
            </text>
          </motion.g>
        ) : (
          <g fontFamily="JetBrains Mono, monospace" fontSize="9.5">
            <text x="348" y="42" fill="#16A34A" fontWeight="600">
              TARGET LIQ
            </text>
            <text x="348" y="114" fill="#64748B">
              BOS / FVG
            </text>
            <text x="348" y="156" fill="#1D4ED8" fontWeight="600">
              SK POI ENTRY
            </text>
            <text x="348" y="198" fill="#DC2626" fontWeight="600">
              INVALIDATION
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
