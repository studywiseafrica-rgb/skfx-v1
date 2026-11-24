import type {IChartApi, ISeriesApi, SeriesType, UTCTimestamp} from 'lightweight-charts';
import type React from 'react';
import {
  DEFAULT_FIB_EXT_LEVELS,
  DEFAULT_FIB_RETRACE_LEVELS,
  calcPips,
  formatSimPrice,
  getDollarPerPointPerLot,
  type CandleBar,
  type ChartDrawing,
  type ChartPoint,
  type DrawingToolId,
} from './types';

interface DrawingOverlayProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
  chart: IChartApi | null;
  mainSeries: ISeriesApi<SeriesType> | null;
  candles: CandleBar[];
  drawings: ChartDrawing[];
  draftPoints: ChartPoint[];
  cursorPoint: ChartPoint | null;
  activeTool: DrawingToolId;
  selectedId: string | null;
  hideAll: boolean;
  decimals: number;
  pipSize: number;
  symbol: string;
  accountBalance: number;
  currentPrice: number;
  width: number;
  height: number;
  renderTick: number;
  sessionBreakTimes?: number[];
  isDark?: boolean;
  onSelectDrawing: (id: string | null) => void;
  onDoubleClickDrawing?: (id: string) => void;
  onContextMenuDrawing?: (id: string, e: React.MouseEvent) => void;
  onEraseDrawing?: (id: string) => void;
  onStartHandleDrag?: (
    drawingId: string,
    handle: 'tp' | 'sl' | 'entry' | 'end' | 'body' | `pt_${number}`,
    e: React.PointerEvent,
  ) => void;
}

interface ScreenPoint {
  x: number;
  y: number;
}

function getDashArray(style?: 'solid' | 'dashed' | 'dotted'): string | undefined {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '2 3';
  return undefined;
}

function getSvgFontFamily(fam?: ChartDrawing['fontFamily']): string {
  if (fam === 'mono') return 'JetBrains Mono, ui-monospace, monospace';
  if (fam === 'serif') return 'Georgia, Cambria, serif';
  return 'Inter, system-ui, sans-serif';
}

export function DrawingOverlay({
  svgRef,
  chart,
  mainSeries,
  candles,
  drawings,
  draftPoints,
  cursorPoint,
  activeTool,
  selectedId,
  hideAll,
  decimals,
  pipSize,
  symbol,
  accountBalance,
  currentPrice,
  width,
  height,
  sessionBreakTimes,
  isDark = true,
  onSelectDrawing,
  onDoubleClickDrawing,
  onContextMenuDrawing,
  onEraseDrawing,
  onStartHandleDrag,
}: DrawingOverlayProps) {
  if (!chart || !mainSeries || width <= 0 || height <= 0 || candles.length === 0) {
    return null;
  }

  const timeScale = chart.timeScale();
  const firstBar = candles[0];
  const lastBar = candles[candles.length - 1];
  const firstX = timeScale.timeToCoordinate(firstBar.time as UTCTimestamp);
  const lastX = timeScale.timeToCoordinate(lastBar.time as UTCTimestamp);

  const projectTime = (unixSec: number): number | null => {
    let x = timeScale.timeToCoordinate(unixSec as UTCTimestamp);
    if (x === null && firstX !== null && lastX !== null && lastBar.time > firstBar.time) {
      const ratio = (unixSec - firstBar.time) / (lastBar.time - firstBar.time);
      x = (firstX + ratio * (lastX - firstX)) as typeof firstX;
    } else if (x === null && lastX !== null && candles.length >= 2) {
      const barStep = Math.max(1, candles[candles.length - 1].time - candles[candles.length - 2].time);
      const pxPerBar = (lastX - (firstX ?? 0)) / Math.max(1, candles.length - 1);
      x = (lastX + ((unixSec - lastBar.time) / barStep) * pxPerBar) as typeof firstX;
    }
    if (x === null || !Number.isFinite(x)) return null;
    return x;
  };

  const projectPoint = (pt: ChartPoint): ScreenPoint | null => {
    const y = mainSeries.priceToCoordinate(pt.price);
    if (y === null || !Number.isFinite(y)) return null;
    const x = projectTime(pt.time);
    if (x === null) return null;
    return {x, y};
  };

  const extendRay = (
    p1: ScreenPoint,
    p2: ScreenPoint,
    extendLeft = false,
    extendRight = true,
  ): [ScreenPoint, ScreenPoint] => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return [p1, {x: width, y: p1.y}];
    const ux = dx / len;
    const uy = dy / len;
    const span = Math.max(width, height) * 3.2;
    return [
      extendLeft ? {x: p1.x - ux * span, y: p1.y - uy * span} : p1,
      extendRight ? {x: p1.x + ux * span, y: p1.y + uy * span} : p2,
    ];
  };

  const sortedDrawings = [...drawings].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const renderSingleDrawing = (d: ChartDrawing, isPreview = false) => {
    if (!d.visible) return null;
    const pts = d.points.map(projectPoint);
    if (pts.some((p) => p === null)) return null;
    const sp = pts as ScreenPoint[];
    const isSelected = !isPreview && selectedId === d.id;
    const stroke = d.color || '#2962FF';
    const sw = d.lineWidth || 1.7;
    const dash = getDashArray(d.lineStyle);
    const showLabels = d.showLabels !== false;
    const showValues = d.showValues !== false;

    const hitHandlers = isPreview
      ? {}
      : {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            if (activeTool === 'eraser') {
              onEraseDrawing?.(d.id);
              return;
            }
            onSelectDrawing(isSelected ? null : d.id);
          },
          onDoubleClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            if (activeTool === 'eraser') return;
            onSelectDrawing(d.id);
            onDoubleClickDrawing?.(d.id);
          },
          onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectDrawing(d.id);
            onContextMenuDrawing?.(d.id, e);
          },
          onPointerDown: (e: React.PointerEvent) => {
            if (e.button !== 0 || activeTool === 'eraser' || d.locked) return;
            if (activeTool === 'crosshair' || activeTool === 'dot' || activeTool === 'arrow') {
              e.stopPropagation();
              onSelectDrawing(d.id);
              onStartHandleDrag?.(d.id, 'body', e);
            }
          },
          style: {
            cursor:
              activeTool === 'eraser'
                ? ('not-allowed' as const)
                : d.locked
                  ? ('pointer' as const)
                  : ('move' as const),
            pointerEvents: 'all' as const,
          },
        };

    const renderAnchorHandles = (handles: ScreenPoint[]) =>
      isSelected && !d.locked ? (
        <>
          {handles.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={5}
              fill="#FFFFFF"
              stroke="#2962FF"
              strokeWidth={2}
              style={{cursor: 'grab', pointerEvents: 'all'}}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                onStartHandleDrag?.(d.id, `pt_${idx}`, e);
              }}
            />
          ))}
        </>
      ) : null;

    switch (d.tool) {
      case 'hline': {
        const p1 = sp[0];
        const priceLabel = formatSimPrice(d.points[0].price, decimals);
        return (
          <g key={d.id}>
            <line x1={0} y1={p1.y} x2={width} y2={p1.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
            <line x1={0} y1={p1.y} x2={width} y2={p1.y} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            {showValues && (
              <>
                <rect x={8} y={p1.y - 16} width={78} height={15} rx={3} fill={stroke} opacity={0.94} />
                <text x={13} y={p1.y - 5} fill="#FFFFFF" fontSize={10} fontFamily="JetBrains Mono, monospace">
                  {priceLabel}
                </text>
              </>
            )}
            {showLabels && d.text && (
              <text x={94} y={p1.y - 5} fill={stroke} fontSize={10} fontWeight={600}>
                {d.text}
              </text>
            )}
            {renderAnchorHandles([{x: width * 0.45, y: p1.y}])}
          </g>
        );
      }

      case 'hray': {
        const p1 = sp[0];
        return (
          <g key={d.id}>
            <line x1={p1.x} y1={p1.y} x2={width} y2={p1.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
            <line x1={p1.x} y1={p1.y} x2={width} y2={p1.y} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            <circle cx={p1.x} cy={p1.y} r={4} fill="#FFFFFF" stroke={stroke} strokeWidth={1.6} {...hitHandlers} />
            {renderAnchorHandles([p1])}
          </g>
        );
      }

      case 'vline': {
        const p1 = sp[0];
        return (
          <g key={d.id}>
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke={stroke} strokeWidth={sw} strokeDasharray={dash || '4 3'} />
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            {showLabels && d.text && (
              <text x={p1.x + 6} y={24} fill={stroke} fontSize={10} fontWeight={600}>
                {d.text}
              </text>
            )}
            {renderAnchorHandles([{x: p1.x, y: height * 0.5}])}
          </g>
        );
      }

      case 'crossline': {
        const p1 = sp[0];
        return (
          <g key={d.id}>
            <line x1={0} y1={p1.y} x2={width} y2={p1.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash || '3 3'} />
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke={stroke} strokeWidth={sw} strokeDasharray={dash || '3 3'} />
            <circle cx={p1.x} cy={p1.y} r={5} fill="#FFFFFF" stroke={stroke} strokeWidth={1.7} {...hitHandlers} />
            {renderAnchorHandles([p1])}
          </g>
        );
      }

      case 'trendline':
      case 'ray':
      case 'extline':
      case 'infoline':
      case 'angle':
      case 'forecast':
      case 'regtrend': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const [start, end] =
          d.tool === 'ray'
            ? extendRay(a, b, Boolean(d.extendLeft), true)
            : d.tool === 'extline' || (d.extendLeft && d.extendRight)
              ? extendRay(a, b, true, true)
              : d.extendLeft || d.extendRight
                ? extendRay(a, b, Boolean(d.extendLeft), Boolean(d.extendRight))
                : [a, b];

        const priceDiff = d.points[1].price - d.points[0].price;
        const pct = d.points[0].price > 0 ? (priceDiff / d.points[0].price) * 100 : 0;
        const deg = -Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const perp = Math.max(16, Math.abs(b.y - a.y) * 0.28);

        return (
          <g key={d.id}>
            {d.tool === 'regtrend' && (
              <>
                <polygon
                  points={`${a.x},${a.y - perp} ${b.x},${b.y - perp} ${b.x},${b.y + perp} ${a.x},${a.y + perp}`}
                  fill={d.fillColor || stroke}
                  fillOpacity={d.fillOpacity ?? 0.1}
                  {...hitHandlers}
                />
                <line x1={a.x} y1={a.y - perp} x2={b.x} y2={b.y - perp} stroke={stroke} strokeWidth={1.1} />
                <line x1={a.x} y1={a.y + perp} x2={b.x} y2={b.y + perp} stroke={stroke} strokeWidth={1.1} />
              </>
            )}
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={dash || (d.tool === 'forecast' || d.tool === 'regtrend' ? '5 4' : undefined)}
            />
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={12} {...hitHandlers} />
            {d.tool === 'angle' && showValues && (
              <>
                <line x1={a.x} y1={a.y} x2={a.x + 56} y2={a.y} stroke={stroke} strokeDasharray="3 3" strokeWidth={1} />
                <text x={a.x + 60} y={a.y + 4} fill={stroke} fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                  {deg}°
                </text>
              </>
            )}
            {(d.tool === 'infoline' || d.tool === 'forecast') && showValues && (
              <g transform={`translate(${midX + 6}, ${midY - 22})`}>
                <rect width={152} height={20} rx={4} fill="#131722" opacity={0.92} />
                <text x={7} y={13} fill="#FFFFFF" fontSize={10} fontFamily="JetBrains Mono, monospace">
                  {priceDiff >= 0 ? '+' : ''}
                  {formatSimPrice(priceDiff, decimals)} ({pct >= 0 ? '+' : ''}
                  {pct.toFixed(2)}%)
                </text>
              </g>
            )}
            {showLabels && d.text && (
              <text x={midX + 6} y={midY + 14} fill={stroke} fontSize={10} fontWeight={600}>
                {d.text}
              </text>
            )}
            <circle cx={a.x} cy={a.y} r={3.6} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            <circle cx={b.x} cy={b.y} r={3.6} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
            {renderAnchorHandles([a, b])}
          </g>
        );
      }

      case 'channel':
      case 'fibchannel': {
        if (sp.length < 2) return null;
        const a = sp[0];
        const b = sp[1];
        const c = sp[2] || {x: b.x, y: b.y - 48};
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const offsetY = c.y - (a.y + ((c.x - a.x) / (dx || 1)) * dy);
        const a2 = {x: a.x, y: a.y + offsetY};
        const b2 = {x: b.x, y: b.y + offsetY};
        const midA = {x: a.x, y: (a.y + a2.y) / 2};
        const midB = {x: b.x, y: (b.y + b2.y) / 2};
        const polyPts = `${a.x},${a.y} ${b.x},${b.y} ${b2.x},${b2.y} ${a2.x},${a2.y}`;
        const fibRatios =
          d.tool === 'fibchannel'
            ? (d.fibLevels?.filter((l) => l.enabled).map((l) => ({lvl: l.level, col: l.color})) || [
                {lvl: 0.236, col: '#F23645'},
                {lvl: 0.382, col: '#F59E0B'},
                {lvl: 0.5, col: '#089981'},
                {lvl: 0.618, col: '#2962FF'},
                {lvl: 0.786, col: '#0EA5E9'},
              ])
            : [];

        return (
          <g key={d.id}>
            <polygon points={polyPts} fill={d.fillColor || stroke} fillOpacity={d.fillOpacity ?? 0.12} {...hitHandlers} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} {...hitHandlers} />
            <line x1={a2.x} y1={a2.y} x2={b2.x} y2={b2.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} {...hitHandlers} />
            <line x1={midA.x} y1={midA.y} x2={midB.x} y2={midB.y} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
            {d.tool === 'fibchannel' &&
              fibRatios
                .filter((r) => r.lvl !== 0 && r.lvl !== 1)
                .map((r) => (
                  <line
                    key={r.lvl}
                    x1={a.x}
                    y1={a.y + offsetY * r.lvl}
                    x2={b.x}
                    y2={b.y + offsetY * r.lvl}
                    stroke={r.col}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                ))}
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'fib':
      case 'fibext':
      case 'fibtrendext': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const c = sp[2] || b;
        const leftX = d.extendLeft ? 0 : Math.min(a.x, b.x, c.x);
        const rightX = d.extendRight ? width : Math.max(a.x, b.x, c.x, leftX + 200);
        const p0 = d.fibReverse ? d.points[1].price : d.points[0].price;
        const p1 = d.fibReverse ? d.points[0].price : d.points[1].price;
        const p2 = d.points[2]?.price ?? p1;
        const rawLevels =
          d.fibLevels && d.fibLevels.length > 0
            ? d.fibLevels
            : d.tool === 'fib'
              ? DEFAULT_FIB_RETRACE_LEVELS
              : DEFAULT_FIB_EXT_LEVELS;
        const levels = rawLevels.filter((l) => l.enabled);

        const computePrice = (lvl: number) => {
          if (d.tool === 'fib') return p1 + (p0 - p1) * lvl;
          if (d.tool === 'fibtrendext') return p2 + (p1 - p0) * lvl;
          return p1 + (p1 - p0) * (lvl - 1);
        };

        return (
          <g key={d.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#787B86" strokeWidth={1} strokeDasharray="3 3" />
            {d.tool === 'fibtrendext' && sp[2] && (
              <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke="#787B86" strokeWidth={1} strokeDasharray="3 3" />
            )}
            {levels.map((lv, idx) => {
              const priceAtLevel = computePrice(lv.level);
              const ly = mainSeries.priceToCoordinate(priceAtLevel);
              if (ly === null || !Number.isFinite(ly)) return null;
              const nextLv = levels[idx + 1];
              const nextY = nextLv ? mainSeries.priceToCoordinate(computePrice(nextLv.level)) : null;
              return (
                <g key={lv.level}>
                  {d.fibBgFill !== false && nextY !== null && Number.isFinite(nextY) && (
                    <rect
                      x={leftX}
                      y={Math.min(ly, nextY)}
                      width={Math.max(40, rightX - leftX)}
                      height={Math.abs(nextY - ly)}
                      fill={lv.color}
                      fillOpacity={0.07}
                    />
                  )}
                  <line
                    x1={leftX}
                    y1={ly}
                    x2={rightX}
                    y2={ly}
                    stroke={lv.color}
                    strokeWidth={lv.lineWidth}
                    strokeDasharray={getDashArray(lv.lineStyle)}
                    {...hitHandlers}
                  />
                  {showLabels && (
                    <text
                      x={leftX + 5}
                      y={ly - 3}
                      fill={lv.color}
                      fontSize={10}
                      fontWeight={600}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {d.fibShowPercents ? `${(lv.level * 100).toFixed(1)}%` : lv.level}
                      {d.fibShowPrices !== false && showValues
                        ? ` (${formatSimPrice(priceAtLevel, decimals)})`
                        : ''}
                    </text>
                  )}
                </g>
              );
            })}
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'fibtime': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const dx = Math.max(12, Math.abs(b.x - a.x)) * (b.x >= a.x ? 1 : -1);
        const seq = [0, 1, 2, 3, 5, 8, 13, 21];
        return (
          <g key={d.id}>
            {seq.map((n) => {
              const vx = a.x + dx * n;
              if (vx < 0 || vx > width) return null;
              return (
                <g key={n}>
                  <line x1={vx} y1={0} x2={vx} y2={height} stroke={stroke} strokeWidth={1.2} strokeDasharray="3 3" {...hitHandlers} />
                  {showLabels && (
                    <text x={vx + 4} y={24} fill={stroke} fontSize={10} fontFamily="JetBrains Mono, monospace">
                      {n}
                    </text>
                  )}
                </g>
              );
            })}
            {renderAnchorHandles([a, b])}
          </g>
        );
      }

      case 'fibcircles':
      case 'fibarcs':
      case 'fibspeedarcs':
      case 'fibspiral': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const radius = Math.max(14, Math.hypot(b.x - a.x, b.y - a.y));
        const rings = [0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618];
        return (
          <g key={d.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#787B86" strokeDasharray="3 3" strokeWidth={1} />
            {d.tool === 'fibspiral' ? (
              <path
                d={Array.from({length: 90}, (_, idx) => {
                  const ang = idx * 0.22;
                  const r = radius * 0.15 * Math.exp(0.18 * ang);
                  const px = a.x + Math.cos(ang) * r;
                  const py = a.y + Math.sin(ang) * r;
                  return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
                }).join(' ')}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                {...hitHandlers}
              />
            ) : (
              rings.map((r) => (
                <circle
                  key={r}
                  cx={a.x}
                  cy={a.y}
                  r={radius * r}
                  fill="none"
                  stroke={r === 0.618 || r === 1 ? stroke : '#787B86'}
                  strokeWidth={r === 0.618 ? 1.5 : 1}
                  {...hitHandlers}
                />
              ))
            )}
            {renderAnchorHandles([a, b])}
          </g>
        );
      }

      case 'fibwedge':
      case 'gannfan': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const ratios =
          d.tool === 'gannfan'
            ? [0.25, 0.333, 0.5, 1, 2, 3, 4]
            : (d.fibLevels?.filter((l) => l.enabled).map((l) => l.level) || [0.236, 0.382, 0.5, 0.618, 0.786, 1]);
        return (
          <g key={d.id}>
            {ratios.map((r) => {
              const target = {x: b.x, y: a.y + (b.y - a.y) * r};
              const [, end] = extendRay(a, target, false, true);
              return (
                <line
                  key={r}
                  x1={a.x}
                  y1={a.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={r === 1 || r === 0.618 ? stroke : '#787B86'}
                  strokeWidth={r === 1 || r === 0.618 ? 1.5 : 1}
                  {...hitHandlers}
                />
              );
            })}
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'gannbox':
      case 'gannsquare':
      case 'gannsquarefixed': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(16, Math.abs(b.x - a.x));
        const h = d.tool === 'gannsquarefixed' ? w : Math.max(16, Math.abs(b.y - a.y));
        const fracs = [0.25, 0.382, 0.5, 0.618, 0.75];
        return (
          <g key={d.id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={d.fillColor || stroke}
              fillOpacity={d.fillOpacity ?? 0.08}
              stroke={stroke}
              strokeWidth={sw}
              {...hitHandlers}
            />
            {fracs.map((f) => (
              <g key={f}>
                <line x1={x} y1={y + h * f} x2={x + w} y2={y + h * f} stroke={stroke} strokeOpacity={0.45} strokeWidth={0.9} />
                <line x1={x + w * f} y1={y} x2={x + w * f} y2={y + h} stroke={stroke} strokeOpacity={0.45} strokeWidth={0.9} />
              </g>
            ))}
            <line x1={x} y1={y} x2={x + w} y2={y + h} stroke="#F59E0B" strokeWidth={1.1} />
            <line x1={x} y1={y + h} x2={x + w} y2={y} stroke="#089981" strokeWidth={1.1} />
            {renderAnchorHandles([a, b])}
          </g>
        );
      }

      case 'xabcd':
      case 'cypher':
      case 'headshoulders':
      case 'abcd':
      case 'threedrives':
      case 'elliott5':
      case 'elliott3':
      case 'path':
      case 'polyline': {
        if (sp.length < 2) return null;
        const labelsMap: Record<string, string[]> = {
          xabcd: ['X', 'A', 'B', 'C', 'D'],
          cypher: ['X', 'A', 'B', 'C', 'D'],
          headshoulders: ['LS', 'L1', 'H', 'R1', 'RS'],
          abcd: ['A', 'B', 'C', 'D'],
          threedrives: ['1', 'A', '2', 'B', '3'],
          elliott5: ['1', '2', '3', '4', '5'],
          elliott3: ['A', 'B', 'C'],
        };
        const labels = labelsMap[d.tool];
        const polyLine = sp.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const isClosed = Boolean(labels) && sp.length >= 3 && d.tool !== 'elliott5' && d.tool !== 'elliott3';

        // Optional arrow head for `path`
        const lastP = sp[sp.length - 1];
        const prevP = sp[sp.length - 2];
        const ang = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x);
        const arrowSize = 9;
        const arrowPts = `${lastP.x.toFixed(1)},${lastP.y.toFixed(1)} ${(lastP.x - arrowSize * Math.cos(ang - 0.45)).toFixed(1)},${(lastP.y - arrowSize * Math.sin(ang - 0.45)).toFixed(1)} ${(lastP.x - arrowSize * Math.cos(ang + 0.45)).toFixed(1)},${(lastP.y - arrowSize * Math.sin(ang + 0.45)).toFixed(1)}`;

        return (
          <g key={d.id}>
            {isClosed && (
              <polygon
                points={`${polyLine} ${sp[0].x.toFixed(1)},${sp[0].y.toFixed(1)}`}
                fill={d.fillColor || stroke}
                fillOpacity={d.fillOpacity ?? 0.11}
                {...hitHandlers}
              />
            )}
            <polyline points={polyLine} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} {...hitHandlers} />
            <polyline points={polyLine} fill="none" stroke="transparent" strokeWidth={12} {...hitHandlers} />
            {d.tool === 'path' && <polygon points={arrowPts} fill={stroke} {...hitHandlers} />}
            {sp.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={3.4} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
                {labels && showLabels && (
                  <text
                    x={pt.x + 5}
                    y={pt.y - 6}
                    fill={stroke}
                    fontSize={10}
                    fontWeight={700}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {labels[i] || i + 1}
                  </text>
                )}
              </g>
            ))}
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'triangle': {
        if (sp.length < 2) return null;
        const poly = sp.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        return (
          <g key={d.id}>
            <polygon
              points={poly}
              fill={d.fillColor || stroke}
              fillOpacity={d.fillOpacity ?? 0.14}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={dash}
              {...hitHandlers}
            />
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'rotatedrect': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const c = sp[2] || {x: b.x, y: b.y + 42};
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const proj = (c.x - a.x) * nx + (c.y - a.y) * ny;
        const heightOffset = Math.abs(proj) < 6 ? (proj >= 0 ? 12 : -12) : proj;
        const p3 = {x: b.x + nx * heightOffset, y: b.y + ny * heightOffset};
        const p4 = {x: a.x + nx * heightOffset, y: a.y + ny * heightOffset};
        const polyPts = `${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${p4.x.toFixed(1)},${p4.y.toFixed(1)}`;
        return (
          <g key={d.id}>
            <polygon
              points={polyPts}
              fill={d.fillColor || stroke}
              fillOpacity={d.fillOpacity ?? 0.14}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={dash}
              {...hitHandlers}
            />
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'curve': {
        if (sp.length < 2) return null;
        const [a, b, c] = sp;
        const ctrl = c || {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 45};
        const pathD = `M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`;
        return (
          <g key={d.id}>
            <path d={pathD} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} {...hitHandlers} />
            <path d={pathD} fill="none" stroke="transparent" strokeWidth={12} {...hitHandlers} />
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'ellipse': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        const rx = Math.max(8, Math.abs(b.x - a.x) / 2);
        const ry = Math.max(8, Math.abs(b.y - a.y) / 2);
        return (
          <g key={d.id}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={d.fillColor || stroke}
              fillOpacity={d.fillOpacity ?? 0.14}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={dash}
              {...hitHandlers}
            />
            {renderAnchorHandles([a, b])}
          </g>
        );
      }

      case 'rect':
      case 'daterange':
      case 'pricerange':
      case 'datepricerange':
      case 'barspattern':
      case 'ghostfeed': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(10, Math.abs(b.x - a.x));
        const h = Math.max(10, Math.abs(b.y - a.y));
        const diff = d.points[1].price - d.points[0].price;
        const pct = d.points[0].price > 0 ? (diff / d.points[0].price) * 100 : 0;
        const pips = Math.round(diff / (symbol === 'XAUUSD' ? 0.1 : pipSize || 0.0001));
        const days = Math.max(1, Math.round(Math.abs(d.points[1].time - d.points[0].time) / 86400));
        const boxColor =
          d.tool === 'pricerange' || d.tool === 'datepricerange'
            ? diff >= 0
              ? '#089981'
              : '#F23645'
            : d.fillColor || stroke;

        return (
          <g key={d.id}>
            <rect
              x={x}
              y={d.tool === 'daterange' ? 0 : y}
              width={w}
              height={d.tool === 'daterange' ? height : h}
              fill={boxColor}
              fillOpacity={d.fillOpacity ?? 0.13}
              stroke={d.tool === 'rect' ? stroke : boxColor}
              strokeWidth={sw}
              strokeDasharray={d.tool === 'ghostfeed' ? '4 4' : dash}
              {...hitHandlers}
            />
            {(d.tool === 'pricerange' || d.tool === 'datepricerange') && showValues && (
              <>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={boxColor} strokeWidth={1.1} strokeDasharray="3 3" />
                <g transform={`translate(${x + w / 2 - 90}, ${diff >= 0 ? y - 26 : y + h + 6})`}>
                  <rect width={180} height={22} rx={4} fill={boxColor} />
                  <text x={90} y={14} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                    {diff >= 0 ? '+' : ''}
                    {formatSimPrice(diff, decimals)} ({pct >= 0 ? '+' : ''}
                    {pct.toFixed(2)}%) · {pips}p
                    {d.tool === 'datepricerange' ? ` · ${days}d` : ''}
                  </text>
                </g>
              </>
            )}
            {d.tool === 'daterange' && showValues && (
              <g transform={`translate(${x + w / 2 - 44}, ${y})`}>
                <rect width={88} height={20} rx={4} fill="#2962FF" />
                <text x={44} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                  {days} days
                </text>
              </g>
            )}
            {(d.tool === 'barspattern' || d.tool === 'ghostfeed') && showLabels && (
              <g transform={`translate(${x + 6}, ${y + 16})`}>
                <text fill={boxColor} fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                  {d.tool === 'barspattern' ? 'Bars Pattern Projection' : 'Ghost Feed Model'}
                </text>
              </g>
            )}
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'brush':
      case 'highlighter': {
        if (sp.length < 2) return null;
        const pathD = sp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        const isHi = d.tool === 'highlighter';
        return (
          <g key={d.id}>
            <path
              d={pathD}
              fill="none"
              stroke={stroke}
              strokeOpacity={isHi ? 0.38 : 1}
              strokeWidth={isHi ? 12 : sw + 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d={pathD} fill="none" stroke="transparent" strokeWidth={14} {...hitHandlers} />
          </g>
        );
      }

      case 'text':
      case 'anchoredtext':
      case 'note':
      case 'callout':
      case 'pricelabel':
      case 'pricenote':
      case 'signpost': {
        const p1 = sp[0];
        const p2 = sp[1] || {x: p1.x + 28, y: p1.y - 26};
        const label =
          d.tool === 'pricelabel'
            ? `${formatSimPrice(d.points[0].price, decimals)}`
            : d.text || (d.tool === 'note' ? 'Market Note' : d.tool === 'signpost' ? 'Session Open' : 'Chart Note');
        const fontSize = d.fontSize || 11;
        const boxW = Math.max(76, label.length * (fontSize * 0.62) + 20);
        const boxH = Math.max(22, fontSize + 11);
        const anchorPt = d.tool === 'callout' || d.tool === 'pricenote' ? p2 : p1;
        const showBg = d.textBgEnabled !== false;
        const bgCol = d.textBgColor || stroke;
        const textAlign = d.textAlign || 'left';
        const tx =
          textAlign === 'center'
            ? anchorPt.x + boxW / 2
            : textAlign === 'right'
              ? anchorPt.x + boxW - 10
              : anchorPt.x + 10;
        const svgAnchor =
          textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';

        return (
          <g key={d.id} {...hitHandlers}>
            {(d.tool === 'callout' || d.tool === 'pricenote') && (
              <line x1={p1.x} y1={p1.y} x2={anchorPt.x} y2={anchorPt.y} stroke={stroke} strokeWidth={1.4} />
            )}
            {showBg && (
              <rect
                x={anchorPt.x}
                y={anchorPt.y - boxH * 0.65}
                width={boxW}
                height={boxH}
                rx={4}
                fill={bgCol}
                fillOpacity={0.93}
              />
            )}
            <text
              x={tx}
              y={anchorPt.y + fontSize * 0.2}
              textAnchor={svgAnchor}
              fill={showBg ? '#FFFFFF' : stroke}
              fontSize={fontSize}
              fontWeight={600}
              fontFamily={getSvgFontFamily(d.fontFamily)}
            >
              {label}
            </text>
            {renderAnchorHandles(sp)}
          </g>
        );
      }

      case 'arrowup':
      case 'arrowdown':
      case 'flagmarker':
      case 'starmarker':
      case 'checkmarker':
      case 'crossmarker':
      case 'thumbup': {
        const p1 = sp[0];
        const glyphs: Record<string, {txt: string; bg: string}> = {
          arrowup: {txt: '▲', bg: '#089981'},
          arrowdown: {txt: '▼', bg: '#F23645'},
          flagmarker: {txt: '⚑', bg: '#F59E0B'},
          starmarker: {txt: '★', bg: '#2962FF'},
          checkmarker: {txt: '✓', bg: '#089981'},
          crossmarker: {txt: '✕', bg: '#F23645'},
          thumbup: {txt: '▲+', bg: '#2962FF'},
        };
        const g = glyphs[d.tool] || {txt: '●', bg: stroke};
        return (
          <g key={d.id} {...hitHandlers}>
            <circle cx={p1.x} cy={p1.y} r={11} fill={d.color || g.bg} fillOpacity={0.92} />
            <text x={p1.x} y={p1.y + 4} textAnchor="middle" fill="#FFFFFF" fontSize={11} fontWeight={800}>
              {g.txt}
            </text>
            {renderAnchorHandles([p1])}
          </g>
        );
      }

      case 'longpos':
      case 'shortpos': {
        if (sp.length < 2) return null;
        const [a, b] = sp;
        const isLong = d.tool === 'longpos';
        const entryP = d.points[0].price;
        const stopP = d.stopPrice ?? d.points[1].price;
        const riskDist = Math.max(pipSize * 4, Math.abs(entryP - stopP));
        const defaultTarget = isLong ? entryP + riskDist * 2.17 : entryP - riskDist * 2.17;
        const targetP = d.targetPrice ?? defaultTarget;

        const slY = mainSeries.priceToCoordinate(stopP);
        const tpY = mainSeries.priceToCoordinate(targetP);
        if (slY === null || tpY === null || !Number.isFinite(slY) || !Number.isFinite(tpY)) return null;

        const boxLeft = Math.min(a.x, b.x);
        const boxW = Math.max(135, Math.abs(b.x - a.x));
        const slTop = Math.min(a.y, slY);
        const slH = Math.max(14, Math.abs(slY - a.y));
        const tpTop = Math.min(a.y, tpY);
        const tpH = Math.max(14, Math.abs(tpY - a.y));

        const riskDiff = Math.abs(entryP - stopP);
        const rewardDiff = Math.abs(targetP - entryP);
        const rrNum = riskDiff > 0 ? rewardDiff / riskDiff : 1;
        const riskPct = d.riskPercent ?? 1.0;
        const riskAmt = (accountBalance * riskPct) / 100;
        const targetAmt = riskAmt * rrNum;
        const stopPct = entryP > 0 ? (riskDiff / entryP) * 100 : 0;
        const targetPct = entryP > 0 ? (rewardDiff / entryP) * 100 : 0;
        const dollarPerPoint = getDollarPerPointPerLot(symbol, entryP);
        const rawQty = riskDiff > 0 && dollarPerPoint > 0 ? riskAmt / (riskDiff * dollarPerPoint) : 1;
        const qtyPrecisionStep =
          d.qtyPrecision === '1'
            ? 1
            : d.qtyPrecision === '0.1'
              ? 0.1
              : 0.01;
        const qty = Math.max(qtyPrecisionStep, Math.round(rawQty / qtyPrecisionStep) * qtyPrecisionStep);
        const liveDiff = isLong ? currentPrice - entryP : entryP - currentPrice;
        const openPnl = liveDiff * qty * dollarPerPoint;
        const stopTicks = Math.round(
          Math.abs(calcPips(symbol, pipSize, isLong ? 'BUY' : 'SELL', entryP, stopP)) * 10,
        );
        const tpTicks = Math.round(
          Math.abs(calcPips(symbol, pipSize, isLong ? 'BUY' : 'SELL', entryP, targetP)) * 10,
        );

        const profitFill = d.fillColor || '#089981';
        const stopFill = '#F23645';

        return (
          <g key={d.id}>
            <rect
              x={boxLeft}
              y={tpTop}
              width={boxW}
              height={tpH}
              fill={profitFill}
              fillOpacity={d.fillOpacity ?? 0.22}
              stroke={isSelected ? profitFill : 'transparent'}
              strokeWidth={1}
              {...hitHandlers}
            />
            <rect
              x={boxLeft}
              y={slTop}
              width={boxW}
              height={slH}
              fill={stopFill}
              fillOpacity={d.fillOpacity ?? 0.22}
              stroke={isSelected ? stopFill : 'transparent'}
              strokeWidth={1}
              {...hitHandlers}
            />
            <line
              x1={boxLeft}
              y1={a.y}
              x2={boxLeft + boxW}
              y2={tpY}
              stroke="#787B86"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <line x1={boxLeft} y1={a.y} x2={boxLeft + boxW} y2={a.y} stroke="#475569" strokeWidth={1.3} {...hitHandlers} />

            {showLabels && (
              <>
                <g transform={`translate(${Math.max(4, boxLeft + boxW / 2 - 125)}, ${isLong ? tpTop - 24 : tpTop + tpH + 5})`}>
                  <rect width={250} height={19} rx={3} fill={profitFill} />
                  <text x={125} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                    Target: {formatSimPrice(rewardDiff, decimals)} ({targetPct.toFixed(2)}%) {tpTicks}, +${targetAmt.toFixed(2)}
                  </text>
                </g>

                <g transform={`translate(${Math.max(4, boxLeft + boxW / 2 - 108)}, ${a.y - 16})`} {...hitHandlers}>
                  <rect width={216} height={32} rx={4} fill="#1E293B" opacity={0.94} />
                  <text x={108} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                    Open PnL: {openPnl >= 0 ? '+' : ''}{openPnl.toFixed(2)}, Qty: {qty.toFixed(2)}
                  </text>
                  <text x={108} y={26} textAnchor="middle" fill="#E2E8F0" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                    Risk/Reward: 1 : {rrNum.toFixed(2)}
                  </text>
                </g>

                <g transform={`translate(${Math.max(4, boxLeft + boxW / 2 - 120)}, ${isLong ? slTop + slH + 5 : slTop - 24})`}>
                  <rect width={240} height={19} rx={3} fill={stopFill} />
                  <text x={120} y={13} textAnchor="middle" fill="#FFFFFF" fontSize={10} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                    Stop: {formatSimPrice(riskDiff, decimals)} ({stopPct.toFixed(2)}%) {stopTicks}, -${riskAmt.toFixed(2)}
                  </text>
                </g>
              </>
            )}

            {isSelected && !d.locked && (
              <>
                <circle
                  cx={boxLeft}
                  cy={tpY}
                  r={5}
                  fill="#FFFFFF"
                  stroke={profitFill}
                  strokeWidth={2}
                  style={{cursor: 'ns-resize', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'tp', e);
                  }}
                />
                <circle
                  cx={boxLeft}
                  cy={slY}
                  r={5}
                  fill="#FFFFFF"
                  stroke={stopFill}
                  strokeWidth={2}
                  style={{cursor: 'ns-resize', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'sl', e);
                  }}
                />
                <circle
                  cx={boxLeft}
                  cy={a.y}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#2962FF"
                  strokeWidth={2}
                  style={{cursor: 'move', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'entry', e);
                  }}
                />
                <circle
                  cx={boxLeft + boxW}
                  cy={a.y}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#2962FF"
                  strokeWidth={2}
                  style={{cursor: 'ew-resize', pointerEvents: 'all'}}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    onStartHandleDrag?.(d.id, 'end', e);
                  }}
                />
              </>
            )}
          </g>
        );
      }
    }
  };

  let draftPreview: ChartDrawing | null = null;
  if (
    activeTool !== 'crosshair' &&
    activeTool !== 'dot' &&
    activeTool !== 'arrow' &&
    activeTool !== 'eraser' &&
    draftPoints.length > 0 &&
    cursorPoint
  ) {
    draftPreview = {
      id: '__draft__',
      tool: activeTool,
      symbol,
      points:
        activeTool === 'brush' || activeTool === 'highlighter'
          ? draftPoints
          : [...draftPoints, cursorPoint],
      color: '#2962FF',
      visible: true,
      locked: false,
      createdAt: 0,
    };
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="absolute inset-0 z-10 pointer-events-none select-none"
      style={{overflow: 'hidden'}}
    >
      {sessionBreakTimes &&
        sessionBreakTimes.map((t) => {
          const sx = projectTime(t);
          if (sx === null || sx < 0 || sx > width - 65) return null;
          return (
            <line
              key={`sb_${t}`}
              x1={sx}
              y1={0}
              x2={sx}
              y2={height}
              stroke={isDark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.16)'}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}
      {!hideAll && sortedDrawings.map((d) => renderSingleDrawing(d, false))}
      {draftPreview && renderSingleDrawing(draftPreview, true)}
      {activeTool === 'dot' && cursorPoint && (() => {
        const sp = projectPoint(cursorPoint);
        if (!sp) return null;
        return (
          <g pointerEvents="none">
            <circle cx={sp.x} cy={sp.y} r={9} fill="#2962FF" fillOpacity={0.14} stroke="#2962FF" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={sp.x} cy={sp.y} r={3.5} fill="#2962FF" stroke={isDark ? '#0B0F17' : '#FFFFFF'} strokeWidth={1.2} />
          </g>
        );
      })()}
    </svg>
  );
}
