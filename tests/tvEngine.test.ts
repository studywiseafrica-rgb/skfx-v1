import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateCandles,
  applySimulatedTicksToCandles,
  computeLiveTickCandle,
  generateSimulatedTickBurst,
  generateSimulatedTicksForBar,
  normalizeCandles,
  toHeikinAshi,
  toKagi,
  toLineBreak,
  toPointAndFigure,
  toRangeBars,
  toRenko,
} from '../src/lib/tv/chartTransforms';
import {
  INDICATOR_DEFINITIONS,
  computeIndicator,
  createIndicatorInstance,
} from '../src/lib/tv/indicators';
import {SYMBOL_CATALOG} from '../src/lib/tv/marketData';
import {
  calcPips,
  calcPnl,
  getDollarPerPointPerLot,
  resolveTimeframeDef,
  type CandleBar,
} from '../src/components/tv/types';

function makeSampleCandles(count = 160): CandleBar[] {
  const start = 1700000000;
  let price = 2000;
  const out: CandleBar[] = [];
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i * 0.23) * 8 + (i % 5 === 0 ? 4 : -2);
    const open = price;
    const close = Number((price + wave).toFixed(2));
    const high = Number((Math.max(open, close) + 5.5).toFixed(2));
    const low = Number((Math.min(open, close) - 4.8).toFixed(2));
    out.push({
      time: start + i * 3600,
      open,
      high,
      low,
      close,
      volume: 1200 + (i % 7) * 250,
    });
    price = close;
  }
  return out;
}

test('OHLCV normalization & higher-timeframe aggregation', () => {
  const base = makeSampleCandles(24);
  const withInvalid = base.map((b, i) => (i === 2 ? {...b, close: NaN} : b));
  const duped = normalizeCandles([...withInvalid, base[5]]);
  assert.equal(duped.length, 23);

  const agg4h = aggregateCandles(base, 4 * 3600);
  assert.ok(agg4h.length >= 5 && agg4h.length <= 7);
  for (const bar of agg4h) {
    assert.ok(bar.high >= Math.max(bar.open, bar.close));
    assert.ok(bar.low <= Math.min(bar.open, bar.close));
  }
});

test('Custom timeframe resolution & aggregation for 2m, 90m, 2d', () => {
  const tf2m = resolveTimeframeDef('2m');
  assert.equal(tf2m.isCustom, true);
  assert.equal(tf2m.stepSec, 120);
  assert.equal(tf2m.baseFetchInterval, '1m');

  const tf90m = resolveTimeframeDef('90m');
  assert.equal(tf90m.isCustom, true);
  assert.equal(tf90m.stepSec, 5400);
  assert.equal(tf90m.baseFetchInterval, '1h');

  const tf2d = resolveTimeframeDef('2d');
  assert.equal(tf2d.isCustom, true);
  assert.equal(tf2d.stepSec, 172800);
  assert.equal(tf2d.baseFetchInterval, '1d');

  const base1h = makeSampleCandles(96);
  const agg2d = aggregateCandles(base1h, tf2d.stepSec);
  assert.ok(agg2d.length >= 2 && agg2d.length <= 4);
  for (let i = 1; i < agg2d.length; i++) {
    assert.ok(agg2d[i].time > agg2d[i - 1].time);
  }
});

test('Synthetic chart type transforms produce monotonic valid bars', () => {
  const candles = makeSampleCandles(120);
  const ha = toHeikinAshi(candles);
  assert.equal(ha.length, candles.length);

  const renko = toRenko(candles, 6);
  assert.ok(renko.length > 0);
  for (let i = 1; i < renko.length; i++) {
    assert.ok(renko[i].time > renko[i - 1].time);
  }

  const lb = toLineBreak(candles, 3);
  assert.ok(lb.length > 0);

  const kagi = toKagi(candles, 0.5);
  assert.ok(kagi.length > 0);

  const pnf = toPointAndFigure(candles, 6, 3);
  assert.ok(pnf.length > 0);

  const rng = toRangeBars(candles, 10);
  assert.ok(rng.length > 0);
});

test('All 33 indicators compute without NaN & enforce bounds', () => {
  assert.equal(INDICATOR_DEFINITIONS.length, 33);
  const candles = makeSampleCandles(160);

  for (const def of INDICATOR_DEFINITIONS) {
    const inst = createIndicatorInstance(def.id);
    const out = computeIndicator(candles, inst, 2);
    assert.ok(out.series.length > 0, `Expected output series for ${def.id}`);
    for (const ser of out.series) {
      for (const pt of ser.data) {
        assert.ok(Number.isFinite(pt.value), `Non-finite point in ${def.id}:${ser.key}`);
      }
    }
  }

  const rsiOut = computeIndicator(candles, createIndicatorInstance('rsi'), 2);
  for (const pt of rsiOut.series[0].data) {
    assert.ok(pt.value >= 0 && pt.value <= 100);
  }

  const bbOut = computeIndicator(candles, createIndicatorInstance('bb'), 2);
  const upper = bbOut.series[0].data;
  const mid = bbOut.series[1].data;
  const lower = bbOut.series[2].data;
  assert.equal(upper.length, mid.length);
  for (let i = 0; i < upper.length; i++) {
    assert.ok(upper[i].value >= mid[i].value);
    assert.ok(mid[i].value >= lower[i].value);
  }
});

test('Zero look-ahead bias during Bar Replay slicing', () => {
  const full = makeSampleCandles(140);
  const cutLen = 90;
  const sliced = full.slice(0, cutLen);

  for (const id of ['ema', 'rsi', 'macd', 'supertrend', 'bb'] as const) {
    const inst = createIndicatorInstance(id);
    const fullAtCut = computeIndicator(full, inst, 2).series[0].data.filter(
      (p) => p.time <= sliced[sliced.length - 1].time,
    );
    const slicedOut = computeIndicator(sliced, inst, 2).series[0].data;
    assert.equal(slicedOut.length, fullAtCut.length);
    for (let i = 0; i < slicedOut.length; i++) {
      assert.equal(slicedOut[i].value, fullAtCut[i].value);
    }
  }
});

test('P&L, contract sizing, and Pip math precision across asset classes', () => {
  assert.equal(getDollarPerPointPerLot('XAUUSD', 2600), 100);
  assert.equal(getDollarPerPointPerLot('NAS100', 20000), 20);
  assert.equal(getDollarPerPointPerLot('BTCUSDT', 90000), 1);
  assert.equal(getDollarPerPointPerLot('EURUSD', 1.1), 100_000);

  assert.equal(calcPnl('XAUUSD', 'BUY', 1, 2600, 2610), 1000);
  assert.equal(calcPnl('NAS100', 'BUY', 2, 20000, 20025), 1000);
  assert.equal(calcPnl('BTCUSDT', 'SELL', 0.5, 90000, 88000), 1000);
  assert.equal(calcPnl('EURUSD', 'BUY', 0.1, 1.1, 1.105), 50);

  assert.equal(calcPips('XAUUSD', 0.1, 'BUY', 2600, 2610), 100);
  assert.equal(calcPips('EURUSD', 0.0001, 'SELL', 1.105, 1.1), 50);
});

test('Live tick replay candle enforces OHLC invariants and progressive formation', () => {
  const target: CandleBar = {
    time: 1735689600,
    open: 2640.0,
    high: 2662.5,
    low: 2631.2,
    close: 2658.4,
    volume: 2400,
  };

  const early = computeLiveTickCandle(target, 0.12, 2);
  assert.equal(early.time, target.time);
  assert.equal(early.open, target.open);
  assert.ok(early.high >= Math.max(early.open, early.close));
  assert.ok(early.low <= Math.min(early.open, early.close));
  assert.ok(early.high < target.high, 'Early tick must not leak final target high');
  assert.ok(early.volume < target.volume);

  const mid = computeLiveTickCandle(target, 0.55, 2);
  assert.ok(mid.high >= Math.max(mid.open, mid.close));
  assert.ok(mid.low <= Math.min(mid.open, mid.close));

  const done = computeLiveTickCandle(target, 1.0, 2);
  assert.deepEqual(done, target);
});

test('All instruments including XAUUSD support 1s through 1mo intervals', () => {
  const xau = SYMBOL_CATALOG.find((s) => s.key === 'XAUUSD');
  assert.ok(xau);
  for (const iv of ['1s', '5s', '1m', '5m', '15m', '1h', '4h', '1d', '1wk', '1mo'] as const) {
    assert.ok(xau.supportedIntervals.includes(iv), `Missing interval ${iv} on XAUUSD`);
  }
});

test('Simulated tick stream builds incremental OHLCV candles cleanly', () => {
  const anchor: CandleBar = {
    time: 1735689600,
    open: 2640,
    high: 2648,
    low: 2635,
    close: 2645,
    volume: 500,
  };
  const barTicks = generateSimulatedTicksForBar(anchor, 8, 2);
  assert.equal(barTicks.length, 8);
  assert.equal(barTicks[barTicks.length - 1].price, anchor.close);

  const burst = generateSimulatedTickBurst(anchor, 3600, 3, 6, 2, 7);
  assert.equal(burst.length, 18);
  const partialCandles = applySimulatedTicksToCandles(burst.slice(0, 9), 3600, 2, anchor);
  assert.equal(partialCandles.length, 2);
  for (const c of partialCandles) {
    assert.ok(c.high >= Math.max(c.open, c.close));
    assert.ok(c.low <= Math.min(c.open, c.close));
    assert.ok(c.volume > 0);
  }
});
