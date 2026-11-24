import {useMemo, useState} from 'react';
import {Calculator, RotateCcw} from 'lucide-react';
import {
  INSTRUMENTS,
  calculatePositionSizing,
  formatPrice,
} from '../lib/forexMath';

interface LotCalculatorPanelProps {
  initialPair?: string;
  initialBalance?: number;
  initialRiskPercent?: number;
  initialEntry?: number;
  initialStopLoss?: number;
  initialTakeProfit?: number;
  onSavePreferences?: (balance: number, riskPercent: number) => Promise<void>;
}

export function LotCalculatorPanel({
  initialPair = 'XAUUSD',
  initialBalance = 10000,
  initialRiskPercent = 1.0,
  initialEntry = 2638.5,
  initialStopLoss = 2631.0,
  initialTakeProfit = 2658.5,
  onSavePreferences,
}: LotCalculatorPanelProps) {
  const [pair, setPair] = useState(initialPair);
  const [balance, setBalance] = useState(String(initialBalance));
  const [riskPercent, setRiskPercent] = useState(String(initialRiskPercent));
  const [entry, setEntry] = useState(String(initialEntry));
  const [stopLoss, setStopLoss] = useState(String(initialStopLoss));
  const [takeProfit, setTakeProfit] = useState(String(initialTakeProfit));
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState('');

  const handlePairSwitch = (nextPair: string) => {
    setPair(nextPair);
    if (nextPair === 'XAUUSD') {
      setEntry('2638.50');
      setStopLoss('2631.00');
      setTakeProfit('2658.50');
    } else if (nextPair === 'EURUSD') {
      setEntry('1.05840');
      setStopLoss('1.06040');
      setTakeProfit('1.05240');
    } else if (nextPair === 'GBPUSD') {
      setEntry('1.26950');
      setStopLoss('1.27200');
      setTakeProfit('1.26250');
    } else if (nextPair === 'NAS100') {
      setEntry('20780.0');
      setStopLoss('20725.0');
      setTakeProfit('20945.0');
    } else if (nextPair === 'US30') {
      setEntry('43420.0');
      setStopLoss('43340.0');
      setTakeProfit('43660.0');
    } else if (nextPair === 'EURJPY' || nextPair === 'USDJPY') {
      setEntry('163.450');
      setStopLoss('163.150');
      setTakeProfit('164.450');
    }
  };

  const result = useMemo(() => {
    return calculatePositionSizing({
      pair,
      accountBalance: Math.max(0, Number(balance) || 0),
      riskPercent: Math.max(0, Number(riskPercent) || 0),
      entry: Number(entry) || 0,
      stopLoss: Number(stopLoss) || 0,
      takeProfit: Number(takeProfit) || 0,
    });
  }, [pair, balance, riskPercent, entry, stopLoss, takeProfit]);

  const handleSaveDefaults = async () => {
    if (!onSavePreferences) return;
    setSaving(true);
    setSavedNote('');
    try {
      await onSavePreferences(
        Math.max(100, Number(balance) || 10000),
        Math.max(0.1, Number(riskPercent) || 1.0),
      );
      setSavedNote('Account defaults saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-blue-400/15 bg-white dark:bg-[#0B1528] p-4 sm:p-6 shadow-sm dark:shadow-none backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200 dark:border-blue-400/15">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
              Position Size & Risk Parameters
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Compute exact lot size from your invalidation distance before placing orders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handlePairSwitch(pair)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-blue-400/20 bg-slate-50 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12223F] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
            Reset Preset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Instrument
            </label>
            <select
              value={pair}
              onChange={(e) => handlePairSwitch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2.5 text-sm font-medium text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              {Object.values(INSTRUMENTS).map((inst) => (
                <option key={inst.symbol} value={inst.symbol}>
                  {inst.symbol} — {inst.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Account Equity (USD)
            </label>
            <input
              type="number"
              min="50"
              step="100"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Risk Per Trade (%)
            </label>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.25"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              <div className="flex gap-1 shrink-0">
                {['0.5', '1.0', '2.0'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRiskPercent(preset)}
                    className={`px-2.5 py-2 rounded-md text-xs font-mono tabular-nums transition-colors ${
                      riskPercent === preset
                        ? 'bg-[#1D4ED8] text-white font-semibold'
                        : 'bg-slate-100 dark:bg-[#12223F] text-[#0F172A] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A3158]'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Entry Price
            </label>
            <input
              type="number"
              step="any"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Stop Loss Price
            </label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Take Profit Target
            </label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2.5 text-sm font-mono tabular-nums text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
        </div>

        {onSavePreferences && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-blue-400/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {savedNote || 'Sync these defaults with your live signal execution panel.'}
            </span>
            <button
              type="button"
              onClick={handleSaveDefaults}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {saving ? 'Saving...' : 'Save Account Defaults'}
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-blue-400/15 bg-white dark:bg-[#0B1528] p-4 sm:p-6 flex flex-col justify-between shadow-sm dark:shadow-none backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#1D4ED8] dark:text-blue-400 mb-2">
            <Calculator className="w-4 h-4" />
            <span>Recommended Execution Size</span>
          </div>
          <div className="text-4xl font-display font-bold font-mono tabular-nums text-[#0F172A] dark:text-white tracking-tight">
            {result.lotSize.toFixed(2)} <span className="text-lg font-normal text-slate-500">lots</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {result.spec.symbol} · Entry {formatPrice(pair, Number(entry) || 0)} · SL{' '}
            {formatPrice(pair, Number(stopLoss) || 0)}
          </p>

          <dl className="mt-6 divide-y divide-slate-200 dark:divide-blue-400/15 border-t border-b border-slate-200 dark:border-blue-400/15">
            <div className="py-3 flex items-center justify-between text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Capital at Risk</dt>
              <dd className="font-mono tabular-nums font-semibold text-[#DC2626]">
                -${result.riskAmount.toFixed(2)} ({riskPercent || 0}%)
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Stop Loss Distance</dt>
              <dd className="font-mono tabular-nums font-medium text-[#0F172A] dark:text-slate-100">
                {result.stopPips} pips/pts
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Target Distance</dt>
              <dd className="font-mono tabular-nums font-medium text-[#0F172A] dark:text-slate-100">
                {result.targetPips} pips/pts
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Reward-to-Risk Ratio</dt>
              <dd className="font-mono tabular-nums font-semibold text-[#1D4ED8] dark:text-blue-400">
                1 : {result.rrRatio.toFixed(1)}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Projected Payout at TP</dt>
              <dd className="font-mono tabular-nums font-semibold text-[#16A34A]">
                +${result.projectedProfit.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-5 leading-relaxed">
          SK Rule: Never risk more than 1.0% on a single setup, and move Stop Loss to Breakeven once TP1 clears.
        </p>
      </div>
    </div>
  );
}
