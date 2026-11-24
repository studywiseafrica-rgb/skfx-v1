import type {DrawingToolId} from './types';

export type TvIconName =
  | DrawingToolId
  | 'patterns_group'
  | 'projection_group'
  | 'fib_group'
  | 'gann_group'
  | 'shapes_group'
  | 'annotation_group'
  | 'icons_group';

export function TvToolSvg({
  tool,
  className = 'w-[18px] h-[18px]',
}: {
  tool: TvIconName;
  className?: string;
}) {
  switch (tool) {
    case 'crosshair':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M14 4v6M14 18v6M4 14h6M18 14h6" strokeLinecap="round" />
          <circle cx="14" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'dot':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="14" cy="14" r="3" fill="currentColor" />
          <circle cx="14" cy="14" r="7" strokeDasharray="2 2" opacity="0.55" />
        </svg>
      );

    case 'arrow':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 5l13 9.5-6.2 1.2 2.8 6.3-2.2 1-2.8-6.3L7 20V5z" strokeLinejoin="round" />
        </svg>
      );

    case 'eraser':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M16.5 6.5l5 5-9.5 9.5H7l-3-3 12.5-11.5z" strokeLinejoin="round" />
          <path d="M12 11l5 5M14 21h9" strokeLinecap="round" />
        </svg>
      );

    case 'trendline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="6.5" y1="21.5" x2="21.5" y2="6.5" />
          <circle cx="6" cy="22" r="2.2" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="22" cy="6" r="2.2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'ray':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="6.5" y1="21.5" x2="23" y2="5" />
          <circle cx="6" cy="22" r="2.2" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="15" cy="13" r="2.2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'infoline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="5.5" y1="22.5" x2="18.5" y2="9.5" />
          <circle cx="5.5" cy="22.5" r="2" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="18.5" cy="9.5" r="2" fill="var(--tv-icon-bg, #131722)" />
          <rect x="13" y="4" width="11" height="7" rx="1.5" />
        </svg>
      );

    case 'extline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="4" y1="24" x2="24" y2="4" />
          <circle cx="10" cy="18" r="2" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="18" cy="10" r="2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'angle':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M6 21h17M6 21L20 7" />
          <path d="M13 21a7 7 0 0 0-2-5" strokeDasharray="2 1.5" />
          <circle cx="6" cy="21" r="2" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="20" cy="7" r="2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'hline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="14" x2="24" y2="14" />
          <circle cx="14" cy="14" r="2.2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'hray':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="14" x2="24" y2="14" />
          <circle cx="6.5" cy="14" r="2.2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'vline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="14" y1="4" x2="14" y2="24" />
          <circle cx="14" cy="14" r="2.2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'crossline':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="4" y1="14" x2="24" y2="14" />
          <line x1="14" y1="4" x2="14" y2="24" />
          <circle cx="14" cy="14" r="2.2" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'channel':
    case 'regtrend':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <line x1="5" y1="16" x2="19" y2="6" />
          <line x1="9" y1="22" x2="23" y2="12" />
          <line x1="7" y1="19" x2="21" y2="9" strokeDasharray="2 2" opacity="0.7" />
          <circle cx="5" cy="16" r="1.8" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="19" cy="6" r="1.8" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="9" cy="22" r="1.8" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'fib':
    case 'fib_group':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <line x1="4" y1="7" x2="24" y2="7" />
          <line x1="4" y1="12" x2="24" y2="12" />
          <line x1="4" y1="17" x2="24" y2="17" />
          <line x1="4" y1="22" x2="24" y2="22" />
          <circle cx="9" cy="7" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="19" cy="22" r="1.7" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'fibext':
    case 'fibtrendext':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M5 21L12 10L17 16" />
          <line x1="11" y1="7" x2="24" y2="7" />
          <line x1="11" y1="12" x2="24" y2="12" />
          <line x1="11" y1="19" x2="24" y2="19" />
          <circle cx="5" cy="21" r="1.6" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="12" cy="10" r="1.6" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="17" cy="16" r="1.6" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'fibchannel':
    case 'fibtime':
    case 'fibwedge':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M5 22L22 6M5 22L24 12M5 22L24 18" />
          <circle cx="5" cy="22" r="1.8" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="16" cy="11" r="1.8" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'fibcircles':
    case 'fibspiral':
    case 'fibarcs':
    case 'fibspeedarcs':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <circle cx="14" cy="14" r="9" />
          <circle cx="14" cy="14" r="5" />
          <circle cx="14" cy="14" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'gann_group':
    case 'gannbox':
    case 'gannsquarefixed':
    case 'gannsquare':
    case 'gannfan':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <rect x="5" y="5" width="18" height="18" rx="1" />
          <line x1="5" y1="14" x2="23" y2="14" opacity="0.7" />
          <line x1="14" y1="5" x2="14" y2="23" opacity="0.7" />
          <line x1="5" y1="23" x2="23" y2="5" />
        </svg>
      );

    case 'patterns_group':
    case 'xabcd':
    case 'cypher':
    case 'headshoulders':
    case 'abcd':
    case 'threedrives':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M4 20L9 7L14 16L19 6L24 18" />
          <line x1="4" y1="20" x2="24" y2="18" strokeDasharray="2 1.5" opacity="0.55" />
          <circle cx="4" cy="20" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="9" cy="7" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="14" cy="16" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="19" cy="6" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="24" cy="18" r="1.7" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'elliott5':
    case 'elliott3':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <path d="M5 20L10 10L15 16L22 7" />
          <circle cx="5" cy="20" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="10" cy="10" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="15" cy="16" r="1.7" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="22" cy="7" r="1.7" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'projection_group':
    case 'longpos':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <rect x="6" y="5" width="16" height="9" fill="#089981" fillOpacity="0.22" stroke="#089981" />
          <rect x="6" y="14" width="16" height="8" fill="#F23645" fillOpacity="0.22" stroke="#F23645" />
          <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );

    case 'shortpos':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.35">
          <rect x="6" y="6" width="16" height="8" fill="#F23645" fillOpacity="0.22" stroke="#F23645" />
          <rect x="6" y="14" width="16" height="9" fill="#089981" fillOpacity="0.22" stroke="#089981" />
          <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );

    case 'forecast':
    case 'barspattern':
    case 'ghostfeed':
    case 'datepricerange':
    case 'daterange':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5 19l6-6 4 4 8-9" />
          <path d="M18 8h5v5" />
        </svg>
      );

    case 'pricerange':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M6 7h16M6 21h16M14 7v14M11 10l3-3 3 3M11 18l3 3 3-3" />
        </svg>
      );

    case 'shapes_group':
    case 'rect':
    case 'rotatedrect':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="6" y="7" width="16" height="14" rx="1" />
          <circle cx="6" cy="7" r="1.8" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="22" cy="21" r="1.8" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'ellipse':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <ellipse cx="14" cy="14" rx="9" ry="6" />
        </svg>
      );

    case 'triangle':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <polygon points="14,5 23,22 5,22" />
        </svg>
      );

    case 'brush':
    case 'highlighter':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M19.5 4.5l4 4L11 21H7v-4L19.5 4.5z" />
          <path d="M6 22.5c-1.5 1-2.5 1-3 0 .8-1 1.8-1.5 3 0z" fill="currentColor" />
        </svg>
      );

    case 'path':
    case 'polyline':
    case 'curve':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5 20c3-12 7-12 9 0s6 12 9 0" />
          <circle cx="5" cy="20" r="1.8" fill="var(--tv-icon-bg, #131722)" />
          <circle cx="23" cy="20" r="1.8" fill="var(--tv-icon-bg, #131722)" />
        </svg>
      );

    case 'annotation_group':
    case 'text':
    case 'anchoredtext':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M7 7h14M14 7v15M10.5 22h7" strokeLinecap="round" />
        </svg>
      );

    case 'note':
    case 'callout':
    case 'pricelabel':
    case 'pricenote':
    case 'signpost':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5 6h18v12H12l-5 4v-4H5V6z" strokeLinejoin="round" />
          <line x1="9" y1="10" x2="19" y2="10" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      );

    case 'icons_group':
    case 'starmarker':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <polygon points="14,4 17,10.5 24,11.5 19,16.5 20.2,23.5 14,20 7.8,23.5 9,16.5 4,11.5 11,10.5" strokeLinejoin="round" />
        </svg>
      );

    case 'arrowup':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M14 23V6M8 12l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'arrowdown':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M14 5v17M8 16l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'flagmarker':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M7 23V5h13l-3 4.5L20 14H7" strokeLinejoin="round" />
        </svg>
      );

    case 'checkmarker':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 15l5 5 11-11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'crossmarker':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 7l14 14M21 7L7 21" strokeLinecap="round" />
        </svg>
      );

    case 'thumbup':
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M9 12v11H5V12h4zm0 0l3.5-7c1.2 0 2 .9 2 2.2V11h6.5a2 2 0 0 1 1.9 2.5l-1.5 7A2 2 0 0 1 19.5 22H9" strokeLinejoin="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 28 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="6" y1="22" x2="22" y2="6" />
        </svg>
      );
  }
}

export function SymbolBadge({symbol, size = 18}: {symbol: string; size?: number}) {
  const s = symbol.toUpperCase();
  if (s === 'XAUUSD') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#FACC15] via-[#EAB308] to-[#CA8A04] text-[#422006] font-extrabold text-[8px] shrink-0 ring-1 ring-amber-500/40"
      >
        Au
      </span>
    );
  }
  if (s === 'XAGUSD') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-extrabold text-[8px] shrink-0"
      >
        Ag
      </span>
    );
  }
  if (s === 'WTI' || s === 'BRENT') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-slate-800 text-amber-400 font-extrabold text-[8px] shrink-0 ring-1 ring-amber-500/30"
      >
        OIL
      </span>
    );
  }
  if (s === 'DXY') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#16A34A] text-white font-extrabold text-[9px] shrink-0"
      >
        $
      </span>
    );
  }
  if (s === 'BTCUSDT' || s === 'BTCUSD') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#F7931A] text-white font-extrabold text-[9px] shrink-0"
      >
        ₿
      </span>
    );
  }
  if (s === 'ETHUSDT') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#627EEA] text-white font-extrabold text-[9px] shrink-0"
      >
        Ξ
      </span>
    );
  }
  if (s === 'SOLUSDT') {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#00FFA3] text-[#0F172A] font-extrabold text-[8px] shrink-0"
      >
        SOL
      </span>
    );
  }
  if (['NAS100', 'NQ1!', 'QQQ'].includes(s)) {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#0284C7] text-white font-extrabold text-[7px] shrink-0"
      >
        NQ
      </span>
    );
  }
  if (['SPX', 'ES1!', 'SPY', 'US30'].includes(s)) {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-[#1D4ED8] text-white font-extrabold text-[7px] shrink-0"
      >
        {s === 'US30' ? 'DJ' : 'SP'}
      </span>
    );
  }
  if (['AAPL', 'NVDA', 'TSLA', 'MSFT'].includes(s)) {
    return (
      <span
        style={{width: size, height: size}}
        className="inline-flex items-center justify-center rounded-full bg-slate-700 text-white font-extrabold text-[7px] shrink-0"
      >
        {s.slice(0, 2)}
      </span>
    );
  }

  const flagPalette: Record<string, {bg1: string; bg2: string; txt1: string; txt2: string}> = {
    EURUSD: {bg1: '#1D4ED8', bg2: '#DC2626', txt1: 'E', txt2: 'U'},
    GBPUSD: {bg1: '#1E3A8A', bg2: '#DC2626', txt1: '£', txt2: '$'},
    AUDUSD: {bg1: '#1E40AF', bg2: '#DC2626', txt1: 'A', txt2: '$'},
    NZDUSD: {bg1: '#0F172A', bg2: '#DC2626', txt1: 'N', txt2: '$'},
    USDCAD: {bg1: '#1D4ED8', bg2: '#EF4444', txt1: '$', txt2: 'C'},
    USDJPY: {bg1: '#1D4ED8', bg2: '#F8FAFC', txt1: '$', txt2: '¥'},
    USDCHF: {bg1: '#1D4ED8', bg2: '#DC2626', txt1: '$', txt2: '₣'},
    EURJPY: {bg1: '#1D4ED8', bg2: '#F8FAFC', txt1: '€', txt2: '¥'},
  };
  const cfg = flagPalette[s] || {bg1: '#2563EB', bg2: '#0F172A', txt1: s[0] || 'F', txt2: s[3] || '$'};

  return (
    <span style={{width: size + 4, height: size}} className="relative inline-flex items-center shrink-0">
      <span
        style={{width: size * 0.68, height: size * 0.68, backgroundColor: cfg.bg1}}
        className="rounded-full text-white font-bold text-[7px] flex items-center justify-center ring-1 ring-white dark:ring-[#131722]"
      >
        {cfg.txt1}
      </span>
      <span
        style={{
          width: size * 0.68,
          height: size * 0.68,
          backgroundColor: cfg.bg2,
          color: cfg.bg2 === '#F8FAFC' ? '#DC2626' : '#FFFFFF',
          marginLeft: -size * 0.22,
          marginTop: size * 0.22,
        }}
        className="rounded-full font-bold text-[7px] flex items-center justify-center ring-1 ring-white dark:ring-[#131722]"
      >
        {cfg.txt2}
      </span>
    </span>
  );
}
