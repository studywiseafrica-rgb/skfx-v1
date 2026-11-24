export type AssetClass =
  | 'Forex'
  | 'Metals'
  | 'Commodities'
  | 'Indices'
  | 'Stocks'
  | 'ETFs'
  | 'Futures'
  | 'Crypto';

export type FeedStatus = 'real-time' | 'delayed' | 'cached' | 'simulated' | 'unavailable';

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SimulatedTick {
  time: number;
  price: number;
  volume?: number;
}

export interface SymbolMeta {
  key: string;
  ticker: string;
  label: string;
  exchange: string;
  assetClass: AssetClass;
  currency: string;
  decimals: number;
  pipSize: number;
  sessionHours: string;
  description: string;
  supportedIntervals: TimeframeKey[];
}

export interface MarketPayload {
  symbol: string;
  displayName: string;
  exchange?: string;
  assetClass?: AssetClass;
  interval: string;
  decimals: number;
  pipSize: number;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  source: string;
  feedStatus: FeedStatus;
  supportedIntervals?: string[];
  dateRange?: {from: number; to: number; count: number};
  candles: CandleBar[];
}

export interface QuoteItem {
  symbol: string;
  name: string;
  exchange?: string;
  assetClass?: AssetClass;
  decimals: number;
  price: number;
  change: number;
  changePercent: number;
  feedStatus?: FeedStatus;
}

export interface SimPosition {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  entryTime: number;
  status: 'OPEN' | 'PENDING';
}

export interface SimClosedTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pips: number;
  reason: 'TP Hit' | 'SL Hit' | 'Manual Close';
}

export type BuiltinTimeframeKey =
  | '1s'
  | '5s'
  | '10s'
  | '15s'
  | '30s'
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '45m'
  | '1h'
  | '2h'
  | '3h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '1wk'
  | '1mo';

export type TimeframeKey = BuiltinTimeframeKey | (string & {});

export interface CustomTimeframeDef {
  key: string;
  label: string;
  shortLabel: string;
  longLabel: string;
  section: 'MINUTES' | 'HOURS' | 'DAYS';
  stepSec: number;
}

export type ChartStyleKey =
  | 'candles'
  | 'hollow'
  | 'bars'
  | 'line'
  | 'area'
  | 'baseline'
  | 'heikinashi'
  | 'renko'
  | 'linebreak'
  | 'kagi'
  | 'pnf'
  | 'rangebars';

export interface ChartTypeConfig {
  renkoMode: 'auto' | 'fixed';
  renkoBoxSize: number;
  lineBreakCount: number;
  kagiReversalPct: number;
  pnfBoxSize: number;
  pnfReversal: number;
  rangeSize: number;
  baselineValue: number | null;
}

export type PriceScaleMode = 'normal' | 'logarithmic' | 'percentage' | 'indexed100';

export type IndicatorCategory = 'Trend' | 'Momentum' | 'Volume' | 'Volatility' | 'Other';

export type IndicatorId =
  | 'sma'
  | 'ema'
  | 'wma'
  | 'hma'
  | 'vwap'
  | 'session_vwap'
  | 'supertrend'
  | 'ichimoku'
  | 'psar'
  | 'adx'
  | 'rsi'
  | 'macd'
  | 'stoch'
  | 'stoch_rsi'
  | 'cci'
  | 'mom'
  | 'willr'
  | 'roc'
  | 'volume'
  | 'volume_sma'
  | 'obv'
  | 'mfi'
  | 'ad_line'
  | 'cmf'
  | 'vol_profile'
  | 'bb'
  | 'atr'
  | 'keltner'
  | 'donchian'
  | 'stddev'
  | 'pivots'
  | 'auto_fib'
  | 'price_channel';

export type PriceSourceKey = 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';

export interface IndicatorDefinition {
  id: IndicatorId;
  name: string;
  shortName: string;
  category: IndicatorCategory;
  placement: 'overlay' | 'pane';
  description: string;
  defaultInputs: Record<string, number | string | boolean>;
  defaultColors: string[];
}

export interface IndicatorInstance {
  uid: string;
  indicatorId: IndicatorId;
  name: string;
  category: IndicatorCategory;
  placement: 'overlay' | 'pane';
  visible: boolean;
  collapsed: boolean;
  expanded: boolean;
  paneHeight: number;
  source: PriceSourceKey;
  inputs: Record<string, number | string | boolean>;
  colors: string[];
  lineWidth: number;
  scaleMode?: PriceScaleMode;
  paneGroupId?: string;
}

export interface FibLevelItem {
  level: number;
  enabled: boolean;
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
}

export type DrawingToolId =
  // 1. Cursor
  | 'crosshair'
  | 'dot'
  | 'arrow'
  | 'eraser'
  // 2. Trend line
  | 'trendline'
  | 'ray'
  | 'extline'
  | 'hline'
  | 'hray'
  | 'vline'
  | 'crossline'
  | 'channel'
  | 'regtrend'
  | 'angle'
  | 'infoline'
  // 3. Fibonacci
  | 'fib'
  | 'fibext'
  | 'fibtrendext'
  | 'fibchannel'
  | 'fibtime'
  | 'fibcircles'
  | 'fibarcs'
  | 'fibspiral'
  | 'fibspeedarcs'
  | 'fibwedge'
  // 4. Gann
  | 'gannfan'
  | 'gannbox'
  | 'gannsquare'
  | 'gannsquarefixed'
  // 5. Pattern
  | 'xabcd'
  | 'abcd'
  | 'elliott5'
  | 'elliott3'
  | 'headshoulders'
  | 'cypher'
  | 'threedrives'
  // 6. Position & Measurement
  | 'longpos'
  | 'shortpos'
  | 'forecast'
  | 'datepricerange'
  | 'barspattern'
  | 'ghostfeed'
  | 'pricerange'
  | 'daterange'
  // 7. Brush & Shape
  | 'brush'
  | 'highlighter'
  | 'path'
  | 'rect'
  | 'rotatedrect'
  | 'ellipse'
  | 'triangle'
  | 'polyline'
  | 'curve'
  // 8. Annotation
  | 'text'
  | 'anchoredtext'
  | 'note'
  | 'callout'
  | 'pricelabel'
  | 'pricenote'
  | 'signpost'
  // 9. Icons & Symbols
  | 'arrowup'
  | 'arrowdown'
  | 'flagmarker'
  | 'starmarker'
  | 'checkmarker'
  | 'crossmarker'
  | 'thumbup';

export interface ChartPoint {
  time: number;
  price: number;
}

export interface ChartDrawing {
  id: string;
  tool: Exclude<DrawingToolId, 'crosshair' | 'dot' | 'arrow' | 'eraser'>;
  symbol: string;
  points: ChartPoint[];
  color: string;
  fillColor?: string;
  fillOpacity?: number;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  extendLeft?: boolean;
  extendRight?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: 'sans' | 'mono' | 'serif';
  textAlign?: 'left' | 'center' | 'right';
  textBgEnabled?: boolean;
  textBgColor?: string;
  showLabels?: boolean;
  showValues?: boolean;
  visible: boolean;
  locked: boolean;
  zIndex?: number;
  createdAt: number;
  // Position settings
  riskPercent?: number;
  leverage?: number;
  targetPrice?: number;
  stopPrice?: number;
  qtyPrecision?: 'Default' | '0.01' | '0.1' | '1';
  // Fibonacci settings
  fibLevels?: FibLevelItem[];
  fibShowPrices?: boolean;
  fibShowPercents?: boolean;
  fibReverse?: boolean;
  fibBgFill?: boolean;
}

export type ToolCatalogGroup =
  | 'CURSOR'
  | 'TREND LINE'
  | 'FIBONACCI'
  | 'GANN'
  | 'PATTERN'
  | 'POSITION & MEASUREMENT'
  | 'BRUSH & SHAPE'
  | 'ANNOTATION'
  | 'ICONS & SYMBOLS';

export interface ToolCatalogEntry {
  id: DrawingToolId;
  label: string;
  shortcut?: string;
  group: ToolCatalogGroup;
  requiredPoints: number; // -1 for freehand/multi-click finished with double-click
}

export type WorkspaceLayoutMode = '1x1' | '2h' | '2v' | '2x2' | '3left' | '3top';

export interface LayoutSyncOptions {
  symbol: boolean;
  timeframe: boolean;
  crosshair: boolean;
  timeRange: boolean;
  drawings: boolean;
}

export interface CompareSymbolItem {
  symbol: string;
  color: string;
  visible: boolean;
  mode: 'percent' | 'price';
}

export interface ChartSettingsConfig {
  // Symbol
  bullColor: string;
  bearColor: string;
  wickBullColor: string;
  wickBearColor: string;
  borderBullColor: string;
  borderBearColor: string;
  showLastPriceLine: boolean;
  showPrevCloseLine: boolean;
  // Status Line
  showSymbolTitle: boolean;
  showOhlcValues: boolean;
  showBarChangeValues: boolean;
  showVolumeInStatus: boolean;
  showIndicatorValues: boolean;
  // Scales & Lines
  priceAxisPrecision: 'auto' | '2' | '3' | '4' | '5';
  scalePosition: 'right' | 'left';
  scaleMarginTop: number;
  scaleMarginBottom: number;
  rightOffsetBars: number;
  barSpacing: number;
  showCountdown: boolean;
  showSessionBreaks: boolean;
  timezone: string;
  // Canvas
  showVertGrid: boolean;
  showHorzGrid: boolean;
  canvasBgColor: string;
  gridColor: string;
  crosshairStyle: 'dashed' | 'solid' | 'dotted';
  showWatermark: boolean;
  // Trading
  showOneClickTrading: boolean;
  showPositionOverlay: boolean;
  // Appearance
  themeOverride: 'inherit' | 'dark' | 'light';
  chartFontSize: number;
}

export interface ChartPaneState {
  id: string;
  symbol: string;
  interval: TimeframeKey;
  chartStyle: ChartStyleKey;
  chartTypeConfig: ChartTypeConfig;
  compareSymbols: CompareSymbolItem[];
  indicators: IndicatorInstance[];
  drawings: ChartDrawing[];
  priceScaleMode: PriceScaleMode;
  autoScale: boolean;
  invertedScale: boolean;
  manualPriceRange: {min: number; max: number} | null;
}

export interface SavedWorkspace {
  id: string;
  name: string;
  updatedAt: string;
  layoutMode: WorkspaceLayoutMode;
  syncOptions: LayoutSyncOptions;
  activePaneId: string;
  panes: ChartPaneState[];
  settings: ChartSettingsConfig;
  favoriteTimeframes: TimeframeKey[];
  customTimeframes?: CustomTimeframeDef[];
  favoriteIndicators: IndicatorId[];
  favoriteTools: DrawingToolId[];
  recentSymbols?: string[];
  fibTemplates: {name: string; levels: FibLevelItem[]}[];
}

export const DEFAULT_FIB_RETRACE_LEVELS: FibLevelItem[] = [
  {level: 0, enabled: true, color: '#787B86', lineStyle: 'solid', lineWidth: 1},
  {level: 0.236, enabled: true, color: '#F23645', lineStyle: 'solid', lineWidth: 1},
  {level: 0.382, enabled: true, color: '#F59E0B', lineStyle: 'solid', lineWidth: 1},
  {level: 0.5, enabled: true, color: '#089981', lineStyle: 'solid', lineWidth: 1.5},
  {level: 0.618, enabled: true, color: '#2962FF', lineStyle: 'solid', lineWidth: 1.8},
  {level: 0.786, enabled: true, color: '#0EA5E9', lineStyle: 'solid', lineWidth: 1},
  {level: 1, enabled: true, color: '#787B86', lineStyle: 'solid', lineWidth: 1},
  {level: 1.272, enabled: false, color: '#8B5CF6', lineStyle: 'dashed', lineWidth: 1},
  {level: 1.618, enabled: false, color: '#EC4899', lineStyle: 'dashed', lineWidth: 1},
];

export const DEFAULT_FIB_EXT_LEVELS: FibLevelItem[] = [
  {level: 0, enabled: true, color: '#787B86', lineStyle: 'solid', lineWidth: 1},
  {level: 0.382, enabled: true, color: '#F59E0B', lineStyle: 'solid', lineWidth: 1},
  {level: 0.618, enabled: true, color: '#2962FF', lineStyle: 'solid', lineWidth: 1.5},
  {level: 1, enabled: true, color: '#089981', lineStyle: 'solid', lineWidth: 1.5},
  {level: 1.272, enabled: true, color: '#F59E0B', lineStyle: 'dashed', lineWidth: 1},
  {level: 1.618, enabled: true, color: '#EF4444', lineStyle: 'solid', lineWidth: 1.8},
  {level: 2.618, enabled: true, color: '#8B5CF6', lineStyle: 'dashed', lineWidth: 1},
];

export const DEFAULT_CHART_TYPE_CONFIG: ChartTypeConfig = {
  renkoMode: 'auto',
  renkoBoxSize: 5,
  lineBreakCount: 3,
  kagiReversalPct: 0.8,
  pnfBoxSize: 5,
  pnfReversal: 3,
  rangeSize: 8,
  baselineValue: null,
};

export const DEFAULT_SETTINGS: ChartSettingsConfig = {
  bullColor: '#089981',
  bearColor: '#F23645',
  wickBullColor: '#089981',
  wickBearColor: '#F23645',
  borderBullColor: '#089981',
  borderBearColor: '#F23645',
  showLastPriceLine: true,
  showPrevCloseLine: false,
  showSymbolTitle: true,
  showOhlcValues: true,
  showBarChangeValues: true,
  showVolumeInStatus: true,
  showIndicatorValues: true,
  priceAxisPrecision: 'auto',
  scalePosition: 'right',
  scaleMarginTop: 0.08,
  scaleMarginBottom: 0.08,
  rightOffsetBars: 12,
  barSpacing: 8,
  showCountdown: true,
  showSessionBreaks: false,
  timezone: 'UTC',
  showVertGrid: true,
  showHorzGrid: true,
  canvasBgColor: '',
  gridColor: '',
  crosshairStyle: 'dashed',
  showWatermark: true,
  showOneClickTrading: true,
  showPositionOverlay: true,
  themeOverride: 'inherit',
  chartFontSize: 11,
};

export const DRAWING_CATALOG: ToolCatalogEntry[] = [
  // 1. CURSOR
  {id: 'crosshair', label: 'Crosshair', shortcut: 'Esc', group: 'CURSOR', requiredPoints: 0},
  {id: 'dot', label: 'Dot Cursor', group: 'CURSOR', requiredPoints: 0},
  {id: 'arrow', label: 'Arrow Pointer', group: 'CURSOR', requiredPoints: 0},
  {id: 'eraser', label: 'Eraser (Click Drawing)', group: 'CURSOR', requiredPoints: 0},

  // 2. TREND LINE
  {id: 'trendline', label: 'Trend Line', shortcut: 'Alt + T', group: 'TREND LINE', requiredPoints: 2},
  {id: 'ray', label: 'Ray', group: 'TREND LINE', requiredPoints: 2},
  {id: 'extline', label: 'Extended Line', group: 'TREND LINE', requiredPoints: 2},
  {id: 'infoline', label: 'Info Line', group: 'TREND LINE', requiredPoints: 2},
  {id: 'hline', label: 'Horizontal Line', shortcut: 'Alt + H', group: 'TREND LINE', requiredPoints: 1},
  {id: 'hray', label: 'Horizontal Ray', shortcut: 'Alt + J', group: 'TREND LINE', requiredPoints: 1},
  {id: 'vline', label: 'Vertical Line', shortcut: 'Alt + V', group: 'TREND LINE', requiredPoints: 1},
  {id: 'crossline', label: 'Cross Line', shortcut: 'Alt + C', group: 'TREND LINE', requiredPoints: 1},
  {id: 'channel', label: 'Parallel Channel', group: 'TREND LINE', requiredPoints: 3},
  {id: 'regtrend', label: 'Regression Trend', group: 'TREND LINE', requiredPoints: 2},
  {id: 'angle', label: 'Trend Angle', group: 'TREND LINE', requiredPoints: 2},

  // 3. FIBONACCI
  {id: 'fib', label: 'Fibonacci Retracement', shortcut: 'Alt + F', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibext', label: 'Fibonacci Extension', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibtrendext', label: 'Fib Trend-Based Extension', group: 'FIBONACCI', requiredPoints: 3},
  {id: 'fibchannel', label: 'Fibonacci Channel', group: 'FIBONACCI', requiredPoints: 3},
  {id: 'fibtime', label: 'Fibonacci Time Zone', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibcircles', label: 'Fibonacci Circles', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibarcs', label: 'Fibonacci Arcs', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibspiral', label: 'Fibonacci Spiral', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibspeedarcs', label: 'Fib Speed Resistance Arcs', group: 'FIBONACCI', requiredPoints: 2},
  {id: 'fibwedge', label: 'Fibonacci Wedge', group: 'FIBONACCI', requiredPoints: 3},

  // 4. GANN
  {id: 'gannfan', label: 'Gann Fan', group: 'GANN', requiredPoints: 2},
  {id: 'gannbox', label: 'Gann Box', group: 'GANN', requiredPoints: 2},
  {id: 'gannsquare', label: 'Gann Square', group: 'GANN', requiredPoints: 2},
  {id: 'gannsquarefixed', label: 'Gann Square Fixed', group: 'GANN', requiredPoints: 2},

  // 5. PATTERN
  {id: 'xabcd', label: 'XABCD Pattern', group: 'PATTERN', requiredPoints: 5},
  {id: 'abcd', label: 'ABCD Pattern', group: 'PATTERN', requiredPoints: 4},
  {id: 'elliott5', label: 'Elliott Impulse Wave (1-5)', group: 'PATTERN', requiredPoints: 5},
  {id: 'elliott3', label: 'Elliott Correction Wave (A-C)', group: 'PATTERN', requiredPoints: 3},
  {id: 'headshoulders', label: 'Head and Shoulders', group: 'PATTERN', requiredPoints: 5},
  {id: 'cypher', label: 'Cypher Pattern', group: 'PATTERN', requiredPoints: 5},
  {id: 'threedrives', label: 'Three Drives', group: 'PATTERN', requiredPoints: 5},

  // 6. POSITION & MEASUREMENT
  {id: 'longpos', label: 'Long Position', shortcut: 'L', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'shortpos', label: 'Short Position', shortcut: 'S', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'forecast', label: 'Forecast', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'datepricerange', label: 'Date & Price Range', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'barspattern', label: 'Bars Pattern', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'ghostfeed', label: 'Ghost Feed', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'pricerange', label: 'Price Range', shortcut: 'M', group: 'POSITION & MEASUREMENT', requiredPoints: 2},
  {id: 'daterange', label: 'Date Range', group: 'POSITION & MEASUREMENT', requiredPoints: 2},

  // 7. BRUSH & SHAPE
  {id: 'brush', label: 'Brush', group: 'BRUSH & SHAPE', requiredPoints: -1},
  {id: 'highlighter', label: 'Highlighter', group: 'BRUSH & SHAPE', requiredPoints: -1},
  {id: 'path', label: 'Path (Double-click to finish)', group: 'BRUSH & SHAPE', requiredPoints: -2},
  {id: 'rect', label: 'Rectangle', shortcut: 'R', group: 'BRUSH & SHAPE', requiredPoints: 2},
  {id: 'rotatedrect', label: 'Rotated Rectangle', group: 'BRUSH & SHAPE', requiredPoints: 3},
  {id: 'ellipse', label: 'Ellipse', group: 'BRUSH & SHAPE', requiredPoints: 2},
  {id: 'triangle', label: 'Triangle', group: 'BRUSH & SHAPE', requiredPoints: 3},
  {id: 'polyline', label: 'Polyline (Double-click to finish)', group: 'BRUSH & SHAPE', requiredPoints: -2},
  {id: 'curve', label: 'Curve (Bezier)', group: 'BRUSH & SHAPE', requiredPoints: 3},

  // 8. ANNOTATION
  {id: 'text', label: 'Text', shortcut: 'T', group: 'ANNOTATION', requiredPoints: 1},
  {id: 'anchoredtext', label: 'Anchored Text', group: 'ANNOTATION', requiredPoints: 1},
  {id: 'note', label: 'Note', group: 'ANNOTATION', requiredPoints: 1},
  {id: 'callout', label: 'Callout', group: 'ANNOTATION', requiredPoints: 2},
  {id: 'pricelabel', label: 'Price Label', group: 'ANNOTATION', requiredPoints: 1},
  {id: 'pricenote', label: 'Price Note', group: 'ANNOTATION', requiredPoints: 2},
  {id: 'signpost', label: 'Signpost', group: 'ANNOTATION', requiredPoints: 1},

  // 9. ICONS & SYMBOLS
  {id: 'arrowup', label: 'Arrow Up', group: 'ICONS & SYMBOLS', requiredPoints: 1},
  {id: 'arrowdown', label: 'Arrow Down', group: 'ICONS & SYMBOLS', requiredPoints: 1},
  {id: 'flagmarker', label: 'Flag Marker', group: 'ICONS & SYMBOLS', requiredPoints: 1},
  {id: 'starmarker', label: 'Star Marker', group: 'ICONS & SYMBOLS', requiredPoints: 1},
  {id: 'checkmarker', label: 'Check Marker', group: 'ICONS & SYMBOLS', requiredPoints: 1},
  {id: 'crossmarker', label: 'Cross Marker', group: 'ICONS & SYMBOLS', requiredPoints: 1},
  {id: 'thumbup', label: 'Thumbs Up Marker', group: 'ICONS & SYMBOLS', requiredPoints: 1},
];

export const DEFAULT_FAVORITE_TOOLS: DrawingToolId[] = [
  'trendline',
  'hline',
  'hray',
  'channel',
  'fib',
  'rect',
  'longpos',
  'shortpos',
  'text',
  'pricerange',
];

export interface TimeframeDef {
  key: TimeframeKey;
  label: string;
  shortLabel: string;
  longLabel: string;
  section: 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';
  stepSec: number;
}

export const TIMEFRAMES: TimeframeDef[] = [
  {key: '1s', label: '1s', shortLabel: '1s', longLabel: '1 second', section: 'SECONDS', stepSec: 1},
  {key: '5s', label: '5s', shortLabel: '5s', longLabel: '5 seconds', section: 'SECONDS', stepSec: 5},
  {key: '10s', label: '10s', shortLabel: '10s', longLabel: '10 seconds', section: 'SECONDS', stepSec: 10},
  {key: '15s', label: '15s', shortLabel: '15s', longLabel: '15 seconds', section: 'SECONDS', stepSec: 15},
  {key: '30s', label: '30s', shortLabel: '30s', longLabel: '30 seconds', section: 'SECONDS', stepSec: 30},
  {key: '1m', label: '1m', shortLabel: '1m', longLabel: '1 minute', section: 'MINUTES', stepSec: 60},
  {key: '3m', label: '3m', shortLabel: '3m', longLabel: '3 minutes', section: 'MINUTES', stepSec: 180},
  {key: '5m', label: '5m', shortLabel: '5m', longLabel: '5 minutes', section: 'MINUTES', stepSec: 300},
  {key: '15m', label: '15m', shortLabel: '15m', longLabel: '15 minutes', section: 'MINUTES', stepSec: 900},
  {key: '30m', label: '30m', shortLabel: '30m', longLabel: '30 minutes', section: 'MINUTES', stepSec: 1800},
  {key: '45m', label: '45m', shortLabel: '45m', longLabel: '45 minutes', section: 'MINUTES', stepSec: 2700},
  {key: '1h', label: '1h', shortLabel: '1h', longLabel: '1 hour', section: 'HOURS', stepSec: 3600},
  {key: '2h', label: '2h', shortLabel: '2h', longLabel: '2 hours', section: 'HOURS', stepSec: 7200},
  {key: '3h', label: '3h', shortLabel: '3h', longLabel: '3 hours', section: 'HOURS', stepSec: 10800},
  {key: '4h', label: '4h', shortLabel: '4h', longLabel: '4 hours', section: 'HOURS', stepSec: 14400},
  {key: '6h', label: '6h', shortLabel: '6h', longLabel: '6 hours', section: 'HOURS', stepSec: 21600},
  {key: '8h', label: '8h', shortLabel: '8h', longLabel: '8 hours', section: 'HOURS', stepSec: 28800},
  {key: '12h', label: '12h', shortLabel: '12h', longLabel: '12 hours', section: 'HOURS', stepSec: 43200},
  {key: '1d', label: 'D', shortLabel: 'D', longLabel: '1 day', section: 'DAYS', stepSec: 86400},
  {key: '1wk', label: 'W', shortLabel: 'W', longLabel: '1 week', section: 'DAYS', stepSec: 604800},
  {key: '1mo', label: 'M', shortLabel: 'M', longLabel: '1 month', section: 'DAYS', stepSec: 2592000},
];

export function resolveTimeframeDef(
  tfKey: string,
  customTimeframes: CustomTimeframeDef[] = [],
): TimeframeDef & {isCustom?: boolean; baseFetchInterval?: BuiltinTimeframeKey} {
  const builtin = TIMEFRAMES.find((t) => t.key === tfKey);
  if (builtin) return builtin;
  const custom = customTimeframes.find((t) => t.key === tfKey);
  if (custom) {
    const baseFetchInterval: BuiltinTimeframeKey =
      custom.stepSec < 3600 ? '1m' : custom.stepSec < 86400 ? '1h' : '1d';
    return {...custom, isCustom: true, baseFetchInterval};
  }
  const m = /^(\d+)(m|h|d)$/i.exec(tfKey.trim());
  if (m) {
    const val = Math.max(1, Number(m[1]));
    const unit = m[2].toLowerCase() as 'm' | 'h' | 'd';
    const mult = unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    const stepSec = val * mult;
    const section = unit === 'm' ? 'MINUTES' : unit === 'h' ? 'HOURS' : 'DAYS';
    const label = unit === 'd' ? `${val}D` : `${val}${unit}`;
    const longLabel =
      unit === 'm'
        ? `${val} minute${val > 1 ? 's' : ''}`
        : unit === 'h'
          ? `${val} hour${val > 1 ? 's' : ''}`
          : `${val} day${val > 1 ? 's' : ''}`;
    return {
      key: `${val}${unit}`,
      label,
      shortLabel: label,
      longLabel,
      section,
      stepSec,
      isCustom: true,
      baseFetchInterval: stepSec < 3600 ? '1m' : stepSec < 86400 ? '1h' : '1d',
    };
  }
  return TIMEFRAMES[7];
}

export const DEFAULT_FAVORITE_TIMEFRAMES: TimeframeKey[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
  '1wk',
];

export const SPEEDS = [
  {label: '0.25x', ms: 2200},
  {label: '0.5x', ms: 1400},
  {label: '1x', ms: 800},
  {label: '2x', ms: 420},
  {label: '5x', ms: 180},
  {label: '10x', ms: 80},
];

export const TIMEZONE_OPTIONS = [
  {id: 'UTC', label: 'UTC'},
  {id: 'America/New_York', label: 'New York (EST/EDT)'},
  {id: 'Europe/London', label: 'London (GMT/BST)'},
  {id: 'Europe/Berlin', label: 'Frankfurt (CET)'},
  {id: 'Asia/Tokyo', label: 'Tokyo (JST)'},
  {id: 'Asia/Singapore', label: 'Singapore (SGT)'},
  {id: 'Australia/Sydney', label: 'Sydney (AEST)'},
];

export function getDollarPerPointPerLot(symbol: string, currentPrice: number): number {
  switch (symbol) {
    case 'XAUUSD':
      return 100;
    case 'XAGUSD':
      return 5000;
    case 'USDJPY':
      return currentPrice > 0 ? 100_000 / currentPrice : 650;
    case 'NAS100':
    case 'NQ1!':
      return 20;
    case 'SPX':
    case 'ES1!':
      return 50;
    case 'BTCUSD':
    case 'BTCUSDT':
    case 'ETHUSDT':
    case 'SOLUSDT':
    case 'AAPL':
    case 'NVDA':
    case 'TSLA':
    case 'MSFT':
      return 1;
    default:
      return 100_000;
  }
}

export function calcPnl(
  symbol: string,
  side: 'BUY' | 'SELL',
  lots: number,
  entry: number,
  exit: number,
): number {
  const diff = side === 'BUY' ? exit - entry : entry - exit;
  const perPoint = getDollarPerPointPerLot(symbol, exit);
  return Number((diff * lots * perPoint).toFixed(2));
}

export function calcPips(
  symbol: string,
  pipSize: number,
  side: 'BUY' | 'SELL',
  entry: number,
  exit: number,
): number {
  const diff = side === 'BUY' ? exit - entry : entry - exit;
  const divisor = symbol === 'XAUUSD' ? 0.1 : pipSize || 0.0001;
  return Number((diff / divisor).toFixed(1));
}

export function formatBarTimestamp(unixSec: number, timezone = 'UTC'): string {
  const d = new Date(unixSec * 1000);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
    return `${get('weekday')} ${get('day')} ${get('month')} '${get('year')} ${get('hour')}:${get('minute')}`;
  } catch {
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }
}

export function formatSimPrice(price: number, decimals: number): string {
  if (!Number.isFinite(price)) return '0.00';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function findNearestCandleIndex(candles: CandleBar[], targetTime: number): number {
  if (candles.length === 0) return -1;
  let lo = 0;
  let hi = candles.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid].time < targetTime) lo = mid + 1;
    else hi = mid;
  }
  if (
    lo > 0 &&
    Math.abs(candles[lo - 1].time - targetTime) < Math.abs(candles[lo].time - targetTime)
  ) {
    return lo - 1;
  }
  return lo;
}
