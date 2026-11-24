import type {LogicalRange} from 'lightweight-charts';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FolderKanban,
  GitCompareArrows,
  History,
  Info,
  LayoutGrid,
  Lock,
  Magnet,
  Maximize2,
  Minimize2,
  Pause,
  PencilRuler,
  Play,
  Plus,
  Radio,
  Redo2,
  RotateCcw,
  Save,
  Scissors,
  Search,
  Settings,
  SkipForward,
  SlidersHorizontal,
  Star,
  StepBack,
  StepForward,
  Trash2,
  TrendingUp,
  Undo2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {apiFetch} from '../lib/apiClient';
import {
  aggregateCandles,
  applySimulatedTicksToCandles,
  computeLiveTickCandle,
  generateSimulatedTickBurst,
} from '../lib/tv/chartTransforms';
import {INDICATOR_DEFINITIONS, createIndicatorInstance} from '../lib/tv/indicators';
import {getSymbolMeta} from '../lib/tv/marketData';
import type {PublicUser} from '../types';
import {BrandLogo} from './BrandLogo';
import {ChartPane, type PaneActions, type SnapshotExportOptions} from './tv/ChartPane';
import {
  ChartSettingsModal,
  DrawingConfigModal,
  GoToDateModal,
  IndicatorSettingsModal,
  IndicatorsModal,
  QuickSearchModal,
  SnapshotModal,
  SymbolSearchModal,
  WorkspaceModal,
} from './tv/Modals';
import {SymbolBadge, TvToolSvg, type TvIconName} from './tv/TvIcons';
import {
  DEFAULT_CHART_TYPE_CONFIG,
  DEFAULT_FAVORITE_TIMEFRAMES,
  DEFAULT_FAVORITE_TOOLS,
  DEFAULT_FIB_EXT_LEVELS,
  DEFAULT_FIB_RETRACE_LEVELS,
  DEFAULT_SETTINGS,
  DRAWING_CATALOG,
  SPEEDS,
  TIMEFRAMES,
  TIMEZONE_OPTIONS,
  calcPips,
  calcPnl,
  formatBarTimestamp,
  formatSimPrice,
  resolveTimeframeDef,
  type CandleBar,
  type ChartDrawing,
  type ChartPaneState,
  type ChartStyleKey,
  type CustomTimeframeDef,
  type DrawingToolId,
  type FeedStatus,
  type FibLevelItem,
  type IndicatorId,
  type LayoutSyncOptions,
  type QuoteItem,
  type SavedWorkspace,
  type SimClosedTrade,
  type SimPosition,
  type SimulatedTick,
  type TimeframeKey,
  type ToolCatalogGroup,
  type WorkspaceLayoutMode,
} from './tv/types';

interface TradingViewSimulatorProps {
  user: PublicUser;
  isDark: boolean;
}

const CHART_STYLE_OPTIONS: {
  id: ChartStyleKey;
  label: string;
  synthetic?: boolean;
}[] = [
  {id: 'candles', label: 'Candles'},
  {id: 'hollow', label: 'Hollow Candles'},
  {id: 'bars', label: 'Bars (OHLC)'},
  {id: 'line', label: 'Line'},
  {id: 'area', label: 'Area'},
  {id: 'baseline', label: 'Baseline'},
  {id: 'heikinashi', label: 'Heikin Ashi', synthetic: true},
  {id: 'renko', label: 'Renko Bricks', synthetic: true},
  {id: 'linebreak', label: 'Line Break', synthetic: true},
  {id: 'kagi', label: 'Kagi', synthetic: true},
  {id: 'pnf', label: 'Point & Figure', synthetic: true},
  {id: 'rangebars', label: 'Range Bars', synthetic: true},
];

const LEFT_TOOLBAR_GROUPS: {
  group: ToolCatalogGroup;
  defaultIcon: TvIconName;
  label: string;
}[] = [
  {group: 'CURSOR', defaultIcon: 'crosshair', label: 'Cursors'},
  {group: 'TREND LINE', defaultIcon: 'trendline', label: 'Trend Line Tools'},
  {group: 'FIBONACCI', defaultIcon: 'fib_group', label: 'Fibonacci Tools'},
  {group: 'GANN', defaultIcon: 'gann_group', label: 'Gann Tools'},
  {group: 'PATTERN', defaultIcon: 'patterns_group', label: 'Pattern Tools'},
  {group: 'POSITION & MEASUREMENT', defaultIcon: 'projection_group', label: 'Position & Measure'},
  {group: 'BRUSH & SHAPE', defaultIcon: 'shapes_group', label: 'Brush & Geometric Shapes'},
  {group: 'ANNOTATION', defaultIcon: 'annotation_group', label: 'Text & Annotations'},
  {group: 'ICONS & SYMBOLS', defaultIcon: 'icons_group', label: 'Icons & Chart Markers'},
];

const COMPARE_PALETTE = ['#F59E0B', '#A855F7', '#06B6D4', '#EC4899', '#10B981'];
const EMPTY_CUSTOM_TIMEFRAMES: CustomTimeframeDef[] = [];
const REPLAY_TICKS_PER_BAR = 12;

function createDefaultPane(id = 'pane_1', symbol = 'XAUUSD', interval: TimeframeKey = '1h'): ChartPaneState {
  return {
    id,
    symbol,
    interval,
    chartStyle: 'candles',
    chartTypeConfig: {...DEFAULT_CHART_TYPE_CONFIG},
    compareSymbols: [],
    indicators: [
      createIndicatorInstance('ema', {inputs: {period: 50}, colors: ['#F59E0B']}),
      createIndicatorInstance('rsi', {inputs: {period: 14, overbought: 70, oversold: 30}}),
    ],
    drawings: [],
    priceScaleMode: 'normal',
    autoScale: true,
    invertedScale: false,
    manualPriceRange: null,
  };
}

function createDefaultWorkspace(userId: string): SavedWorkspace {
  return {
    id: `ws_${userId}_default`,
    name: 'Institutional Primary',
    updatedAt: new Date().toISOString(),
    layoutMode: '1x1',
    syncOptions: {
      symbol: false,
      timeframe: false,
      crosshair: true,
      timeRange: false,
      drawings: false,
    },
    activePaneId: 'pane_1',
    panes: [createDefaultPane('pane_1', 'XAUUSD', '1h')],
    settings: {...DEFAULT_SETTINGS},
    favoriteTimeframes: [...DEFAULT_FAVORITE_TIMEFRAMES],
    customTimeframes: [],
    recentSymbols: ['XAUUSD', 'EURUSD', 'BTCUSDT', 'NAS100'],
    favoriteIndicators: ['ema', 'sma', 'rsi', 'macd', 'bb', 'vwap'],
    favoriteTools: [...DEFAULT_FAVORITE_TOOLS],
    fibTemplates: [
      {name: 'Standard Retracement', levels: DEFAULT_FIB_RETRACE_LEVELS},
      {name: 'Trend Extension', levels: DEFAULT_FIB_EXT_LEVELS},
    ],
  };
}

function normalizeWorkspace(ws: SavedWorkspace, userId: string): SavedWorkspace {
  const base = createDefaultWorkspace(userId);
  return {
    ...base,
    ...ws,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(ws.settings || {}),
    },
    syncOptions: {
      ...base.syncOptions,
      ...(ws.syncOptions || {}),
    },
    panes:
      Array.isArray(ws.panes) && ws.panes.length > 0
        ? ws.panes.map((p) => ({
            ...createDefaultPane(p.id, p.symbol, p.interval),
            ...p,
            chartTypeConfig: {
              ...DEFAULT_CHART_TYPE_CONFIG,
              ...(p.chartTypeConfig || {}),
            },
          }))
        : base.panes,
    favoriteTimeframes:
      Array.isArray(ws.favoriteTimeframes) && ws.favoriteTimeframes.length > 0
        ? ws.favoriteTimeframes
        : base.favoriteTimeframes,
    customTimeframes: Array.isArray(ws.customTimeframes) ? ws.customTimeframes : [],
    recentSymbols: Array.isArray(ws.recentSymbols) ? ws.recentSymbols : base.recentSymbols,
    favoriteIndicators:
      Array.isArray(ws.favoriteIndicators) && ws.favoriteIndicators.length > 0
        ? ws.favoriteIndicators
        : base.favoriteIndicators,
    favoriteTools:
      Array.isArray(ws.favoriteTools) && ws.favoriteTools.length > 0
        ? ws.favoriteTools
        : base.favoriteTools,
    fibTemplates:
      Array.isArray(ws.fibTemplates) && ws.fibTemplates.length > 0
        ? ws.fibTemplates
        : base.fibTemplates,
  };
}

function requiredPanesForLayout(mode: WorkspaceLayoutMode): number {
  switch (mode) {
    case '2h':
    case '2v':
      return 2;
    case '3left':
    case '3top':
      return 3;
    case '2x2':
      return 4;
    default:
      return 1;
  }
}

export function TradingViewSimulator({user, isDark}: TradingViewSimulatorProps) {
  const localStorageKey = `skfx_tv_workspaces_${user.id}`;

  const [workspaces, setWorkspaces] = useState<SavedWorkspace[]>(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedWorkspace[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((w) => normalizeWorkspace(w, user.id));
        }
      }
    } catch {
      // ignore corrupt cache
    }
    return [createDefaultWorkspace(user.id)];
  });

  const [activeWsId, setActiveWsId] = useState<string>(() => workspaces[0]?.id || `ws_${user.id}_default`);

  const workspace = useMemo(
    () => workspaces.find((w) => w.id === activeWsId) || workspaces[0],
    [workspaces, activeWsId],
  );

  // History Stack (Undo / Redo across panes: drawings, indicators, symbols, chartStyle)
  const [historyStack, setHistoryStack] = useState<ChartPaneState[][]>(() => [workspace.panes]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Quotes cache for symbol modal
  const [quotesMap, setQuotesMap] = useState<Record<string, QuoteItem>>({});
  const [paneSnapshots, setPaneSnapshots] = useState<
    Record<
      string,
      {price: number; decimals: number; pipSize: number; feedStatus: FeedStatus; candles: CandleBar[]}
    >
  >({});

  // UI Popovers & Modals
  const [symbolModalMode, setSymbolModalMode] = useState<'switch' | 'compare' | null>(null);
  const [symbolInfoOpen, setSymbolInfoOpen] = useState(false);
  const [tfDropdownOpen, setTfDropdownOpen] = useState(false);
  const [tfSearch, setTfSearch] = useState('');
  const [customTfValue, setCustomTfValue] = useState(2);
  const [customTfUnit, setCustomTfUnit] = useState<'m' | 'h' | 'd'>('h');
  const [chartTypeDropdownOpen, setChartTypeDropdownOpen] = useState(false);
  const [indModalOpen, setIndModalOpen] = useState(false);
  const [indFavDropdownOpen, setIndFavDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goToDateOpen, setGoToDateOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [snapshotPayload, setSnapshotPayload] = useState<{
    initialPng: string | null;
    csv: {filename: string; csv: string} | null;
  } | null>(null);
  const [editingIndTarget, setEditingIndTarget] = useState<{
    paneId: string;
    uid: string;
  } | null>(null);
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const [openLeftGroup, setOpenLeftGroup] = useState<ToolCatalogGroup | null>(null);
  const [groupLastTool, setGroupLastTool] = useState<Record<ToolCatalogGroup, DrawingToolId>>({
    CURSOR: 'crosshair',
    'TREND LINE': 'trendline',
    FIBONACCI: 'fib',
    GANN: 'gannfan',
    PATTERN: 'xabcd',
    'POSITION & MEASUREMENT': 'longpos',
    'BRUSH & SHAPE': 'rect',
    ANNOTATION: 'text',
    'ICONS & SYMBOLS': 'arrowup',
  });

  // Active Tools & Drawing State
  const [activeTool, setActiveTool] = useState<DrawingToolId>('crosshair');
  const [stayInDrawingMode, setStayInDrawingMode] = useState(false);
  const [magnetEnabled, setMagnetEnabled] = useState(false);
  const [lockedAll, setLockedAll] = useState(false);
  const [hideAllDrawings, setHideAllDrawings] = useState(false);
  const [showFavoritesBar, setShowFavoritesBar] = useState(true);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [clipboardDrawing, setClipboardDrawing] = useState<ChartDrawing | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync Signals across Multi-Chart Panes
  const [syncCrosshairTime, setSyncCrosshairTime] = useState<number | null>(null);
  const [syncCrosshairSourcePane, setSyncCrosshairSourcePane] = useState<string | null>(null);
  const [syncLogicalRange, setSyncLogicalRange] = useState<LogicalRange | null>(null);
  const [syncRangeSourcePane, setSyncRangeSourcePane] = useState<string | null>(null);

  // Live Replay State (timestamp-anchored + Simulated Tick Stream engine)
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [selectingCutBar, setSelectingCutBar] = useState(false);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayLiveTicks, setReplayLiveTicks] = useState(true);
  const [replayTickStep, setReplayTickStep] = useState(0);
  const [replayCutoffTime, setReplayCutoffTime] = useState<number | null>(null);
  const [replayStartCutoffTime, setReplayStartCutoffTime] = useState<number | null>(null);
  const [replaySpeedMs, setReplaySpeedMs] = useState(SPEEDS[2]?.ms ?? 800);
  const [customTickStream, setCustomTickStream] = useState<SimulatedTick[] | null>(null);
  const [customTickCursor, setCustomTickCursor] = useState(0);
  const [tickFeedOpen, setTickFeedOpen] = useState(false);
  const [tickFeedInput, setTickFeedInput] = useState('');
  const [tickFeedError, setTickFeedError] = useState<string | null>(null);
  const [tickBurstSeed, setTickBurstSeed] = useState(1);

  // Paper Execution Desk (optional collapsible bottom drawer)
  const [showExecutionDesk, setShowExecutionDesk] = useState(false);
  const [blotterTab, setBlotterTab] = useState<'positions' | 'history'>('positions');
  const [accountBalance, setAccountBalance] = useState(user.accountBalance || 50000);
  const [openPositions, setOpenPositions] = useState<SimPosition[]>([]);
  const [closedTrades, setClosedTrades] = useState<SimClosedTrade[]>([]);
  const [orderLots, setOrderLots] = useState(0.5);
  const [liveUtcClock, setLiveUtcClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', {hour12: false, timeZone: 'UTC'}),
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const paneActionsRef = useRef<Record<string, PaneActions>>({});

  const activePane = useMemo(
    () => workspace.panes.find((p) => p.id === workspace.activePaneId) || workspace.panes[0],
    [workspace],
  );
  const activeMeta = useMemo(() => getSymbolMeta(activePane.symbol), [activePane.symbol]);
  const activeSnap = paneSnapshots[activePane.id];
  const effectiveDark =
    workspace.settings.themeOverride === 'dark'
      ? true
      : workspace.settings.themeOverride === 'light'
        ? false
        : isDark;

  const closeAllPopovers = useCallback(() => {
    setSymbolInfoOpen(false);
    setTfDropdownOpen(false);
    setChartTypeDropdownOpen(false);
    setIndFavDropdownOpen(false);
    setLayoutDropdownOpen(false);
    setTickFeedOpen(false);
    setOpenLeftGroup(null);
  }, []);

  // Outside click listener to dismiss open toolbar popovers & flyouts
  useEffect(() => {
    const hasOpen =
      symbolInfoOpen ||
      tfDropdownOpen ||
      chartTypeDropdownOpen ||
      indFavDropdownOpen ||
      layoutDropdownOpen ||
      tickFeedOpen ||
      openLeftGroup !== null;
    if (!hasOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('[data-tv-popover]')) return;
      closeAllPopovers();
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [
    symbolInfoOpen,
    tfDropdownOpen,
    chartTypeDropdownOpen,
    indFavDropdownOpen,
    layoutDropdownOpen,
    tickFeedOpen,
    openLeftGroup,
    closeAllPopovers,
  ]);

  // Load saved workspaces from backend /api/workspaces on mount
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/workspaces')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: {workspaces?: SavedWorkspace[]} | null) => {
        if (cancelled || !data?.workspaces || data.workspaces.length === 0) return;
        const normalized = data.workspaces.map((w) => normalizeWorkspace(w, user.id));
        setWorkspaces(normalized);
        setActiveWsId(normalized[0].id);
        setHistoryStack([normalized[0].panes]);
        setHistoryIdx(0);
      })
      .catch(() => {
        // Fallback to localStorage already loaded
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  // Load overview quotes cleanly
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const res = await fetch('/api/market/quotes');
        if (!res.ok) return;
        const data = (await res.json()) as {quotes?: QuoteItem[]};
        if (!data.quotes) return;
        const next: Record<string, QuoteItem> = {};
        for (const q of data.quotes) next[q.symbol] = q;
        setQuotesMap(next);
      } catch {
        // ignore
      }
    };
    void loadQuotes();
    const id = window.setInterval(() => {
      if (!document.hidden) void loadQuotes();
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  // Clock in selected timezone
  useEffect(() => {
    const tick = () => {
      try {
        setLiveUtcClock(
          new Date().toLocaleTimeString('en-US', {
            hour12: false,
            timeZone: workspace.settings.timezone || 'UTC',
          }),
        );
      } catch {
        setLiveUtcClock(new Date().toISOString().slice(11, 19));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [workspace.settings.timezone]);

  // Persist workspaces locally on change
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(workspaces));
    } catch {
      // ignore quota error
    }
  }, [workspaces, localStorageKey]);

  const updateWorkspace = useCallback(
    (updater: (prev: SavedWorkspace) => SavedWorkspace, pushHistoryPanes?: ChartPaneState[]) => {
      setWorkspaces((prevList) =>
        prevList.map((ws) => {
          if (ws.id !== activeWsId) return ws;
          return {...updater(ws), updatedAt: new Date().toISOString()};
        }),
      );
      if (pushHistoryPanes) {
        setHistoryStack((prevStack) => {
          const truncated = prevStack.slice(0, historyIdx + 1);
          const next = [...truncated, JSON.parse(JSON.stringify(pushHistoryPanes))];
          return next.slice(-40);
        });
        setHistoryIdx((idx) => Math.min(39, idx + 1));
      }
    },
    [activeWsId, historyIdx],
  );

  const handleSaveToServer = useCallback(async () => {
    try {
      await apiFetch('/api/workspaces', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({workspace}),
      });
      setSaveFeedback('Saved');
      window.setTimeout(() => setSaveFeedback(null), 1800);
    } catch {
      setSaveFeedback('Saved locally');
      window.setTimeout(() => setSaveFeedback(null), 1800);
    }
  }, [workspace]);

  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return;
    const target = historyStack[historyIdx - 1];
    if (!target) return;
    setHistoryIdx(historyIdx - 1);
    updateWorkspace((ws) => ({...ws, panes: JSON.parse(JSON.stringify(target))}));
  }, [historyIdx, historyStack, updateWorkspace]);

  const handleRedo = useCallback(() => {
    if (historyIdx >= historyStack.length - 1) return;
    const target = historyStack[historyIdx + 1];
    if (!target) return;
    setHistoryIdx(historyIdx + 1);
    updateWorkspace((ws) => ({...ws, panes: JSON.parse(JSON.stringify(target))}));
  }, [historyIdx, historyStack, updateWorkspace]);

  const handleUpdatePane = useCallback(
    (paneId: string, patch: Partial<ChartPaneState>, recordHistory = false) => {
      let nextPanesCapture: ChartPaneState[] | undefined;
      setWorkspaces((prevList) =>
        prevList.map((ws) => {
          if (ws.id !== activeWsId) return ws;
          const nextPanes = ws.panes.map((p) => {
            if (p.id === paneId) return {...p, ...patch};
            if (ws.syncOptions.symbol && patch.symbol) {
              return {...p, symbol: patch.symbol};
            }
            if (ws.syncOptions.timeframe && patch.interval) {
              return {...p, interval: patch.interval};
            }
            if (ws.syncOptions.drawings && patch.drawings) {
              return {...p, drawings: JSON.parse(JSON.stringify(patch.drawings))};
            }
            return p;
          });
          if (recordHistory) {
            nextPanesCapture = nextPanes;
          }
          const nextRecent = patch.symbol
            ? [patch.symbol, ...(ws.recentSymbols || []).filter((s) => s !== patch.symbol)].slice(0, 8)
            : ws.recentSymbols;
          return {...ws, panes: nextPanes, recentSymbols: nextRecent, updatedAt: new Date().toISOString()};
        }),
      );
      if (recordHistory && nextPanesCapture) {
        const snapshot = JSON.parse(JSON.stringify(nextPanesCapture)) as ChartPaneState[];
        setHistoryStack((prev) => [...prev.slice(0, historyIdx + 1), snapshot].slice(-40));
        setHistoryIdx((idx) => Math.min(39, idx + 1));
      }
    },
    [activeWsId, historyIdx],
  );

  const handleChangeLayout = (mode: WorkspaceLayoutMode) => {
    const needed = requiredPanesForLayout(mode);
    const defaultSymbols = ['XAUUSD', 'EURUSD', 'BTCUSDT', 'NAS100'];
    const nextPanes = [...workspace.panes];
    while (nextPanes.length < needed) {
      const idx = nextPanes.length;
      nextPanes.push(
        createDefaultPane(
          `pane_${Date.now().toString(36)}_${idx}`,
          defaultSymbols[idx % defaultSymbols.length],
          activePane.interval,
        ),
      );
    }
    const trimmed = nextPanes.slice(0, needed);
    updateWorkspace(
      (ws) => ({
        ...ws,
        layoutMode: mode,
        panes: trimmed,
        activePaneId: trimmed.some((p) => p.id === ws.activePaneId) ? ws.activePaneId : trimmed[0].id,
      }),
      trimmed,
    );
    setLayoutDropdownOpen(false);
  };

  const handleAddIndicator = useCallback(
    (id: IndicatorId) => {
      const inst = createIndicatorInstance(id);
      handleUpdatePane(
        activePane.id,
        {indicators: [...activePane.indicators, inst]},
        true,
      );
    },
    [activePane.id, activePane.indicators, handleUpdatePane],
  );

  const pasteDrawingToPane = useCallback(() => {
    if (!clipboardDrawing) return;
    const tfDef = resolveTimeframeDef(activePane.interval, workspace.customTimeframes);
    const stepShift = Math.max(60, tfDef.stepSec || 3600);
    const pasted: ChartDrawing = {
      ...JSON.parse(JSON.stringify(clipboardDrawing)),
      id: `drw_${Date.now().toString(36)}`,
      symbol: activePane.symbol,
      points: clipboardDrawing.points.map((pt) => ({
        time: pt.time + stepShift,
        price: pt.price + activeMeta.pipSize * 8,
      })),
    };
    handleUpdatePane(activePane.id, {drawings: [...activePane.drawings, pasted]}, true);
    setSelectedDrawingId(pasted.id);
  }, [
    clipboardDrawing,
    activePane.id,
    activePane.interval,
    activePane.symbol,
    activePane.drawings,
    workspace.customTimeframes,
    activeMeta.pipSize,
    handleUpdatePane,
  ]);

  const openSnapshotModal = useCallback(async () => {
    const acts = paneActionsRef.current[activePane.id];
    const initialPng = (await acts?.exportPngDataUrlAsync({includeDrawings: true, includeIndicators: true})) || acts?.exportPngDataUrl() || null;
    setSnapshotPayload({
      initialPng,
      csv: acts?.exportCsvContent() || null,
    });
  }, [activePane.id]);

  const handleGenerateSnapshot = useCallback(
    async (opts: SnapshotExportOptions) => {
      const acts = paneActionsRef.current[activePane.id];
      const png = (await acts?.exportPngDataUrlAsync(opts)) || acts?.exportPngDataUrl() || null;
      const svg = acts?.exportSvgMarkup({includeDrawings: opts.includeDrawings}) || null;
      return {png, svg};
    },
    [activePane.id],
  );

  // Keep full raw candle timestamps for activePane so Replay scrubber & Step Forward work cleanly
  const [activeFullBars, setActiveFullBars] = useState<CandleBar[]>([]);
  useEffect(() => {
    let cancelled = false;
    const tfDef = resolveTimeframeDef(activePane.interval, workspace.customTimeframes);
    const fetchInterval = tfDef.isCustom ? tfDef.baseFetchInterval || '1h' : activePane.interval;
    fetch(
      `/api/market/candles?symbol=${encodeURIComponent(activePane.symbol)}&interval=${encodeURIComponent(fetchInterval)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: {candles?: CandleBar[]} | null) => {
        if (cancelled || !d?.candles) return;
        const bars = tfDef.isCustom ? aggregateCandles(d.candles, tfDef.stepSec) : d.candles;
        setActiveFullBars(bars);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activePane.symbol, activePane.interval, workspace.customTimeframes]);

  const replayCurrentIndex = useMemo(() => {
    if (activeFullBars.length === 0) return 0;
    if (replayCutoffTime === null) return activeFullBars.length - 1;
    const idx = activeFullBars.findIndex((b) => b.time > replayCutoffTime);
    if (idx === -1) return activeFullBars.length - 1;
    return Math.max(0, idx - 1);
  }, [activeFullBars, replayCutoffTime]);

  const stepReplayBy = useCallback(
    (delta: number) => {
      if (activeFullBars.length < 2) return;
      const nextIdx = Math.max(
        10,
        Math.min(activeFullBars.length - 1, replayCurrentIndex + delta),
      );
      setReplayTickStep(0);
      setReplayCutoffTime(activeFullBars[nextIdx].time);
      if (nextIdx >= activeFullBars.length - 1 && delta > 0) {
        setReplayPlaying(false);
      }
    },
    [activeFullBars, replayCurrentIndex],
  );

  const activeTfDef = useMemo(
    () => resolveTimeframeDef(activePane.interval, workspace.customTimeframes),
    [activePane.interval, workspace.customTimeframes],
  );

  // When custom simulated tick stream is active, derive live candles incrementally
  const customSimulatedCandles = useMemo(() => {
    if (!isReplayMode || !customTickStream || customTickCursor <= 0) return [];
    const slice = customTickStream.slice(0, customTickCursor);
    const seedBar = activeFullBars[replayCurrentIndex] ?? null;
    return applySimulatedTicksToCandles(
      slice,
      activeTfDef.stepSec,
      activeMeta.decimals,
      seedBar,
    );
  }, [
    isReplayMode,
    customTickStream,
    customTickCursor,
    activeTfDef.stepSec,
    activeMeta.decimals,
    activeFullBars,
    replayCurrentIndex,
  ]);

  const stepReplayTick = useCallback(
    (delta = 1) => {
      if (customTickStream && customTickStream.length > 0) {
        setCustomTickCursor((prev) => {
          const next = Math.max(0, Math.min(customTickStream.length, prev + delta));
          if (next >= customTickStream.length) {
            setReplayPlaying(false);
          }
          return next;
        });
        return;
      }
      if (activeFullBars.length < 2) return;
      if (delta < 0) {
        setReplayTickStep((prev) => {
          if (prev > 0) return prev - 1;
          stepReplayBy(-1);
          return 0;
        });
        return;
      }
      setReplayTickStep((prev) => {
        const nextBar = activeFullBars[replayCurrentIndex + 1];
        if (!nextBar) {
          setReplayPlaying(false);
          return 0;
        }
        if (prev + 1 >= REPLAY_TICKS_PER_BAR) {
          setReplayCutoffTime(nextBar.time);
          if (replayCurrentIndex + 1 >= activeFullBars.length - 1) {
            setReplayPlaying(false);
          }
          return 0;
        }
        return prev + 1;
      });
    },
    [customTickStream, activeFullBars, replayCurrentIndex, stepReplayBy],
  );

  // Live forming tick candle during Live Replay mode
  const replayLiveBar = useMemo(() => {
    if (!isReplayMode) return null;
    if (customSimulatedCandles.length > 0) {
      return customSimulatedCandles[customSimulatedCandles.length - 1];
    }
    if (!replayLiveTicks) return null;
    if (!replayPlaying && replayTickStep === 0) return null;
    const nextBar = activeFullBars[replayCurrentIndex + 1];
    if (!nextBar) return null;
    return computeLiveTickCandle(
      nextBar,
      (replayTickStep + 1) / REPLAY_TICKS_PER_BAR,
      activeMeta.decimals,
    );
  }, [
    isReplayMode,
    customSimulatedCandles,
    replayLiveTicks,
    replayPlaying,
    replayTickStep,
    activeFullBars,
    replayCurrentIndex,
    activeMeta.decimals,
  ]);

  const replaySimulatedBars = useMemo(() => {
    if (customSimulatedCandles.length <= 1) return [];
    return customSimulatedCandles.slice(0, -1);
  }, [customSimulatedCandles]);

  // Playback engine: custom simulated tick stream OR live intrabar tick-by-tick OR bar-by-bar
  useEffect(() => {
    if (!isReplayMode || !replayPlaying) return;
    if (customTickStream && customTickStream.length > 0) {
      const tickMs = Math.max(40, Math.round(replaySpeedMs / REPLAY_TICKS_PER_BAR));
      const id = window.setInterval(() => {
        setCustomTickCursor((prev) => {
          if (prev >= customTickStream.length) {
            setReplayPlaying(false);
            return prev;
          }
          const next = prev + 1;
          if (next >= customTickStream.length) {
            setReplayPlaying(false);
          }
          return next;
        });
      }, tickMs);
      return () => window.clearInterval(id);
    }
    if (replayLiveTicks) {
      const tickMs = Math.max(45, Math.round(replaySpeedMs / REPLAY_TICKS_PER_BAR));
      const id = window.setInterval(() => {
        setReplayTickStep((prev) => {
          const nextBar = activeFullBars[replayCurrentIndex + 1];
          if (!nextBar) {
            setReplayPlaying(false);
            return 0;
          }
          if (prev + 1 >= REPLAY_TICKS_PER_BAR) {
            setReplayCutoffTime(nextBar.time);
            if (replayCurrentIndex + 1 >= activeFullBars.length - 1) {
              setReplayPlaying(false);
            }
            return 0;
          }
          return prev + 1;
        });
      }, tickMs);
      return () => window.clearInterval(id);
    }
    const id = window.setInterval(() => {
      stepReplayBy(1);
    }, replaySpeedMs);
    return () => window.clearInterval(id);
  }, [
    isReplayMode,
    replayPlaying,
    customTickStream,
    replayLiveTicks,
    replaySpeedMs,
    activeFullBars,
    replayCurrentIndex,
    stepReplayBy,
  ]);

  const handleLoadCustomTicks = useCallback(() => {
    const raw = tickFeedInput.trim();
    if (!raw) {
      setTickFeedError('Paste JSON ticks or price lines, or generate a tick burst.');
      return;
    }
    const anchorBar = activeFullBars[replayCurrentIndex] || activeFullBars[activeFullBars.length - 1];
    const baseTime = anchorBar ? anchorBar.time + activeTfDef.stepSec : Math.floor(Date.now() / 1000);
    const parsed: SimulatedTick[] = [];

    try {
      if (raw.startsWith('[') || raw.startsWith('{')) {
        const json = JSON.parse(raw) as unknown;
        const arr = Array.isArray(json) ? json : [json];
        arr.forEach((item, idx) => {
          if (typeof item === 'number' && Number.isFinite(item)) {
            parsed.push({
              time: baseTime + Math.floor(idx / REPLAY_TICKS_PER_BAR) * activeTfDef.stepSec,
              price: item,
              volume: 45,
            });
          } else if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            const price = Number(obj.price ?? obj.close ?? obj.p);
            const tRaw = Number(obj.time ?? obj.timestamp ?? obj.t);
            const vol = Number(obj.volume ?? obj.v ?? 50);
            if (Number.isFinite(price)) {
              parsed.push({
                time: Number.isFinite(tRaw)
                  ? tRaw
                  : baseTime + Math.floor(idx / REPLAY_TICKS_PER_BAR) * activeTfDef.stepSec,
                price,
                volume: Number.isFinite(vol) ? vol : 50,
              });
            }
          }
        });
      } else {
        const lines = raw.split(/\r?\n|;/).map((s) => s.trim()).filter(Boolean);
        lines.forEach((line, idx) => {
          const parts = line.split(/[,\s]+/).map((p) => Number(p.trim()));
          if (parts.length === 1 && Number.isFinite(parts[0])) {
            parsed.push({
              time: baseTime + Math.floor(idx / REPLAY_TICKS_PER_BAR) * activeTfDef.stepSec,
              price: parts[0],
              volume: 50,
            });
          } else if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
            parsed.push({
              time: parts[0],
              price: parts[1],
              volume: Number.isFinite(parts[2]) ? parts[2] : 50,
            });
          }
        });
      }
    } catch {
      setTickFeedError('Invalid tick format. Use JSON [{price, time?, volume?}] or price lines.');
      return;
    }

    if (parsed.length === 0) {
      setTickFeedError('No valid numeric ticks found.');
      return;
    }
    setTickFeedError(null);
    setCustomTickStream(parsed);
    setCustomTickCursor(1);
    setReplayLiveTicks(true);
    setReplayPlaying(true);
    setTickFeedOpen(false);
  }, [tickFeedInput, activeFullBars, replayCurrentIndex, activeTfDef.stepSec]);

  const handleGenerateTickBurst = useCallback(() => {
    const anchorBar = activeFullBars[replayCurrentIndex] || activeFullBars[activeFullBars.length - 1];
    if (!anchorBar) return;
    const nextSeed = tickBurstSeed + 1;
    setTickBurstSeed(nextSeed);
    const ticks = generateSimulatedTickBurst(
      anchorBar,
      activeTfDef.stepSec,
      6,
      REPLAY_TICKS_PER_BAR,
      activeMeta.decimals,
      nextSeed,
    );
    setTickFeedError(null);
    setCustomTickStream(ticks);
    setCustomTickCursor(1);
    setReplayLiveTicks(true);
    setReplayPlaying(true);
    setTickFeedOpen(false);
  }, [activeFullBars, replayCurrentIndex, tickBurstSeed, activeTfDef.stepSec, activeMeta.decimals]);

  // Monitor open paper positions for SL / TP hits on live ticks & price updates
  const currentActiveTickPrice =
    isReplayMode && replayLiveBar ? replayLiveBar.close : activeSnap?.price;
  useEffect(() => {
    if (!currentActiveTickPrice || openPositions.length === 0) return;
    const symbolPositions = openPositions.filter((p) => p.symbol === activePane.symbol);
    if (symbolPositions.length === 0) return;

    const triggered: Array<{pos: SimPosition; exitPrice: number; reason: 'SL Hit' | 'TP Hit'}> = [];
    for (const pos of symbolPositions) {
      if (pos.side === 'BUY') {
        if (pos.stopLoss !== null && pos.stopLoss !== undefined && currentActiveTickPrice <= pos.stopLoss) {
          triggered.push({pos, exitPrice: pos.stopLoss, reason: 'SL Hit'});
        } else if (pos.takeProfit !== null && pos.takeProfit !== undefined && currentActiveTickPrice >= pos.takeProfit) {
          triggered.push({pos, exitPrice: pos.takeProfit, reason: 'TP Hit'});
        }
      } else {
        if (pos.stopLoss !== null && pos.stopLoss !== undefined && currentActiveTickPrice >= pos.stopLoss) {
          triggered.push({pos, exitPrice: pos.stopLoss, reason: 'SL Hit'});
        } else if (pos.takeProfit !== null && pos.takeProfit !== undefined && currentActiveTickPrice <= pos.takeProfit) {
          triggered.push({pos, exitPrice: pos.takeProfit, reason: 'TP Hit'});
        }
      }
    }

    if (triggered.length === 0) return;
    const closedIds = new Set(triggered.map((t) => t.pos.id));
    const meta = getSymbolMeta(activePane.symbol);
    let netDelta = 0;
    const newlyClosed: SimClosedTrade[] = triggered.map(({pos, exitPrice, reason}) => {
      const pnl = calcPnl(pos.symbol, pos.side, pos.lots, pos.entryPrice, exitPrice);
      const pips = calcPips(pos.symbol, meta.pipSize, pos.side, pos.entryPrice, exitPrice);
      netDelta += pnl;
      return {
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        lots: pos.lots,
        entryPrice: pos.entryPrice,
        exitPrice,
        entryTime: pos.entryTime,
        exitTime: Math.floor(Date.now() / 1000),
        pnl,
        pips,
        reason,
      };
    });

    setOpenPositions((prev) => prev.filter((p) => !closedIds.has(p.id)));
    setClosedTrades((prev) => [...newlyClosed, ...prev]);
    setAccountBalance((b) => Number((b + netDelta).toFixed(2)));
  }, [currentActiveTickPrice, openPositions, activePane.symbol]);

  // Execute instant simulated order & close helpers
  const handleQuickOrder = useCallback(
    (symbol: string, side: 'BUY' | 'SELL', price: number) => {
      const meta = getSymbolMeta(symbol);
      const slDist = meta.pipSize * 30;
      const tpDist = meta.pipSize * 60;
      const pos: SimPosition = {
        id: `pos_${Date.now().toString(36)}`,
        symbol,
        side,
        lots: orderLots,
        entryPrice: price,
        stopLoss: Number((side === 'BUY' ? price - slDist : price + slDist).toFixed(meta.decimals)),
        takeProfit: Number((side === 'BUY' ? price + tpDist : price - tpDist).toFixed(meta.decimals)),
        entryTime: Math.floor(Date.now() / 1000),
        status: 'OPEN',
      };
      setOpenPositions((prev) => [pos, ...prev]);
      setShowExecutionDesk(true);
    },
    [orderLots],
  );

  const handleClosePosition = (pos: SimPosition) => {
    const snap =
      Object.values(paneSnapshots).find((_, idx) => workspace.panes[idx]?.symbol === pos.symbol) || activeSnap;
    const exitPrice = snap?.price || pos.entryPrice;
    const meta = getSymbolMeta(pos.symbol);
    const pnl = calcPnl(pos.symbol, pos.side, pos.lots, pos.entryPrice, exitPrice);
    const pips = calcPips(pos.symbol, meta.pipSize, pos.side, pos.entryPrice, exitPrice);
    const closed: SimClosedTrade = {
      id: pos.id,
      symbol: pos.symbol,
      side: pos.side,
      lots: pos.lots,
      entryPrice: pos.entryPrice,
      exitPrice,
      entryTime: pos.entryTime,
      exitTime: Math.floor(Date.now() / 1000),
      pnl,
      pips,
      reason: 'Manual Close',
    };
    setOpenPositions((prev) => prev.filter((p) => p.id !== pos.id));
    setClosedTrades((prev) => [closed, ...prev]);
    setAccountBalance((b) => Number((b + pnl).toFixed(2)));
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && rootRef.current?.requestFullscreen) {
        await rootRef.current.requestFullscreen();
        setIsFullscreen(true);
        return;
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        return;
      }
    } catch {
      // Fallback CSS fullscreen below
    }
    setIsFullscreen((v) => !v);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveToServer();
        return;
      }
      if (inInput) return;

      if (e.key === '/') {
        e.preventDefault();
        setQuickSearchOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        paneActionsRef.current[activePane.id]?.zoomIn();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        paneActionsRef.current[activePane.id]?.zoomOut();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && selectedDrawingId) {
        const found = activePane.drawings.find((d) => d.id === selectedDrawingId);
        if (found) setClipboardDrawing(JSON.parse(JSON.stringify(found)));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v' && clipboardDrawing) {
        e.preventDefault();
        pasteDrawingToPane();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        e.preventDefault();
        handleUpdatePane(
          activePane.id,
          {drawings: activePane.drawings.filter((d) => d.id !== selectedDrawingId)},
          true,
        );
        setSelectedDrawingId(null);
        return;
      }
      if (e.key === 'Escape') {
        setActiveTool('crosshair');
        closeAllPopovers();
        setSelectedDrawingId(null);
        setSelectingCutBar(false);
        return;
      }

      if (e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 't') { e.preventDefault(); setActiveTool('trendline'); }
        else if (k === 'h') { e.preventDefault(); setActiveTool('hline'); }
        else if (k === 'j') { e.preventDefault(); setActiveTool('hray'); }
        else if (k === 'v') { e.preventDefault(); setActiveTool('vline'); }
        else if (k === 'c') { e.preventDefault(); setActiveTool('crossline'); }
        else if (k === 'f') { e.preventDefault(); setActiveTool('fib'); }
        else if (k === 'r') { e.preventDefault(); paneActionsRef.current[activePane.id]?.resetView(); }
        return;
      }

      if (!e.metaKey && !e.ctrlKey) {
        const k = e.key.toLowerCase();
        if (k === 'l') setActiveTool('longpos');
        else if (k === 's') setActiveTool('shortpos');
        else if (k === 'r') setActiveTool('rect');
        else if (k === 't') setActiveTool('text');
        else if (k === 'm') setActiveTool('pricerange');
        else if (k === 'f') void toggleFullscreen();
        else if (isReplayMode && e.key === 'ArrowRight') { e.preventDefault(); stepReplayBy(1); }
        else if (isReplayMode && e.key === 'ArrowLeft') { e.preventDefault(); stepReplayBy(-1); }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSaveToServer,
    selectedDrawingId,
    activePane,
    clipboardDrawing,
    pasteDrawingToPane,
    handleUpdatePane,
    closeAllPopovers,
    toggleFullscreen,
    isReplayMode,
    stepReplayBy,
  ]);

  const registerPaneActions = useCallback((paneId: string, actions: PaneActions | null) => {
    if (actions) paneActionsRef.current[paneId] = actions;
    else delete paneActionsRef.current[paneId];
  }, []);

  const handleMarketSnapshot = useCallback(
    (
      paneId: string,
      payload: {price: number; decimals: number; pipSize: number; feedStatus: FeedStatus; candles: CandleBar[]},
    ) => {
      setPaneSnapshots((prev) => ({...prev, [paneId]: payload}));
    },
    [],
  );

  const allTimeframes = useMemo(() => {
    const customList = workspace.customTimeframes || [];
    return [...TIMEFRAMES, ...customList];
  }, [workspace.customTimeframes]);

  const filteredTimeframes = useMemo(() => {
    const q = tfSearch.trim().toLowerCase();
    return allTimeframes.filter(
      (t) =>
        !q ||
        t.label.toLowerCase().includes(q) ||
        t.longLabel.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q),
    );
  }, [tfSearch, allTimeframes]);

  const handleCreateCustomTimeframe = () => {
    const val = Math.max(1, Math.min(999, Math.round(customTfValue || 1)));
    const key = `${val}${customTfUnit}`;
    const def = resolveTimeframeDef(key, workspace.customTimeframes);
    const alreadyBuiltin = TIMEFRAMES.some((t) => t.key === def.key);
    const alreadyCustom = (workspace.customTimeframes || []).some((t) => t.key === def.key);
    if (!alreadyBuiltin && !alreadyCustom) {
      const nextCustom: CustomTimeframeDef = {
        key: def.key,
        label: def.label,
        shortLabel: def.shortLabel,
        longLabel: def.longLabel,
        section: def.section === 'SECONDS' ? 'MINUTES' : def.section,
        stepSec: def.stepSec,
      };
      updateWorkspace((ws) => ({
        ...ws,
        customTimeframes: [...(ws.customTimeframes || []), nextCustom],
        favoriteTimeframes: ws.favoriteTimeframes.includes(def.key)
          ? ws.favoriteTimeframes
          : [...ws.favoriteTimeframes, def.key],
      }));
    }
    handleUpdatePane(activePane.id, {interval: def.key}, true);
    setTfDropdownOpen(false);
  };

  const moveFavoriteTimeframe = (tfKey: TimeframeKey, dir: -1 | 1) => {
    const list = [...workspace.favoriteTimeframes];
    const idx = list.indexOf(tfKey);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    updateWorkspace((ws) => ({...ws, favoriteTimeframes: list}));
  };

  const gridClass = useMemo(() => {
    switch (workspace.layoutMode) {
      case '2h':
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-1';
      case '2v':
        return 'grid grid-cols-1 grid-rows-2';
      case '2x2':
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-2';
      case '3left':
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-2';
      case '3top':
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-2';
      default:
        return 'grid grid-cols-1 grid-rows-1';
    }
  }, [workspace.layoutMode]);

  const editingIndicator = useMemo(() => {
    if (!editingIndTarget) return null;
    const p = workspace.panes.find((x) => x.id === editingIndTarget.paneId);
    return p?.indicators.find((i) => i.uid === editingIndTarget.uid) || null;
  }, [editingIndTarget, workspace.panes]);

  const editingDrawing = useMemo(() => {
    if (!editingDrawingId) return null;
    return activePane.drawings.find((d) => d.id === editingDrawingId) || null;
  }, [editingDrawingId, activePane.drawings]);

  const bgTop = effectiveDark
    ? 'bg-[#131722] border-[#2A2E39] text-slate-200'
    : 'bg-white border-slate-200 text-slate-800';
  const bgShell = effectiveDark
    ? 'bg-[#0B0F17] border-[#2A2E39] text-slate-100'
    : 'bg-slate-50 border-slate-300 text-slate-900';
  const iconIdleCls = effectiveDark
    ? 'text-slate-400 hover:text-white'
    : 'text-slate-600 hover:text-slate-950';
  const iconMutedText = effectiveDark ? 'text-slate-300' : 'text-slate-700';
  const optionCls = effectiveDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900';

  return (
    <div
      ref={rootRef}
      className={`${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-140px)] min-h-[540px] sm:min-h-[640px]'
      } w-full rounded-xl border flex flex-col overflow-hidden select-none ${bgShell}`}
      style={{['--tv-icon-bg' as string]: effectiveDark ? '#131722' : '#FFFFFF'}}
    >
      {/* ====================================================================
       * A. TOP NAVIGATION TOOLBAR (Dropdowns outside overflow-clipped elements)
       * ================================================================== */}
      <header
        className={`relative z-30 min-h-[44px] px-2 py-1 border-b flex flex-wrap items-center justify-between gap-1 shrink-0 ${bgTop}`}
      >
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          {/* Mobile Drawing Toolbar Toggle */}
          <button
            type="button"
            onClick={() => setMobileToolsOpen((v) => !v)}
            title="Toggle Drawing Toolbar"
            className={`sm:hidden p-1.5 rounded transition-colors ${
              mobileToolsOpen ? 'bg-[#2962FF]/20 text-[#2962FF]' : 'hover:bg-slate-500/15 text-slate-400'
            }`}
          >
            <PencilRuler className="w-3.5 h-3.5" />
          </button>

          {/* App Brand Logo */}
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-slate-500/25 shrink-0">
            <BrandLogo className="w-6 h-6 rounded-full" />
            <span className="font-display font-extrabold text-xs tracking-tight hidden sm:inline">
              SKFX
            </span>
          </div>

          {/* Current Symbol Search + Info */}
          <div className="relative flex items-center" data-tv-popover>
            <button
              type="button"
              onClick={() => setSymbolModalMode('switch')}
              title="Search & Switch Symbol"
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-500/15 font-bold text-xs transition-colors"
            >
              <SymbolBadge symbol={activePane.symbol} size={16} />
              <span>{activeMeta.ticker}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !symbolInfoOpen;
                closeAllPopovers();
                setSymbolInfoOpen(next);
              }}
              title="Symbol Specifications"
              className={`p-1 rounded hover:bg-slate-500/15 transition-colors ${
                symbolInfoOpen ? 'text-[#2962FF]' : iconIdleCls
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {symbolInfoOpen && (
              <div
                className={`absolute top-9 left-0 z-50 w-64 p-3 rounded-lg border shadow-2xl text-xs ${bgTop}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold">{activeMeta.label}</span>
                  <button type="button" onClick={() => setSymbolInfoOpen(false)} className="text-slate-400">
                    ×
                  </button>
                </div>
                <div className={`space-y-1 text-[11px] ${effectiveDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div>Class: <span className={effectiveDark ? 'text-slate-200' : 'text-slate-900 font-medium'}>{activeMeta.assetClass}</span></div>
                  <div>Exchange: <span className={effectiveDark ? 'text-slate-200' : 'text-slate-900 font-medium'}>{activeMeta.exchange}</span></div>
                  <div>Session: <span className={effectiveDark ? 'text-slate-200' : 'text-slate-900 font-medium'}>{activeMeta.sessionHours}</span></div>
                  <div>Tick/Pip: <span className={`font-mono ${effectiveDark ? 'text-slate-200' : 'text-slate-900 font-medium'}`}>{activeMeta.pipSize} ({activeMeta.decimals} dp)</span></div>
                  <p className="pt-1 border-t border-slate-500/20">{activeMeta.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Compare Symbol Button */}
          <button
            type="button"
            onClick={() => setSymbolModalMode('compare')}
            title="Compare or Add Symbol Overlay"
            className={`relative p-1.5 rounded hover:bg-slate-500/15 transition-colors ${
              activePane.compareSymbols.length > 0 ? 'text-[#2962FF]' : iconIdleCls
            }`}
          >
            <GitCompareArrows className="w-4 h-4" />
            {activePane.compareSymbols.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#2962FF] text-white text-[9px] font-bold flex items-center justify-center">
                {activePane.compareSymbols.length}
              </span>
            )}
          </button>

          <span className="h-4 w-px bg-slate-500/25 mx-0.5 shrink-0" />

          {/* Timeframe Quick Shortcuts */}
          <div className="flex items-center gap-0.5">
            {workspace.favoriteTimeframes.map((tfKey) => {
              const tf = resolveTimeframeDef(tfKey, workspace.customTimeframes);
              const checkInterval = tf.isCustom && tf.baseFetchInterval ? tf.baseFetchInterval : tfKey;
              const supported = activeMeta.supportedIntervals.includes(checkInterval);
              const active = activePane.interval === tfKey;
              return (
                <button
                  key={tfKey}
                  type="button"
                  disabled={!supported}
                  onClick={() => handleUpdatePane(activePane.id, {interval: tfKey}, true)}
                  title={supported ? tf.longLabel : `${tf.longLabel} (Not available on ${activeMeta.assetClass})`}
                  className={`px-1.5 py-1 rounded text-[11px] font-semibold transition-colors disabled:opacity-30 ${
                    active
                      ? 'bg-[#2962FF]/20 text-[#2962FF]'
                      : `hover:bg-slate-500/15 ${iconIdleCls}`
                  }`}
                >
                  {tf.shortLabel}
                </button>
              );
            })}

            {/* Timeframe Search, Custom Interval & Reorder Dropdown */}
            <div className="relative" data-tv-popover>
              <button
                type="button"
                onClick={() => {
                  const next = !tfDropdownOpen;
                  closeAllPopovers();
                  setTfDropdownOpen(next);
                }}
                title="All Timeframes, Custom Intervals & Quick Bar Ordering"
                className={`p-1 rounded hover:bg-slate-500/15 flex items-center ${
                  tfDropdownOpen ? 'text-[#2962FF]' : iconIdleCls
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {tfDropdownOpen && (
                <div
                  className={`absolute top-9 left-0 z-50 w-72 p-2.5 rounded-lg border shadow-2xl text-xs ${bgTop}`}
                >
                  <input
                    value={tfSearch}
                    onChange={(e) => setTfSearch(e.target.value)}
                    placeholder="Filter timeframes (1s..1mo or custom)..."
                    className="w-full px-2 py-1 mb-2 rounded border border-slate-500/30 bg-transparent text-xs outline-none"
                  />
                  {/* Reorder Favorite Bar */}
                  {workspace.favoriteTimeframes.length > 1 && (
                    <div className="mb-2 pb-2 border-b border-slate-500/20">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Quick Bar Order
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {workspace.favoriteTimeframes.map((fk, idx) => {
                          const fd = resolveTimeframeDef(fk, workspace.customTimeframes);
                          return (
                            <div
                              key={fk}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-500/15 text-[10px] font-mono"
                            >
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveFavoriteTimeframe(fk, -1)}
                                className="disabled:opacity-25 hover:text-[#2962FF]"
                                title="Move Left"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                              <span className="px-0.5 font-semibold">{fd.shortLabel}</span>
                              <button
                                type="button"
                                disabled={idx === workspace.favoriteTimeframes.length - 1}
                                onClick={() => moveFavoriteTimeframe(fk, 1)}
                                className="disabled:opacity-25 hover:text-[#2962FF]"
                                title="Move Right"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {filteredTimeframes.map((tf) => {
                      const def = resolveTimeframeDef(tf.key, workspace.customTimeframes);
                      const checkInterval =
                        def.isCustom && def.baseFetchInterval ? def.baseFetchInterval : tf.key;
                      const supported = activeMeta.supportedIntervals.includes(checkInterval);
                      const isFav = workspace.favoriteTimeframes.includes(tf.key);
                      return (
                        <div
                          key={tf.key}
                          className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-500/15"
                        >
                          <button
                            type="button"
                            disabled={!supported}
                            onClick={() => {
                              handleUpdatePane(activePane.id, {interval: tf.key}, true);
                              setTfDropdownOpen(false);
                            }}
                            className={`flex-1 text-left text-xs disabled:opacity-30 ${
                              activePane.interval === tf.key ? 'text-[#2962FF] font-bold' : ''
                            }`}
                          >
                            {tf.longLabel}
                            {def.isCustom && (
                              <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-[#2962FF]/15 text-[#2962FF]">
                                Custom
                              </span>
                            )}
                          </button>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const nextFavs = isFav
                                  ? workspace.favoriteTimeframes.filter((k) => k !== tf.key)
                                  : [...workspace.favoriteTimeframes, tf.key];
                                updateWorkspace((ws) => ({...ws, favoriteTimeframes: nextFavs}));
                              }}
                              title={isFav ? 'Unpin from bar' : 'Pin to quick bar'}
                              className="p-1 text-slate-400 hover:text-amber-400"
                            >
                              <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            {def.isCustom && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateWorkspace((ws) => ({
                                    ...ws,
                                    customTimeframes: (ws.customTimeframes || []).filter(
                                      (c) => c.key !== tf.key,
                                    ),
                                    favoriteTimeframes: ws.favoriteTimeframes.filter((k) => k !== tf.key),
                                  }))
                                }
                                title="Delete custom interval"
                                className="p-1 text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Interval Builder */}
                  <div className="mt-2 pt-2 border-t border-slate-500/20">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                      Add Custom Interval
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={customTfValue}
                        onChange={(e) => setCustomTfValue(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono text-xs"
                      />
                      <select
                        value={customTfUnit}
                        onChange={(e) => setCustomTfUnit(e.target.value as 'm' | 'h' | 'd')}
                        className="flex-1 px-2 py-1 rounded border border-slate-500/30 bg-transparent text-xs"
                      >
                        <option value="m" className={optionCls}>Minutes</option>
                        <option value="h" className={optionCls}>Hours</option>
                        <option value="d" className={optionCls}>Days</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateCustomTimeframe}
                        className="px-2.5 py-1 rounded bg-[#2962FF] hover:bg-[#1D4ED8] text-white font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <span className="h-4 w-px bg-slate-500/25 mx-0.5 shrink-0" />

          {/* Chart Type Selector (12 Types + Full Synthetic Params) */}
          <div className="relative" data-tv-popover>
            <button
              type="button"
              onClick={() => {
                const next = !chartTypeDropdownOpen;
                closeAllPopovers();
                setChartTypeDropdownOpen(next);
              }}
              title="Chart Style (Candles, Heikin Ashi, Renko, Line Break, Kagi, PnF, Range Bars)"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-500/15 text-xs font-medium"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#2962FF]" />
              <span className="hidden lg:inline">
                {CHART_STYLE_OPTIONS.find((s) => s.id === activePane.chartStyle)?.label || 'Candles'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {chartTypeDropdownOpen && (
              <div
                className={`absolute top-9 left-0 z-50 w-64 p-2 rounded-lg border shadow-2xl text-xs ${bgTop}`}
              >
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {CHART_STYLE_OPTIONS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        handleUpdatePane(activePane.id, {chartStyle: st.id}, true);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left ${
                        activePane.chartStyle === st.id
                          ? 'bg-[#2962FF]/20 text-[#2962FF] font-bold'
                          : 'hover:bg-slate-500/15'
                      }`}
                    >
                      <span>{st.label}</span>
                      {st.synthetic && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-500/15 text-slate-400">
                          Synthetic
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {['baseline', 'renko', 'linebreak', 'kagi', 'pnf', 'rangebars'].includes(
                  activePane.chartStyle,
                ) && (
                  <div className="mt-2 pt-2 border-t border-slate-500/20 space-y-2 text-[11px]">
                    <div className="font-semibold text-slate-400">Style Parameters</div>

                    {activePane.chartStyle === 'baseline' && (
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Baseline</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            placeholder="Auto"
                            value={activePane.chartTypeConfig.baselineValue ?? ''}
                            onChange={(e) =>
                              handleUpdatePane(activePane.id, {
                                chartTypeConfig: {
                                  ...activePane.chartTypeConfig,
                                  baselineValue:
                                    e.target.value === '' ? null : Number(e.target.value),
                                },
                              })
                            }
                            className="w-20 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                          />
                          {activePane.chartTypeConfig.baselineValue !== null && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdatePane(activePane.id, {
                                  chartTypeConfig: {
                                    ...activePane.chartTypeConfig,
                                    baselineValue: null,
                                  },
                                })
                              }
                              className="px-1.5 py-0.5 rounded border border-slate-500/30 text-[10px]"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {['renko', 'pnf', 'rangebars'].includes(activePane.chartStyle) && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Sizing</span>
                        <select
                          value={activePane.chartTypeConfig.renkoMode}
                          onChange={(e) =>
                            handleUpdatePane(activePane.id, {
                              chartTypeConfig: {
                                ...activePane.chartTypeConfig,
                                renkoMode: e.target.value as 'auto' | 'fixed',
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent"
                        >
                          <option value="auto" className={optionCls}>Auto (ATR)</option>
                          <option value="fixed" className={optionCls}>Fixed Size</option>
                        </select>
                      </div>
                    )}

                    {activePane.chartStyle === 'renko' &&
                      activePane.chartTypeConfig.renkoMode === 'fixed' && (
                        <label className="flex items-center justify-between">
                          <span>Box Size</span>
                          <input
                            type="number"
                            step="any"
                            value={activePane.chartTypeConfig.renkoBoxSize}
                            onChange={(e) =>
                              handleUpdatePane(activePane.id, {
                                chartTypeConfig: {
                                  ...activePane.chartTypeConfig,
                                  renkoBoxSize: Number(e.target.value) || 1,
                                },
                              })
                            }
                            className="w-20 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                          />
                        </label>
                      )}

                    {activePane.chartStyle === 'pnf' && (
                      <>
                        {activePane.chartTypeConfig.renkoMode === 'fixed' && (
                          <label className="flex items-center justify-between">
                            <span>Box Size</span>
                            <input
                              type="number"
                              step="any"
                              value={activePane.chartTypeConfig.pnfBoxSize}
                              onChange={(e) =>
                                handleUpdatePane(activePane.id, {
                                  chartTypeConfig: {
                                    ...activePane.chartTypeConfig,
                                    pnfBoxSize: Number(e.target.value) || 1,
                                  },
                                })
                              }
                              className="w-20 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                            />
                          </label>
                        )}
                        <label className="flex items-center justify-between">
                          <span>Reversal Boxes</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={activePane.chartTypeConfig.pnfReversal}
                            onChange={(e) =>
                              handleUpdatePane(activePane.id, {
                                chartTypeConfig: {
                                  ...activePane.chartTypeConfig,
                                  pnfReversal: Math.max(1, Number(e.target.value) || 3),
                                },
                              })
                            }
                            className="w-16 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                          />
                        </label>
                      </>
                    )}

                    {activePane.chartStyle === 'rangebars' &&
                      activePane.chartTypeConfig.renkoMode === 'fixed' && (
                        <label className="flex items-center justify-between">
                          <span>Range Size</span>
                          <input
                            type="number"
                            step="any"
                            value={activePane.chartTypeConfig.rangeSize}
                            onChange={(e) =>
                              handleUpdatePane(activePane.id, {
                                chartTypeConfig: {
                                  ...activePane.chartTypeConfig,
                                  rangeSize: Number(e.target.value) || 1,
                                },
                              })
                            }
                            className="w-20 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                          />
                        </label>
                      )}

                    {activePane.chartStyle === 'linebreak' && (
                      <label className="flex items-center justify-between">
                        <span>Line Count</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={activePane.chartTypeConfig.lineBreakCount}
                          onChange={(e) =>
                            handleUpdatePane(activePane.id, {
                              chartTypeConfig: {
                                ...activePane.chartTypeConfig,
                                lineBreakCount: Number(e.target.value) || 3,
                              },
                            })
                          }
                          className="w-16 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                        />
                      </label>
                    )}

                    {activePane.chartStyle === 'kagi' && (
                      <label className="flex items-center justify-between">
                        <span>Reversal %</span>
                        <input
                          type="number"
                          step="0.1"
                          value={activePane.chartTypeConfig.kagiReversalPct}
                          onChange={(e) =>
                            handleUpdatePane(activePane.id, {
                              chartTypeConfig: {
                                ...activePane.chartTypeConfig,
                                kagiReversalPct: Number(e.target.value) || 0.8,
                              },
                            })
                          }
                          className="w-16 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent font-mono"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <span className="h-4 w-px bg-slate-500/25 mx-0.5 shrink-0" />

          {/* Indicators Button + Favorites Quick Menu */}
          <div className="relative flex items-center" data-tv-popover>
            <button
              type="button"
              onClick={() => {
                closeAllPopovers();
                setIndModalOpen(true);
              }}
              title="Technical Indicators (33 Studies)"
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-500/15 text-xs font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Indicators</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !indFavDropdownOpen;
                closeAllPopovers();
                setIndFavDropdownOpen(next);
              }}
              title="Pinned Indicator Favorites"
              className={`p-1 rounded hover:bg-slate-500/15 ${
                indFavDropdownOpen ? 'text-[#2962FF]' : iconIdleCls
              }`}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            {indFavDropdownOpen && (
              <div
                className={`absolute top-9 left-0 z-50 w-56 p-1.5 rounded-lg border shadow-2xl text-xs ${bgTop}`}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  Favorite Studies
                </div>
                {workspace.favoriteIndicators.map((fid) => {
                  const def = INDICATOR_DEFINITIONS.find((d) => d.id === fid);
                  if (!def) return null;
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => {
                        handleAddIndicator(fid);
                        setIndFavDropdownOpen(false);
                      }}
                      className="w-full px-2 py-1.5 rounded text-left hover:bg-slate-500/15 flex items-center justify-between"
                    >
                      <span>{def.shortName}</span>
                      <span className="text-[10px] text-slate-400">{def.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Replay Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isReplayMode) {
                setIsReplayMode(true);
                setReplayLiveTicks(true);
                setReplayPlaying(false);
                setReplayTickStep(0);
                setCustomTickStream(null);
                setCustomTickCursor(0);
                setSelectingCutBar(true);
                const midIdx = Math.max(20, Math.floor(activeFullBars.length * 0.65));
                const t = activeFullBars[midIdx]?.time ?? null;
                setReplayCutoffTime(t);
                setReplayStartCutoffTime(t);
              } else {
                setIsReplayMode(false);
                setReplayPlaying(false);
                setReplayTickStep(0);
                setCustomTickStream(null);
                setCustomTickCursor(0);
                setTickFeedOpen(false);
                setSelectingCutBar(false);
                setReplayCutoffTime(null);
              }
            }}
            title="Live Replay Real-Time Tick Simulator"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
              isReplayMode
                ? 'bg-[#2962FF] text-white'
                : `hover:bg-slate-500/15 ${iconMutedText}`
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Live Replay</span>
          </button>

          <span className="h-4 w-px bg-slate-500/25 mx-0.5 shrink-0" />

          {/* Undo / Redo */}
          <button
            type="button"
            disabled={historyIdx <= 0}
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-500/15 disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={historyIdx >= historyStack.length - 1}
            onClick={handleRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-500/15 disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Side of Top Toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Multi-Chart Layout Selector */}
          <div className="relative" data-tv-popover>
            <button
              type="button"
              onClick={() => {
                const next = !layoutDropdownOpen;
                closeAllPopovers();
                setLayoutDropdownOpen(next);
              }}
              title="Multi-Chart Layout & Synchronization"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-500/15 text-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] hidden sm:inline">{workspace.layoutMode}</span>
            </button>
            {layoutDropdownOpen && (
              <div
                className={`absolute top-9 right-0 z-50 w-60 p-2.5 rounded-lg border shadow-2xl text-xs ${bgTop}`}
              >
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                  Grid Layout
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(
                    [
                      {id: '1x1', label: '1 Chart'},
                      {id: '2h', label: '2 Side'},
                      {id: '2v', label: '2 Stack'},
                      {id: '2x2', label: '4 Grid'},
                      {id: '3left', label: '1 + 2R'},
                      {id: '3top', label: '1 + 2B'},
                    ] as {id: WorkspaceLayoutMode; label: string}[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleChangeLayout(item.id)}
                      className={`px-2 py-1.5 rounded border text-[11px] font-semibold ${
                        workspace.layoutMode === item.id
                          ? 'bg-[#2962FF] border-[#2962FF] text-white'
                          : 'border-slate-500/25 hover:bg-slate-500/15'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Sync In Layout
                </div>
                {(
                  [
                    ['symbol', 'Sync Symbol'],
                    ['timeframe', 'Sync Timeframe'],
                    ['crosshair', 'Sync Crosshair'],
                    ['timeRange', 'Sync Time Scroll/Zoom'],
                    ['drawings', 'Sync Drawings'],
                  ] as [keyof LayoutSyncOptions, string][]
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between py-1 cursor-pointer">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={workspace.syncOptions[key]}
                      onChange={(e) =>
                        updateWorkspace((ws) => ({
                          ...ws,
                          syncOptions: {...ws.syncOptions, [key]: e.target.checked},
                        }))
                      }
                      className="accent-[#2962FF]"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Workspace Name / Save / Manager */}
          <button
            type="button"
            onClick={() => setWsModalOpen(true)}
            title="Manage Saved Workspaces"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-500/15 text-xs font-medium max-w-[140px]"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#2962FF] shrink-0" />
            <span className="truncate hidden lg:inline">{workspace.name}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleSaveToServer()}
            title="Save Workspace Changes (Ctrl+S)"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-500/15 text-xs font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            {saveFeedback && <span className="text-[10px] text-[#089981]">{saveFeedback}</span>}
          </button>

          {/* Quick Search (Ctrl+K) */}
          <button
            type="button"
            onClick={() => setQuickSearchOpen(true)}
            title="Quick Command Search (Ctrl+K or /)"
            className={`p-1.5 rounded hover:bg-slate-500/15 ${iconMutedText}`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Chart Settings */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Chart Settings"
            className={`p-1.5 rounded hover:bg-slate-500/15 ${iconMutedText}`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen Terminal (F)'}
            className={`p-1.5 rounded hover:bg-slate-500/15 ${iconMutedText}`}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Snapshot / Export */}
          <button
            type="button"
            onClick={() => void openSnapshotModal()}
            title="Snapshot & Export (PNG, SVG, CSV, Clipboard)"
            className={`p-1.5 rounded hover:bg-slate-500/15 ${iconMutedText}`}
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ====================================================================
       * LIVE REPLAY CONTROL STRIP (Simulated Tick Stream + Bar-by-Bar Playback)
       * ================================================================== */}
      {isReplayMode && (
        <div
          className={`relative px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
            effectiveDark
              ? 'bg-[#171E2E] border-[#2962FF]/40 text-slate-200'
              : 'bg-blue-50 border-blue-200 text-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-[#2962FF] text-white font-bold text-[10px] tracking-wide">
              LIVE REPLAY
            </span>
            <button
              type="button"
              onClick={() => setSelectingCutBar((v) => !v)}
              className={`px-2 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 ${
                selectingCutBar
                  ? 'bg-amber-500 border-amber-500 text-black'
                  : 'border-slate-500/35 hover:bg-slate-500/15'
              }`}
              title="Click on any candle to jump replay start"
            >
              <Scissors className="w-3 h-3" />
              {selectingCutBar ? 'Click Bar on Chart...' : 'Jump to Bar'}
            </button>
            <button
              type="button"
              onClick={() => stepReplayBy(-1)}
              className="p-1.5 rounded hover:bg-slate-500/15"
              title="Step Back 1 Bar (Left Arrow)"
            >
              <StepBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (customTickStream && customTickCursor >= customTickStream.length) {
                  setCustomTickCursor(1);
                  setReplayPlaying(true);
                  return;
                }
                setReplayPlaying((v) => !v);
              }}
              className="px-2.5 py-1 rounded bg-[#2962FF] text-white font-semibold flex items-center gap-1"
              title={replayPlaying ? 'Pause Live Replay' : 'Play Live Replay'}
            >
              {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{replayPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => stepReplayTick(1)}
              className="px-2 py-1 rounded border border-slate-500/35 hover:bg-slate-500/15 text-[11px] font-medium"
              title="Advance 1 Simulated Tick"
            >
              +1 Tick
            </button>
            <button
              type="button"
              onClick={() => stepReplayBy(1)}
              className="p-1.5 rounded hover:bg-slate-500/15"
              title="Step Forward 1 Bar (Right Arrow)"
            >
              <StepForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setReplayLiveTicks((prev) => {
                  const next = !prev;
                  if (next && !replayPlaying && replayCurrentIndex < activeFullBars.length - 1) {
                    setReplayPlaying(true);
                  }
                  if (!next) {
                    setReplayTickStep(0);
                  }
                  return next;
                });
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                replayLiveTicks
                  ? 'bg-[#089981]/20 border-[#089981] text-[#089981]'
                  : 'border-slate-500/35 hover:bg-slate-500/15'
              }`}
              title="Stream candle movement tick-by-tick like live trading"
            >
              <Radio className={`w-3.5 h-3.5 ${replayLiveTicks && replayPlaying ? 'animate-pulse' : ''}`} />
              <span>{replayLiveTicks ? 'Live Ticks ON' : 'Live Ticks'}</span>
            </button>

            {/* Simulated Tick Data Input Popover */}
            <div className="relative" data-tv-popover>
              <button
                type="button"
                onClick={() => setTickFeedOpen((v) => !v)}
                className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
                  customTickStream
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-500'
                    : 'border-slate-500/35 hover:bg-slate-500/15'
                }`}
                title="Load custom simulated tick data or generate a live tick stream"
              >
                {customTickStream
                  ? `Tick Stream (${customTickCursor}/${customTickStream.length})`
                  : 'Tick Feed'}
              </button>
              {tickFeedOpen && (
                <div
                  className={`absolute top-9 left-0 z-50 w-80 p-3 rounded-lg border shadow-2xl space-y-2.5 text-xs ${bgTop}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Simulated Tick Data Feed</span>
                    {customTickStream && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTickStream(null);
                          setCustomTickCursor(0);
                          setTickFeedError(null);
                        }}
                        className="text-[10px] text-[#2962FF] hover:underline"
                      >
                        Reset to Chart Bars
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Inject custom simulated ticks (JSON array of &#123;price, time?, volume?&#125; or one price per line) or generate a synthetic multi-bar tick stream.
                  </p>
                  <textarea
                    rows={4}
                    value={tickFeedInput}
                    onChange={(e) => setTickFeedInput(e.target.value)}
                    placeholder={`2648.40\n2649.15\n2650.80\n2649.95\n2652.10`}
                    className="w-full rounded border border-slate-500/30 bg-transparent p-2 font-mono text-[11px] focus:outline-none focus:border-[#2962FF]"
                  />
                  {tickFeedError && (
                    <p className="text-[11px] text-rose-500">{tickFeedError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadCustomTicks}
                      className="flex-1 px-2.5 py-1.5 rounded bg-[#2962FF] text-white font-semibold text-[11px]"
                    >
                      Play Ticks
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateTickBurst}
                      className="flex-1 px-2.5 py-1.5 rounded border border-[#089981]/50 text-[#089981] hover:bg-[#089981]/10 font-semibold text-[11px]"
                    >
                      Simulate Burst
                    </button>
                  </div>
                </div>
              )}
            </div>

            <select
              value={replaySpeedMs}
              onChange={(e) => setReplaySpeedMs(Number(e.target.value))}
              className="px-2 py-1 rounded border border-slate-500/35 bg-transparent font-mono text-[11px]"
              title="Playback Speed"
            >
              {SPEEDS.map((s) => (
                <option key={s.label} value={s.ms} className={optionCls}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setReplayPlaying(false);
                setReplayTickStep(0);
                setCustomTickCursor(0);
                if (replayStartCutoffTime) setReplayCutoffTime(replayStartCutoffTime);
              }}
              className="p-1.5 rounded hover:bg-slate-500/15"
              title="Restart from initial cut bar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="range"
              min={10}
              max={Math.max(10, activeFullBars.length - 1)}
              value={replayCurrentIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setReplayTickStep(0);
                setCustomTickStream(null);
                setCustomTickCursor(0);
                if (activeFullBars[idx]) setReplayCutoffTime(activeFullBars[idx].time);
              }}
              className="flex-1 accent-[#2962FF]"
            />
            <span className={`font-mono text-[10px] tabular-nums whitespace-nowrap ${effectiveDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {customTickStream
                ? `${replayLiveBar ? formatSimPrice(replayLiveBar.close, activeMeta.decimals) : '--'} · Tick ${customTickCursor}/${customTickStream.length}`
                : replayLiveBar
                  ? `${formatSimPrice(replayLiveBar.close, activeMeta.decimals)} · ${Math.round(((replayTickStep + 1) / REPLAY_TICKS_PER_BAR) * 100)}%`
                  : replayCutoffTime
                    ? formatBarTimestamp(replayCutoffTime, workspace.settings.timezone)
                    : '--'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsReplayMode(false);
              setReplayPlaying(false);
              setReplayTickStep(0);
              setCustomTickStream(null);
              setCustomTickCursor(0);
              setTickFeedOpen(false);
              setSelectingCutBar(false);
              setReplayCutoffTime(null);
            }}
            className={`px-2.5 py-1 rounded border border-rose-500/40 text-[11px] font-semibold hover:bg-rose-500/15 ${
              effectiveDark ? 'text-rose-400' : 'text-rose-600'
            }`}
          >
            Exit Replay
          </button>
        </div>
      )}

      {/* ====================================================================
       * MAIN BODY: LEFT DRAWING TOOLBAR + MULTI-PANE WORKSPACE
       * ================================================================== */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        {/* B. Left Collapsible Drawing Toolbar (9 Groups + Utilities) */}
        <aside
          data-tv-popover
          className={`${
            mobileToolsOpen ? 'flex' : 'hidden sm:flex'
          } w-11 border-r flex-col items-center py-1.5 justify-between shrink-0 z-30 ${bgTop}`}
        >
          <div className="flex flex-col items-center gap-0.5 w-full px-1">
            {LEFT_TOOLBAR_GROUPS.map((grp) => {
              const toolsInGroup = DRAWING_CATALOG.filter((t) => t.group === grp.group);
              const currentToolInGroup = groupLastTool[grp.group] || toolsInGroup[0]?.id;
              const isGroupActive = toolsInGroup.some((t) => t.id === activeTool);
              const isFlyoutOpen = openLeftGroup === grp.group;

              return (
                <div key={grp.group} className="relative w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool(currentToolInGroup);
                      setOpenLeftGroup(null);
                    }}
                    title={grp.label}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                      isGroupActive
                        ? 'bg-[#2962FF]/20 text-[#2962FF]'
                        : `hover:bg-slate-500/15 ${iconIdleCls}`
                    }`}
                  >
                    <TvToolSvg tool={currentToolInGroup || grp.defaultIcon} className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = isFlyoutOpen ? null : grp.group;
                      closeAllPopovers();
                      setOpenLeftGroup(next);
                    }}
                    title={`Open ${grp.label}`}
                    className={`absolute right-0 bottom-0.5 p-0.5 ${iconIdleCls}`}
                  >
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>

                  {isFlyoutOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute left-11 top-0 z-50 w-60 p-1.5 rounded-lg border shadow-2xl text-xs max-h-80 overflow-y-auto ${bgTop}`}
                    >
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {grp.group}
                      </div>
                      {toolsInGroup.map((tool) => {
                        const isFav = workspace.favoriteTools.includes(tool.id);
                        return (
                          <div
                            key={tool.id}
                            className={`flex items-center justify-between px-2 py-1.5 rounded ${
                              activeTool === tool.id ? 'bg-[#2962FF]/20 text-[#2962FF]' : 'hover:bg-slate-500/15'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTool(tool.id);
                                setGroupLastTool((prev) => ({...prev, [grp.group]: tool.id}));
                                setOpenLeftGroup(null);
                              }}
                              className="flex items-center gap-2 flex-1 text-left min-w-0"
                            >
                              <TvToolSvg tool={tool.id} className="w-4 h-4 shrink-0" />
                              <span className="truncate">{tool.label}</span>
                              {tool.shortcut && (
                                <span className="ml-auto text-[10px] text-slate-500 font-mono">
                                  {tool.shortcut}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = isFav
                                  ? workspace.favoriteTools.filter((x) => x !== tool.id)
                                  : [...workspace.favoriteTools, tool.id];
                                updateWorkspace((ws) => ({...ws, favoriteTools: next}));
                              }}
                              className="ml-1.5 text-slate-500 hover:text-amber-400"
                              title={isFav ? 'Unpin favorite' : 'Pin to favorites toolbar'}
                            >
                              <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Left Bottom Tool Utilities */}
          <div className="flex flex-col items-center gap-1 pt-2 border-t border-slate-500/20 w-full px-1">
            <button
              type="button"
              onClick={() => setMagnetEnabled((v) => !v)}
              title="Magnet Mode (Snap to Candle OHLC)"
              className={`w-8 h-7 rounded flex items-center justify-center ${
                magnetEnabled ? 'bg-[#2962FF]/20 text-[#2962FF]' : 'text-slate-400 hover:bg-slate-500/15'
              }`}
            >
              <Magnet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStayInDrawingMode((v) => !v)}
              title="Stay in Drawing Mode"
              className={`w-8 h-7 rounded flex items-center justify-center ${
                stayInDrawingMode ? 'bg-[#2962FF]/20 text-[#2962FF]' : 'text-slate-400 hover:bg-slate-500/15'
              }`}
            >
              <PencilRuler className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLockedAll((v) => !v)}
              title={lockedAll ? 'Unlock All Drawings' : 'Lock All Drawings'}
              className={`w-8 h-7 rounded flex items-center justify-center ${
                lockedAll ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:bg-slate-500/15'
              }`}
            >
              {lockedAll ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setHideAllDrawings((v) => !v)}
              title={hideAllDrawings ? 'Show All Drawings' : 'Hide All Drawings'}
              className={`w-8 h-7 rounded flex items-center justify-center ${
                hideAllDrawings ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:bg-slate-500/15'
              }`}
            >
              {hideAllDrawings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowFavoritesBar((v) => !v)}
              title="Toggle Floating Favorites Drawing Bar"
              className={`w-8 h-7 rounded flex items-center justify-center ${
                showFavoritesBar ? 'text-amber-400' : 'text-slate-400 hover:bg-slate-500/15'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesBar ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (activePane.drawings.length === 0) return;
                handleUpdatePane(activePane.id, {drawings: []}, true);
                setSelectedDrawingId(null);
              }}
              title="Clear All Drawings on Active Chart"
              className="w-8 h-7 rounded flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Center Multi-Pane Chart Grid */}
        <div className="relative flex-1 flex flex-col min-w-0 min-h-0">
          {/* Floating Favorites Drawing Toolbar */}
          {showFavoritesBar && workspace.favoriteTools.length > 0 && (
            <div
              className={`absolute bottom-2.5 left-3 z-20 hidden sm:flex items-center gap-0.5 px-1.5 py-1 rounded-lg border shadow-lg ${bgTop}`}
            >
              {workspace.favoriteTools.map((tid) => {
                const entry = DRAWING_CATALOG.find((d) => d.id === tid);
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setActiveTool(tid)}
                    title={entry?.label || tid}
                    className={`p-1 rounded transition-colors ${
                      activeTool === tid
                        ? 'bg-[#2962FF] text-white'
                        : `hover:bg-slate-500/15 ${iconIdleCls}`
                    }`}
                  >
                    <TvToolSvg tool={tid} className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid of ChartPanes */}
          <div className={`flex-1 min-h-0 gap-px bg-slate-500/20 ${gridClass}`}>
            {workspace.panes.map((pane, idx) => {
              const spanClass =
                workspace.layoutMode === '3left' && idx === 0
                  ? 'md:row-span-2'
                  : workspace.layoutMode === '3top' && idx === 0
                    ? 'md:col-span-2'
                    : '';

              return (
                <div key={pane.id} className={`min-h-0 min-w-0 ${spanClass}`}>
                  <ChartPane
                    pane={pane}
                    isActive={pane.id === workspace.activePaneId}
                    isDark={effectiveDark}
                    settings={workspace.settings}
                    customTimeframes={workspace.customTimeframes || EMPTY_CUSTOM_TIMEFRAMES}
                    replayState={{
                      isReplayMode,
                      isPlaying: replayPlaying,
                      cutoffTime: replayCutoffTime,
                      selectingCutBar,
                      liveBar: pane.id === activePane.id ? replayLiveBar : null,
                      simulatedBars: pane.id === activePane.id ? replaySimulatedBars : undefined,
                    }}
                    activeTool={activeTool}
                    stayInDrawingMode={stayInDrawingMode}
                    magnetEnabled={magnetEnabled}
                    lockedAll={lockedAll}
                    hideAllDrawings={hideAllDrawings}
                    selectedDrawingId={selectedDrawingId}
                    hasClipboardDrawing={Boolean(clipboardDrawing)}
                    accountBalance={accountBalance}
                    openPositions={openPositions}
                    syncCrosshairTime={
                      workspace.syncOptions.crosshair && syncCrosshairSourcePane !== pane.id
                        ? syncCrosshairTime
                        : null
                    }
                    syncLogicalRange={
                      workspace.syncOptions.timeRange && syncRangeSourcePane !== pane.id
                        ? syncLogicalRange
                        : null
                    }
                    onActivatePane={(pid) =>
                      updateWorkspace((ws) => ({...ws, activePaneId: pid}))
                    }
                    onUpdatePane={handleUpdatePane}
                    onSelectDrawing={setSelectedDrawingId}
                    onCopyDrawing={(drw) => setClipboardDrawing(JSON.parse(JSON.stringify(drw)))}
                    onPasteDrawing={pasteDrawingToPane}
                    onEditDrawingProps={(drwId) => setEditingDrawingId(drwId)}
                    onEditIndicatorProps={(pid, uid) => setEditingIndTarget({paneId: pid, uid})}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onOpenSnapshot={() => void openSnapshotModal()}
                    onResetToolToCursor={() => setActiveTool('crosshair')}
                    onCutReplayAtTime={(unixSec) => {
                      setReplayCutoffTime(unixSec);
                      setReplayStartCutoffTime(unixSec);
                      setSelectingCutBar(false);
                    }}
                    onCrosshairMoveSync={(pid, t) => {
                      if (!workspace.syncOptions.crosshair) return;
                      if (syncCrosshairSourcePane === pid && syncCrosshairTime === t) return;
                      setSyncCrosshairSourcePane(pid);
                      setSyncCrosshairTime(t);
                    }}
                    onLogicalRangeSync={(pid, r) => {
                      if (!workspace.syncOptions.timeRange || !r) return;
                      if (
                        syncRangeSourcePane === pid &&
                        syncLogicalRange &&
                        Math.abs(syncLogicalRange.from - r.from) < 0.05 &&
                        Math.abs(syncLogicalRange.to - r.to) < 0.05
                      ) {
                        return;
                      }
                      setSyncRangeSourcePane(pid);
                      setSyncLogicalRange(r);
                    }}
                    onQuickOrder={handleQuickOrder}
                    onMarketSnapshot={handleMarketSnapshot}
                    onRegisterActions={registerPaneActions}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
       * BOTTOM NAVIGATION BAR (Range Presets, Pan/Zoom, Restore View, Blotter)
       * ================================================================== */}
      <footer
        className={`h-8 px-2.5 border-t flex items-center justify-between gap-2 text-[11px] shrink-0 overflow-x-auto ${bgTop}`}
      >
        <div className="flex items-center gap-0.5">
          {(['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => paneActionsRef.current[activePane.id]?.applyRangePreset(preset)}
              className={`px-1.5 py-0.5 rounded hover:bg-slate-500/15 font-medium transition-colors ${iconIdleCls}`}
            >
              {preset}
            </button>
          ))}
          <span className="h-3.5 w-px bg-slate-500/25 mx-1" />
          <button
            type="button"
            onClick={() => setGoToDateOpen(true)}
            title="Go to specific Date/Time"
            className={`px-2 py-0.5 rounded hover:bg-slate-500/15 flex items-center gap-1 ${iconMutedText}`}
          >
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Go to</span>
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.panByBars(-12)}
            title="Scroll Left (Earlier Bars)"
            className={`p-1 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.panByBars(12)}
            title="Scroll Right (Later Bars)"
            className={`p-1 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.zoomIn()}
            title="Zoom In (Ctrl++)"
            className={`p-1 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.zoomOut()}
            title="Zoom Out (Ctrl+-)"
            className={`p-1 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.restorePreviousViewport()}
            title="Restore Previous Viewport"
            className={`p-1 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.resetView()}
            title="Reset Chart View (Alt+R)"
            className={`px-1.5 py-0.5 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.fitContent()}
            title="Fit All Loaded Bars"
            className={`px-1.5 py-0.5 rounded hover:bg-slate-500/15 ${iconIdleCls}`}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => paneActionsRef.current[activePane.id]?.scrollToLatest()}
            title="Jump to Latest Candle"
            className="px-1.5 py-0.5 rounded hover:bg-slate-500/15 flex items-center gap-1 text-[#2962FF] font-semibold"
          >
            <SkipForward className="w-3 h-3" />
            <span>Latest</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowExecutionDesk((v) => !v)}
            className={`px-2 py-0.5 rounded border text-[10px] font-semibold transition-colors ${
              showExecutionDesk
                ? 'bg-[#2962FF]/20 border-[#2962FF]/40 text-[#2962FF]'
                : `border-slate-500/30 ${iconIdleCls}`
            }`}
          >
            Paper Desk ({openPositions.length} open)
          </button>

          <select
            value={workspace.settings.timezone}
            onChange={(e) =>
              updateWorkspace((ws) => ({
                ...ws,
                settings: {...ws.settings, timezone: e.target.value},
              }))
            }
            className={`bg-transparent border border-slate-500/25 rounded px-1.5 py-0.5 font-mono text-[10px] ${iconMutedText}`}
            title="Chart Display Timezone"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.id} value={tz.id} className={optionCls}>
                {tz.label}
              </option>
            ))}
          </select>

          <span className={`font-mono text-[11px] tabular-nums ${iconMutedText}`}>
            {liveUtcClock}
          </span>
        </div>
      </footer>

      {/* ====================================================================
       * OPTIONAL COLLAPSIBLE PAPER EXECUTION DESK (Zero clutter when closed)
       * ================================================================== */}
      {showExecutionDesk && (
        <section
          className={`h-44 border-t flex flex-col shrink-0 text-xs ${bgTop}`}
        >
          <div className="h-8 px-3 border-b border-slate-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBlotterTab('positions')}
                className={`px-2 py-0.5 rounded font-semibold ${
                  blotterTab === 'positions' ? 'bg-[#2962FF] text-white' : 'text-slate-400'
                }`}
              >
                Open Positions ({openPositions.length})
              </button>
              <button
                type="button"
                onClick={() => setBlotterTab('history')}
                className={`px-2 py-0.5 rounded font-semibold ${
                  blotterTab === 'history' ? 'bg-[#2962FF] text-white' : 'text-slate-400'
                }`}
              >
                Closed History ({closedTrades.length})
              </button>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>
                Balance:{' '}
                <strong className={effectiveDark ? 'text-white' : 'text-slate-900'}>
                  ${accountBalance.toLocaleString()}
                </strong>
              </span>
              <label className="flex items-center gap-1">
                <span>Lots:</span>
                <input
                  type="number"
                  step="0.05"
                  min={0.01}
                  value={orderLots}
                  onChange={(e) => setOrderLots(Math.max(0.01, Number(e.target.value) || 0.1))}
                  className="w-16 px-1.5 py-0.5 rounded border border-slate-500/30 bg-transparent text-center"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const p = currentActiveTickPrice ?? 0;
                  if (p > 0) handleQuickOrder(activePane.symbol, 'BUY', p);
                }}
                className="px-2 py-0.5 rounded bg-[#089981] text-white font-bold"
              >
                Market Buy
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = currentActiveTickPrice ?? 0;
                  if (p > 0) handleQuickOrder(activePane.symbol, 'SELL', p);
                }}
                className="px-2 py-0.5 rounded bg-[#F23645] text-white font-bold"
              >
                Market Sell
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-1.5">
            {blotterTab === 'positions' ? (
              openPositions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No open paper positions. Click One-Click Buy/Sell on the chart or Market Buy/Sell above.
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="text-slate-500 border-b border-slate-500/15">
                    <tr>
                      <th className="py-1">Symbol</th>
                      <th>Side</th>
                      <th>Lots</th>
                      <th>Entry</th>
                      <th>SL</th>
                      <th>TP</th>
                      <th>Unrealized P&amp;L</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((pos) => {
                      const mark =
                        activePane.symbol === pos.symbol && currentActiveTickPrice
                          ? currentActiveTickPrice
                          : pos.entryPrice;
                      const meta = getSymbolMeta(pos.symbol);
                      const uPnl = calcPnl(pos.symbol, pos.side, pos.lots, pos.entryPrice, mark);
                      return (
                        <tr key={pos.id} className="border-b border-slate-500/10">
                          <td className="py-1 font-bold">{pos.symbol}</td>
                          <td className={pos.side === 'BUY' ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {pos.side}
                          </td>
                          <td>{pos.lots}</td>
                          <td>{formatSimPrice(pos.entryPrice, meta.decimals)}</td>
                          <td className="text-[#F23645]">{pos.stopLoss ?? '—'}</td>
                          <td className="text-[#089981]">{pos.takeProfit ?? '—'}</td>
                          <td className={uPnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                            {uPnl >= 0 ? '+' : ''}${uPnl.toFixed(2)}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => handleClosePosition(pos)}
                              className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : closedTrades.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No closed paper trades yet.
              </div>
            ) : (
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="text-slate-500 border-b border-slate-500/15">
                  <tr>
                    <th className="py-1">Symbol</th>
                    <th>Side</th>
                    <th>Lots</th>
                    <th>Entry → Exit</th>
                    <th>Pips</th>
                    <th>Realized P&amp;L</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.map((tr) => (
                    <tr key={tr.id} className="border-b border-slate-500/10">
                      <td className="py-1 font-bold">{tr.symbol}</td>
                      <td className={tr.side === 'BUY' ? 'text-[#089981]' : 'text-[#F23645]'}>
                        {tr.side}
                      </td>
                      <td>{tr.lots}</td>
                      <td>
                        {tr.entryPrice} → {tr.exitPrice}
                      </td>
                      <td>{tr.pips}p</td>
                      <td className={tr.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                        {tr.pnl >= 0 ? '+' : ''}${tr.pnl.toFixed(2)}
                      </td>
                      <td className="text-slate-400">{tr.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* ====================================================================
       * MODALS & DIALOGS
       * ================================================================== */}
      {symbolModalMode && (
        <SymbolSearchModal
          mode={symbolModalMode}
          quotes={quotesMap}
          recentSymbols={workspace.recentSymbols || []}
          isDark={effectiveDark}
          onSelectSymbol={(symKey) => {
            if (symbolModalMode === 'switch') {
              handleUpdatePane(activePane.id, {symbol: symKey}, true);
            } else {
              if (activePane.compareSymbols.some((c) => c.symbol === symKey)) return;
              const col = COMPARE_PALETTE[activePane.compareSymbols.length % COMPARE_PALETTE.length];
              handleUpdatePane(
                activePane.id,
                {
                  compareSymbols: [
                    ...activePane.compareSymbols,
                    {symbol: symKey, color: col, visible: true, mode: 'percent'},
                  ],
                },
                true,
              );
            }
          }}
          onClose={() => setSymbolModalMode(null)}
        />
      )}

      {indModalOpen && (
        <IndicatorsModal
          favoriteIds={workspace.favoriteIndicators}
          activeIndicators={activePane.indicators}
          isDark={effectiveDark}
          onAddIndicator={handleAddIndicator}
          onToggleFavorite={(indId) => {
            const exists = workspace.favoriteIndicators.includes(indId);
            updateWorkspace((ws) => ({
              ...ws,
              favoriteIndicators: exists
                ? ws.favoriteIndicators.filter((i) => i !== indId)
                : [...ws.favoriteIndicators, indId],
            }));
          }}
          onClose={() => setIndModalOpen(false)}
        />
      )}

      {editingIndTarget && editingIndicator && (
        <IndicatorSettingsModal
          indicator={editingIndicator}
          isDark={effectiveDark}
          onSave={(updated) => {
            const targetPane = workspace.panes.find((p) => p.id === editingIndTarget.paneId);
            if (!targetPane) return;
            handleUpdatePane(
              targetPane.id,
              {
                indicators: targetPane.indicators.map((i) =>
                  i.uid === updated.uid ? updated : i,
                ),
              },
              true,
            );
          }}
          onClose={() => setEditingIndTarget(null)}
        />
      )}

      {settingsOpen && (
        <ChartSettingsModal
          settings={workspace.settings}
          isDark={effectiveDark}
          onSave={(next) => updateWorkspace((ws) => ({...ws, settings: next}))}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {editingDrawing && (
        <DrawingConfigModal
          drawing={editingDrawing}
          fibTemplates={workspace.fibTemplates}
          isDark={effectiveDark}
          onSave={(updated) =>
            handleUpdatePane(
              activePane.id,
              {
                drawings: activePane.drawings.map((d) =>
                  d.id === updated.id ? updated : d,
                ),
              },
              true,
            )
          }
          onSaveFibTemplate={(name: string, levels: FibLevelItem[]) =>
            updateWorkspace((ws) => ({
              ...ws,
              fibTemplates: [
                ...ws.fibTemplates.filter((t) => t.name !== name),
                {name, levels: levels.map((l) => ({...l}))},
              ],
            }))
          }
          onDeleteFibTemplate={(name: string) =>
            updateWorkspace((ws) => ({
              ...ws,
              fibTemplates: ws.fibTemplates.filter((t) => t.name !== name),
            }))
          }
          onClose={() => setEditingDrawingId(null)}
        />
      )}

      {wsModalOpen && (
        <WorkspaceModal
          workspaces={workspaces}
          activeWorkspaceId={workspace.id}
          isDark={effectiveDark}
          onSelectWorkspace={(id) => {
            const target = workspaces.find((w) => w.id === id);
            setActiveWsId(id);
            if (target) {
              setHistoryStack([target.panes]);
              setHistoryIdx(0);
            }
          }}
          onCreateWorkspace={(name) => {
            const id = `ws_${user.id}_${Date.now().toString(36)}`;
            const cloned: SavedWorkspace = {
              ...JSON.parse(JSON.stringify(workspace)),
              id,
              name,
              updatedAt: new Date().toISOString(),
            };
            setWorkspaces((prev) => [cloned, ...prev]);
            setActiveWsId(id);
            void apiFetch('/api/workspaces', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({workspace: cloned}),
            }).catch(() => {});
          }}
          onRenameWorkspace={(id, name) =>
            setWorkspaces((prev) => prev.map((w) => (w.id === id ? {...w, name} : w)))
          }
          onDuplicateWorkspace={(id) => {
            const src = workspaces.find((w) => w.id === id);
            if (!src) return;
            const copyId = `ws_${user.id}_${Date.now().toString(36)}`;
            const copy: SavedWorkspace = {
              ...JSON.parse(JSON.stringify(src)),
              id: copyId,
              name: `${src.name} (Copy)`,
              updatedAt: new Date().toISOString(),
            };
            setWorkspaces((prev) => [copy, ...prev]);
          }}
          onDeleteWorkspace={(id) => {
            if (workspaces.length <= 1) return;
            setWorkspaces((prev) => {
              const filtered = prev.filter((w) => w.id !== id);
              if (activeWsId === id && filtered[0]) setActiveWsId(filtered[0].id);
              return filtered;
            });
            void apiFetch(`/api/workspaces/${encodeURIComponent(id)}`, {
              method: 'DELETE',
            }).catch(() => {});
          }}
          onClose={() => setWsModalOpen(false)}
        />
      )}

      {quickSearchOpen && (
        <QuickSearchModal
          customTimeframes={workspace.customTimeframes || []}
          isDark={effectiveDark}
          onSelectSymbol={(sym) => handleUpdatePane(activePane.id, {symbol: sym}, true)}
          onSelectTimeframe={(tf) => handleUpdatePane(activePane.id, {interval: tf}, true)}
          onAddIndicator={handleAddIndicator}
          onSelectTool={(t) => setActiveTool(t)}
          onAction={(act) => {
            if (act === 'settings') setSettingsOpen(true);
            else if (act === 'fullscreen') void toggleFullscreen();
            else if (act === 'replay') setIsReplayMode((v) => !v);
            else if (act === 'snapshot') void openSnapshotModal();
          }}
          onClose={() => setQuickSearchOpen(false)}
        />
      )}

      {snapshotPayload && (
        <SnapshotModal
          initialPngDataUrl={snapshotPayload.initialPng}
          csvPayload={snapshotPayload.csv}
          symbol={activePane.symbol}
          interval={activePane.interval}
          isDark={effectiveDark}
          onGenerateSnapshot={handleGenerateSnapshot}
          onClose={() => setSnapshotPayload(null)}
        />
      )}

      {goToDateOpen && (
        <GoToDateModal
          isDark={effectiveDark}
          onGoToDate={(unixSec) => paneActionsRef.current[activePane.id]?.goToDate(unixSec)}
          onClose={() => setGoToDateOpen(false)}
        />
      )}
    </div>
  );
}
