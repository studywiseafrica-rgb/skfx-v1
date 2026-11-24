export interface InstrumentSpec {
  symbol: string;
  label: string;
  decimals: number;
  pipSize: number;
  pipValuePerStandardLot: number;
}

export const INSTRUMENTS: Record<string, InstrumentSpec> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    label: 'Gold / US Dollar',
    decimals: 2,
    pipSize: 0.1,
    pipValuePerStandardLot: 10,
  },
  EURUSD: {
    symbol: 'EURUSD',
    label: 'Euro / US Dollar',
    decimals: 5,
    pipSize: 0.0001,
    pipValuePerStandardLot: 10,
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    label: 'British Pound / US Dollar',
    decimals: 5,
    pipSize: 0.0001,
    pipValuePerStandardLot: 10,
  },
  EURJPY: {
    symbol: 'EURJPY',
    label: 'Euro / Japanese Yen',
    decimals: 3,
    pipSize: 0.01,
    pipValuePerStandardLot: 6.7,
  },
  USDJPY: {
    symbol: 'USDJPY',
    label: 'US Dollar / Japanese Yen',
    decimals: 3,
    pipSize: 0.01,
    pipValuePerStandardLot: 6.7,
  },
  NAS100: {
    symbol: 'NAS100',
    label: 'Nasdaq 100 Index',
    decimals: 1,
    pipSize: 1.0,
    pipValuePerStandardLot: 1,
  },
  US30: {
    symbol: 'US30',
    label: 'Dow Jones 30 Index',
    decimals: 1,
    pipSize: 1.0,
    pipValuePerStandardLot: 1,
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    label: 'Bitcoin / US Dollar',
    decimals: 1,
    pipSize: 1.0,
    pipValuePerStandardLot: 1,
  },
};

export function getInstrumentSpec(pair: string): InstrumentSpec {
  const normalized = pair.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (INSTRUMENTS[normalized]) return INSTRUMENTS[normalized];
  if (normalized.includes('JPY')) {
    return {
      symbol: normalized,
      label: normalized,
      decimals: 3,
      pipSize: 0.01,
      pipValuePerStandardLot: 6.7,
    };
  }
  if (normalized.includes('XAU')) {
    return INSTRUMENTS.XAUUSD;
  }
  return {
    symbol: normalized || 'EURUSD',
    label: normalized || 'Forex Pair',
    decimals: 5,
    pipSize: 0.0001,
    pipValuePerStandardLot: 10,
  };
}

export function formatPrice(pair: string, price: number): string {
  const spec = getInstrumentSpec(pair);
  return price.toFixed(spec.decimals);
}

export function calculatePositionSizing(params: {
  pair: string;
  accountBalance: number;
  riskPercent: number;
  entry: number;
  stopLoss: number;
  takeProfit?: number;
}) {
  const spec = getInstrumentSpec(params.pair);
  const riskAmount = (params.accountBalance * params.riskPercent) / 100;
  const distance = Math.abs(params.entry - params.stopLoss);
  const stopPips = distance / spec.pipSize;
  const rawLots =
    stopPips > 0
      ? riskAmount / (stopPips * spec.pipValuePerStandardLot)
      : 0;
  const lotSize = Math.max(0.01, Math.round(rawLots * 100) / 100);

  let targetPips = 0;
  let projectedProfit = 0;
  let rrRatio = 0;

  if (params.takeProfit && params.takeProfit > 0 && distance > 0) {
    const tpDist = Math.abs(params.takeProfit - params.entry);
    targetPips = tpDist / spec.pipSize;
    rrRatio = tpDist / distance;
    projectedProfit = targetPips * spec.pipValuePerStandardLot * lotSize;
  }

  return {
    spec,
    riskAmount,
    stopPips: Math.round(stopPips * 10) / 10,
    lotSize,
    targetPips: Math.round(targetPips * 10) / 10,
    projectedProfit,
    rrRatio: Math.round(rrRatio * 10) / 10,
  };
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
