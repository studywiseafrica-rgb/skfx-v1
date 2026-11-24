import type {
  CandleBar,
  ChartStyleKey,
  ChartTypeConfig,
  SimulatedTick,
} from '../../components/tv/types';

/**
 * Clean, deduplicate, and chronologically sort OHLCV bars.
 */
export function normalizeCandles(candles: CandleBar[]): CandleBar[] {
  const map = new Map<number, CandleBar>();
  for (const c of candles) {
    if (
      !Number.isFinite(c.time) ||
      !Number.isFinite(c.open) ||
      !Number.isFinite(c.high) ||
      !Number.isFinite(c.low) ||
      !Number.isFinite(c.close)
    ) {
      continue;
    }
    const hi = Math.max(c.high, c.open, c.close, c.low);
    const lo = Math.min(c.low, c.open, c.close, c.high);
    map.set(c.time, {
      time: c.time,
      open: c.open,
      high: hi,
      low: lo,
      close: c.close,
      volume: Number.isFinite(c.volume) ? Math.max(0, c.volume) : 0,
    });
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

/**
 * Aggregate lower-timeframe OHLCV candles into higher-timeframe buckets cleanly.
 */
export function aggregateCandles(candles: CandleBar[], stepSec: number): CandleBar[] {
  const clean = normalizeCandles(candles);
  if (stepSec <= 0 || clean.length === 0) return clean;
  const buckets = new Map<number, CandleBar>();
  for (const c of clean) {
    const bucketTime = Math.floor(c.time / stepSec) * stepSec;
    const existing = buckets.get(bucketTime);
    if (!existing) {
      buckets.set(bucketTime, {
        time: bucketTime,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
      existing.volume += c.volume;
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

/**
 * True Heikin Ashi candle transformation.
 */
export function toHeikinAshi(candles: CandleBar[]): CandleBar[] {
  if (candles.length === 0) return [];
  const out: CandleBar[] = [];
  let prevHaOpen = (candles[0].open + candles[0].close) / 2;
  let prevHaClose = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? prevHaOpen : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }
  return out;
}

/**
 * Estimate ATR-based default brick/box size when user selects Auto sizing.
 */
export function estimateAutoBoxSize(candles: CandleBar[], period = 14): number {
  if (candles.length < 2) return 1;
  const start = Math.max(1, candles.length - period * 3);
  let sumTr = 0;
  let count = 0;
  for (let i = start; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    sumTr += tr;
    count++;
  }
  const atr = count > 0 ? sumTr / count : Math.abs(candles[0].high - candles[0].low);
  return Math.max(atr * 0.75, candles[candles.length - 1].close * 0.0015 || 0.0005);
}

/**
 * Assign strictly increasing timestamps to derived bricks/columns so Lightweight Charts renders every brick cleanly.
 */
function ensureMonotonicTime(bars: CandleBar[]): CandleBar[] {
  let lastTime = -Infinity;
  return bars.map((b) => {
    const t = b.time > lastTime ? b.time : lastTime + 1;
    lastTime = t;
    return {...b, time: t};
  });
}

/**
 * Renko bricks constructed from close prices using a box size.
 */
export function toRenko(candles: CandleBar[], boxSize: number): CandleBar[] {
  if (candles.length === 0) return [];
  const box = Math.max(boxSize, candles[0].close * 0.0002 || 0.0001);
  let anchor = Math.round(candles[0].close / box) * box;
  const bricks: CandleBar[] = [];
  let lastDir: 1 | -1 | 0 = 0;

  for (const c of candles) {
    let diff = c.close - anchor;
    // Standard Renko reversal requires 2 boxes if reversing from previous direction
    while (
      (lastDir !== -1 && diff >= box) ||
      (lastDir === -1 && diff >= box * 2)
    ) {
      const open = lastDir === -1 ? anchor + box : anchor;
      const close = open + box;
      bricks.push({
        time: c.time,
        open,
        high: close,
        low: open,
        close,
        volume: c.volume,
      });
      anchor = close;
      lastDir = 1;
      diff = c.close - anchor;
    }

    while (
      (lastDir !== 1 && diff <= -box) ||
      (lastDir === 1 && diff <= -box * 2)
    ) {
      const open = lastDir === 1 ? anchor - box : anchor;
      const close = open - box;
      bricks.push({
        time: c.time,
        open,
        high: open,
        low: close,
        close,
        volume: c.volume,
      });
      anchor = close;
      lastDir = -1;
      diff = c.close - anchor;
    }
  }

  if (bricks.length === 0) {
    return candles.slice(-1);
  }
  return ensureMonotonicTime(bricks);
}

/**
 * Three-Line Break (or N-Line Break) transformation.
 */
export function toLineBreak(candles: CandleBar[], lineCount = 3): CandleBar[] {
  if (candles.length === 0) return [];
  const lines: CandleBar[] = [];
  const first = candles[0];
  lines.push({
    time: first.time,
    open: first.open,
    high: Math.max(first.open, first.close),
    low: Math.min(first.open, first.close),
    close: first.close,
    volume: first.volume,
  });

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const last = lines[lines.length - 1];
    const isBull = last.close >= last.open;
    const recent = lines.slice(-Math.max(1, lineCount));
    const recentHigh = Math.max(...recent.map((r) => Math.max(r.open, r.close)));
    const recentLow = Math.min(...recent.map((r) => Math.min(r.open, r.close)));

    if (isBull) {
      if (c.close > last.close) {
        lines.push({
          time: c.time,
          open: last.close,
          high: c.close,
          low: last.close,
          close: c.close,
          volume: c.volume,
        });
      } else if (c.close < recentLow) {
        lines.push({
          time: c.time,
          open: last.open,
          high: last.open,
          low: c.close,
          close: c.close,
          volume: c.volume,
        });
      }
    } else {
      if (c.close < last.close) {
        lines.push({
          time: c.time,
          open: last.close,
          high: last.close,
          low: c.close,
          close: c.close,
          volume: c.volume,
        });
      } else if (c.close > recentHigh) {
        lines.push({
          time: c.time,
          open: last.open,
          high: c.close,
          low: last.open,
          close: c.close,
          volume: c.volume,
        });
      }
    }
  }
  return ensureMonotonicTime(lines);
}

/**
 * Kagi chart lines represented as directional OHLC segments (thick Yang / thin Yin).
 */
export function toKagi(candles: CandleBar[], reversalPct = 0.8): CandleBar[] {
  if (candles.length === 0) return [];
  const out: CandleBar[] = [];
  let dir: 1 | -1 = candles.length > 1 && candles[1].close < candles[0].close ? -1 : 1;
  let extreme = candles[0].close;
  let segmentStart = candles[0].close;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const revAmt = extreme * (Math.max(0.1, reversalPct) / 100);
    if (dir === 1) {
      if (c.close >= extreme) {
        extreme = c.close;
      } else if (c.close <= extreme - revAmt) {
        out.push({
          time: c.time,
          open: segmentStart,
          high: Math.max(segmentStart, extreme),
          low: Math.min(segmentStart, extreme),
          close: extreme,
          volume: c.volume,
        });
        segmentStart = extreme;
        extreme = c.close;
        dir = -1;
      }
    } else {
      if (c.close <= extreme) {
        extreme = c.close;
      } else if (c.close >= extreme + revAmt) {
        out.push({
          time: c.time,
          open: segmentStart,
          high: Math.max(segmentStart, extreme),
          low: Math.min(segmentStart, extreme),
          close: extreme,
          volume: c.volume,
        });
        segmentStart = extreme;
        extreme = c.close;
        dir = 1;
      }
    }
  }
  const last = candles[candles.length - 1];
  out.push({
    time: last.time,
    open: segmentStart,
    high: Math.max(segmentStart, extreme),
    low: Math.min(segmentStart, extreme),
    close: extreme,
    volume: last.volume,
  });

  return ensureMonotonicTime(out);
}

/**
 * Point & Figure (X / O columns) converted into directional column bars.
 */
export function toPointAndFigure(
  candles: CandleBar[],
  boxSize: number,
  reversalBoxes = 3,
): CandleBar[] {
  if (candles.length === 0) return [];
  const box = Math.max(boxSize, candles[0].close * 0.0003 || 0.0001);
  const cols: CandleBar[] = [];
  let dir: 1 | -1 = 1;
  let colOpen = Math.floor(candles[0].close / box) * box;
  let colExtreme = colOpen + box;
  let colTime = candles[0].time;

  for (const c of candles) {
    if (dir === 1) {
      if (c.high >= colExtreme + box) {
        colExtreme = Math.floor(c.high / box) * box;
        colTime = c.time;
      } else if (c.low <= colExtreme - reversalBoxes * box) {
        cols.push({
          time: colTime,
          open: colOpen,
          high: colExtreme,
          low: colOpen,
          close: colExtreme,
          volume: c.volume,
        });
        dir = -1;
        colOpen = colExtreme - box;
        colExtreme = Math.ceil(c.low / box) * box;
        colTime = c.time;
      }
    } else {
      if (c.low <= colExtreme - box) {
        colExtreme = Math.ceil(c.low / box) * box;
        colTime = c.time;
      } else if (c.high >= colExtreme + reversalBoxes * box) {
        cols.push({
          time: colTime,
          open: colOpen,
          high: colOpen,
          low: colExtreme,
          close: colExtreme,
          volume: c.volume,
        });
        dir = 1;
        colOpen = colExtreme + box;
        colExtreme = Math.floor(c.high / box) * box;
        colTime = c.time;
      }
    }
  }
  cols.push({
    time: colTime,
    open: colOpen,
    high: Math.max(colOpen, colExtreme),
    low: Math.min(colOpen, colExtreme),
    close: colExtreme,
    volume: candles[candles.length - 1].volume,
  });
  return ensureMonotonicTime(cols);
}

/**
 * Range Bars: closes a bar once (high - low) >= rangeSize.
 */
export function toRangeBars(candles: CandleBar[], rangeSize: number): CandleBar[] {
  if (candles.length === 0) return [];
  const rng = Math.max(rangeSize, candles[0].close * 0.0004 || 0.0002);
  const bars: CandleBar[] = [];
  let cur: CandleBar = {...candles[0]};

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    cur.high = Math.max(cur.high, c.high);
    cur.low = Math.min(cur.low, c.low);
    cur.close = c.close;
    cur.volume += c.volume;
    if (cur.high - cur.low >= rng) {
      bars.push(cur);
      cur = {
        time: c.time,
        open: c.close,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: 0,
      };
    }
  }
  bars.push(cur);
  return ensureMonotonicTime(bars);
}

/**
 * Apply selected ChartStyleKey transformation to raw OHLCV candles.
 */
export function transformCandlesForChartType(
  candles: CandleBar[],
  style: ChartStyleKey,
  cfg: ChartTypeConfig,
): CandleBar[] {
  if (candles.length === 0) return [];
  const autoBox = estimateAutoBoxSize(candles);
  switch (style) {
    case 'heikinashi':
      return toHeikinAshi(candles);
    case 'renko':
      return toRenko(candles, cfg.renkoMode === 'auto' ? autoBox : cfg.renkoBoxSize);
    case 'linebreak':
      return toLineBreak(candles, cfg.lineBreakCount || 3);
    case 'kagi':
      return toKagi(candles, cfg.kagiReversalPct || 0.8);
    case 'pnf':
      return toPointAndFigure(
        candles,
        cfg.renkoMode === 'auto' ? autoBox : cfg.pnfBoxSize,
        cfg.pnfReversal || 3,
      );
    case 'rangebars':
      return toRangeBars(candles, cfg.renkoMode === 'auto' ? autoBox * 1.4 : cfg.rangeSize);
    default:
      return candles;
  }
}

/**
 * Deterministic intrabar tick simulation for Live Tick Replay Mode.
 * Computes the forming candle at fractional progress `p` in [0, 1] without revealing
 * future highs/lows before the price path reaches them.
 */
export function computeLiveTickCandle(
  target: CandleBar,
  progress: number,
  decimals = 3,
): CandleBar {
  const p = Math.max(0.02, Math.min(1, progress));
  const round = (v: number) => {
    const f = Math.pow(10, Math.min(6, Math.max(0, decimals)));
    return Math.round(v * f) / f;
  };

  if (p >= 0.999) {
    return {...target};
  }

  const bullish = target.close >= target.open;
  const firstExtreme = bullish ? target.low : target.high;
  const secondExtreme = bullish ? target.high : target.low;

  const evalPath = (u: number): number => {
    const ripple = Math.sin(u * Math.PI * 5) * (target.high - target.low) * 0.08 * (1 - u);
    let base: number;
    if (u <= 0.25) {
      const k = u / 0.25;
      base = target.open + (firstExtreme - target.open) * k;
    } else if (u <= 0.72) {
      const k = (u - 0.25) / 0.47;
      base = firstExtreme + (secondExtreme - firstExtreme) * k;
    } else {
      const k = (u - 0.72) / 0.28;
      base = secondExtreme + (target.close - secondExtreme) * k;
    }
    return Math.max(target.low, Math.min(target.high, base + ripple));
  };

  let curHigh = target.open;
  let curLow = target.open;
  const steps = Math.max(2, Math.round(p * 24));
  let currentClose = target.open;
  for (let s = 1; s <= steps; s++) {
    const u = (s / steps) * p;
    currentClose = evalPath(u);
    if (currentClose > curHigh) curHigh = currentClose;
    if (currentClose < curLow) curLow = currentClose;
  }

  return {
    time: target.time,
    open: round(target.open),
    high: round(curHigh),
    low: round(curLow),
    close: round(currentClose),
    volume: Math.max(1, Math.round(target.volume * p)),
  };
}

/**
 * Generates an ordered sequence of intrabar simulated ticks from a completed target bar
 * so the Live Replay canvas engine can play back realistic tick-by-tick price formation.
 */
export function generateSimulatedTicksForBar(
  target: CandleBar,
  tickCount = 12,
  decimals = 3,
): SimulatedTick[] {
  const count = Math.max(2, Math.round(tickCount));
  const ticks: SimulatedTick[] = [];
  let prevVol = 0;
  for (let i = 0; i < count; i++) {
    const progress = (i + 1) / count;
    const barState = computeLiveTickCandle(target, progress, decimals);
    const volDelta = Math.max(1, barState.volume - prevVol);
    prevVol = barState.volume;
    ticks.push({
      time: target.time,
      price: barState.close,
      volume: volDelta,
    });
  }
  return ticks;
}

/**
 * Reduces a stream of simulated ticks into OHLCV candles bucketed by `stepSec`.
 * Supports ticks both inside the current bar and across multiple future bars.
 */
export function applySimulatedTicksToCandles(
  ticks: SimulatedTick[],
  stepSec: number,
  decimals = 3,
  seedBar?: CandleBar | null,
): CandleBar[] {
  if (ticks.length === 0) return [];
  const safeStep = Math.max(1, Math.round(stepSec || 60));
  const f = Math.pow(10, Math.min(6, Math.max(0, decimals)));
  const round = (v: number) => Math.round(v * f) / f;

  const buckets = new Map<number, CandleBar>();
  for (const tick of ticks) {
    if (!Number.isFinite(tick.time) || !Number.isFinite(tick.price)) continue;
    const bucketTime = Math.floor(tick.time / safeStep) * safeStep;
    const price = round(tick.price);
    const vol = Number.isFinite(tick.volume) ? Math.max(1, Math.round(tick.volume!)) : 12;
    const existing = buckets.get(bucketTime);
    if (!existing) {
      const openPrice =
        seedBar && seedBar.time === bucketTime ? round(seedBar.open) : price;
      buckets.set(bucketTime, {
        time: bucketTime,
        open: openPrice,
        high: Math.max(openPrice, price),
        low: Math.min(openPrice, price),
        close: price,
        volume: vol,
      });
    } else {
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      existing.volume += vol;
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}

/**
 * Builds a burst of realistic simulated ticks starting from `lastBar` for live replay injection.
 */
export function generateSimulatedTickBurst(
  lastBar: CandleBar,
  stepSec: number,
  barCount = 6,
  ticksPerBar = 12,
  decimals = 3,
  seed = 1,
): SimulatedTick[] {
  const ticks: SimulatedTick[] = [];
  const safeStep = Math.max(1, Math.round(stepSec || 60));
  const f = Math.pow(10, Math.min(6, Math.max(0, decimals)));
  const round = (v: number) => Math.round(v * f) / f;
  const baseRange = Math.max(lastBar.high - lastBar.low, lastBar.close * 0.0018);
  let cursorPrice = lastBar.close;
  let state = (seed * 9301 + 49297) % 233280;
  const rand = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  for (let b = 1; b <= barCount; b++) {
    const barTime = lastBar.time + b * safeStep;
    const driftBias = (rand() - 0.47) * baseRange * 0.9;
    for (let t = 0; t < ticksPerBar; t++) {
      const stepJitter = (rand() - 0.5) * baseRange * 0.42 + driftBias / ticksPerBar;
      cursorPrice = round(Math.max(0.00001, cursorPrice + stepJitter));
      ticks.push({
        time: barTime + Math.floor((t / ticksPerBar) * Math.max(1, safeStep - 1)),
        price: cursorPrice,
        volume: Math.max(10, Math.round(45 + rand() * 160)),
      });
    }
  }
  return ticks;
}


