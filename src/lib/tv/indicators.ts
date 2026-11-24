import type {UTCTimestamp} from 'lightweight-charts';
import type {
  CandleBar,
  IndicatorDefinition,
  IndicatorId,
  IndicatorInstance,
  PriceSourceKey,
} from '../../components/tv/types';

export interface IndicatorPlotPoint {
  time: UTCTimestamp;
  value: number;
  color?: string;
}

export interface IndicatorPlotSeries {
  key: string;
  label: string;
  seriesType: 'line' | 'histogram';
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  data: IndicatorPlotPoint[];
}

export interface ComputedIndicatorOutput {
  instanceId: string;
  series: IndicatorPlotSeries[];
  referenceLines?: {value: number; color: string; title: string}[];
  latestSummary: string;
}

export const INDICATOR_DEFINITIONS: IndicatorDefinition[] = [
  // TREND
  {
    id: 'sma',
    name: 'Simple Moving Average (SMA)',
    shortName: 'SMA',
    category: 'Trend',
    placement: 'overlay',
    description: 'Arithmetic mean of selected price over N bars.',
    defaultInputs: {period: 20},
    defaultColors: ['#2962FF'],
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average (EMA)',
    shortName: 'EMA',
    category: 'Trend',
    placement: 'overlay',
    description: 'Exponentially weighted moving average emphasizing recent closes.',
    defaultInputs: {period: 50},
    defaultColors: ['#F59E0B'],
  },
  {
    id: 'wma',
    name: 'Weighted Moving Average (WMA)',
    shortName: 'WMA',
    category: 'Trend',
    placement: 'overlay',
    description: 'Linearly weighted moving average favoring newest bars.',
    defaultInputs: {period: 20},
    defaultColors: ['#EC4899'],
  },
  {
    id: 'hma',
    name: 'Hull Moving Average (HMA)',
    shortName: 'HMA',
    category: 'Trend',
    placement: 'overlay',
    description: 'Low-lag smoothed moving average using weighted square-root windows.',
    defaultInputs: {period: 21},
    defaultColors: ['#06B6D4'],
  },
  {
    id: 'vwap',
    name: 'VWAP (Cumulative)',
    shortName: 'VWAP',
    category: 'Trend',
    placement: 'overlay',
    description: 'Volume Weighted Average Price across loaded bars.',
    defaultInputs: {},
    defaultColors: ['#8B5CF6'],
  },
  {
    id: 'session_vwap',
    name: 'Session VWAP (Daily Reset)',
    shortName: 'Sess VWAP',
    category: 'Trend',
    placement: 'overlay',
    description: 'Volume Weighted Average Price resetting each UTC trading day.',
    defaultInputs: {},
    defaultColors: ['#0EA5E9'],
  },
  {
    id: 'supertrend',
    name: 'Supertrend',
    shortName: 'Supertrend',
    category: 'Trend',
    placement: 'overlay',
    description: 'ATR-based trend trailing stop & direction band.',
    defaultInputs: {period: 10, multiplier: 3},
    defaultColors: ['#089981', '#F23645'],
  },
  {
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    shortName: 'Ichimoku',
    category: 'Trend',
    placement: 'overlay',
    description: 'Tenkan-sen, Kijun-sen, Senkou Span A/B equilibrium cloud.',
    defaultInputs: {tenkan: 9, kijun: 26, senkouB: 52},
    defaultColors: ['#2962FF', '#F23645', '#089981', '#EF4444'],
  },
  {
    id: 'psar',
    name: 'Parabolic SAR',
    shortName: 'PSAR',
    category: 'Trend',
    placement: 'overlay',
    description: 'Stop-and-reverse parabolic trend acceleration indicator.',
    defaultInputs: {step: 0.02, maxStep: 0.2},
    defaultColors: ['#F59E0B'],
  },
  {
    id: 'adx',
    name: 'Average Directional Index (ADX)',
    shortName: 'ADX',
    category: 'Trend',
    placement: 'pane',
    description: 'Measures trend strength alongside +DI and -DI directional lines.',
    defaultInputs: {period: 14},
    defaultColors: ['#F59E0B', '#089981', '#F23645'],
  },

  // MOMENTUM
  {
    id: 'rsi',
    name: 'Relative Strength Index (RSI)',
    shortName: 'RSI',
    category: 'Momentum',
    placement: 'pane',
    description: "Wilder's 0–100 momentum oscillator with 70/30 zones.",
    defaultInputs: {period: 14, overbought: 70, oversold: 30},
    defaultColors: ['#7E57C2'],
  },
  {
    id: 'macd',
    name: 'MACD (12, 26, 9)',
    shortName: 'MACD',
    category: 'Momentum',
    placement: 'pane',
    description: 'Moving Average Convergence Divergence with Signal and Histogram.',
    defaultInputs: {fast: 12, slow: 26, signal: 9},
    defaultColors: ['#2962FF', '#F59E0B', '#089981'],
  },
  {
    id: 'stoch',
    name: 'Stochastic Oscillator',
    shortName: 'Stoch',
    category: 'Momentum',
    placement: 'pane',
    description: 'Fast %K and smoothed %D close location oscillator.',
    defaultInputs: {kPeriod: 14, smoothK: 3, dPeriod: 3},
    defaultColors: ['#2962FF', '#F59E0B'],
  },
  {
    id: 'stoch_rsi',
    name: 'Stochastic RSI',
    shortName: 'StochRSI',
    category: 'Momentum',
    placement: 'pane',
    description: 'Stochastic normalization applied to RSI readings.',
    defaultInputs: {rsiPeriod: 14, stochPeriod: 14, smoothK: 3, smoothD: 3},
    defaultColors: ['#0EA5E9', '#F23645'],
  },
  {
    id: 'cci',
    name: 'Commodity Channel Index (CCI)',
    shortName: 'CCI',
    category: 'Momentum',
    placement: 'pane',
    description: 'Statistical deviation of typical price from its SMA.',
    defaultInputs: {period: 20},
    defaultColors: ['#089981'],
  },
  {
    id: 'mom',
    name: 'Momentum (MOM)',
    shortName: 'MOM',
    category: 'Momentum',
    placement: 'pane',
    description: 'Net price change over N bars.',
    defaultInputs: {period: 10},
    defaultColors: ['#2962FF'],
  },
  {
    id: 'willr',
    name: 'Williams %R',
    shortName: 'Will %R',
    category: 'Momentum',
    placement: 'pane',
    description: 'Overbought/oversold range oscillator (-100 to 0).',
    defaultInputs: {period: 14},
    defaultColors: ['#EC4899'],
  },
  {
    id: 'roc',
    name: 'Rate of Change (ROC)',
    shortName: 'ROC',
    category: 'Momentum',
    placement: 'pane',
    description: 'Percentage change in price over N periods.',
    defaultInputs: {period: 12},
    defaultColors: ['#06B6D4'],
  },

  // VOLUME
  {
    id: 'volume',
    name: 'Volume',
    shortName: 'Vol',
    category: 'Volume',
    placement: 'pane',
    description: 'Color-coded bar volume histogram.',
    defaultInputs: {},
    defaultColors: ['#089981', '#F23645'],
  },
  {
    id: 'volume_sma',
    name: 'Volume + Volume SMA',
    shortName: 'Vol SMA',
    category: 'Volume',
    placement: 'pane',
    description: 'Volume histogram overlaid with its moving average.',
    defaultInputs: {period: 20},
    defaultColors: ['#089981', '#F59E0B'],
  },
  {
    id: 'obv',
    name: 'On-Balance Volume (OBV)',
    shortName: 'OBV',
    category: 'Volume',
    placement: 'pane',
    description: 'Cumulative directional volume flow.',
    defaultInputs: {},
    defaultColors: ['#2962FF'],
  },
  {
    id: 'mfi',
    name: 'Money Flow Index (MFI)',
    shortName: 'MFI',
    category: 'Volume',
    placement: 'pane',
    description: 'Volume-weighted RSI measuring buying/selling pressure.',
    defaultInputs: {period: 14},
    defaultColors: ['#8B5CF6'],
  },
  {
    id: 'ad_line',
    name: 'Accumulation / Distribution (A/D)',
    shortName: 'A/D',
    category: 'Volume',
    placement: 'pane',
    description: 'Close-location-weighted cumulative volume flow.',
    defaultInputs: {},
    defaultColors: ['#0EA5E9'],
  },
  {
    id: 'cmf',
    name: 'Chaikin Money Flow (CMF)',
    shortName: 'CMF',
    category: 'Volume',
    placement: 'pane',
    description: 'Rolling N-period money flow volume oscillator (-1 to +1).',
    defaultInputs: {period: 20},
    defaultColors: ['#089981'],
  },
  {
    id: 'vol_profile',
    name: 'Volume Profile (POC / Value Area)',
    shortName: 'VPVR POC',
    category: 'Volume',
    placement: 'overlay',
    description: 'Rolling Point of Control & Value Area high/low levels.',
    defaultInputs: {bins: 24, lookback: 120},
    defaultColors: ['#F59E0B', '#2962FF', '#64748B'],
  },

  // VOLATILITY
  {
    id: 'bb',
    name: 'Bollinger Bands (BB)',
    shortName: 'BB',
    category: 'Volatility',
    placement: 'overlay',
    description: 'SMA basis with upper and lower standard deviation bands.',
    defaultInputs: {period: 20, mult: 2},
    defaultColors: ['#2962FF', '#F59E0B', '#2962FF'],
  },
  {
    id: 'atr',
    name: 'Average True Range (ATR)',
    shortName: 'ATR',
    category: 'Volatility',
    placement: 'pane',
    description: "Wilder's Average True Range volatility gauge.",
    defaultInputs: {period: 14},
    defaultColors: ['#F23645'],
  },
  {
    id: 'keltner',
    name: 'Keltner Channels (KC)',
    shortName: 'KC',
    category: 'Volatility',
    placement: 'overlay',
    description: 'EMA basis enveloped by ATR volatility bands.',
    defaultInputs: {period: 20, mult: 2},
    defaultColors: ['#0EA5E9', '#64748B', '#0EA5E9'],
  },
  {
    id: 'donchian',
    name: 'Donchian Channels (DC)',
    shortName: 'DC',
    category: 'Volatility',
    placement: 'overlay',
    description: 'N-period highest high, lowest low, and mid-channel.',
    defaultInputs: {period: 20},
    defaultColors: ['#089981', '#94A3B8', '#F23645'],
  },
  {
    id: 'stddev',
    name: 'Standard Deviation (StdDev)',
    shortName: 'StdDev',
    category: 'Volatility',
    placement: 'pane',
    description: 'Rolling population standard deviation of price.',
    defaultInputs: {period: 20},
    defaultColors: ['#EC4899'],
  },

  // OTHER
  {
    id: 'pivots',
    name: 'Pivot Points Standard (PP / R1 / S1)',
    shortName: 'Pivots',
    category: 'Other',
    placement: 'overlay',
    description: 'Classic Floor Trader Pivot, R1, and S1 levels from prior session.',
    defaultInputs: {},
    defaultColors: ['#F59E0B', '#089981', '#F23645'],
  },
  {
    id: 'auto_fib',
    name: 'Auto Fibonacci Swing Levels',
    shortName: 'Auto Fib',
    category: 'Other',
    placement: 'overlay',
    description: 'Dynamic 0.382, 0.5, and 0.618 retracement tracks over rolling swing.',
    defaultInputs: {lookback: 60},
    defaultColors: ['#F59E0B', '#089981', '#2962FF'],
  },
  {
    id: 'price_channel',
    name: 'Price Channels (Envelope %)',
    shortName: 'Envelope',
    category: 'Other',
    placement: 'overlay',
    description: 'Percentage envelope bands around a moving average.',
    defaultInputs: {period: 20, pct: 1.5},
    defaultColors: ['#8B5CF6', '#64748B', '#8B5CF6'],
  },
];

export function createIndicatorInstance(
  indicatorId: IndicatorId,
  overrides?: Partial<IndicatorInstance>,
): IndicatorInstance {
  const def = INDICATOR_DEFINITIONS.find((d) => d.id === indicatorId) || INDICATOR_DEFINITIONS[0];
  return {
    uid: `ind_${indicatorId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    indicatorId: def.id,
    name: def.name,
    category: def.category,
    placement: def.placement,
    visible: true,
    collapsed: false,
    expanded: false,
    paneHeight: 136,
    source: 'close',
    inputs: {...def.defaultInputs},
    colors: [...def.defaultColors],
    lineWidth: 2,
    ...overrides,
  };
}

export function extractSourceSeries(candles: CandleBar[], source: PriceSourceKey): number[] {
  return candles.map((c) => {
    switch (source) {
      case 'open':
        return c.open;
      case 'high':
        return c.high;
      case 'low':
        return c.low;
      case 'hl2':
        return (c.high + c.low) / 2;
      case 'hlc3':
        return (c.high + c.low + c.close) / 3;
      case 'ohlc4':
        return (c.open + c.high + c.low + c.close) / 4;
      default:
        return c.close;
    }
  });
}

function calcSmaArr(values: number[], period: number): (number | null)[] {
  const p = Math.max(1, Math.round(period));
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= p) sum -= values[i - p];
    if (i >= p - 1) out[i] = sum / p;
  }
  return out;
}

function calcEmaArr(values: number[], period: number): (number | null)[] {
  const p = Math.max(1, Math.round(period));
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < p) return out;
  let sum = 0;
  for (let i = 0; i < p; i++) sum += values[i];
  let ema = sum / p;
  out[p - 1] = ema;
  const k = 2 / (p + 1);
  for (let i = p; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

function calcWmaArr(values: number[], period: number): (number | null)[] {
  const p = Math.max(1, Math.round(period));
  const out: (number | null)[] = new Array(values.length).fill(null);
  const denom = (p * (p + 1)) / 2;
  for (let i = p - 1; i < values.length; i++) {
    let num = 0;
    for (let j = 0; j < p; j++) {
      num += values[i - p + 1 + j] * (j + 1);
    }
    out[i] = num / denom;
  }
  return out;
}

function calcAtrArr(candles: CandleBar[], period: number): (number | null)[] {
  const p = Math.max(1, Math.round(period));
  const out: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length === 0) return out;
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      trs.push(c.high - c.low);
    } else {
      const prevC = candles[i - 1].close;
      trs.push(Math.max(c.high - c.low, Math.abs(c.high - prevC), Math.abs(c.low - prevC)));
    }
  }
  if (trs.length < p) return out;
  let sum = 0;
  for (let i = 0; i < p; i++) sum += trs[i];
  let atr = sum / p;
  out[p - 1] = atr;
  for (let i = p; i < trs.length; i++) {
    atr = (atr * (p - 1) + trs[i]) / p;
    out[i] = atr;
  }
  return out;
}

function toPlotPoints(
  candles: CandleBar[],
  arr: (number | null)[],
): IndicatorPlotPoint[] {
  const pts: IndicatorPlotPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const v = arr[i];
    if (v !== null && Number.isFinite(v)) {
      pts.push({time: candles[i].time as UTCTimestamp, value: v});
    }
  }
  return pts;
}

function formatLast(pts: IndicatorPlotPoint[], decimals = 2): string {
  if (pts.length === 0) return '—';
  return pts[pts.length - 1].value.toFixed(decimals);
}

/**
 * Compute all series for an IndicatorInstance strictly using `candles` (zero look-ahead bias).
 */
export function computeIndicator(
  candles: CandleBar[],
  inst: IndicatorInstance,
  priceDecimals = 2,
): ComputedIndicatorOutput {
  if (candles.length === 0) {
    return {instanceId: inst.uid, series: [], latestSummary: '—'};
  }

  const src = extractSourceSeries(candles, inst.source);
  const c0 = inst.colors[0] || '#2962FF';
  const c1 = inst.colors[1] || '#F59E0B';
  const c2 = inst.colors[2] || '#089981';
  const c3 = inst.colors[3] || '#EF4444';
  const lw = inst.lineWidth || 2;
  const numInput = (k: string, def: number) => {
    const n = Number(inst.inputs[k]);
    return Number.isFinite(n) ? n : def;
  };

  switch (inst.indicatorId) {
    case 'sma': {
      const p = numInput('period', 20);
      const data = toPlotPoints(candles, calcSmaArr(src, p));
      return {
        instanceId: inst.uid,
        series: [{key: 'sma', label: `SMA(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data}],
        latestSummary: formatLast(data, priceDecimals),
      };
    }

    case 'ema': {
      const p = numInput('period', 50);
      const data = toPlotPoints(candles, calcEmaArr(src, p));
      return {
        instanceId: inst.uid,
        series: [{key: 'ema', label: `EMA(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data}],
        latestSummary: formatLast(data, priceDecimals),
      };
    }

    case 'wma': {
      const p = numInput('period', 20);
      const data = toPlotPoints(candles, calcWmaArr(src, p));
      return {
        instanceId: inst.uid,
        series: [{key: 'wma', label: `WMA(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data}],
        latestSummary: formatLast(data, priceDecimals),
      };
    }

    case 'hma': {
      const p = Math.max(2, Math.round(numInput('period', 21)));
      const half = Math.max(1, Math.floor(p / 2));
      const sqrtP = Math.max(1, Math.round(Math.sqrt(p)));
      const wHalf = calcWmaArr(src, half);
      const wFull = calcWmaArr(src, p);
      const diff: number[] = [];
      const diffIndices: number[] = [];
      for (let i = 0; i < src.length; i++) {
        if (wHalf[i] !== null && wFull[i] !== null) {
          diff.push(2 * (wHalf[i] as number) - (wFull[i] as number));
          diffIndices.push(i);
        }
      }
      const wSqrt = calcWmaArr(diff, sqrtP);
      const out: (number | null)[] = new Array(src.length).fill(null);
      for (let k = 0; k < wSqrt.length; k++) {
        if (wSqrt[k] !== null) out[diffIndices[k]] = wSqrt[k];
      }
      const data = toPlotPoints(candles, out);
      return {
        instanceId: inst.uid,
        series: [{key: 'hma', label: `HMA(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data}],
        latestSummary: formatLast(data, priceDecimals),
      };
    }

    case 'vwap':
    case 'session_vwap': {
      const isSess = inst.indicatorId === 'session_vwap';
      let cumPV = 0;
      let cumV = 0;
      let prevDay = -1;
      const pts: IndicatorPlotPoint[] = [];
      for (const c of candles) {
        const day = Math.floor(c.time / 86400);
        if (isSess && day !== prevDay) {
          cumPV = 0;
          cumV = 0;
          prevDay = day;
        }
        const tp = (c.high + c.low + c.close) / 3;
        const v = Math.max(c.volume, 1);
        cumPV += tp * v;
        cumV += v;
        pts.push({time: c.time as UTCTimestamp, value: cumPV / cumV});
      }
      return {
        instanceId: inst.uid,
        series: [
          {
            key: inst.indicatorId,
            label: isSess ? 'Sess VWAP' : 'VWAP',
            seriesType: 'line',
            color: c0,
            lineWidth: lw,
            lineStyle: 'solid',
            data: pts,
          },
        ],
        latestSummary: formatLast(pts, priceDecimals),
      };
    }

    case 'supertrend': {
      const p = numInput('period', 10);
      const mult = numInput('multiplier', 3);
      const atr = calcAtrArr(candles, p);
      const upPts: IndicatorPlotPoint[] = [];
      const dnPts: IndicatorPlotPoint[] = [];
      let upperBand = 0;
      let lowerBand = 0;
      let trendUp = true;

      for (let i = 0; i < candles.length; i++) {
        const a = atr[i];
        if (a === null) continue;
        const hl2 = (candles[i].high + candles[i].low) / 2;
        const basicUpper = hl2 + mult * a;
        const basicLower = hl2 - mult * a;
        if (upPts.length === 0 && dnPts.length === 0) {
          upperBand = basicUpper;
          lowerBand = basicLower;
          trendUp = candles[i].close >= hl2;
        } else {
          const prevClose = candles[i - 1].close;
          upperBand = basicUpper < upperBand || prevClose > upperBand ? basicUpper : upperBand;
          lowerBand = basicLower > lowerBand || prevClose < lowerBand ? basicLower : lowerBand;
          if (trendUp && candles[i].close < lowerBand) trendUp = false;
          else if (!trendUp && candles[i].close > upperBand) trendUp = true;
        }
        if (trendUp) {
          upPts.push({time: candles[i].time as UTCTimestamp, value: lowerBand});
        } else {
          dnPts.push({time: candles[i].time as UTCTimestamp, value: upperBand});
        }
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'st_up', label: 'Supertrend Bull', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: upPts},
          {key: 'st_dn', label: 'Supertrend Bear', seriesType: 'line', color: c1, lineWidth: lw, lineStyle: 'solid', data: dnPts},
        ],
        latestSummary: upPts.length > 0 && (dnPts.length === 0 || upPts[upPts.length - 1].time >= dnPts[dnPts.length - 1].time)
          ? `Bull ${formatLast(upPts, priceDecimals)}`
          : `Bear ${formatLast(dnPts, priceDecimals)}`,
      };
    }

    case 'ichimoku': {
      const tP = Math.max(1, Math.round(numInput('tenkan', 9)));
      const kP = Math.max(1, Math.round(numInput('kijun', 26)));
      const bP = Math.max(1, Math.round(numInput('senkouB', 52)));
      const midHL = (idx: number, len: number) => {
        if (idx < len - 1) return null;
        let hi = -Infinity;
        let lo = Infinity;
        for (let j = idx - len + 1; j <= idx; j++) {
          if (candles[j].high > hi) hi = candles[j].high;
          if (candles[j].low < lo) lo = candles[j].low;
        }
        return (hi + lo) / 2;
      };
      const tenkan: (number | null)[] = [];
      const kijun: (number | null)[] = [];
      const spanA: (number | null)[] = [];
      const spanB: (number | null)[] = [];
      for (let i = 0; i < candles.length; i++) {
        const t = midHL(i, tP);
        const k = midHL(i, kP);
        const sb = midHL(i, bP);
        tenkan.push(t);
        kijun.push(k);
        spanA.push(t !== null && k !== null ? (t + k) / 2 : null);
        spanB.push(sb);
      }
      const td = toPlotPoints(candles, tenkan);
      const kd = toPlotPoints(candles, kijun);
      const sa = toPlotPoints(candles, spanA);
      const sb = toPlotPoints(candles, spanB);
      return {
        instanceId: inst.uid,
        series: [
          {key: 'tenkan', label: 'Tenkan', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'solid', data: td},
          {key: 'kijun', label: 'Kijun', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: kd},
          {key: 'spanA', label: 'Span A', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'dashed', data: sa},
          {key: 'spanB', label: 'Span B', seriesType: 'line', color: c3, lineWidth: 1, lineStyle: 'dashed', data: sb},
        ],
        latestSummary: `${formatLast(td, priceDecimals)} / ${formatLast(kd, priceDecimals)}`,
      };
    }

    case 'psar': {
      const step = Math.max(0.005, numInput('step', 0.02));
      const maxAf = Math.max(step, numInput('maxStep', 0.2));
      const pts: IndicatorPlotPoint[] = [];
      if (candles.length >= 2) {
        let isUp = candles[1].close >= candles[0].close;
        let af = step;
        let ep = isUp ? candles[0].high : candles[0].low;
        let sar = isUp ? candles[0].low : candles[0].high;
        for (let i = 1; i < candles.length; i++) {
          const c = candles[i];
          sar = sar + af * (ep - sar);
          if (isUp) {
            if (c.low < sar) {
              isUp = false;
              sar = ep;
              ep = c.low;
              af = step;
            } else {
              if (c.high > ep) {
                ep = c.high;
                af = Math.min(maxAf, af + step);
              }
            }
          } else {
            if (c.high > sar) {
              isUp = true;
              sar = ep;
              ep = c.high;
              af = step;
            } else {
              if (c.low < ep) {
                ep = c.low;
                af = Math.min(maxAf, af + step);
              }
            }
          }
          pts.push({
            time: c.time as UTCTimestamp,
            value: sar,
            color: isUp ? '#089981' : '#F23645',
          });
        }
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'psar', label: 'PSAR', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'dotted', data: pts}],
        latestSummary: formatLast(pts, priceDecimals),
      };
    }

    case 'adx': {
      const p = Math.max(2, Math.round(numInput('period', 14)));
      const plusPts: IndicatorPlotPoint[] = [];
      const minusPts: IndicatorPlotPoint[] = [];
      const adxPts: IndicatorPlotPoint[] = [];
      if (candles.length > p * 2) {
        const tr: number[] = [0];
        const dmP: number[] = [0];
        const dmM: number[] = [0];
        for (let i = 1; i < candles.length; i++) {
          const hDiff = candles[i].high - candles[i - 1].high;
          const lDiff = candles[i - 1].low - candles[i].low;
          dmP.push(hDiff > lDiff && hDiff > 0 ? hDiff : 0);
          dmM.push(lDiff > hDiff && lDiff > 0 ? lDiff : 0);
          tr.push(
            Math.max(
              candles[i].high - candles[i].low,
              Math.abs(candles[i].high - candles[i - 1].close),
              Math.abs(candles[i].low - candles[i - 1].close),
            ),
          );
        }
        let sTr = 0;
        let sDmP = 0;
        let sDmM = 0;
        for (let i = 1; i <= p; i++) {
          sTr += tr[i];
          sDmP += dmP[i];
          sDmM += dmM[i];
        }
        const dxArr: {idx: number; dx: number}[] = [];
        for (let i = p; i < candles.length; i++) {
          if (i > p) {
            sTr = sTr - sTr / p + tr[i];
            sDmP = sDmP - sDmP / p + dmP[i];
            sDmM = sDmM - sDmM / p + dmM[i];
          }
          const pdi = sTr > 0 ? (100 * sDmP) / sTr : 0;
          const mdi = sTr > 0 ? (100 * sDmM) / sTr : 0;
          const t = candles[i].time as UTCTimestamp;
          plusPts.push({time: t, value: pdi});
          minusPts.push({time: t, value: mdi});
          const sumDi = pdi + mdi;
          dxArr.push({idx: i, dx: sumDi > 0 ? (100 * Math.abs(pdi - mdi)) / sumDi : 0});
        }
        if (dxArr.length >= p) {
          let adx = dxArr.slice(0, p).reduce((a, b) => a + b.dx, 0) / p;
          adxPts.push({time: candles[dxArr[p - 1].idx].time as UTCTimestamp, value: adx});
          for (let j = p; j < dxArr.length; j++) {
            adx = (adx * (p - 1) + dxArr[j].dx) / p;
            adxPts.push({time: candles[dxArr[j].idx].time as UTCTimestamp, value: adx});
          }
        }
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'adx', label: 'ADX', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: adxPts},
          {key: 'pdi', label: '+DI', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: plusPts},
          {key: 'mdi', label: '-DI', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'solid', data: minusPts},
        ],
        referenceLines: [{value: 25, color: 'rgba(148,163,184,0.45)', title: '25'}],
        latestSummary: formatLast(adxPts, 1),
      };
    }

    case 'rsi': {
      const p = Math.max(2, Math.round(numInput('period', 14)));
      const ob = numInput('overbought', 70);
      const os = numInput('oversold', 30);
      const pts: IndicatorPlotPoint[] = [];
      if (src.length > p) {
        let g = 0;
        let l = 0;
        for (let i = 1; i <= p; i++) {
          const d = src[i] - src[i - 1];
          if (d >= 0) g += d;
          else l -= d;
        }
        let avgG = g / p;
        let avgL = l / p;
        pts.push({
          time: candles[p].time as UTCTimestamp,
          value: avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL),
        });
        for (let i = p + 1; i < src.length; i++) {
          const d = src[i] - src[i - 1];
          avgG = (avgG * (p - 1) + (d > 0 ? d : 0)) / p;
          avgL = (avgL * (p - 1) + (d < 0 ? -d : 0)) / p;
          pts.push({
            time: candles[i].time as UTCTimestamp,
            value: avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL),
          });
        }
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'rsi', label: `RSI(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [
          {value: ob, color: 'rgba(242,54,69,0.55)', title: String(ob)},
          {value: os, color: 'rgba(8,153,129,0.55)', title: String(os)},
        ],
        latestSummary: formatLast(pts, 1),
      };
    }

    case 'macd': {
      const fastP = Math.max(2, Math.round(numInput('fast', 12)));
      const slowP = Math.max(fastP + 1, Math.round(numInput('slow', 26)));
      const sigP = Math.max(2, Math.round(numInput('signal', 9)));
      const fastE = calcEmaArr(src, fastP);
      const slowE = calcEmaArr(src, slowP);
      const macdArr: number[] = [];
      const macdIdx: number[] = [];
      for (let i = 0; i < src.length; i++) {
        if (fastE[i] !== null && slowE[i] !== null) {
          macdArr.push((fastE[i] as number) - (slowE[i] as number));
          macdIdx.push(i);
        }
      }
      const sigArr = calcEmaArr(macdArr, sigP);
      const macdPts: IndicatorPlotPoint[] = [];
      const sigPts: IndicatorPlotPoint[] = [];
      const histPts: IndicatorPlotPoint[] = [];
      for (let k = 0; k < macdArr.length; k++) {
        const t = candles[macdIdx[k]].time as UTCTimestamp;
        macdPts.push({time: t, value: macdArr[k]});
        const sVal = sigArr[k];
        if (sVal !== null) {
          sigPts.push({time: t, value: sVal});
          const h = macdArr[k] - sVal;
          histPts.push({
            time: t,
            value: h,
            color: h >= 0 ? 'rgba(8, 153, 129, 0.55)' : 'rgba(242, 54, 69, 0.55)',
          });
        }
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'hist', label: 'Histogram', seriesType: 'histogram', color: c2, lineWidth: 1, lineStyle: 'solid', data: histPts},
          {key: 'macd', label: 'MACD', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: macdPts},
          {key: 'signal', label: 'Signal', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: sigPts},
        ],
        referenceLines: [{value: 0, color: 'rgba(148,163,184,0.4)', title: '0'}],
        latestSummary: formatLast(macdPts, priceDecimals),
      };
    }

    case 'stoch': {
      const kP = Math.max(2, Math.round(numInput('kPeriod', 14)));
      const sK = Math.max(1, Math.round(numInput('smoothK', 3)));
      const dP = Math.max(1, Math.round(numInput('dPeriod', 3)));
      const rawK: (number | null)[] = new Array(candles.length).fill(null);
      for (let i = kP - 1; i < candles.length; i++) {
        let hi = -Infinity;
        let lo = Infinity;
        for (let j = i - kP + 1; j <= i; j++) {
          if (candles[j].high > hi) hi = candles[j].high;
          if (candles[j].low < lo) lo = candles[j].low;
        }
        rawK[i] = hi === lo ? 50 : ((candles[i].close - lo) / (hi - lo)) * 100;
      }
      const validRaw = rawK.filter((v): v is number => v !== null);
      const validIdx = rawK.map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0);
      const kSmoothed = calcSmaArr(validRaw, sK);
      const kVals = kSmoothed.filter((v): v is number => v !== null);
      const kIndices = kSmoothed.map((v, i) => (v !== null ? validIdx[i] : -1)).filter((i) => i >= 0);
      const dSmoothed = calcSmaArr(kVals, dP);

      const kPts = kVals.map((v, i) => ({time: candles[kIndices[i]].time as UTCTimestamp, value: v}));
      const dPts: IndicatorPlotPoint[] = [];
      for (let i = 0; i < dSmoothed.length; i++) {
        if (dSmoothed[i] !== null) {
          dPts.push({time: candles[kIndices[i]].time as UTCTimestamp, value: dSmoothed[i] as number});
        }
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'k', label: '%K', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: kPts},
          {key: 'd', label: '%D', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: dPts},
        ],
        referenceLines: [
          {value: 80, color: 'rgba(242,54,69,0.45)', title: '80'},
          {value: 20, color: 'rgba(8,153,129,0.45)', title: '20'},
        ],
        latestSummary: `${formatLast(kPts, 1)} / ${formatLast(dPts, 1)}`,
      };
    }

    case 'stoch_rsi': {
      const rP = Math.max(2, Math.round(numInput('rsiPeriod', 14)));
      const sP = Math.max(2, Math.round(numInput('stochPeriod', 14)));
      const rsiOut = computeIndicator(candles, createIndicatorInstance('rsi', {inputs: {period: rP}}));
      const rsiPts = rsiOut.series[0]?.data || [];
      const kPts: IndicatorPlotPoint[] = [];
      for (let i = sP - 1; i < rsiPts.length; i++) {
        let hi = -Infinity;
        let lo = Infinity;
        for (let j = i - sP + 1; j <= i; j++) {
          if (rsiPts[j].value > hi) hi = rsiPts[j].value;
          if (rsiPts[j].value < lo) lo = rsiPts[j].value;
        }
        kPts.push({
          time: rsiPts[i].time,
          value: hi === lo ? 50 : ((rsiPts[i].value - lo) / (hi - lo)) * 100,
        });
      }
      const dVals = calcSmaArr(kPts.map((x) => x.value), 3);
      const dPts: IndicatorPlotPoint[] = [];
      for (let i = 0; i < dVals.length; i++) {
        if (dVals[i] !== null) dPts.push({time: kPts[i].time, value: dVals[i] as number});
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'sk', label: 'StochRSI K', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: kPts},
          {key: 'sd', label: 'StochRSI D', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: dPts},
        ],
        referenceLines: [
          {value: 80, color: 'rgba(242,54,69,0.45)', title: '80'},
          {value: 20, color: 'rgba(8,153,129,0.45)', title: '20'},
        ],
        latestSummary: formatLast(kPts, 1),
      };
    }

    case 'cci': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const tp = candles.map((c) => (c.high + c.low + c.close) / 3);
      const sma = calcSmaArr(tp, p);
      const pts: IndicatorPlotPoint[] = [];
      for (let i = p - 1; i < tp.length; i++) {
        const m = sma[i] as number;
        let md = 0;
        for (let j = i - p + 1; j <= i; j++) md += Math.abs(tp[j] - m);
        md /= p;
        pts.push({time: candles[i].time as UTCTimestamp, value: md === 0 ? 0 : (tp[i] - m) / (0.015 * md)});
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'cci', label: `CCI(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [
          {value: 100, color: 'rgba(242,54,69,0.45)', title: '+100'},
          {value: -100, color: 'rgba(8,153,129,0.45)', title: '-100'},
        ],
        latestSummary: formatLast(pts, 1),
      };
    }

    case 'mom': {
      const p = Math.max(1, Math.round(numInput('period', 10)));
      const pts: IndicatorPlotPoint[] = [];
      for (let i = p; i < src.length; i++) {
        pts.push({time: candles[i].time as UTCTimestamp, value: src[i] - src[i - p]});
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'mom', label: `MOM(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [{value: 0, color: 'rgba(148,163,184,0.4)', title: '0'}],
        latestSummary: formatLast(pts, priceDecimals),
      };
    }

    case 'willr': {
      const p = Math.max(2, Math.round(numInput('period', 14)));
      const pts: IndicatorPlotPoint[] = [];
      for (let i = p - 1; i < candles.length; i++) {
        let hi = -Infinity;
        let lo = Infinity;
        for (let j = i - p + 1; j <= i; j++) {
          if (candles[j].high > hi) hi = candles[j].high;
          if (candles[j].low < lo) lo = candles[j].low;
        }
        pts.push({
          time: candles[i].time as UTCTimestamp,
          value: hi === lo ? -50 : ((hi - candles[i].close) / (hi - lo)) * -100,
        });
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'willr', label: `%R(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [
          {value: -20, color: 'rgba(242,54,69,0.45)', title: '-20'},
          {value: -80, color: 'rgba(8,153,129,0.45)', title: '-80'},
        ],
        latestSummary: formatLast(pts, 1),
      };
    }

    case 'roc': {
      const p = Math.max(1, Math.round(numInput('period', 12)));
      const pts: IndicatorPlotPoint[] = [];
      for (let i = p; i < src.length; i++) {
        const prev = src[i - p];
        pts.push({time: candles[i].time as UTCTimestamp, value: prev !== 0 ? ((src[i] - prev) / prev) * 100 : 0});
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'roc', label: `ROC(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [{value: 0, color: 'rgba(148,163,184,0.4)', title: '0%'}],
        latestSummary: `${formatLast(pts, 2)}%`,
      };
    }

    case 'volume':
    case 'volume_sma': {
      const volPts: IndicatorPlotPoint[] = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(8, 153, 129, 0.55)' : 'rgba(242, 54, 69, 0.55)',
      }));
      const series: IndicatorPlotSeries[] = [
        {key: 'vol', label: 'Volume', seriesType: 'histogram', color: c0, lineWidth: 1, lineStyle: 'solid', data: volPts},
      ];
      if (inst.indicatorId === 'volume_sma') {
        const p = numInput('period', 20);
        const smaPts = toPlotPoints(candles, calcSmaArr(candles.map((c) => c.volume), p));
        series.push({key: 'vsma', label: `Vol SMA(${p})`, seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: smaPts});
      }
      const lastV = candles[candles.length - 1]?.volume ?? 0;
      return {
        instanceId: inst.uid,
        series,
        latestSummary: lastV >= 1000 ? `${(lastV / 1000).toFixed(1)}K` : String(lastV),
      };
    }

    case 'obv': {
      let obv = 0;
      const pts: IndicatorPlotPoint[] = candles.map((c, i) => {
        if (i > 0) {
          if (c.close > candles[i - 1].close) obv += c.volume;
          else if (c.close < candles[i - 1].close) obv -= c.volume;
        }
        return {time: c.time as UTCTimestamp, value: obv};
      });
      return {
        instanceId: inst.uid,
        series: [{key: 'obv', label: 'OBV', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        latestSummary: formatLast(pts, 0),
      };
    }

    case 'mfi': {
      const p = Math.max(2, Math.round(numInput('period', 14)));
      const pts: IndicatorPlotPoint[] = [];
      const tp = candles.map((c) => (c.high + c.low + c.close) / 3);
      for (let i = p; i < candles.length; i++) {
        let posFlow = 0;
        let negFlow = 0;
        for (let j = i - p + 1; j <= i; j++) {
          const mf = tp[j] * Math.max(candles[j].volume, 1);
          if (tp[j] >= tp[j - 1]) posFlow += mf;
          else negFlow += mf;
        }
        const mfr = negFlow === 0 ? 100 : posFlow / negFlow;
        pts.push({time: candles[i].time as UTCTimestamp, value: negFlow === 0 ? 100 : 100 - 100 / (1 + mfr)});
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'mfi', label: `MFI(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [
          {value: 80, color: 'rgba(242,54,69,0.45)', title: '80'},
          {value: 20, color: 'rgba(8,153,129,0.45)', title: '20'},
        ],
        latestSummary: formatLast(pts, 1),
      };
    }

    case 'ad_line': {
      let ad = 0;
      const pts: IndicatorPlotPoint[] = candles.map((c) => {
        const hl = c.high - c.low;
        const mfm = hl > 0 ? ((c.close - c.low) - (c.high - c.close)) / hl : 0;
        ad += mfm * Math.max(c.volume, 1);
        return {time: c.time as UTCTimestamp, value: ad};
      });
      return {
        instanceId: inst.uid,
        series: [{key: 'ad', label: 'A/D Line', seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        latestSummary: formatLast(pts, 0),
      };
    }

    case 'cmf': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const pts: IndicatorPlotPoint[] = [];
      for (let i = p - 1; i < candles.length; i++) {
        let mfvSum = 0;
        let volSum = 0;
        for (let j = i - p + 1; j <= i; j++) {
          const c = candles[j];
          const hl = c.high - c.low;
          const mfm = hl > 0 ? ((c.close - c.low) - (c.high - c.close)) / hl : 0;
          const v = Math.max(c.volume, 1);
          mfvSum += mfm * v;
          volSum += v;
        }
        pts.push({time: candles[i].time as UTCTimestamp, value: volSum > 0 ? mfvSum / volSum : 0});
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'cmf', label: `CMF(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        referenceLines: [{value: 0, color: 'rgba(148,163,184,0.4)', title: '0'}],
        latestSummary: formatLast(pts, 3),
      };
    }

    case 'vol_profile': {
      const binsCount = Math.max(8, Math.round(numInput('bins', 24)));
      const lookback = Math.max(20, Math.round(numInput('lookback', 120)));
      const slice = candles.slice(-lookback);
      let hi = -Infinity;
      let lo = Infinity;
      for (const c of slice) {
        if (c.high > hi) hi = c.high;
        if (c.low < lo) lo = c.low;
      }
      const step = Math.max((hi - lo) / binsCount, 1e-6);
      const bins = new Array(binsCount).fill(0);
      for (const c of slice) {
        const idx = Math.min(binsCount - 1, Math.max(0, Math.floor((c.close - lo) / step)));
        bins[idx] += Math.max(c.volume, 1);
      }
      let pocIdx = 0;
      for (let i = 1; i < bins.length; i++) {
        if (bins[i] > bins[pocIdx]) pocIdx = i;
      }
      const pocPrice = lo + (pocIdx + 0.5) * step;
      const vahPrice = lo + Math.min(binsCount, pocIdx + Math.round(binsCount * 0.18)) * step;
      const valPrice = lo + Math.max(0, pocIdx - Math.round(binsCount * 0.18)) * step;
      const pocPts = slice.map((c) => ({time: c.time as UTCTimestamp, value: pocPrice}));
      const vahPts = slice.map((c) => ({time: c.time as UTCTimestamp, value: vahPrice}));
      const valPts = slice.map((c) => ({time: c.time as UTCTimestamp, value: valPrice}));
      return {
        instanceId: inst.uid,
        series: [
          {key: 'poc', label: 'POC', seriesType: 'line', color: c0, lineWidth: 2, lineStyle: 'solid', data: pocPts},
          {key: 'vah', label: 'VAH', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'dashed', data: vahPts},
          {key: 'val', label: 'VAL', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'dashed', data: valPts},
        ],
        latestSummary: `POC ${pocPrice.toFixed(priceDecimals)}`,
      };
    }

    case 'bb': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const mult = numInput('mult', 2);
      const upper: IndicatorPlotPoint[] = [];
      const basis: IndicatorPlotPoint[] = [];
      const lower: IndicatorPlotPoint[] = [];
      for (let i = p - 1; i < src.length; i++) {
        let sum = 0;
        for (let j = i - p + 1; j <= i; j++) sum += src[j];
        const mean = sum / p;
        let sq = 0;
        for (let j = i - p + 1; j <= i; j++) sq += (src[j] - mean) ** 2;
        const sd = Math.sqrt(sq / p);
        const t = candles[i].time as UTCTimestamp;
        upper.push({time: t, value: mean + mult * sd});
        basis.push({time: t, value: mean});
        lower.push({time: t, value: mean - mult * sd});
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'bb_up', label: 'BB Upper', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'dashed', data: upper},
          {key: 'bb_mid', label: 'BB Basis', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: basis},
          {key: 'bb_low', label: 'BB Lower', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'dashed', data: lower},
        ],
        latestSummary: `${formatLast(basis, priceDecimals)}`,
      };
    }

    case 'atr': {
      const p = Math.max(2, Math.round(numInput('period', 14)));
      const data = toPlotPoints(candles, calcAtrArr(candles, p));
      return {
        instanceId: inst.uid,
        series: [{key: 'atr', label: `ATR(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data}],
        latestSummary: formatLast(data, priceDecimals),
      };
    }

    case 'keltner': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const mult = numInput('mult', 2);
      const ema = calcEmaArr(src, p);
      const atr = calcAtrArr(candles, p);
      const up: IndicatorPlotPoint[] = [];
      const mid: IndicatorPlotPoint[] = [];
      const low: IndicatorPlotPoint[] = [];
      for (let i = 0; i < candles.length; i++) {
        if (ema[i] !== null && atr[i] !== null) {
          const t = candles[i].time as UTCTimestamp;
          mid.push({time: t, value: ema[i] as number});
          up.push({time: t, value: (ema[i] as number) + mult * (atr[i] as number)});
          low.push({time: t, value: (ema[i] as number) - mult * (atr[i] as number)});
        }
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'kc_up', label: 'KC Upper', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'dashed', data: up},
          {key: 'kc_mid', label: 'KC Mid', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: mid},
          {key: 'kc_low', label: 'KC Lower', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'dashed', data: low},
        ],
        latestSummary: formatLast(mid, priceDecimals),
      };
    }

    case 'donchian': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const up: IndicatorPlotPoint[] = [];
      const mid: IndicatorPlotPoint[] = [];
      const low: IndicatorPlotPoint[] = [];
      for (let i = p - 1; i < candles.length; i++) {
        let hi = -Infinity;
        let lo = Infinity;
        for (let j = i - p + 1; j <= i; j++) {
          if (candles[j].high > hi) hi = candles[j].high;
          if (candles[j].low < lo) lo = candles[j].low;
        }
        const t = candles[i].time as UTCTimestamp;
        up.push({time: t, value: hi});
        low.push({time: t, value: lo});
        mid.push({time: t, value: (hi + lo) / 2});
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'dc_up', label: 'DC High', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'solid', data: up},
          {key: 'dc_mid', label: 'DC Mid', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'dashed', data: mid},
          {key: 'dc_low', label: 'DC Low', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'solid', data: low},
        ],
        latestSummary: `${formatLast(up, priceDecimals)} / ${formatLast(low, priceDecimals)}`,
      };
    }

    case 'stddev': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const pts: IndicatorPlotPoint[] = [];
      for (let i = p - 1; i < src.length; i++) {
        let sum = 0;
        for (let j = i - p + 1; j <= i; j++) sum += src[j];
        const mean = sum / p;
        let sq = 0;
        for (let j = i - p + 1; j <= i; j++) sq += (src[j] - mean) ** 2;
        pts.push({time: candles[i].time as UTCTimestamp, value: Math.sqrt(sq / p)});
      }
      return {
        instanceId: inst.uid,
        series: [{key: 'sd', label: `StdDev(${p})`, seriesType: 'line', color: c0, lineWidth: lw, lineStyle: 'solid', data: pts}],
        latestSummary: formatLast(pts, priceDecimals),
      };
    }

    case 'pivots': {
      const ppPts: IndicatorPlotPoint[] = [];
      const r1Pts: IndicatorPlotPoint[] = [];
      const s1Pts: IndicatorPlotPoint[] = [];
      let curDay = -1;
      let prevHigh = candles[0].high;
      let prevLow = candles[0].low;
      let prevClose = candles[0].close;
      let dayHigh = candles[0].high;
      let dayLow = candles[0].low;
      let dayClose = candles[0].close;

      for (const c of candles) {
        const d = Math.floor(c.time / 86400);
        if (curDay === -1) curDay = d;
        if (d !== curDay) {
          prevHigh = dayHigh;
          prevLow = dayLow;
          prevClose = dayClose;
          dayHigh = c.high;
          dayLow = c.low;
          curDay = d;
        } else {
          if (c.high > dayHigh) dayHigh = c.high;
          if (c.low < dayLow) dayLow = c.low;
        }
        dayClose = c.close;
        const pp = (prevHigh + prevLow + prevClose) / 3;
        const r1 = 2 * pp - prevLow;
        const s1 = 2 * pp - prevHigh;
        const t = c.time as UTCTimestamp;
        ppPts.push({time: t, value: pp});
        r1Pts.push({time: t, value: r1});
        s1Pts.push({time: t, value: s1});
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'pp', label: 'PP', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'solid', data: ppPts},
          {key: 'r1', label: 'R1', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'dashed', data: r1Pts},
          {key: 's1', label: 'S1', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'dashed', data: s1Pts},
        ],
        latestSummary: `P ${formatLast(ppPts, priceDecimals)}`,
      };
    }

    case 'auto_fib': {
      const lb = Math.max(10, Math.round(numInput('lookback', 60)));
      const f382: IndicatorPlotPoint[] = [];
      const f500: IndicatorPlotPoint[] = [];
      const f618: IndicatorPlotPoint[] = [];
      for (let i = lb - 1; i < candles.length; i++) {
        let hi = -Infinity;
        let lo = Infinity;
        for (let j = i - lb + 1; j <= i; j++) {
          if (candles[j].high > hi) hi = candles[j].high;
          if (candles[j].low < lo) lo = candles[j].low;
        }
        const rng = hi - lo;
        const t = candles[i].time as UTCTimestamp;
        f382.push({time: t, value: hi - rng * 0.382});
        f500.push({time: t, value: hi - rng * 0.5});
        f618.push({time: t, value: hi - rng * 0.618});
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'f382', label: '0.382', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'dotted', data: f382},
          {key: 'f500', label: '0.500', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'dashed', data: f500},
          {key: 'f618', label: '0.618', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'solid', data: f618},
        ],
        latestSummary: `0.618: ${formatLast(f618, priceDecimals)}`,
      };
    }

    case 'price_channel': {
      const p = Math.max(2, Math.round(numInput('period', 20)));
      const pct = Math.max(0.1, numInput('pct', 1.5)) / 100;
      const basis = calcSmaArr(src, p);
      const up: IndicatorPlotPoint[] = [];
      const mid: IndicatorPlotPoint[] = [];
      const low: IndicatorPlotPoint[] = [];
      for (let i = 0; i < candles.length; i++) {
        if (basis[i] !== null) {
          const b = basis[i] as number;
          const t = candles[i].time as UTCTimestamp;
          up.push({time: t, value: b * (1 + pct)});
          mid.push({time: t, value: b});
          low.push({time: t, value: b * (1 - pct)});
        }
      }
      return {
        instanceId: inst.uid,
        series: [
          {key: 'pc_up', label: 'Env +%', seriesType: 'line', color: c0, lineWidth: 1, lineStyle: 'dashed', data: up},
          {key: 'pc_mid', label: 'Env Mid', seriesType: 'line', color: c1, lineWidth: 1, lineStyle: 'solid', data: mid},
          {key: 'pc_low', label: 'Env -%', seriesType: 'line', color: c2, lineWidth: 1, lineStyle: 'dashed', data: low},
        ],
        latestSummary: formatLast(mid, priceDecimals),
      };
    }
  }
}
