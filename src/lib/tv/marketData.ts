import type {CandleBar, SymbolMeta, TimeframeKey} from '../../components/tv/types';

const ALL_TIMEFRAME_INTERVALS: TimeframeKey[] = [
  '1s', '5s', '10s', '15s', '30s',
  '1m', '3m', '5m', '15m', '30m', '45m',
  '1h', '2h', '3h', '4h', '6h', '8h', '12h',
  '1d', '1wk', '1mo',
];

const CRYPTO_INTERVALS: TimeframeKey[] = ALL_TIMEFRAME_INTERVALS;

const STANDARD_MARKET_INTERVALS: TimeframeKey[] = ALL_TIMEFRAME_INTERVALS;

export const SYMBOL_CATALOG: SymbolMeta[] = [
  // METALS
  {
    key: 'XAUUSD',
    ticker: 'XAUUSD',
    label: 'Gold / US Dollar',
    exchange: 'COMEX / OANDA',
    assetClass: 'Metals',
    currency: 'USD',
    decimals: 3,
    pipSize: 0.1,
    sessionHours: '23:00–22:00 UTC (Sun–Fri)',
    description: 'Spot Gold vs US Dollar CFD / Futures benchmark',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'XAGUSD',
    ticker: 'XAGUSD',
    label: 'Silver / US Dollar',
    exchange: 'COMEX',
    assetClass: 'Metals',
    currency: 'USD',
    decimals: 3,
    pipSize: 0.01,
    sessionHours: '23:00–22:00 UTC (Sun–Fri)',
    description: 'Spot Silver vs US Dollar',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // FOREX
  {
    key: 'EURUSD',
    ticker: 'EURUSD',
    label: 'Euro / US Dollar',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'USD',
    decimals: 5,
    pipSize: 0.0001,
    sessionHours: '24/5 FX Continuous',
    description: 'Most liquid global G10 currency pair',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'GBPUSD',
    ticker: 'GBPUSD',
    label: 'British Pound / US Dollar',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'USD',
    decimals: 5,
    pipSize: 0.0001,
    sessionHours: '24/5 FX Continuous',
    description: 'Cable — UK Sterling vs US Dollar',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'USDJPY',
    ticker: 'USDJPY',
    label: 'US Dollar / Japanese Yen',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'JPY',
    decimals: 3,
    pipSize: 0.01,
    sessionHours: '24/5 FX Continuous',
    description: 'US Dollar vs Japanese Yen benchmark',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'AUDUSD',
    ticker: 'AUDUSD',
    label: 'Australian Dollar / US Dollar',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'USD',
    decimals: 5,
    pipSize: 0.0001,
    sessionHours: '24/5 FX Continuous',
    description: 'Commodity-linked G10 currency pair',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'NZDUSD',
    ticker: 'NZDUSD',
    label: 'New Zealand Dollar / US Dollar',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'USD',
    decimals: 5,
    pipSize: 0.0001,
    sessionHours: '24/5 FX Continuous',
    description: 'Kiwi vs US Dollar',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'USDCAD',
    ticker: 'USDCAD',
    label: 'US Dollar / Canadian Dollar',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'CAD',
    decimals: 5,
    pipSize: 0.0001,
    sessionHours: '24/5 FX Continuous',
    description: 'Loonie North American FX pair',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'USDCHF',
    ticker: 'USDCHF',
    label: 'US Dollar / Swiss Franc',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'CHF',
    decimals: 5,
    pipSize: 0.0001,
    sessionHours: '24/5 FX Continuous',
    description: 'Swissie safe-haven FX pair',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'EURJPY',
    ticker: 'EURJPY',
    label: 'Euro / Japanese Yen',
    exchange: 'OANDA / FX',
    assetClass: 'Forex',
    currency: 'JPY',
    decimals: 3,
    pipSize: 0.01,
    sessionHours: '24/5 FX Continuous',
    description: 'Euro / Yen cross pair',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // COMMODITIES
  {
    key: 'WTI',
    ticker: 'USOIL',
    label: 'WTI Crude Oil Futures',
    exchange: 'NYMEX',
    assetClass: 'Commodities',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '23:00–22:00 UTC',
    description: 'West Texas Intermediate Light Sweet Crude',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'BRENT',
    ticker: 'UKOIL',
    label: 'Brent Crude Oil Futures',
    exchange: 'ICE',
    assetClass: 'Commodities',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '01:00–23:00 UTC',
    description: 'Global Brent Crude Oil benchmark',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // INDICES
  {
    key: 'DXY',
    ticker: 'DXY',
    label: 'US Dollar Index',
    exchange: 'ICE / TVC',
    assetClass: 'Indices',
    currency: 'USD',
    decimals: 3,
    pipSize: 0.01,
    sessionHours: '01:00–22:00 UTC',
    description: 'Trade-weighted US Dollar Index basket',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'SPX',
    ticker: 'SPX',
    label: 'S&P 500 Index',
    exchange: 'SP / CBOE',
    assetClass: 'Indices',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.25,
    sessionHours: '14:30–21:00 UTC',
    description: 'US Large Cap 500 Equity Index',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'NAS100',
    ticker: 'NAS100',
    label: 'Nasdaq 100 Index',
    exchange: 'NASDAQ / CME',
    assetClass: 'Indices',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.25,
    sessionHours: '23:00–22:00 UTC',
    description: 'Nasdaq 100 Technology Index',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'US30',
    ticker: 'US30',
    label: 'Dow Jones Industrial Average',
    exchange: 'CBOT / DJI',
    assetClass: 'Indices',
    currency: 'USD',
    decimals: 2,
    pipSize: 1.0,
    sessionHours: '14:30–21:00 UTC',
    description: '30 Blue-Chip US Industrial Equities',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // STOCKS
  {
    key: 'AAPL',
    ticker: 'AAPL',
    label: 'Apple Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '14:30–21:00 UTC (RTH)',
    description: 'Apple Inc. Common Stock',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'NVDA',
    ticker: 'NVDA',
    label: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '14:30–21:00 UTC (RTH)',
    description: 'NVIDIA Corp. Semiconductors',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'TSLA',
    ticker: 'TSLA',
    label: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '14:30–21:00 UTC (RTH)',
    description: 'Tesla Inc. EV & Clean Energy',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'MSFT',
    ticker: 'MSFT',
    label: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    assetClass: 'Stocks',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '14:30–21:00 UTC (RTH)',
    description: 'Microsoft Corp. Software & Cloud',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // ETFs
  {
    key: 'SPY',
    ticker: 'SPY',
    label: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSE ARCA',
    assetClass: 'ETFs',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '14:30–21:00 UTC (RTH)',
    description: 'S&P 500 Benchmark Exchange-Traded Fund',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'QQQ',
    ticker: 'QQQ',
    label: 'Invesco QQQ Trust ETF',
    exchange: 'NASDAQ',
    assetClass: 'ETFs',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '14:30–21:00 UTC (RTH)',
    description: 'Nasdaq-100 Tracking ETF',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // FUTURES
  {
    key: 'ES1!',
    ticker: 'ES1!',
    label: 'E-Mini S&P 500 Futures',
    exchange: 'CME',
    assetClass: 'Futures',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.25,
    sessionHours: '23:00–22:00 UTC (Globex)',
    description: 'CME Continuous E-Mini S&P 500 Contract',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },
  {
    key: 'NQ1!',
    ticker: 'NQ1!',
    label: 'E-Mini Nasdaq 100 Futures',
    exchange: 'CME',
    assetClass: 'Futures',
    currency: 'USD',
    decimals: 2,
    pipSize: 0.25,
    sessionHours: '23:00–22:00 UTC (Globex)',
    description: 'CME Continuous E-Mini Nasdaq 100 Contract',
    supportedIntervals: STANDARD_MARKET_INTERVALS,
  },

  // CRYPTO
  {
    key: 'BTCUSDT',
    ticker: 'BTCUSDT',
    label: 'Bitcoin / TetherUS',
    exchange: 'BINANCE',
    assetClass: 'Crypto',
    currency: 'USDT',
    decimals: 2,
    pipSize: 1.0,
    sessionHours: '24/7 Continuous',
    description: 'Bitcoin Spot Perpetual / Pair on Binance',
    supportedIntervals: CRYPTO_INTERVALS,
  },
  {
    key: 'ETHUSDT',
    ticker: 'ETHUSDT',
    label: 'Ethereum / TetherUS',
    exchange: 'BINANCE',
    assetClass: 'Crypto',
    currency: 'USDT',
    decimals: 2,
    pipSize: 0.1,
    sessionHours: '24/7 Continuous',
    description: 'Ethereum Spot Pair on Binance',
    supportedIntervals: CRYPTO_INTERVALS,
  },
  {
    key: 'SOLUSDT',
    ticker: 'SOLUSDT',
    label: 'Solana / TetherUS',
    exchange: 'BINANCE',
    assetClass: 'Crypto',
    currency: 'USDT',
    decimals: 2,
    pipSize: 0.01,
    sessionHours: '24/7 Continuous',
    description: 'Solana Spot Pair on Binance',
    supportedIntervals: CRYPTO_INTERVALS,
  },
];

export function getSymbolMeta(symbolKey: string): SymbolMeta {
  const upper = symbolKey.toUpperCase();
  return (
    SYMBOL_CATALOG.find((s) => s.key === upper || s.ticker === upper) ||
    SYMBOL_CATALOG[0]
  );
}

export function exportCandlesToCsv(symbol: string, interval: string, candles: CandleBar[]): string {
  const header = 'timestamp_utc,unix_sec,open,high,low,close,volume';
  const rows = candles.map((c) => {
    const iso = new Date(c.time * 1000).toISOString();
    return `${iso},${c.time},${c.open},${c.high},${c.low},${c.close},${c.volume}`;
  });
  return `# SKFX Terminal Export · ${symbol} · ${interval}\n${header}\n${rows.join('\n')}`;
}

export function formatCountdownToNextBar(lastBarTimeSec: number, stepSec: number): string {
  if (!lastBarTimeSec || !stepSec) return '--:--';
  const nowSec = Math.floor(Date.now() / 1000);
  const nextClose = lastBarTimeSec + stepSec;
  const rem = Math.max(0, nextClose - nowSec);
  if (rem === 0) return '00:00';
  const hrs = Math.floor(rem / 3600);
  const mins = Math.floor((rem % 3600) / 60);
  const secs = rem % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
