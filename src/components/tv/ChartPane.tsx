import {
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  PriceScaleMode as LwPriceScaleMode,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Logical,
  type LogicalRange,
  type SeriesType,
  type UTCTimestamp,
} from 'lightweight-charts';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  Settings,
  SlidersHorizontal,
  Trash2,
  Unlock,
} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {aggregateCandles, transformCandlesForChartType} from '../../lib/tv/chartTransforms';
import {computeIndicator, type ComputedIndicatorOutput} from '../../lib/tv/indicators';
import {
  exportCandlesToCsv,
  formatCountdownToNextBar,
  getSymbolMeta,
} from '../../lib/tv/marketData';
import {DrawingOverlay} from './DrawingOverlay';
import {SymbolBadge} from './TvIcons';
import {
  DEFAULT_FIB_EXT_LEVELS,
  DEFAULT_FIB_RETRACE_LEVELS,
  DRAWING_CATALOG,
  formatBarTimestamp,
  formatSimPrice,
  resolveTimeframeDef,
  type CandleBar,
  type ChartDrawing,
  type ChartPaneState,
  type ChartPoint,
  type ChartSettingsConfig,
  type ChartStyleKey,
  type CustomTimeframeDef,
  type DrawingToolId,
  type FeedStatus,
  type IndicatorInstance,
  type MarketPayload,
  type PriceScaleMode,
  type SimPosition,
} from './types';

export interface SnapshotExportOptions {
  width?: number;
  height?: number;
  includeDrawings?: boolean;
  includeIndicators?: boolean;
}

export interface PaneActions {
  zoomIn: () => void;
  zoomOut: () => void;
  panByBars: (delta: number) => void;
  fitContent: () => void;
  scrollToLatest: () => void;
  resetView: () => void;
  restorePreviousViewport: () => boolean;
  canRestoreViewport: () => boolean;
  navigateToPrice: (price: number) => void;
  applyRangePreset: (preset: '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL') => void;
  goToDate: (unixSec: number) => void;
  exportPngDataUrl: () => string | null;
  exportPngDataUrlAsync: (opts?: SnapshotExportOptions) => Promise<string | null>;
  exportSvgMarkup: (opts?: {includeDrawings?: boolean}) => string | null;
  exportCsvContent: () => {filename: string; csv: string} | null;
  getCandles: () => CandleBar[];
}

export interface ReplayControlState {
  isReplayMode: boolean;
  isPlaying?: boolean;
  cutoffTime: number | null;
  selectingCutBar: boolean;
  liveBar?: CandleBar | null;
  simulatedBars?: CandleBar[];
}

interface ChartPaneProps {
  pane: ChartPaneState;
  isActive: boolean;
  isDark: boolean;
  settings: ChartSettingsConfig;
  customTimeframes: CustomTimeframeDef[];
  replayState: ReplayControlState;
  activeTool: DrawingToolId;
  stayInDrawingMode: boolean;
  magnetEnabled: boolean;
  lockedAll: boolean;
  hideAllDrawings: boolean;
  selectedDrawingId: string | null;
  hasClipboardDrawing: boolean;
  accountBalance: number;
  openPositions: SimPosition[];
  syncCrosshairTime: number | null;
  syncLogicalRange: LogicalRange | null;
  onActivatePane: (paneId: string) => void;
  onUpdatePane: (paneId: string, patch: Partial<ChartPaneState>, recordHistory?: boolean) => void;
  onSelectDrawing: (drawingId: string | null) => void;
  onCopyDrawing: (drawing: ChartDrawing) => void;
  onPasteDrawing: () => void;
  onEditDrawingProps: (drawingId: string) => void;
  onEditIndicatorProps: (paneId: string, indicatorUid: string) => void;
  onOpenSettings: () => void;
  onOpenSnapshot: () => void;
  onResetToolToCursor: () => void;
  onCutReplayAtTime: (unixSec: number) => void;
  onCrosshairMoveSync: (paneId: string, timeSec: number | null) => void;
  onLogicalRangeSync: (paneId: string, range: LogicalRange | null) => void;
  onQuickOrder: (symbol: string, side: 'BUY' | 'SELL', price: number) => void;
  onMarketSnapshot: (paneId: string, payload: {
    price: number;
    decimals: number;
    pipSize: number;
    feedStatus: FeedStatus;
    candles: CandleBar[];
  }) => void;
  onRegisterActions: (paneId: string, actions: PaneActions | null) => void;
}

type MainSeriesKind = 'candles' | 'bars' | 'line' | 'area' | 'baseline';

function getMainSeriesKind(style: ChartStyleKey): MainSeriesKind {
  if (style === 'bars') return 'bars';
  if (style === 'line') return 'line';
  if (style === 'area') return 'area';
  if (style === 'baseline') return 'baseline';
  return 'candles';
}

function toLwLineStyle(style: 'solid' | 'dashed' | 'dotted' | undefined): LineStyle {
  if (style === 'dashed') return LineStyle.Dashed;
  if (style === 'dotted') return LineStyle.Dotted;
  return LineStyle.Solid;
}

function toLwScaleMode(mode: PriceScaleMode): LwPriceScaleMode {
  switch (mode) {
    case 'logarithmic':
      return LwPriceScaleMode.Logarithmic;
    case 'percentage':
      return LwPriceScaleMode.Percentage;
    case 'indexed100':
      return LwPriceScaleMode.IndexedTo100;
    default:
      return LwPriceScaleMode.Normal;
  }
}

function feedBadgeStyle(status: FeedStatus): {label: string; cls: string} {
  switch (status) {
    case 'real-time':
      return {label: 'REAL-TIME', cls: 'bg-[#089981]/15 text-[#089981] border-[#089981]/30'};
    case 'delayed':
      return {label: 'DELAYED', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30'};
    case 'cached':
      return {label: 'CACHED', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30'};
    case 'unavailable':
      return {label: 'OFFLINE', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30'};
    default:
      return {label: 'SIMULATED', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30'};
  }
}

const BINANCE_WS_INTERVALS = new Set([
  '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '1wk', '1mo',
]);

function toBinanceWsInterval(interval: string): string {
  if (interval === '1wk') return '1w';
  if (interval === '1mo') return '1M';
  return interval;
}

function rangesApproxEqual(
  a: LogicalRange | null | undefined,
  b: LogicalRange | null | undefined,
  eps = 0.05,
): boolean {
  if (!a || !b) return a === b;
  return Math.abs(a.from - b.from) <= eps && Math.abs(a.to - b.to) <= eps;
}

const CHART_HANDLE_SCROLL = {
  mouseWheel: true,
  pressedMouseMove: true,
  horzTouchDrag: true,
  vertTouchDrag: true,
};

const CHART_HANDLE_SCALE = {
  axisPressedMouseMove: {time: true, price: true},
  axisDoubleClickReset: {time: true, price: true},
  mouseWheel: true,
  pinch: true,
};

interface IndicatorSubPaneProps {
  inst: IndicatorInstance;
  output: ComputedIndicatorOutput;
  candles: CandleBar[];
  isDark: boolean;
  decimals: number;
  timezone: string;
  canvasBgColor: string;
  gridColor: string;
  mainLogicalRange: LogicalRange | null;
  crosshairTime: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRangeChange: (range: LogicalRange | null) => void;
  onCrosshairMove: (timeSec: number | null) => void;
  onToggleVisible: () => void;
  onChangeScaleMode: (mode: PriceScaleMode) => void;
  onOpenSettings: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleCollapse: () => void;
  onToggleExpand: () => void;
  onRemove: () => void;
  onResizeHeight: (newHeight: number) => void;
  onRegisterSubChart: (uid: string, chart: IChartApi | null) => void;
}

function IndicatorSubPane({
  inst,
  output,
  candles,
  isDark,
  decimals,
  timezone,
  canvasBgColor,
  gridColor,
  mainLogicalRange,
  crosshairTime,
  canMoveUp,
  canMoveDown,
  onRangeChange,
  onCrosshairMove,
  onToggleVisible,
  onChangeScaleMode,
  onOpenSettings,
  onMoveUp,
  onMoveDown,
  onToggleCollapse,
  onToggleExpand,
  onRemove,
  onResizeHeight,
  onRegisterSubChart,
}: IndicatorSubPaneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<SeriesType>[]>([]);
  const firstSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const syncingRangeRef = useRef(false);
  const lastSyncedRangeRef = useRef<LogicalRange | null>(mainLogicalRange);
  const mainLogicalRangeRef = useRef<LogicalRange | null>(mainLogicalRange);
  mainLogicalRangeRef.current = mainLogicalRange;
  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;
  const onCrosshairMoveRef = useRef(onCrosshairMove);
  onCrosshairMoveRef.current = onCrosshairMove;

  const effectiveHeight = inst.collapsed ? 26 : inst.expanded ? 235 : inst.paneHeight || 132;
  const scaleMode = inst.scaleMode || 'normal';

  const applySubRangeSafely = useCallback((range: LogicalRange) => {
    const ch = chartRef.current;
    if (!ch) return;
    lastSyncedRangeRef.current = range;
    syncingRangeRef.current = true;
    try {
      ch.timeScale().setVisibleLogicalRange(range);
    } catch {
      // ignore before scale warms up
    }
    requestAnimationFrame(() => {
      syncingRangeRef.current = false;
    });
  }, []);

  // Create chart instance once while uncollapsed
  useEffect(() => {
    const el = hostRef.current;
    if (!el || inst.collapsed) {
      onRegisterSubChart(inst.uid, null);
      return;
    }

    const bg = canvasBgColor || (isDark ? '#0B0F17' : '#FFFFFF');
    const text = isDark ? '#94A3B8' : '#475569';
    const grid = gridColor || (isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.07)');

    const chart = createChart(el, {
      width: el.clientWidth,
      height: Math.max(48, effectiveHeight - 24),
      layout: {
        background: {type: ColorType.Solid, color: bg},
        textColor: text,
        fontSize: 10,
      },
      grid: {
        vertLines: {color: grid},
        horzLines: {color: grid},
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E293B' : '#CBD5E1',
        minimumWidth: 64,
        mode: toLwScaleMode(scaleMode),
      },
      timeScale: {
        visible: false,
        borderColor: isDark ? '#1E293B' : '#CBD5E1',
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {color: isDark ? '#475569' : '#94A3B8', style: LineStyle.Dashed, width: 1},
        horzLine: {color: isDark ? '#475569' : '#94A3B8', style: LineStyle.Dashed, width: 1},
      },
      handleScroll: CHART_HANDLE_SCROLL,
      handleScale: CHART_HANDLE_SCALE,
      kineticScroll: {mouse: true, touch: true},
      localization: {
        locale: 'en-US',
        timeFormatter: (t: number) => formatBarTimestamp(t, timezone),
      },
    });
    chartRef.current = chart;
    onRegisterSubChart(inst.uid, chart);

    const onVisChange = (r: LogicalRange | null) => {
      if (syncingRangeRef.current || !r) return;
      if (rangesApproxEqual(lastSyncedRangeRef.current, r, 0.05)) return;
      lastSyncedRangeRef.current = r;
      onRangeChangeRef.current(r);
    };
    const onCross = (param: {time?: unknown}) => {
      const t = typeof param.time === 'number' ? param.time : null;
      onCrosshairMoveRef.current(t);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisChange);
    chart.subscribeCrosshairMove(onCross);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width: Math.max(120, Math.floor(entry.contentRect.width)),
            height: Math.max(48, Math.floor(entry.contentRect.height)),
          });
        }
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisChange);
      chart.unsubscribeCrosshairMove(onCross);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
      firstSeriesRef.current = null;
      onRegisterSubChart(inst.uid, null);
    };
    // Intentionally recreate only when collapse state flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inst.collapsed, inst.uid]);

  // Apply appearance & scale options in-place
  useEffect(() => {
    const ch = chartRef.current;
    if (!ch || inst.collapsed) return;
    const bg = canvasBgColor || (isDark ? '#0B0F17' : '#FFFFFF');
    const text = isDark ? '#94A3B8' : '#475569';
    const grid = gridColor || (isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.07)');
    ch.applyOptions({
      height: Math.max(48, effectiveHeight - 24),
      layout: {
        background: {type: ColorType.Solid, color: bg},
        textColor: text,
      },
      grid: {
        vertLines: {color: grid},
        horzLines: {color: grid},
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E293B' : '#CBD5E1',
        mode: toLwScaleMode(scaleMode),
      },
      localization: {
        timeFormatter: (t: number) => formatBarTimestamp(t, timezone),
      },
    });
  }, [isDark, effectiveHeight, canvasBgColor, gridColor, scaleMode, timezone, inst.collapsed]);

  // Update plotted indicator data cleanly without destroying the chart (never depends on mainLogicalRange!)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || inst.collapsed) return;

    syncingRangeRef.current = true;
    for (const oldSer of seriesRefs.current) {
      try {
        chart.removeSeries(oldSer);
      } catch {
        // ignore already removed
      }
    }
    seriesRefs.current = [];
    firstSeriesRef.current = null;

    if (inst.visible) {
      let firstSer: ISeriesApi<SeriesType> | null = null;
      output.series.forEach((s, idx) => {
        if (s.data.length === 0) return;
        const lw = Math.min(4, Math.max(1, Math.round(s.lineWidth))) as 1 | 2 | 3 | 4;
        if (s.seriesType === 'histogram') {
          const hs = chart.addSeries(HistogramSeries, {
            color: s.color,
            priceFormat: {type: 'price', precision: 2, minMove: 0.01},
            lastValueVisible: idx === 0,
            priceLineVisible: false,
          });
          hs.setData(s.data);
          const cast = hs as unknown as ISeriesApi<SeriesType>;
          seriesRefs.current.push(cast);
          if (!firstSer) firstSer = cast;
        } else {
          const ls = chart.addSeries(LineSeries, {
            color: s.color,
            lineWidth: lw,
            lineStyle: toLwLineStyle(s.lineStyle),
            priceLineVisible: false,
            lastValueVisible: idx === 0,
          });
          ls.setData(s.data);
          const cast = ls as unknown as ISeriesApi<SeriesType>;
          seriesRefs.current.push(cast);
          if (!firstSer) firstSer = cast;
        }
      });

      if (firstSer && output.referenceLines) {
        const target = firstSer as ISeriesApi<SeriesType>;
        for (const refLine of output.referenceLines) {
          target.createPriceLine({
            price: refLine.value,
            color: refLine.color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: refLine.title,
          });
        }
      }
      firstSeriesRef.current = firstSer;
    }

    const currRange = mainLogicalRangeRef.current;
    if (currRange) {
      applySubRangeSafely(currRange);
    } else {
      requestAnimationFrame(() => {
        syncingRangeRef.current = false;
      });
    }
  }, [inst.visible, inst.collapsed, output, applySubRangeSafely]);

  useEffect(() => {
    if (!chartRef.current || !mainLogicalRange || inst.collapsed) return;
    if (rangesApproxEqual(lastSyncedRangeRef.current, mainLogicalRange, 0.05)) return;
    applySubRangeSafely(mainLogicalRange);
  }, [mainLogicalRange, inst.collapsed, applySubRangeSafely]);

  useEffect(() => {
    const ch = chartRef.current;
    const ser = firstSeriesRef.current;
    if (!ch || !ser || inst.collapsed) return;
    if (crosshairTime === null) {
      ch.clearCrosshairPosition();
      return;
    }
    const match = output.series[0]?.data.find((d) => d.time === crosshairTime);
    if (match) {
      try {
        ch.setCrosshairPosition(match.value, crosshairTime as UTCTimestamp, ser);
      } catch {
        // ignore out-of-range
      }
    }
  }, [crosshairTime, output, inst.collapsed]);

  const startDragResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = inst.paneHeight || 132;
    const onMove = (ev: PointerEvent) => {
      const delta = startY - ev.clientY;
      onResizeHeight(Math.max(76, Math.min(340, startH + delta)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      style={{height: effectiveHeight}}
      className={`relative border-t flex flex-col shrink-0 ${
        isDark ? 'border-[#1E293B] bg-[#0B0F17]' : 'border-slate-200 bg-white'
      }`}
    >
      {!inst.collapsed && (
        <div
          onPointerDown={startDragResize}
          title="Drag to resize indicator pane"
          className="h-1 w-full cursor-ns-resize hover:bg-[#2962FF]/60 transition-colors shrink-0"
        />
      )}
      <div className="h-6 px-2.5 flex items-center justify-between text-[11px] shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{backgroundColor: inst.colors[0] || '#2962FF'}}
          />
          <span className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {inst.name}
          </span>
          <span className="font-mono text-[10px] text-[#2962FF] tabular-nums">
            {inst.visible ? output.latestSummary : 'Hidden'}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            ({candles.length} bars)
          </span>
        </div>
        <div className={`flex items-center gap-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <button
            type="button"
            onClick={() => {
              const order: PriceScaleMode[] = ['normal', 'logarithmic', 'percentage'];
              const next = order[(order.indexOf(scaleMode) + 1) % order.length];
              onChangeScaleMode(next);
            }}
            title={`Pane scale: ${scaleMode} (click to cycle)`}
            className={`px-1 py-0.5 rounded font-mono text-[9px] font-bold transition-colors ${
              scaleMode !== 'normal'
                ? 'bg-[#2962FF]/20 text-[#2962FF]'
                : isDark
                  ? 'hover:bg-slate-500/15 hover:text-white'
                  : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {scaleMode === 'logarithmic' ? 'LOG' : scaleMode === 'percentage' ? '%' : 'N'}
          </button>
          <button
            type="button"
            onClick={onToggleVisible}
            title={inst.visible ? 'Hide indicator' : 'Show indicator'}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-500/15 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {inst.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            title="Indicator settings"
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-500/15 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            title="Move pane up"
            className={`p-1 rounded disabled:opacity-30 transition-colors ${
              isDark ? 'hover:bg-slate-500/15 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            title="Move pane down"
            className={`p-1 rounded disabled:opacity-30 transition-colors ${
              isDark ? 'hover:bg-slate-500/15 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={inst.collapsed ? 'Expand pane' : 'Collapse pane'}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-500/15 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {inst.collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            title={inst.expanded ? 'Restore height' : 'Maximize pane'}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-slate-500/15 hover:text-white' : 'hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {inst.expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove indicator"
            className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {!inst.collapsed && <div ref={hostRef} className="flex-1 w-full min-h-0" />}
      {inst.collapsed && <span className="sr-only">Collapsed {decimals}</span>}
    </div>
  );
}

export function ChartPane({
  pane,
  isActive,
  isDark,
  settings,
  customTimeframes,
  replayState,
  activeTool,
  stayInDrawingMode,
  magnetEnabled,
  lockedAll,
  hideAllDrawings,
  selectedDrawingId,
  hasClipboardDrawing,
  accountBalance,
  openPositions,
  syncCrosshairTime,
  syncLogicalRange,
  onActivatePane,
  onUpdatePane,
  onSelectDrawing,
  onCopyDrawing,
  onPasteDrawing,
  onEditDrawingProps,
  onEditIndicatorProps,
  onOpenSettings,
  onOpenSnapshot,
  onResetToolToCursor,
  onCutReplayAtTime,
  onCrosshairMoveSync,
  onLogicalRangeSync,
  onQuickOrder,
  onMarketSnapshot,
  onRegisterActions,
}: ChartPaneProps) {
  const effectiveDark =
    settings.themeOverride === 'dark'
      ? true
      : settings.themeOverride === 'light'
        ? false
        : isDark;

  const symbolMeta = useMemo(() => getSymbolMeta(pane.symbol), [pane.symbol]);
  const timeframeDef = useMemo(
    () => resolveTimeframeDef(pane.interval, customTimeframes),
    [pane.interval, customTimeframes],
  );

  const bundleKey = `${pane.symbol}::${pane.interval}`;
  const [candleBundle, setCandleBundle] = useState<{key: string; bars: CandleBar[]}>({
    key: '',
    bars: [],
  });
  const rawCandles = candleBundle.bars;
  const [feedStatus, setFeedStatus] = useState<FeedStatus>('delayed');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [compareMap, setCompareMap] = useState<Record<string, CandleBar[]>>({});
  const [hoveredBar, setHoveredBar] = useState<CandleBar | null>(null);
  const [countdownText, setCountdownText] = useState('--:--');
  const [manualScaleOpen, setManualScaleOpen] = useState(false);
  const [manualMinInput, setManualMinInput] = useState('');
  const [manualMaxInput, setManualMaxInput] = useState('');
  const [navPriceOpen, setNavPriceOpen] = useState(false);
  const [navPriceInput, setNavPriceInput] = useState('');

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    drawingId: string | null;
    cursorPrice: number | null;
  } | null>(null);

  const [draftPoints, setDraftPoints] = useState<ChartPoint[]>([]);
  const [cursorPoint, setCursorPoint] = useState<ChartPoint | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [subLogicalRange, setSubLogicalRange] = useState<LogicalRange | null>(null);
  const [localCrosshairTime, setLocalCrosshairTime] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({width: 800, height: 420});

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlaySvgRef = useRef<SVGSVGElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const mainSeriesKindRef = useRef<MainSeriesKind | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<SeriesType>[]>([]);
  const compareSeriesRef = useRef<ISeriesApi<SeriesType>[]>([]);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const subChartRefs = useRef<Record<string, IChartApi>>({});

  const initialFitDoneKeyRef = useRef<string>('');
  const viewportHistoryRef = useRef<LogicalRange[]>([]);
  const lastRecordedRangeRef = useRef<LogicalRange | null>(null);
  const prevCandlesLenRef = useRef<number>(0);

  const dragStateRef = useRef<{
    drawingId: string;
    handle: 'tp' | 'sl' | 'entry' | 'end' | 'body' | `pt_${number}`;
    startX: number;
    startY: number;
    origDrawing: ChartDrawing;
  } | null>(null);
  const freehandActiveRef = useRef(false);
  const pointerDownPosRef = useRef<{x: number; y: number} | null>(null);
  const syncingMainRangeRef = useRef(false);
  const displayCandlesRef = useRef<CandleBar[]>([]);
  const lastVisRangeRef = useRef<LogicalRange | null>(null);
  const subLogicalRangeRef = useRef<LogicalRange | null>(null);
  const onLogicalRangeSyncRef = useRef(onLogicalRangeSync);
  onLogicalRangeSyncRef.current = onLogicalRangeSync;
  const onCrosshairMoveSyncRef = useRef(onCrosshairMoveSync);
  onCrosshairMoveSyncRef.current = onCrosshairMoveSync;
  const onMarketSnapshotRef = useRef(onMarketSnapshot);
  onMarketSnapshotRef.current = onMarketSnapshot;

  const applyMainLogicalRangeSafely = useCallback((range: LogicalRange) => {
    const ch = chartRef.current;
    if (!ch) return;
    lastVisRangeRef.current = range;
    syncingMainRangeRef.current = true;
    try {
      ch.timeScale().setVisibleLogicalRange(range);
    } catch {
      // ignore
    }
    requestAnimationFrame(() => {
      syncingMainRangeRef.current = false;
    });
  }, []);

  const pushViewportSnapshot = useCallback((range: LogicalRange | null) => {
    if (!range) return;
    const stack = viewportHistoryRef.current;
    const prev = stack[stack.length - 1];
    if (
      prev &&
      Math.abs(prev.from - range.from) < 1 &&
      Math.abs(prev.to - range.to) < 1
    ) {
      return;
    }
    viewportHistoryRef.current = [...stack.slice(-19), {...range}];
  }, []);

  const registerSubChart = useCallback((uid: string, ch: IChartApi | null) => {
    if (ch) subChartRefs.current[uid] = ch;
    else delete subChartRefs.current[uid];
  }, []);

  // Fetch symbol candles (supports custom interval aggregation cleanly!)
  useEffect(() => {
    let cancelled = false;
    const fetchIv = timeframeDef.baseFetchInterval || pane.interval;
    const targetKey = `${pane.symbol}::${pane.interval}`;

    const loadCandles = async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setFetchError(null);
        setCandleBundle((prev) => (prev.key === targetKey ? prev : {key: targetKey, bars: []}));
      }
      try {
        const res = await fetch(
          `/api/market/candles?symbol=${encodeURIComponent(pane.symbol)}&interval=${encodeURIComponent(fetchIv)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as MarketPayload;
        if (cancelled) return;
        const bars = timeframeDef.isCustom
          ? aggregateCandles(data.candles || [], timeframeDef.stepSec)
          : data.candles || [];
        setCandleBundle({key: targetKey, bars});
        setFeedStatus((prev) => (prev === 'real-time' && !silent ? prev : data.feedStatus || 'simulated'));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : 'Unable to fetch market data');
        setLoading(false);
      }
    };

    void loadCandles(false);
    const poll = window.setInterval(() => {
      if (document.hidden || replayState.isReplayMode) return;
      if (symbolMeta.assetClass === 'Crypto') {
        void loadCandles(true);
      }
    }, 6000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [
    pane.symbol,
    pane.interval,
    timeframeDef.isCustom,
    timeframeDef.baseFetchInterval,
    timeframeDef.stepSec,
    replayState.isReplayMode,
    symbolMeta.assetClass,
  ]);

  // Real-time Binance WebSocket tick/kline streaming for Crypto pairs (graceful fallback)
  useEffect(() => {
    if (
      replayState.isReplayMode ||
      symbolMeta.assetClass !== 'Crypto' ||
      timeframeDef.isCustom ||
      !BINANCE_WS_INTERVALS.has(pane.interval)
    ) {
      return;
    }

    let ws: WebSocket | null = null;
    let closedByUs = false;
    const streamName = `${pane.symbol.toLowerCase()}@kline_${toBinanceWsInterval(pane.interval)}`;
    try {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);
      ws.onmessage = (ev) => {
        if (closedByUs) return;
        try {
          const parsed = JSON.parse(ev.data as string) as {
            k?: {t: number; o: string; h: string; l: string; c: string; v: string};
          };
          const k = parsed?.k;
          if (!k) return;
          const bar: CandleBar = {
            time: Math.floor(k.t / 1000),
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
            volume: Number(k.v),
          };
          if (
            !Number.isFinite(bar.time) ||
            !Number.isFinite(bar.close) ||
            bar.close <= 0
          ) {
            return;
          }
          setFeedStatus('real-time');
          const expectedKey = `${pane.symbol}::${pane.interval}`;
          setCandleBundle((prev) => {
            if (prev.key !== expectedKey) return prev;
            const list = prev.bars;
            if (list.length === 0) return {key: expectedKey, bars: [bar]};
            const last = list[list.length - 1];
            if (bar.time === last.time) {
              const next = list.slice();
              next[next.length - 1] = bar;
              return {key: expectedKey, bars: next};
            }
            if (bar.time > last.time) {
              return {key: expectedKey, bars: [...list, bar]};
            }
            return prev;
          });
        } catch {
          // ignore malformed WS frames
        }
      };
      ws.onerror = () => {
        // Fallback silently to REST polling
      };
    } catch {
      // ignore blocked WS environment
    }

    return () => {
      closedByUs = true;
      if (ws && ws.readyState < 2) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    };
  }, [pane.symbol, pane.interval, symbolMeta.assetClass, replayState.isReplayMode, timeframeDef.isCustom]);

  // Fetch compare overlay symbols
  useEffect(() => {
    const visibleCompares = pane.compareSymbols.filter((c) => c.visible);
    if (visibleCompares.length === 0) {
      setCompareMap((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const fetchIv = timeframeDef.baseFetchInterval || pane.interval;
    let cancelled = false;
    Promise.all(
      visibleCompares.map(async (c) => {
        try {
          const res = await fetch(
            `/api/market/candles?symbol=${encodeURIComponent(c.symbol)}&interval=${encodeURIComponent(fetchIv)}`,
          );
          if (!res.ok) return [c.symbol, [] as CandleBar[]] as const;
          const data = (await res.json()) as MarketPayload;
          const bars = timeframeDef.isCustom
            ? aggregateCandles(data.candles || [], timeframeDef.stepSec)
            : data.candles || [];
          return [c.symbol, bars] as const;
        } catch {
          return [c.symbol, [] as CandleBar[]] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, CandleBar[]> = {};
      for (const [sym, bars] of entries) map[sym] = [...bars];
      setCompareMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [
    pane.compareSymbols,
    pane.interval,
    timeframeDef.isCustom,
    timeframeDef.baseFetchInterval,
    timeframeDef.stepSec,
  ]);

  // Zero look-ahead replay slicing + simulated tick bars & forming candle
  const visibleRawCandles = useMemo(() => {
    if (!replayState.isReplayMode || replayState.cutoffTime === null) {
      return rawCandles;
    }
    const sliced = rawCandles.filter((c) => c.time <= replayState.cutoffTime!);
    let base = sliced.length >= 2 ? sliced.slice() : rawCandles.slice(0, Math.min(20, rawCandles.length));

    const appendOrUpdateBar = (bar: CandleBar) => {
      if (base.length === 0) {
        base = [bar];
        return;
      }
      const last = base[base.length - 1];
      if (bar.time > last.time) {
        base.push(bar);
      } else if (bar.time === last.time) {
        base[base.length - 1] = bar;
      }
    };

    if (replayState.simulatedBars && replayState.simulatedBars.length > 0) {
      for (const sb of replayState.simulatedBars) {
        appendOrUpdateBar(sb);
      }
    }
    if (replayState.liveBar) {
      appendOrUpdateBar(replayState.liveBar);
    }
    return base;
  }, [
    rawCandles,
    replayState.isReplayMode,
    replayState.cutoffTime,
    replayState.simulatedBars,
    replayState.liveBar,
  ]);

  // Chart-type transform (Heikin Ashi, Renko, Line Break, Kagi, PnF, Range Bars)
  const displayCandles = useMemo(
    () => transformCandlesForChartType(visibleRawCandles, pane.chartStyle, pane.chartTypeConfig),
    [visibleRawCandles, pane.chartStyle, pane.chartTypeConfig],
  );
  displayCandlesRef.current = displayCandles;

  // Session break timestamps (when showSessionBreaks enabled)
  const sessionBreakTimes = useMemo(() => {
    if (!settings.showSessionBreaks || displayCandles.length < 2) return undefined;
    const breaks: number[] = [];
    let prevDay = Math.floor(displayCandles[0].time / 86400);
    for (let i = 1; i < displayCandles.length; i++) {
      const day = Math.floor(displayCandles[i].time / 86400);
      if (day !== prevDay) {
        breaks.push(displayCandles[i].time);
        prevDay = day;
      }
    }
    return breaks;
  }, [settings.showSessionBreaks, displayCandles]);

  // Publish live market snapshot up to TradingViewSimulator
  useEffect(() => {
    if (visibleRawCandles.length === 0) return;
    const latest = visibleRawCandles[visibleRawCandles.length - 1];
    onMarketSnapshotRef.current(pane.id, {
      price: latest.close,
      decimals: symbolMeta.decimals,
      pipSize: symbolMeta.pipSize,
      feedStatus,
      candles: visibleRawCandles,
    });
  }, [pane.id, visibleRawCandles, symbolMeta.decimals, symbolMeta.pipSize, feedStatus]);

  // Candle countdown timer
  useEffect(() => {
    const updateClock = () => {
      const last = visibleRawCandles[visibleRawCandles.length - 1];
      if (!last || replayState.isReplayMode) {
        setCountdownText(
          replayState.isReplayMode
            ? replayState.isPlaying
              ? 'LIVE REPLAY'
              : 'PAUSED'
            : '--:--',
        );
        return;
      }
      setCountdownText(formatCountdownToNextBar(last.time, timeframeDef.stepSec));
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(id);
  }, [visibleRawCandles, timeframeDef.stepSec, replayState.isReplayMode, replayState.isPlaying]);

  // Compute all indicators cleanly on `displayCandles` (zero look-ahead)
  const computedIndicators = useMemo(() => {
    const out: Record<string, ComputedIndicatorOutput> = {};
    for (const ind of pane.indicators) {
      out[ind.uid] = computeIndicator(displayCandles, ind, symbolMeta.decimals);
    }
    return out;
  }, [pane.indicators, displayCandles, symbolMeta.decimals]);

  const overlayIndicators = useMemo(
    () => pane.indicators.filter((i) => i.placement === 'overlay'),
    [pane.indicators],
  );
  const subPaneIndicators = useMemo(
    () => pane.indicators.filter((i) => i.placement === 'pane'),
    [pane.indicators],
  );

  const paneDrawings = useMemo(
    () => pane.drawings.filter((d) => d.symbol === pane.symbol || d.symbol === '*'),
    [pane.drawings, pane.symbol],
  );

  // Dismiss pane context menu on outside click / Esc
  useEffect(() => {
    if (!contextMenu) return;
    const onDown = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  // Allow Enter to finalize multi-point path/polyline & Esc to clear draftPoints
  useEffect(() => {
    if (!isActive || draftPoints.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (activeTool === 'path' || activeTool === 'polyline') && draftPoints.length >= 2) {
        e.preventDefault();
        finalizeDrawing(activeTool, draftPoints);
      } else if (e.key === 'Escape') {
        setDraftPoints([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, draftPoints, activeTool]);

  // 1. CREATE PERSISTENT CHART INSTANCE ONCE PER PANE (NEVER RECREATED ON SETTINGS OR TICKS!)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const bgColor = settings.canvasBgColor || (effectiveDark ? '#0B0F17' : '#FFFFFF');
    const textColor = effectiveDark ? '#94A3B8' : '#334155';
    const gridColor =
      settings.gridColor || (effectiveDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.07)');
    const borderColor = effectiveDark ? '#1E293B' : '#CBD5E1';

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: {type: ColorType.Solid, color: bgColor},
        textColor,
        fontSize: settings.chartFontSize || 11,
      },
      grid: {
        vertLines: {visible: settings.showVertGrid, color: gridColor},
        horzLines: {visible: settings.showHorzGrid, color: gridColor},
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: effectiveDark ? '#475569' : '#94A3B8',
          style: toLwLineStyle(settings.crosshairStyle),
          width: 1,
        },
        horzLine: {
          color: effectiveDark ? '#475569' : '#94A3B8',
          style: toLwLineStyle(settings.crosshairStyle),
          width: 1,
        },
      },
      rightPriceScale: {
        visible: settings.scalePosition !== 'left',
        borderColor,
        autoScale: pane.autoScale,
        invertScale: pane.invertedScale,
        mode: toLwScaleMode(pane.priceScaleMode),
        minimumWidth: 68,
        scaleMargins: {
          top: settings.scaleMarginTop ?? 0.08,
          bottom: settings.scaleMarginBottom ?? 0.08,
        },
      },
      leftPriceScale: {
        visible: settings.scalePosition === 'left',
        borderColor,
        autoScale: pane.autoScale,
        invertScale: pane.invertedScale,
        mode: toLwScaleMode(pane.priceScaleMode),
        minimumWidth: 68,
        scaleMargins: {
          top: settings.scaleMarginTop ?? 0.08,
          bottom: settings.scaleMarginBottom ?? 0.08,
        },
      },
      timeScale: {
        borderColor,
        timeVisible: true,
        secondsVisible: timeframeDef.stepSec < 60,
        rightOffset: settings.rightOffsetBars,
        barSpacing: settings.barSpacing,
      },
      handleScroll: CHART_HANDLE_SCROLL,
      handleScale: CHART_HANDLE_SCALE,
      kineticScroll: {mouse: true, touch: true},
      localization: {
        locale: 'en-US',
        timeFormatter: (t: number) => formatBarTimestamp(t, settings.timezone),
      },
    });
    chartRef.current = chart;
    mainSeriesRef.current = null;
    mainSeriesKindRef.current = null;
    initialFitDoneKeyRef.current = '';

    let rangeHistoryTimer: number | undefined;
    const onVisRange = (r: LogicalRange | null) => {
      if (!r) return;
      if (rangesApproxEqual(lastVisRangeRef.current, r, 0.02)) return;
      lastVisRangeRef.current = r;
      setRenderTick((t) => t + 1);
      if (syncingMainRangeRef.current) return;
      if (rangeHistoryTimer) window.clearTimeout(rangeHistoryTimer);
      const snapshot = lastRecordedRangeRef.current;
      rangeHistoryTimer = window.setTimeout(() => {
        if (snapshot) pushViewportSnapshot(snapshot);
        lastRecordedRangeRef.current = {...r};
      }, 450);
      if (!rangesApproxEqual(subLogicalRangeRef.current, r, 0.05)) {
        subLogicalRangeRef.current = r;
        setSubLogicalRange(r);
      }
      onLogicalRangeSyncRef.current(pane.id, r);
    };

    const onCross = (param: {time?: unknown}) => {
      const t = typeof param.time === 'number' ? param.time : null;
      setLocalCrosshairTime((prev) => (prev === t ? prev : t));
      onCrosshairMoveSyncRef.current(pane.id, t);
      if (t !== null) {
        const bar = displayCandlesRef.current.find((c) => c.time === t) || null;
        setHoveredBar((prev) => (prev?.time === bar?.time ? prev : bar));
      } else {
        setHoveredBar((prev) => (prev === null ? prev : null));
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisRange);
    chart.subscribeCrosshairMove(onCross);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(200, Math.floor(entry.contentRect.width));
        const h = Math.max(180, Math.floor(entry.contentRect.height));
        setDimensions((prev) => (prev.width === w && prev.height === h ? prev : {width: w, height: h}));
        chart.applyOptions({width: w, height: h});
        setRenderTick((k) => k + 1);
      }
    });
    ro.observe(el);

    return () => {
      if (rangeHistoryTimer) window.clearTimeout(rangeHistoryTimer);
      ro.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisRange);
      chart.unsubscribeCrosshairMove(onCross);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      mainSeriesKindRef.current = null;
      overlaySeriesRef.current = [];
      compareSeriesRef.current = [];
      priceLinesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pane.id]);

  // 2. APPLY SETTINGS & SCALE OPTIONS IN-PLACE (PRESERVES VIEWPORT!)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const bgColor = settings.canvasBgColor || (effectiveDark ? '#0B0F17' : '#FFFFFF');
    const textColor = effectiveDark ? '#94A3B8' : '#334155';
    const gridColor =
      settings.gridColor || (effectiveDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.07)');
    const borderColor = effectiveDark ? '#1E293B' : '#CBD5E1';
    const hasLeftCompare = pane.compareSymbols.some((c) => c.visible && c.mode === 'percent');

    const showCrosshairLines = activeTool !== 'arrow' && activeTool !== 'dot';
    chart.applyOptions({
      layout: {
        background: {type: ColorType.Solid, color: bgColor},
        textColor,
        fontSize: settings.chartFontSize || 11,
      },
      grid: {
        vertLines: {visible: settings.showVertGrid, color: gridColor},
        horzLines: {visible: settings.showHorzGrid, color: gridColor},
      },
      crosshair: {
        vertLine: {
          visible: showCrosshairLines,
          color: effectiveDark ? '#475569' : '#94A3B8',
          style: toLwLineStyle(settings.crosshairStyle),
        },
        horzLine: {
          visible: showCrosshairLines,
          color: effectiveDark ? '#475569' : '#94A3B8',
          style: toLwLineStyle(settings.crosshairStyle),
        },
      },
      rightPriceScale: {
        visible: settings.scalePosition !== 'left',
        borderColor,
        autoScale: pane.autoScale,
        invertScale: pane.invertedScale,
        mode: toLwScaleMode(pane.priceScaleMode),
        scaleMargins: {
          top: settings.scaleMarginTop ?? 0.08,
          bottom: settings.scaleMarginBottom ?? 0.08,
        },
      },
      leftPriceScale: {
        visible: settings.scalePosition === 'left' || hasLeftCompare,
        borderColor,
        autoScale: pane.autoScale,
        invertScale: pane.invertedScale,
        mode: toLwScaleMode(pane.priceScaleMode),
        scaleMargins: {
          top: settings.scaleMarginTop ?? 0.08,
          bottom: settings.scaleMarginBottom ?? 0.08,
        },
      },
      timeScale: {
        borderColor,
        secondsVisible: timeframeDef.stepSec < 60,
        rightOffset: settings.rightOffsetBars,
        barSpacing: settings.barSpacing,
      },
      handleScroll: CHART_HANDLE_SCROLL,
      handleScale: CHART_HANDLE_SCALE,
      localization: {
        locale: 'en-US',
        timeFormatter: (t: number) => formatBarTimestamp(t, settings.timezone),
      },
    });
  }, [
    effectiveDark,
    settings,
    pane.autoScale,
    pane.invertedScale,
    pane.priceScaleMode,
    pane.compareSymbols,
    timeframeDef.stepSec,
    activeTool,
  ]);

  // 3. MANAGE MAIN SERIES & DATA + OVERLAYS IN-PLACE (ZERO FLICKER, PRESERVE VIEWPORT)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const savedRange = initialFitDoneKeyRef.current ? chart.timeScale().getVisibleLogicalRange() : null;
    const targetKind = getMainSeriesKind(pane.chartStyle);
    const precision =
      settings.priceAxisPrecision === 'auto'
        ? symbolMeta.decimals
        : Number(settings.priceAxisPrecision);
    const minMove = Number((1 / Math.pow(10, precision)).toFixed(precision));
    const pf = {type: 'price' as const, precision, minMove};
    const scaleId = settings.scalePosition === 'left' ? 'left' : 'right';

    const autoscaleProvider =
      !pane.autoScale && pane.manualPriceRange
        ? () => ({
            priceRange: {
              minValue: pane.manualPriceRange!.min,
              maxValue: pane.manualPriceRange!.max,
            },
          })
        : undefined;

    // Recreate main series only when chart style kind flips
    if (!mainSeriesRef.current || mainSeriesKindRef.current !== targetKind) {
      if (mainSeriesRef.current) {
        try {
          chart.removeSeries(mainSeriesRef.current);
        } catch {
          // ignore
        }
      }
      priceLinesRef.current = [];
      let mainSer: ISeriesApi<SeriesType>;
      if (targetKind === 'bars') {
        mainSer = chart.addSeries(BarSeries, {
          priceScaleId: scaleId,
          upColor: settings.bullColor,
          downColor: settings.bearColor,
          priceFormat: pf,
          lastValueVisible: settings.showLastPriceLine,
          priceLineVisible: settings.showLastPriceLine,
          autoscaleInfoProvider: autoscaleProvider,
        }) as unknown as ISeriesApi<SeriesType>;
      } else if (targetKind === 'line') {
        mainSer = chart.addSeries(LineSeries, {
          priceScaleId: scaleId,
          color: '#2962FF',
          lineWidth: 2,
          priceFormat: pf,
          lastValueVisible: settings.showLastPriceLine,
          priceLineVisible: settings.showLastPriceLine,
          autoscaleInfoProvider: autoscaleProvider,
        }) as unknown as ISeriesApi<SeriesType>;
      } else if (targetKind === 'area') {
        mainSer = chart.addSeries(AreaSeries, {
          priceScaleId: scaleId,
          lineColor: '#2962FF',
          topColor: 'rgba(41, 98, 255, 0.32)',
          bottomColor: 'rgba(41, 98, 255, 0.02)',
          lineWidth: 2,
          priceFormat: pf,
          lastValueVisible: settings.showLastPriceLine,
          priceLineVisible: settings.showLastPriceLine,
          autoscaleInfoProvider: autoscaleProvider,
        }) as unknown as ISeriesApi<SeriesType>;
      } else if (targetKind === 'baseline') {
        const base =
          pane.chartTypeConfig.baselineValue ??
          displayCandles[Math.max(0, Math.floor(displayCandles.length * 0.25))]?.close ??
          displayCandles[0]?.close ??
          0;
        mainSer = chart.addSeries(BaselineSeries, {
          priceScaleId: scaleId,
          baseValue: {type: 'price', price: base},
          topLineColor: settings.bullColor,
          topFillColor1: 'rgba(8, 153, 129, 0.28)',
          topFillColor2: 'rgba(8, 153, 129, 0.03)',
          bottomLineColor: settings.bearColor,
          bottomFillColor1: 'rgba(242, 54, 69, 0.03)',
          bottomFillColor2: 'rgba(242, 54, 69, 0.28)',
          priceFormat: pf,
          lastValueVisible: settings.showLastPriceLine,
          priceLineVisible: settings.showLastPriceLine,
          autoscaleInfoProvider: autoscaleProvider,
        }) as unknown as ISeriesApi<SeriesType>;
      } else {
        const isHollow = pane.chartStyle === 'hollow';
        mainSer = chart.addSeries(CandlestickSeries, {
          priceScaleId: scaleId,
          upColor: isHollow ? 'transparent' : settings.bullColor,
          downColor: settings.bearColor,
          borderVisible: true,
          borderUpColor: settings.borderBullColor,
          borderDownColor: settings.borderBearColor,
          wickUpColor: settings.wickBullColor,
          wickDownColor: settings.wickBearColor,
          priceFormat: pf,
          lastValueVisible: settings.showLastPriceLine,
          priceLineVisible: settings.showLastPriceLine,
          autoscaleInfoProvider: autoscaleProvider,
        }) as unknown as ISeriesApi<SeriesType>;
      }
      mainSeriesRef.current = mainSer;
      mainSeriesKindRef.current = targetKind;
    } else {
      // Update existing main series styling in-place
      const mainSer = mainSeriesRef.current;
      const baseOpts: Record<string, unknown> = {
        priceScaleId: scaleId,
        priceFormat: pf,
        lastValueVisible: settings.showLastPriceLine,
        priceLineVisible: settings.showLastPriceLine,
        autoscaleInfoProvider: autoscaleProvider,
      };
      if (targetKind === 'bars') {
        baseOpts.upColor = settings.bullColor;
        baseOpts.downColor = settings.bearColor;
      } else if (targetKind === 'baseline') {
        const base =
          pane.chartTypeConfig.baselineValue ??
          displayCandles[Math.max(0, Math.floor(displayCandles.length * 0.25))]?.close ??
          displayCandles[0]?.close ??
          0;
        baseOpts.baseValue = {type: 'price', price: base};
        baseOpts.topLineColor = settings.bullColor;
        baseOpts.bottomLineColor = settings.bearColor;
      } else if (targetKind === 'candles') {
        const isHollow = pane.chartStyle === 'hollow';
        baseOpts.upColor = isHollow ? 'transparent' : settings.bullColor;
        baseOpts.downColor = settings.bearColor;
        baseOpts.borderUpColor = settings.borderBullColor;
        baseOpts.borderDownColor = settings.borderBearColor;
        baseOpts.wickUpColor = settings.wickBullColor;
        baseOpts.wickDownColor = settings.wickBearColor;
      }
      mainSer.applyOptions(baseOpts);
    }

    const mainSer = mainSeriesRef.current!;
    if (targetKind === 'line' || targetKind === 'area' || targetKind === 'baseline') {
      mainSer.setData(displayCandles.map((c) => ({time: c.time as UTCTimestamp, value: c.close})));
    } else {
      mainSer.setData(displayCandles.map((c) => ({...c, time: c.time as UTCTimestamp})));
    }

    // Sync price lines (Previous close + Open positions)
    for (const pl of priceLinesRef.current) {
      try {
        mainSer.removePriceLine(pl);
      } catch {
        // ignore
      }
    }
    priceLinesRef.current = [];

    if (settings.showPrevCloseLine && displayCandles.length >= 2) {
      const prevClose = displayCandles[displayCandles.length - 2].close;
      priceLinesRef.current.push(
        mainSer.createPriceLine({
          price: prevClose,
          color: '#94A3B8',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'Prev Close',
        }),
      );
    }

    if (settings.showPositionOverlay) {
      for (const pos of openPositions) {
        if (pos.symbol !== pane.symbol) continue;
        priceLinesRef.current.push(
          mainSer.createPriceLine({
            price: pos.entryPrice,
            color: pos.side === 'BUY' ? '#089981' : '#F23645',
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `${pos.side} ${pos.lots}`,
          }),
        );
        if (pos.stopLoss) {
          priceLinesRef.current.push(
            mainSer.createPriceLine({
              price: pos.stopLoss,
              color: '#EF4444',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: 'SL',
            }),
          );
        }
        if (pos.takeProfit) {
          priceLinesRef.current.push(
            mainSer.createPriceLine({
              price: pos.takeProfit,
              color: '#10B981',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: 'TP',
            }),
          );
        }
      }
    }

    // Sync overlay indicator series
    for (const s of overlaySeriesRef.current) {
      try {
        chart.removeSeries(s);
      } catch {
        // ignore
      }
    }
    overlaySeriesRef.current = [];
    for (const ind of overlayIndicators) {
      if (!ind.visible) continue;
      const out = computedIndicators[ind.uid];
      if (!out) continue;
      for (const s of out.series) {
        if (s.data.length === 0) continue;
        const ls = chart.addSeries(LineSeries, {
          priceScaleId: scaleId,
          color: s.color,
          lineWidth: Math.min(4, Math.max(1, Math.round(s.lineWidth))) as 1 | 2 | 3 | 4,
          lineStyle: toLwLineStyle(s.lineStyle),
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ls.setData(s.data);
        overlaySeriesRef.current.push(ls as unknown as ISeriesApi<SeriesType>);
      }
    }

    // Sync compare symbol series
    for (const s of compareSeriesRef.current) {
      try {
        chart.removeSeries(s);
      } catch {
        // ignore
      }
    }
    compareSeriesRef.current = [];
    for (const comp of pane.compareSymbols) {
      if (!comp.visible) continue;
      const rawComp = compareMap[comp.symbol] || [];
      if (rawComp.length === 0) continue;
      const slicedComp =
        replayState.isReplayMode && replayState.cutoffTime !== null
          ? rawComp.filter((c) => c.time <= replayState.cutoffTime!)
          : rawComp;
      if (slicedComp.length === 0) continue;
      const baseClose = slicedComp[0].close || 1;
      const compScaleId =
        comp.mode === 'percent' ? (scaleId === 'right' ? 'left' : 'right') : scaleId;
      const cs = chart.addSeries(LineSeries, {
        color: comp.color,
        lineWidth: 2,
        priceScaleId: compScaleId,
        priceLineVisible: false,
        title: comp.symbol,
      });
      cs.setData(
        slicedComp.map((c) => ({
          time: c.time as UTCTimestamp,
          value: comp.mode === 'percent' ? ((c.close - baseClose) / baseClose) * 100 : c.close,
        })),
      );
      compareSeriesRef.current.push(cs as unknown as ISeriesApi<SeriesType>);
    }

    // Initial fit on new symbol/interval ONLY (once matching bundle finishes loading); guard against out-of-bounds viewports!
    const fitKey = `${pane.symbol}::${pane.interval}`;
    if (candleBundle.key === fitKey && displayCandles.length > 0) {
      const outOfBounds =
        savedRange !== null &&
        (savedRange.from >= displayCandles.length - 1.5 || savedRange.to <= 1.5);

      if (initialFitDoneKeyRef.current !== fitKey || outOfBounds) {
        initialFitDoneKeyRef.current = fitKey;
        const barsToShow = Math.min(displayCandles.length, 130);
        const initRange: LogicalRange = {
          from: Math.max(0, displayCandles.length - barsToShow) as Logical,
          to: (displayCandles.length + settings.rightOffsetBars) as Logical,
        };
        applyMainLogicalRangeSafely(initRange);
        subLogicalRangeRef.current = initRange;
        setSubLogicalRange(initRange);
        lastRecordedRangeRef.current = initRange;
      } else if (savedRange) {
        // Keep viewport anchored cleanly; during Replay Step Forward, follow right edge only if user was near it
        const deltaBars = displayCandles.length - prevCandlesLenRef.current;
        if (
          replayState.isReplayMode &&
          deltaBars > 0 &&
          deltaBars <= 3 &&
          savedRange.to >= prevCandlesLenRef.current - 5
        ) {
          applyMainLogicalRangeSafely({
            from: (savedRange.from + deltaBars) as Logical,
            to: (savedRange.to + deltaBars) as Logical,
          });
        } else if (!rangesApproxEqual(lastVisRangeRef.current, savedRange, 0.05)) {
          applyMainLogicalRangeSafely(savedRange);
        }
      }
      prevCandlesLenRef.current = displayCandles.length;
    }

    const rafId = requestAnimationFrame(() => setRenderTick((k) => k + 1));
    return () => cancelAnimationFrame(rafId);
  }, [
    pane.symbol,
    pane.interval,
    pane.chartStyle,
    pane.chartTypeConfig,
    pane.autoScale,
    pane.manualPriceRange,
    pane.compareSymbols,
    symbolMeta.decimals,
    settings,
    candleBundle.key,
    displayCandles,
    overlayIndicators,
    computedIndicators,
    compareMap,
    openPositions,
    replayState.isReplayMode,
    replayState.cutoffTime,
    applyMainLogicalRangeSafely,
  ]);

  // Apply external layout sync logical range
  useEffect(() => {
    if (!chartRef.current || !syncLogicalRange) return;
    if (rangesApproxEqual(lastVisRangeRef.current, syncLogicalRange, 0.05)) return;
    applyMainLogicalRangeSafely(syncLogicalRange);
    if (!rangesApproxEqual(subLogicalRangeRef.current, syncLogicalRange, 0.05)) {
      subLogicalRangeRef.current = syncLogicalRange;
      setSubLogicalRange(syncLogicalRange);
    }
  }, [syncLogicalRange, applyMainLogicalRangeSafely]);

  // Apply external crosshair sync
  useEffect(() => {
    const ch = chartRef.current;
    const ser = mainSeriesRef.current;
    if (!ch || !ser) return;
    if (syncCrosshairTime === null) {
      ch.clearCrosshairPosition();
      return;
    }
    const bar = displayCandles.find((c) => c.time === syncCrosshairTime);
    if (bar) {
      try {
        ch.setCrosshairPosition(bar.close, bar.time as UTCTimestamp, ser);
      } catch {
        // ignore
      }
    }
  }, [syncCrosshairTime, displayCandles]);

  // Composite PNG Export helper (Main Canvas + Drawing SVG Overlay + Indicator Panes)
  const buildCompositePngAsync = useCallback(
    async (opts?: SnapshotExportOptions): Promise<string | null> => {
      try {
        const ch = chartRef.current;
        if (!ch) return null;
        const mainCanvas = ch.takeScreenshot();
        const includeDrawings = opts?.includeDrawings !== false;
        const includeIndicators = opts?.includeIndicators !== false;

        const subCanvases: HTMLCanvasElement[] = [];
        if (includeIndicators) {
          for (const ind of subPaneIndicators) {
            if (ind.collapsed) continue;
            const subCh = subChartRefs.current[ind.uid];
            if (subCh) {
              try {
                subCanvases.push(subCh.takeScreenshot());
              } catch {
                // ignore
              }
            }
          }
        }

        const totalNatW = mainCanvas.width;
        const totalNatH =
          mainCanvas.height + subCanvases.reduce((acc, c) => acc + c.height, 0);

        const targetW = opts?.width && opts.width > 0 ? opts.width : totalNatW;
        const targetH = opts?.height && opts.height > 0 ? opts.height : totalNatH;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetW;
        outCanvas.height = targetH;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) return mainCanvas.toDataURL('image/png');

        const bg = settings.canvasBgColor || (effectiveDark ? '#0B0F17' : '#FFFFFF');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, targetW, targetH);

        const scaleX = targetW / totalNatW;
        const scaleY = targetH / totalNatH;

        ctx.drawImage(mainCanvas, 0, 0, mainCanvas.width * scaleX, mainCanvas.height * scaleY);

        // Composite SVG drawings onto main chart area
        if (includeDrawings && overlaySvgRef.current) {
          const clone = overlaySvgRef.current.cloneNode(true) as SVGSVGElement;
          clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          const xml = new XMLSerializer().serializeToString(clone);
          const svgBlob = new Blob([xml], {type: 'image/svg+xml;charset=utf-8'});
          const svgUrl = URL.createObjectURL(svgBlob);
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, mainCanvas.width * scaleX, mainCanvas.height * scaleY);
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            img.src = svgUrl;
          });
        }

        // Stack indicator sub-panes cleanly
        let yOffset = mainCanvas.height * scaleY;
        for (const sc of subCanvases) {
          ctx.fillStyle = effectiveDark ? '#1E293B' : '#CBD5E1';
          ctx.fillRect(0, yOffset, targetW, 1);
          ctx.drawImage(sc, 0, yOffset, sc.width * scaleX, sc.height * scaleY);
          yOffset += sc.height * scaleY;
        }

        return outCanvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
    [subPaneIndicators, settings.canvasBgColor, effectiveDark],
  );

  // Register imperative actions (Zoom, Pan, Viewport History, Navigate to Price, Range presets, Go to Date, PNG/SVG/CSV Export)
  useEffect(() => {
    const actions: PaneActions = {
      zoomIn: () => {
        const ts = chartRef.current?.timeScale();
        const r = ts?.getVisibleLogicalRange();
        if (!ts || !r) return;
        pushViewportSnapshot(r);
        const span = Math.max(12, (r.to - r.from) * 0.72);
        const center = (r.from + r.to) / 2;
        ts.setVisibleLogicalRange({from: center - span / 2, to: center + span / 2});
      },
      zoomOut: () => {
        const ts = chartRef.current?.timeScale();
        const r = ts?.getVisibleLogicalRange();
        if (!ts || !r) return;
        pushViewportSnapshot(r);
        const span = Math.min(displayCandles.length * 1.4, (r.to - r.from) * 1.35);
        const center = (r.from + r.to) / 2;
        ts.setVisibleLogicalRange({from: center - span / 2, to: center + span / 2});
      },
      panByBars: (delta) => {
        const ts = chartRef.current?.timeScale();
        const r = ts?.getVisibleLogicalRange();
        if (!ts || !r) return;
        ts.setVisibleLogicalRange({from: r.from + delta, to: r.to + delta});
      },
      fitContent: () => {
        const ts = chartRef.current?.timeScale();
        pushViewportSnapshot(ts?.getVisibleLogicalRange() || null);
        ts?.fitContent();
      },
      scrollToLatest: () => {
        const ts = chartRef.current?.timeScale();
        pushViewportSnapshot(ts?.getVisibleLogicalRange() || null);
        ts?.scrollToRealTime();
      },
      resetView: () => {
        const ts = chartRef.current?.timeScale();
        pushViewportSnapshot(ts?.getVisibleLogicalRange() || null);
        onUpdatePane(pane.id, {autoScale: true, invertedScale: false, manualPriceRange: null}, false);
        if (displayCandles.length > 0 && ts) {
          ts.setVisibleLogicalRange({
            from: Math.max(0, displayCandles.length - 125),
            to: displayCandles.length + settings.rightOffsetBars,
          });
        }
      },
      restorePreviousViewport: () => {
        const ts = chartRef.current?.timeScale();
        if (!ts || viewportHistoryRef.current.length === 0) return false;
        const prev = viewportHistoryRef.current.pop()!;
        ts.setVisibleLogicalRange(prev);
        return true;
      },
      canRestoreViewport: () => viewportHistoryRef.current.length > 0,
      navigateToPrice: (price) => {
        if (!Number.isFinite(price)) return;
        const span = Math.max(symbolMeta.pipSize * 45, Math.abs(price) * 0.018);
        onUpdatePane(
          pane.id,
          {autoScale: false, manualPriceRange: {min: price - span / 2, max: price + span / 2}},
          false,
        );
      },
      applyRangePreset: (preset) => {
        if (displayCandles.length === 0 || !chartRef.current) return;
        const ts = chartRef.current.timeScale();
        pushViewportSnapshot(ts.getVisibleLogicalRange());
        const lastT = displayCandles[displayCandles.length - 1].time;
        let fromT = displayCandles[0].time;
        const day = 86400;
        if (preset === '1D') fromT = lastT - day;
        else if (preset === '5D') fromT = lastT - 5 * day;
        else if (preset === '1M') fromT = lastT - 30 * day;
        else if (preset === '3M') fromT = lastT - 90 * day;
        else if (preset === '6M') fromT = lastT - 180 * day;
        else if (preset === '1Y') fromT = lastT - 365 * day;
        else if (preset === 'YTD') {
          const d = new Date(lastT * 1000);
          fromT = Math.floor(Date.UTC(d.getUTCFullYear(), 0, 1) / 1000);
        }
        if (preset === 'ALL') {
          ts.fitContent();
          return;
        }
        const fromIdx = Math.max(
          0,
          displayCandles.findIndex((c) => c.time >= fromT),
        );
        ts.setVisibleLogicalRange({
          from: Math.max(0, fromIdx),
          to: displayCandles.length + settings.rightOffsetBars,
        });
      },
      goToDate: (unixSec) => {
        if (displayCandles.length === 0 || !chartRef.current) return;
        const ts = chartRef.current.timeScale();
        pushViewportSnapshot(ts.getVisibleLogicalRange());
        let bestIdx = 0;
        let bestDiff = Infinity;
        displayCandles.forEach((c, idx) => {
          const d = Math.abs(c.time - unixSec);
          if (d < bestDiff) {
            bestDiff = d;
            bestIdx = idx;
          }
        });
        ts.setVisibleLogicalRange({
          from: Math.max(0, bestIdx - 45),
          to: Math.min(displayCandles.length + settings.rightOffsetBars, bestIdx + 45),
        });
      },
      exportPngDataUrl: () => {
        try {
          const ch = chartRef.current;
          if (!ch) return null;
          return ch.takeScreenshot().toDataURL('image/png');
        } catch {
          return null;
        }
      },
      exportPngDataUrlAsync: buildCompositePngAsync,
      exportSvgMarkup: (opts) => {
        if (displayCandles.length === 0) return null;
        const w = dimensions.width || 1100;
        const h = dimensions.height || 620;
        const slice = displayCandles.slice(-110);
        const hi = Math.max(...slice.map((c) => c.high));
        const lo = Math.min(...slice.map((c) => c.low));
        const span = Math.max(hi - lo, 1e-6);
        const toY = (p: number) => 40 + ((hi - p) / span) * (h - 90);
        const colW = (w - 90) / Math.max(1, slice.length);
        const bg = settings.canvasBgColor || (effectiveDark ? '#0B0F17' : '#FFFFFF');
        const txtCol = effectiveDark ? '#E2E8F0' : '#0F172A';
        const shapes = slice
          .map((c, idx) => {
            const cx = 30 + idx * colW + colW * 0.5;
            const yH = toY(c.high);
            const yL = toY(c.low);
            const yO = toY(c.open);
            const yC = toY(c.close);
            const bull = c.close >= c.open;
            const col = bull ? settings.bullColor : settings.bearColor;
            const bw = Math.max(2, colW * 0.62);
            return `<line x1="${cx.toFixed(1)}" y1="${yH.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yL.toFixed(1)}" stroke="${col}" stroke-width="1.2"/><rect x="${(cx - bw / 2).toFixed(1)}" y="${Math.min(yO, yC).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1.5, Math.abs(yC - yO)).toFixed(1)}" fill="${col}"/>`;
          })
          .join('');
        const drawingsMarkup =
          opts?.includeDrawings !== false && overlaySvgRef.current
            ? overlaySvgRef.current.innerHTML
            : '';
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/><text x="30" y="24" fill="${txtCol}" font-family="monospace" font-size="14" font-weight="bold">SKFX Terminal · ${pane.symbol} · ${timeframeDef.label}</text>${shapes}${drawingsMarkup}</svg>`;
      },
      exportCsvContent: () => ({
        filename: `${pane.symbol}_${pane.interval}_candles.csv`,
        csv: exportCandlesToCsv(pane.symbol, pane.interval, displayCandles),
      }),
      getCandles: () => displayCandles,
    };
    onRegisterActions(pane.id, actions);
    return () => onRegisterActions(pane.id, null);
  }, [
    pane.id,
    pane.symbol,
    pane.interval,
    displayCandles,
    dimensions.width,
    dimensions.height,
    settings,
    effectiveDark,
    symbolMeta.pipSize,
    timeframeDef.label,
    buildCompositePngAsync,
    pushViewportSnapshot,
    onUpdatePane,
    onRegisterActions,
  ]);

  // Convert screen coordinates -> ChartPoint with optional magnet snap to OHLC
  const screenToChartPoint = useCallback(
    (clientX: number, clientY: number, snapOverride = false): ChartPoint | null => {
      const el = containerRef.current;
      const chart = chartRef.current;
      const ser = mainSeriesRef.current;
      if (!el || !chart || !ser || displayCandles.length === 0) return null;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 70, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height - 26, clientY - rect.top));

      const rawPrice = ser.coordinateToPrice(y);
      if (rawPrice === null || !Number.isFinite(rawPrice)) return null;
      let priceNum = Number(rawPrice);

      let timeVal = chart.timeScale().coordinateToTime(x) as number | null;
      if (timeVal === null || !Number.isFinite(timeVal)) {
        const logical = chart.timeScale().coordinateToLogical(x);
        if (logical !== null && Number.isFinite(logical)) {
          const clampedIdx = Math.max(0, Math.min(displayCandles.length - 1, Math.round(logical)));
          const extraBars = Math.round(logical) - clampedIdx;
          timeVal = displayCandles[clampedIdx].time + extraBars * timeframeDef.stepSec;
        }
      }
      if (timeVal === null || !Number.isFinite(timeVal)) return null;

      if (magnetEnabled || snapOverride) {
        let nearest = displayCandles[0];
        let bestDiff = Infinity;
        for (const bar of displayCandles) {
          const diff = Math.abs(bar.time - timeVal);
          if (diff < bestDiff) {
            bestDiff = diff;
            nearest = bar;
          }
        }
        timeVal = nearest.time;
        const candidates = [nearest.open, nearest.high, nearest.low, nearest.close];
        let bestP = candidates[0];
        let bestPy = Infinity;
        for (const p of candidates) {
          const py = ser.priceToCoordinate(p);
          if (py !== null && Math.abs(py - y) < bestPy) {
            bestPy = Math.abs(py - y);
            bestP = p;
          }
        }
        priceNum = bestP;
      }

      return {time: timeVal, price: Number(priceNum.toFixed(symbolMeta.decimals))};
    },
    [displayCandles, magnetEnabled, symbolMeta.decimals, timeframeDef.stepSec],
  );

  // Commit finalized drawing object
  const finalizeDrawing = useCallback(
    (tool: Exclude<DrawingToolId, 'crosshair' | 'dot' | 'arrow' | 'eraser'>, pts: ChartPoint[]) => {
      const id = `drw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const last = pts[pts.length - 1];
      const isFibTool = ['fib', 'fibext', 'fibtrendext', 'fibchannel', 'fibwedge'].includes(tool);
      const baseDrawing: ChartDrawing = {
        id,
        tool,
        symbol: pane.symbol,
        points: pts,
        color: '#2962FF',
        fillOpacity: 0.14,
        lineWidth: 2,
        lineStyle: 'solid',
        visible: true,
        locked: false,
        zIndex: pane.drawings.length + 1,
        createdAt: Date.now(),
        ...(isFibTool
          ? {
              fibLevels:
                tool === 'fib' || tool === 'fibchannel' || tool === 'fibwedge'
                  ? DEFAULT_FIB_RETRACE_LEVELS.map((l) => ({...l}))
                  : DEFAULT_FIB_EXT_LEVELS.map((l) => ({...l})),
              fibShowPrices: true,
              fibShowPercents: false,
              fibBgFill: true,
            }
          : {}),
        ...(tool === 'longpos' || tool === 'shortpos'
          ? {
              riskPercent: 1,
              leverage: 10,
              stopPrice:
                pts[1]?.price ??
                (tool === 'longpos'
                  ? pts[0].price - symbolMeta.pipSize * 25
                  : pts[0].price + symbolMeta.pipSize * 25),
              targetPrice:
                tool === 'longpos'
                  ? pts[0].price + Math.max(symbolMeta.pipSize * 10, Math.abs(pts[0].price - last.price)) * 2.1
                  : pts[0].price - Math.max(symbolMeta.pipSize * 10, Math.abs(pts[0].price - last.price)) * 2.1,
            }
          : {}),
      };
      onUpdatePane(pane.id, {drawings: [...pane.drawings, baseDrawing]}, true);
      onSelectDrawing(id);
      setDraftPoints([]);
      if (!stayInDrawingMode) {
        onResetToolToCursor();
      }
    },
    [
      pane.id,
      pane.symbol,
      pane.drawings,
      symbolMeta.pipSize,
      stayInDrawingMode,
      onUpdatePane,
      onSelectDrawing,
      onResetToolToCursor,
    ],
  );

  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onActivatePane(pane.id);
    if (dragStateRef.current) return;

    // Prevent drag-panning from triggering accidental clicks / drawing placements
    const downPos = pointerDownPosRef.current;
    pointerDownPosRef.current = null;
    if (downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) {
      return;
    }

    const pt = screenToChartPoint(e.clientX, e.clientY, e.shiftKey);
    if (!pt) return;

    if (replayState.selectingCutBar) {
      onCutReplayAtTime(pt.time);
      return;
    }

    if (
      activeTool === 'crosshair' ||
      activeTool === 'dot' ||
      activeTool === 'arrow' ||
      activeTool === 'eraser'
    ) {
      if (selectedDrawingId) onSelectDrawing(null);
      return;
    }

    const catalogEntry = DRAWING_CATALOG.find((t) => t.id === activeTool);
    const reqPts = catalogEntry?.requiredPoints ?? 2;
    if (reqPts === -1) return; // freehand brush/highlighter

    // Multi-point polyline / path: click adds points until double-click / Enter
    if (reqPts === -2) {
      setDraftPoints((prev) => [...prev, pt]);
      return;
    }

    if (reqPts <= 1) {
      finalizeDrawing(activeTool, [pt]);
      return;
    }

    const nextPts = [...draftPoints, pt];
    if (nextPts.length >= reqPts) {
      finalizeDrawing(activeTool, nextPts);
    } else {
      setDraftPoints(nextPts);
    }
  };

  const handleSurfaceDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Finish multi-point path/polyline on double-click
    if ((activeTool === 'path' || activeTool === 'polyline') && draftPoints.length >= 2) {
      e.stopPropagation();
      finalizeDrawing(activeTool, draftPoints);
      return;
    }

    // Double-clicking on the right/left price scale resets autoScale!
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const inRightScale = settings.scalePosition !== 'left' && relX >= rect.width - 72;
      const inLeftScale = settings.scalePosition === 'left' && relX <= 72;
      if (inRightScale || inLeftScale) {
        onUpdatePane(pane.id, {autoScale: true, manualPriceRange: null}, false);
        return;
      }
    }

    // §7 Double-click empty chart canvas in cursor mode opens Chart Settings
    if (
      activeTool === 'crosshair' ||
      activeTool === 'dot' ||
      activeTool === 'arrow'
    ) {
      onOpenSettings();
    }
  };

  const handleSurfaceContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onActivatePane(pane.id);
    const rect = containerRef.current?.getBoundingClientRect();
    const pt = screenToChartPoint(e.clientX, e.clientY, false);
    if (!rect) return;
    setContextMenu({
      x: Math.min(rect.width - 215, Math.max(8, e.clientX - rect.left)),
      y: Math.min(rect.height - 240, Math.max(8, e.clientY - rect.top)),
      drawingId: null,
      cursorPrice: pt?.price ?? null,
    });
  };

  const handleSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onActivatePane(pane.id);
    if (e.button !== 0) return;
    pointerDownPosRef.current = {x: e.clientX, y: e.clientY};
    if (activeTool !== 'brush' && activeTool !== 'highlighter') return;
    const pt = screenToChartPoint(e.clientX, e.clientY, e.shiftKey);
    if (!pt) return;
    freehandActiveRef.current = true;
    chartRef.current?.applyOptions({handleScroll: false, handleScale: false});
    setDraftPoints([pt]);
  };

  const handleSurfacePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pt = screenToChartPoint(e.clientX, e.clientY, e.shiftKey);
    if (pt) setCursorPoint(pt);

    if (freehandActiveRef.current && pt) {
      setDraftPoints((prev) => {
        const last = prev[prev.length - 1];
        if (!last || Math.abs(last.time - pt.time) > 0 || Math.abs(last.price - pt.price) > symbolMeta.pipSize * 0.4) {
          return [...prev, pt];
        }
        return prev;
      });
    }

    const drag = dragStateRef.current;
    if (drag && pt) {
      const startPt = screenToChartPoint(drag.startX, drag.startY, false);
      if (!startPt) return;
      const dTime = pt.time - startPt.time;
      const dPrice = pt.price - startPt.price;
      const updated = pane.drawings.map((d) => {
        if (d.id !== drag.drawingId) return d;
        const orig = drag.origDrawing;
        if (drag.handle === 'body') {
          return {
            ...d,
            points: orig.points.map((p) => ({
              time: p.time + dTime,
              price: Number((p.price + dPrice).toFixed(symbolMeta.decimals)),
            })),
            ...(orig.stopPrice !== undefined
              ? {stopPrice: Number((orig.stopPrice + dPrice).toFixed(symbolMeta.decimals))}
              : {}),
            ...(orig.targetPrice !== undefined
              ? {targetPrice: Number((orig.targetPrice + dPrice).toFixed(symbolMeta.decimals))}
              : {}),
          };
        }
        if (drag.handle.startsWith('pt_')) {
          const idx = Number(drag.handle.slice(3));
          return {
            ...d,
            points: d.points.map((p, i) => (i === idx ? pt : p)),
          };
        }
        if (drag.handle === 'tp') {
          return {...d, targetPrice: pt.price};
        }
        if (drag.handle === 'sl') {
          return {...d, stopPrice: pt.price};
        }
        if (drag.handle === 'entry') {
          const diff = pt.price - orig.points[0].price;
          return {
            ...d,
            points: orig.points.map((p, i) =>
              i === 0 ? {time: pt.time, price: pt.price} : {...p, time: p.time + dTime},
            ),
            stopPrice:
              orig.stopPrice !== undefined
                ? Number((orig.stopPrice + diff).toFixed(symbolMeta.decimals))
                : undefined,
            targetPrice:
              orig.targetPrice !== undefined
                ? Number((orig.targetPrice + diff).toFixed(symbolMeta.decimals))
                : undefined,
          };
        }
        if (drag.handle === 'end' && orig.points.length >= 2) {
          return {
            ...d,
            points: orig.points.map((p, i) => (i === 1 ? {...p, time: pt.time} : p)),
          };
        }
        return d;
      });
      onUpdatePane(pane.id, {drawings: updated}, false);
    }
  };

  const handleSurfacePointerUp = useCallback(() => {
    if (freehandActiveRef.current) {
      freehandActiveRef.current = false;
      chartRef.current?.applyOptions({
        handleScroll: CHART_HANDLE_SCROLL,
        handleScale: CHART_HANDLE_SCALE,
      });
      if (
        (activeTool === 'brush' || activeTool === 'highlighter') &&
        draftPoints.length >= 2
      ) {
        finalizeDrawing(activeTool, draftPoints);
      } else {
        setDraftPoints([]);
      }
    }
    if (dragStateRef.current) {
      dragStateRef.current = null;
      chartRef.current?.applyOptions({
        handleScroll: CHART_HANDLE_SCROLL,
        handleScale: CHART_HANDLE_SCALE,
      });
      onUpdatePane(pane.id, {drawings: pane.drawings}, true);
    }
  }, [activeTool, draftPoints, finalizeDrawing, onUpdatePane, pane.drawings, pane.id]);

  // Ensure chart pan/zoom is always restored even if pointer is released outside chart surface
  useEffect(() => {
    const onWinUp = () => {
      if (freehandActiveRef.current || dragStateRef.current) {
        handleSurfacePointerUp();
      }
    };
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
    return () => {
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    };
  }, [handleSurfacePointerUp]);

  const handleStartHandleDrag = (
    drawingId: string,
    handle: 'tp' | 'sl' | 'entry' | 'end' | 'body' | `pt_${number}`,
    e: React.PointerEvent,
  ) => {
    if (lockedAll) return;
    const orig = pane.drawings.find((d) => d.id === drawingId);
    if (!orig || orig.locked) return;
    chartRef.current?.applyOptions({handleScroll: false, handleScale: false});
    dragStateRef.current = {
      drawingId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origDrawing: JSON.parse(JSON.stringify(orig)) as ChartDrawing,
    };
  };

  const handleEraseDrawing = (drawingId: string) => {
    onUpdatePane(
      pane.id,
      {drawings: pane.drawings.filter((d) => d.id !== drawingId)},
      true,
    );
    if (selectedDrawingId === drawingId) onSelectDrawing(null);
  };

  const selectedDrawing = useMemo(
    () => paneDrawings.find((d) => d.id === selectedDrawingId) || null,
    [paneDrawings, selectedDrawingId],
  );

  const contextDrawing = useMemo(
    () => (contextMenu?.drawingId ? paneDrawings.find((d) => d.id === contextMenu.drawingId) || null : null),
    [contextMenu, paneDrawings],
  );

  const activeBar = hoveredBar || displayCandles[displayCandles.length - 1] || null;
  const prevBar =
    displayCandles.length >= 2 ? displayCandles[displayCandles.length - 2] : activeBar;
  const barChange = activeBar && prevBar ? activeBar.close - prevBar.close : 0;
  const barChangePct =
    activeBar && prevBar && prevBar.close > 0 ? (barChange / prevBar.close) * 100 : 0;

  const badge = feedBadgeStyle(feedStatus);
  const spread = Math.max(symbolMeta.pipSize * 0.8, (activeBar?.close ?? 1) * 0.00012);
  const bidPrice = activeBar ? activeBar.close - spread / 2 : 0;
  const askPrice = activeBar ? activeBar.close + spread / 2 : 0;

  const updateDrawingById = (drwId: string, patch: Partial<ChartDrawing>) => {
    onUpdatePane(
      pane.id,
      {
        drawings: pane.drawings.map((d) => (d.id === drwId ? {...d, ...patch} : d)),
      },
      true,
    );
  };

  const duplicateDrawingById = (drwId: string) => {
    const target = paneDrawings.find((d) => d.id === drwId);
    if (!target) return;
    const copyId = `drw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const copy: ChartDrawing = {
      ...JSON.parse(JSON.stringify(target)),
      id: copyId,
      locked: false,
      points: target.points.map((p) => ({
        time: p.time + timeframeDef.stepSec * 4,
        price: Number((p.price + symbolMeta.pipSize * 8).toFixed(symbolMeta.decimals)),
      })),
    };
    onUpdatePane(pane.id, {drawings: [...pane.drawings, copy]}, true);
    onSelectDrawing(copyId);
  };

  const cursorClass =
    replayState.selectingCutBar
      ? 'cursor-col-resize'
      : activeTool === 'eraser'
        ? 'cursor-not-allowed'
        : activeTool === 'dot'
          ? 'cursor-cell'
          : activeTool === 'arrow'
            ? 'cursor-default'
            : 'cursor-crosshair';

  return (
    <div
      onMouseDown={() => onActivatePane(pane.id)}
      className={`relative flex flex-col w-full h-full min-h-[260px] overflow-hidden border transition-colors ${
        isActive
          ? 'border-[#2962FF]/70'
          : effectiveDark
            ? 'border-[#1E293B]'
            : 'border-slate-200'
      } ${effectiveDark ? 'bg-[#0B0F17]' : 'bg-white'}`}
    >
      {/* Main Chart Viewport */}
      <div
        className={`relative flex-1 min-h-0 ${cursorClass}`}
        onClick={handleSurfaceClick}
        onDoubleClick={handleSurfaceDoubleClick}
        onContextMenu={handleSurfaceContextMenu}
        onPointerDown={handleSurfacePointerDown}
        onPointerMove={handleSurfacePointerMove}
        onPointerUp={handleSurfacePointerUp}
        onMouseLeave={() => {
          setCursorPoint(null);
          if (freehandActiveRef.current) handleSurfacePointerUp();
        }}
      >
        {/* Subtle Watermark */}
        {settings.showWatermark && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none z-0 opacity-[0.045]">
            <span
              className={`font-display font-black tracking-tight text-4xl sm:text-6xl ${
                effectiveDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {symbolMeta.ticker}
            </span>
            <span
              className={`font-mono font-bold text-sm tracking-widest mt-1 ${
                effectiveDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {timeframeDef.label} · {symbolMeta.exchange}
            </span>
          </div>
        )}

        {/* Lightweight Chart Container */}
        <div ref={containerRef} className="absolute inset-0 z-[1]" />

        {/* Drawing SVG Vector Overlay + Session Breaks */}
        <DrawingOverlay
          svgRef={overlaySvgRef}
          chart={chartRef.current}
          mainSeries={mainSeriesRef.current}
          candles={displayCandles}
          drawings={paneDrawings}
          draftPoints={draftPoints}
          cursorPoint={cursorPoint}
          activeTool={activeTool}
          selectedId={selectedDrawingId}
          hideAll={hideAllDrawings}
          decimals={symbolMeta.decimals}
          pipSize={symbolMeta.pipSize}
          symbol={pane.symbol}
          accountBalance={accountBalance}
          currentPrice={activeBar?.close ?? 0}
          width={dimensions.width}
          height={dimensions.height}
          renderTick={renderTick}
          sessionBreakTimes={sessionBreakTimes}
          isDark={effectiveDark}
          onSelectDrawing={onSelectDrawing}
          onDoubleClickDrawing={(id) => onEditDrawingProps(id)}
          onContextMenuDrawing={(id, e) => {
            const rect = containerRef.current?.getBoundingClientRect();
            const pt = screenToChartPoint(e.clientX, e.clientY, false);
            if (!rect) return;
            setContextMenu({
              x: Math.min(rect.width - 215, Math.max(8, e.clientX - rect.left)),
              y: Math.min(rect.height - 240, Math.max(8, e.clientY - rect.top)),
              drawingId: id,
              cursorPrice: pt?.price ?? null,
            });
          }}
          onEraseDrawing={handleEraseDrawing}
          onStartHandleDrag={handleStartHandleDrag}
        />

        {/* Multi-click path/polyline hint */}
        {(activeTool === 'path' || activeTool === 'polyline') && draftPoints.length > 0 && (
          <div
            className={`absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded border text-[11px] font-medium shadow-lg pointer-events-none ${
              effectiveDark
                ? 'bg-[#131722]/90 border-[#2962FF]/40 text-slate-200'
                : 'bg-white/95 border-[#2962FF]/40 text-slate-800'
            }`}
          >
            {draftPoints.length} point{draftPoints.length > 1 ? 's' : ''} placed — Click to continue, Double-click or Press Enter to finish
          </div>
        )}

        {/* Replay Cut Bar Hint */}
        {replayState.selectingCutBar && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded bg-[#2962FF] text-white text-xs font-semibold shadow-lg pointer-events-none">
            Click any historical candle on this chart to set Bar Replay start point
          </div>
        )}

        {/* Top-Left Status Line + OHLCV + Overlays */}
        <div
          className={`absolute top-1.5 z-20 pointer-events-none flex flex-col gap-1 ${
            settings.scalePosition === 'left' ? 'left-20 right-4' : 'left-2.5 right-24'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] pointer-events-auto">
            {settings.showSymbolTitle && (
              <div className="flex items-center gap-1.5">
                <SymbolBadge symbol={pane.symbol} size={16} />
                <span className={`font-bold ${effectiveDark ? 'text-white' : 'text-slate-900'}`}>
                  {symbolMeta.label}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">
                  · {timeframeDef.shortLabel} · {symbolMeta.exchange}
                </span>
                <span
                  title={`Market Feed Status: ${badge.label}`}
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-bold tracking-wider ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
            )}

            {settings.showOhlcValues && activeBar && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                <span className="text-slate-500">
                  O<span className={barChange >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                    {formatSimPrice(activeBar.open, symbolMeta.decimals)}
                  </span>
                </span>
                <span className="text-slate-500">
                  H<span className={barChange >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                    {formatSimPrice(activeBar.high, symbolMeta.decimals)}
                  </span>
                </span>
                <span className="text-slate-500">
                  L<span className={barChange >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                    {formatSimPrice(activeBar.low, symbolMeta.decimals)}
                  </span>
                </span>
                <span className="text-slate-500">
                  C<span className={barChange >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                    {formatSimPrice(activeBar.close, symbolMeta.decimals)}
                  </span>
                </span>
                {settings.showBarChangeValues && (
                  <span
                    className={`font-semibold ${
                      barChange >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                    }`}
                  >
                    {barChange >= 0 ? '+' : ''}
                    {formatSimPrice(barChange, symbolMeta.decimals)} ({barChangePct >= 0 ? '+' : ''}
                    {barChangePct.toFixed(2)}%)
                  </span>
                )}
                {settings.showVolumeInStatus && (
                  <span className={effectiveDark ? 'text-slate-400' : 'text-slate-600'}>
                    Vol{' '}
                    {activeBar.volume >= 1000
                      ? `${(activeBar.volume / 1000).toFixed(1)}K`
                      : activeBar.volume.toFixed(0)}
                  </span>
                )}
              </div>
            )}

            {settings.showCountdown && (
              <span
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] tabular-nums ${
                  effectiveDark
                    ? 'bg-slate-500/15 text-slate-300'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {countdownText}
              </span>
            )}
          </div>

          {/* Optional One-Click Trading */}
          {settings.showOneClickTrading && activeBar && (
            <div className="flex items-center gap-1 pointer-events-auto w-fit">
              <button
                type="button"
                onClick={() => onQuickOrder(pane.symbol, 'SELL', bidPrice)}
                className="px-2 py-0.5 rounded-l bg-[#F23645]/90 hover:bg-[#F23645] text-white font-mono text-[10px] font-bold tabular-nums transition-colors"
                title="Instant Market Sell"
              >
                SELL {formatSimPrice(bidPrice, symbolMeta.decimals)}
              </button>
              <span
                className={`px-1 py-0.5 text-[9px] font-mono ${
                  effectiveDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {((askPrice - bidPrice) / (symbolMeta.pipSize || 0.01)).toFixed(1)}
              </span>
              <button
                type="button"
                onClick={() => onQuickOrder(pane.symbol, 'BUY', askPrice)}
                className="px-2 py-0.5 rounded-r bg-[#089981]/90 hover:bg-[#089981] text-white font-mono text-[10px] font-bold tabular-nums transition-colors"
                title="Instant Market Buy"
              >
                BUY {formatSimPrice(askPrice, symbolMeta.decimals)}
              </button>
            </div>
          )}

          {/* Overlay Indicator Legend Strip */}
          {settings.showIndicatorValues && (overlayIndicators.length > 0 || pane.compareSymbols.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
              {pane.compareSymbols.map((comp) => (
                <div
                  key={comp.symbol}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                    effectiveDark
                      ? 'bg-[#131722]/85 border-[#2A2E39] text-slate-200'
                      : 'bg-slate-100/90 border-slate-300 text-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: comp.color}} />
                  <span className="font-semibold">{comp.symbol} (%)</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePane(pane.id, {
                        compareSymbols: pane.compareSymbols.filter((x) => x.symbol !== comp.symbol),
                      })
                    }
                    className="ml-0.5 text-slate-400 hover:text-rose-400"
                    title="Remove compare symbol"
                  >
                    ×
                  </button>
                </div>
              ))}

              {overlayIndicators.map((ind) => {
                const out = computedIndicators[ind.uid];
                return (
                  <div
                    key={ind.uid}
                    className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border ${
                      effectiveDark
                        ? 'bg-[#131722]/85 border-[#2A2E39] text-slate-200'
                        : 'bg-slate-100/90 border-slate-300 text-slate-800'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{backgroundColor: ind.colors[0] || '#2962FF'}}
                    />
                    <span className="font-medium truncate max-w-[140px]">{ind.name}</span>
                    <span className="font-mono text-[#2962FF] tabular-nums">
                      {ind.visible ? out?.latestSummary : 'Off'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePane(
                          pane.id,
                          {
                            indicators: pane.indicators.map((i) =>
                              i.uid === ind.uid ? {...i, visible: !i.visible} : i,
                            ),
                          },
                          true,
                        )
                      }
                      className={
                        effectiveDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }
                      title={ind.visible ? 'Hide' : 'Show'}
                    >
                      {ind.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditIndicatorProps(pane.id, ind.uid)}
                      className={
                        effectiveDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }
                      title="Indicator settings"
                    >
                      <Settings className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePane(
                          pane.id,
                          {indicators: pane.indicators.filter((i) => i.uid !== ind.uid)},
                          true,
                        )
                      }
                      className={
                        effectiveDark
                          ? 'text-slate-400 hover:text-rose-400'
                          : 'text-slate-500 hover:text-rose-600'
                      }
                      title="Remove indicator"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Contextual Drawing Toolbar */}
        {selectedDrawing && (
          <div
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute top-12 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-1 px-2 py-1 rounded-lg border shadow-xl text-[11px] ${
              effectiveDark
                ? 'bg-[#131722]/95 border-[#2A2E39] text-slate-200'
                : 'bg-white/95 border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-500/25">
              {['#2962FF', '#089981', '#F23645', '#F59E0B', '#A855F7', effectiveDark ? '#E2E8F0' : '#0F172A'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => updateDrawingById(selectedDrawing.id, {color: col})}
                  className={`w-3.5 h-3.5 rounded-full border ${
                    selectedDrawing.color === col ? 'ring-2 ring-[#2962FF] border-white' : 'border-transparent'
                  }`}
                  style={{backgroundColor: col}}
                  title={`Color ${col}`}
                />
              ))}
            </div>

            <select
              value={selectedDrawing.lineWidth || 2}
              onChange={(e) => updateDrawingById(selectedDrawing.id, {lineWidth: Number(e.target.value)})}
              className="px-1 py-0.5 rounded bg-transparent border border-slate-500/30 text-[10px]"
              title="Line width"
            >
              <option value={1} className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>1px</option>
              <option value={2} className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>2px</option>
              <option value={3} className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>3px</option>
              <option value={4} className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>4px</option>
            </select>

            <select
              value={selectedDrawing.lineStyle || 'solid'}
              onChange={(e) =>
                updateDrawingById(selectedDrawing.id, {
                  lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted',
                })
              }
              className="px-1 py-0.5 rounded bg-transparent border border-slate-500/30 text-[10px]"
              title="Line style"
            >
              <option value="solid" className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Solid</option>
              <option value="dashed" className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dashed</option>
              <option value="dotted" className={effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dotted</option>
            </select>

            {(selectedDrawing.tool === 'trendline' ||
              selectedDrawing.tool === 'fib' ||
              selectedDrawing.tool === 'fibext') && (
              <button
                type="button"
                onClick={() =>
                  updateDrawingById(selectedDrawing.id, {
                    extendRight: !selectedDrawing.extendRight,
                  })
                }
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                  selectedDrawing.extendRight ? 'bg-[#2962FF] text-white' : 'hover:bg-slate-500/15'
                }`}
                title="Extend right"
              >
                <MoveHorizontal className="w-3 h-3" />
                Ext
              </button>
            )}

            <button
              type="button"
              onClick={() => onEditDrawingProps(selectedDrawing.id)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-500/15 flex items-center gap-1 font-semibold text-[#2962FF]"
              title="Edit drawing properties & coordinates"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Settings
            </button>

            <button
              type="button"
              onClick={() => duplicateDrawingById(selectedDrawing.id)}
              className="p-1 rounded hover:bg-slate-500/15"
              title="Clone drawing"
            >
              <Copy className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => updateDrawingById(selectedDrawing.id, {locked: !selectedDrawing.locked})}
              className={`p-1 rounded ${selectedDrawing.locked ? 'text-amber-400' : 'hover:bg-slate-500/15'}`}
              title={selectedDrawing.locked ? 'Unlock drawing' : 'Lock drawing'}
            >
              {selectedDrawing.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => updateDrawingById(selectedDrawing.id, {visible: !selectedDrawing.visible})}
              className="p-1 rounded hover:bg-slate-500/15"
              title="Hide drawing"
            >
              <EyeOff className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateDrawingById(selectedDrawing.id, {
                  zIndex: Math.max(...pane.drawings.map((d) => d.zIndex ?? 0), 0) + 1,
                })
              }
              className="px-1 py-0.5 rounded hover:bg-slate-500/15 text-[10px]"
              title="Bring to front"
            >
              Front
            </button>

            <button
              type="button"
              onClick={() => handleEraseDrawing(selectedDrawing.id)}
              className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
              title="Delete selected drawing (Del)"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Right-Click Context Menu (Canvas or Drawing) */}
        {contextMenu && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{left: contextMenu.x, top: contextMenu.y}}
            className={`absolute z-40 w-52 py-1 rounded-lg border shadow-2xl text-[11px] ${
              effectiveDark
                ? 'bg-[#131722] border-[#2A2E39] text-slate-200'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {contextDrawing ? (
              <>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-500/15">
                  {contextDrawing.tool.toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onEditDrawingProps(contextDrawing.id);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#2962FF]/15 hover:text-[#2962FF]"
                >
                  Settings &amp; Coordinates...
                </button>
                <button
                  type="button"
                  onClick={() => {
                    duplicateDrawingById(contextDrawing.id);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Clone Drawing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCopyDrawing(contextDrawing);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Copy (Ctrl+C)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateDrawingById(contextDrawing.id, {locked: !contextDrawing.locked});
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  {contextDrawing.locked ? 'Unlock Drawing' : 'Lock Drawing'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateDrawingById(contextDrawing.id, {visible: false});
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Hide Drawing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateDrawingById(contextDrawing.id, {
                      zIndex: Math.max(...pane.drawings.map((d) => d.zIndex ?? 0), 0) + 1,
                    });
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Bring to Front
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateDrawingById(contextDrawing.id, {
                      zIndex: Math.min(...pane.drawings.map((d) => d.zIndex ?? 0), 0) - 1,
                    });
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Send to Back
                </button>
                <div className="my-1 border-t border-slate-500/15" />
                <button
                  type="button"
                  onClick={() => {
                    handleEraseDrawing(contextDrawing.id);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/15"
                >
                  Delete Drawing (Del)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const ts = chartRef.current?.timeScale();
                    pushViewportSnapshot(ts?.getVisibleLogicalRange() || null);
                    onUpdatePane(pane.id, {autoScale: true, invertedScale: false, manualPriceRange: null}, false);
                    if (displayCandles.length > 0 && ts) {
                      ts.setVisibleLogicalRange({
                        from: Math.max(0, displayCandles.length - 125),
                        to: displayCandles.length + settings.rightOffsetBars,
                      });
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 flex justify-between"
                >
                  <span>Reset Chart View</span>
                  <span className="font-mono text-[10px] text-slate-400">Alt+R</span>
                </button>
                <button
                  type="button"
                  disabled={viewportHistoryRef.current.length === 0}
                  onClick={() => {
                    const ts = chartRef.current?.timeScale();
                    if (ts && viewportHistoryRef.current.length > 0) {
                      ts.setVisibleLogicalRange(viewportHistoryRef.current.pop()!);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 disabled:opacity-35"
                >
                  Restore Previous Viewport
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNavPriceInput(
                      (contextMenu.cursorPrice ?? activeBar?.close ?? 100).toFixed(symbolMeta.decimals),
                    );
                    setNavPriceOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Navigate to Price...
                </button>
                {hasClipboardDrawing && (
                  <button
                    type="button"
                    onClick={() => {
                      onPasteDrawing();
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 flex justify-between"
                  >
                    <span>Paste Drawing</span>
                    <span className="font-mono text-[10px] text-slate-400">Ctrl+V</span>
                  </button>
                )}
                <div className="my-1 border-t border-slate-500/15" />
                <button
                  type="button"
                  onClick={() => {
                    onUpdatePane(pane.id, {autoScale: !pane.autoScale}, false);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 flex justify-between"
                >
                  <span>Auto Price Scale</span>
                  <span className="text-[#2962FF] font-bold">{pane.autoScale ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdatePane(pane.id, {invertedScale: !pane.invertedScale}, false);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 flex justify-between"
                >
                  <span>Invert Price Scale</span>
                  <span className="text-[#2962FF] font-bold">{pane.invertedScale ? 'ON' : 'OFF'}</span>
                </button>
                {pane.drawings.some((d) => !d.visible) && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePane(
                        pane.id,
                        {drawings: pane.drawings.map((d) => ({...d, visible: true}))},
                        true,
                      );
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 text-[#089981]"
                  >
                    Unhide Hidden Drawings
                  </button>
                )}
                {contextMenu.cursorPrice !== null && (
                  <>
                    <div className="my-1 border-t border-slate-500/15" />
                    <button
                      type="button"
                      onClick={() => {
                        onQuickOrder(pane.symbol, 'BUY', contextMenu.cursorPrice!);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[#089981] hover:bg-[#089981]/15 font-mono"
                    >
                      Paper Buy @ {formatSimPrice(contextMenu.cursorPrice, symbolMeta.decimals)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onQuickOrder(pane.symbol, 'SELL', contextMenu.cursorPrice!);
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[#F23645] hover:bg-[#F23645]/15 font-mono"
                    >
                      Paper Sell @ {formatSimPrice(contextMenu.cursorPrice, symbolMeta.decimals)}
                    </button>
                  </>
                )}
                <div className="my-1 border-t border-slate-500/15" />
                <button
                  type="button"
                  onClick={() => {
                    onOpenSnapshot();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15"
                >
                  Export Snapshot / Data...
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-500/15 font-semibold"
                >
                  Chart Settings...
                </button>
              </>
            )}
          </div>
        )}

        {/* Navigate to Price Popover */}
        {navPriceOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-14 right-[72px] z-30 p-2.5 rounded-lg border shadow-xl w-52 text-xs ${
              effectiveDark
                ? 'bg-[#131722] border-[#2A2E39] text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <div className="font-semibold mb-1.5">Navigate to Price</div>
            <input
              autoFocus
              type="number"
              step="any"
              value={navPriceInput}
              onChange={(e) => setNavPriceInput(e.target.value)}
              className="w-full px-2 py-1 rounded border border-slate-500/35 bg-transparent font-mono text-xs mb-2"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setNavPriceOpen(false)}
                className="px-2 py-1 rounded border border-slate-500/30 text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = Number(navPriceInput);
                  if (Number.isFinite(p)) {
                    const span = Math.max(symbolMeta.pipSize * 45, Math.abs(p) * 0.018);
                    onUpdatePane(
                      pane.id,
                      {autoScale: false, manualPriceRange: {min: p - span / 2, max: p + span / 2}},
                      false,
                    );
                    setNavPriceOpen(false);
                  }
                }}
                className="px-2.5 py-1 rounded bg-[#2962FF] text-white text-[10px] font-semibold"
              >
                Center Price
              </button>
            </div>
          </div>
        )}

        {/* Price Scale Interactive Mode Bar (bottom-right above axis) */}
        <div
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className={`absolute bottom-7 right-[72px] z-20 flex items-center gap-0.5 px-1 py-0.5 rounded border text-[10px] font-mono ${
            effectiveDark
              ? 'bg-[#131722]/90 border-[#2A2E39] text-slate-300'
              : 'bg-white/95 border-slate-300 text-slate-700'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              onUpdatePane(
                pane.id,
                {autoScale: !pane.autoScale, manualPriceRange: !pane.autoScale ? null : pane.manualPriceRange},
                false,
              )
            }
            className={`px-1.5 py-0.5 rounded font-bold ${
              pane.autoScale ? 'bg-[#2962FF] text-white' : 'hover:bg-slate-500/15'
            }`}
            title="Auto price scale"
          >
            A
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdatePane(
                pane.id,
                {priceScaleMode: pane.priceScaleMode === 'logarithmic' ? 'normal' : 'logarithmic'},
                false,
              )
            }
            className={`px-1.5 py-0.5 rounded font-bold ${
              pane.priceScaleMode === 'logarithmic' ? 'bg-[#2962FF] text-white' : 'hover:bg-slate-500/15'
            }`}
            title="Logarithmic scale"
          >
            L
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdatePane(
                pane.id,
                {priceScaleMode: pane.priceScaleMode === 'percentage' ? 'normal' : 'percentage'},
                false,
              )
            }
            className={`px-1.5 py-0.5 rounded font-bold ${
              pane.priceScaleMode === 'percentage' ? 'bg-[#2962FF] text-white' : 'hover:bg-slate-500/15'
            }`}
            title="Percentage scale"
          >
            %
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdatePane(
                pane.id,
                {priceScaleMode: pane.priceScaleMode === 'indexed100' ? 'normal' : 'indexed100'},
                false,
              )
            }
            className={`px-1.5 py-0.5 rounded font-bold ${
              pane.priceScaleMode === 'indexed100' ? 'bg-[#2962FF] text-white' : 'hover:bg-slate-500/15'
            }`}
            title="Indexed to 100"
          >
            100
          </button>
          <button
            type="button"
            onClick={() => onUpdatePane(pane.id, {invertedScale: !pane.invertedScale}, false)}
            className={`px-1.5 py-0.5 rounded font-bold ${
              pane.invertedScale ? 'bg-[#2962FF] text-white' : 'hover:bg-slate-500/15'
            }`}
            title="Invert price scale"
          >
            ⇅
          </button>
          <button
            type="button"
            onClick={() => {
              const lastP = activeBar?.close ?? 100;
              setManualMinInput(
                pane.manualPriceRange?.min?.toString() || (lastP * 0.985).toFixed(symbolMeta.decimals),
              );
              setManualMaxInput(
                pane.manualPriceRange?.max?.toString() || (lastP * 1.015).toFixed(symbolMeta.decimals),
              );
              setManualScaleOpen((v) => !v);
            }}
            className={`px-1.5 py-0.5 rounded ${
              !pane.autoScale && pane.manualPriceRange ? 'bg-amber-500 text-black font-bold' : 'hover:bg-slate-500/15'
            }`}
            title="Manual Min/Max Price Bounds"
          >
            Min/Max
          </button>
        </div>

        {/* Manual Price Scale Min/Max Popover */}
        {manualScaleOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-14 right-[72px] z-30 p-2.5 rounded-lg border shadow-xl w-52 text-xs ${
              effectiveDark
                ? 'bg-[#131722] border-[#2A2E39] text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <div className="font-semibold mb-1.5">Manual Price Bounds</div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <label className="text-[10px] text-slate-400">
                Min
                <input
                  type="number"
                  step="any"
                  value={manualMinInput}
                  onChange={(e) => setManualMinInput(e.target.value)}
                  className="mt-0.5 w-full px-1.5 py-1 rounded bg-transparent border border-slate-500/35 font-mono text-[11px]"
                />
              </label>
              <label className="text-[10px] text-slate-400">
                Max
                <input
                  type="number"
                  step="any"
                  value={manualMaxInput}
                  onChange={(e) => setManualMaxInput(e.target.value)}
                  className="mt-0.5 w-full px-1.5 py-1 rounded bg-transparent border border-slate-500/35 font-mono text-[11px]"
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onUpdatePane(pane.id, {autoScale: true, manualPriceRange: null}, false);
                  setManualScaleOpen(false);
                }}
                className="px-2 py-1 rounded border border-slate-500/30 text-[10px]"
              >
                Reset Auto
              </button>
              <button
                type="button"
                onClick={() => {
                  const minV = Number(manualMinInput);
                  const maxV = Number(manualMaxInput);
                  if (Number.isFinite(minV) && Number.isFinite(maxV) && maxV > minV) {
                    onUpdatePane(
                      pane.id,
                      {autoScale: false, manualPriceRange: {min: minV, max: maxV}},
                      false,
                    );
                    setManualScaleOpen(false);
                  }
                }}
                className="px-2 py-1 rounded bg-[#2962FF] text-white text-[10px] font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Loading / Error Overlay */}
        {loading && displayCandles.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div
              className={`px-3 py-1.5 rounded border text-xs font-mono ${
                effectiveDark
                  ? 'bg-[#131722] border-[#2A2E39] text-slate-200'
                  : 'bg-white border-slate-300 text-slate-800 shadow-md'
              }`}
            >
              Loading {pane.symbol} ({pane.interval})...
            </div>
          </div>
        )}
        {fetchError && (
          <div className="absolute bottom-10 left-3 z-20 px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-400">
            Data notice: {fetchError}
          </div>
        )}
      </div>

      {/* Synced Indicator Sub-Panes */}
      {subPaneIndicators.map((ind, idx) => (
        <IndicatorSubPane
          key={ind.uid}
          inst={ind}
          output={computedIndicators[ind.uid] || {instanceId: ind.uid, series: [], latestSummary: '—'}}
          candles={displayCandles}
          isDark={effectiveDark}
          decimals={symbolMeta.decimals}
          timezone={settings.timezone}
          canvasBgColor={settings.canvasBgColor}
          gridColor={settings.gridColor}
          mainLogicalRange={subLogicalRange}
          crosshairTime={localCrosshairTime}
          canMoveUp={idx > 0}
          canMoveDown={idx < subPaneIndicators.length - 1}
          onRegisterSubChart={registerSubChart}
          onRangeChange={(r) => {
            if (!chartRef.current || !r) return;
            if (rangesApproxEqual(lastVisRangeRef.current, r, 0.05)) return;
            applyMainLogicalRangeSafely(r);
          }}
          onCrosshairMove={(t) => {
            setLocalCrosshairTime((prev) => (prev === t ? prev : t));
          }}
          onToggleVisible={() =>
            onUpdatePane(
              pane.id,
              {
                indicators: pane.indicators.map((x) =>
                  x.uid === ind.uid ? {...x, visible: !x.visible} : x,
                ),
              },
              true,
            )
          }
          onChangeScaleMode={(mode) =>
            onUpdatePane(
              pane.id,
              {
                indicators: pane.indicators.map((x) =>
                  x.uid === ind.uid ? {...x, scaleMode: mode} : x,
                ),
              },
              true,
            )
          }
          onOpenSettings={() => onEditIndicatorProps(pane.id, ind.uid)}
          onMoveUp={() => {
            if (idx <= 0) return;
            const prevSub = subPaneIndicators[idx - 1];
            const copy = [...pane.indicators];
            const iA = copy.findIndex((x) => x.uid === ind.uid);
            const iB = copy.findIndex((x) => x.uid === prevSub.uid);
            if (iA >= 0 && iB >= 0) {
              [copy[iA], copy[iB]] = [copy[iB], copy[iA]];
              onUpdatePane(pane.id, {indicators: copy}, true);
            }
          }}
          onMoveDown={() => {
            if (idx >= subPaneIndicators.length - 1) return;
            const nextSub = subPaneIndicators[idx + 1];
            const copy = [...pane.indicators];
            const iA = copy.findIndex((x) => x.uid === ind.uid);
            const iB = copy.findIndex((x) => x.uid === nextSub.uid);
            if (iA >= 0 && iB >= 0) {
              [copy[iA], copy[iB]] = [copy[iB], copy[iA]];
              onUpdatePane(pane.id, {indicators: copy}, true);
            }
          }}
          onToggleCollapse={() =>
            onUpdatePane(
              pane.id,
              {
                indicators: pane.indicators.map((x) =>
                  x.uid === ind.uid ? {...x, collapsed: !x.collapsed, expanded: false} : x,
                ),
              },
              false,
            )
          }
          onToggleExpand={() =>
            onUpdatePane(
              pane.id,
              {
                indicators: pane.indicators.map((x) =>
                  x.uid === ind.uid ? {...x, expanded: !x.expanded, collapsed: false} : x,
                ),
              },
              false,
            )
          }
          onRemove={() =>
            onUpdatePane(
              pane.id,
              {indicators: pane.indicators.filter((x) => x.uid !== ind.uid)},
              true,
            )
          }
          onResizeHeight={(newH) =>
            onUpdatePane(
              pane.id,
              {
                indicators: pane.indicators.map((x) =>
                  x.uid === ind.uid ? {...x, paneHeight: newH, expanded: false} : x,
                ),
              },
              false,
            )
          }
        />
      ))}
    </div>
  );
}
