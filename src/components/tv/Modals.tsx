import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Image as ImageIcon,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {INDICATOR_DEFINITIONS} from '../../lib/tv/indicators';
import {SYMBOL_CATALOG} from '../../lib/tv/marketData';
import type {SnapshotExportOptions} from './ChartPane';
import {SymbolBadge} from './TvIcons';
import {
  DEFAULT_FIB_EXT_LEVELS,
  DEFAULT_FIB_RETRACE_LEVELS,
  DEFAULT_SETTINGS,
  DRAWING_CATALOG,
  TIMEFRAMES,
  TIMEZONE_OPTIONS,
  formatSimPrice,
  type AssetClass,
  type ChartDrawing,
  type ChartSettingsConfig,
  type CustomTimeframeDef,
  type DrawingToolId,
  type FibLevelItem,
  type IndicatorCategory,
  type IndicatorId,
  type IndicatorInstance,
  type PriceSourceKey,
  type QuoteItem,
  type SavedWorkspace,
  type TimeframeKey,
} from './types';

function ModalBackdrop({
  title,
  subtitle,
  onClose,
  maxWidth = 'max-w-2xl',
  isDark,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-[2px] p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} max-h-[86vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#131722] border-[#2A2E39] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-[#2A2E39]' : 'border-slate-200'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:bg-slate-500/15 transition-colors ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 1. SYMBOL SEARCH MODAL (Switch or Compare Overlay + Recently Selected)
 * ========================================================================== */
const ASSET_FILTERS: ('All' | AssetClass)[] = [
  'All',
  'Forex',
  'Metals',
  'Commodities',
  'Indices',
  'Stocks',
  'ETFs',
  'Futures',
  'Crypto',
];

export function SymbolSearchModal({
  mode,
  quotes,
  recentSymbols = [],
  isDark,
  onSelectSymbol,
  onClose,
}: {
  mode: 'switch' | 'compare';
  quotes: Record<string, QuoteItem>;
  recentSymbols?: string[];
  isDark: boolean;
  onSelectSymbol: (symbolKey: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState<'All' | AssetClass>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYMBOL_CATALOG.filter((s) => {
      if (assetFilter !== 'All' && s.assetClass !== assetFilter) return false;
      if (!q) return true;
      return (
        s.key.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.exchange.toLowerCase().includes(q) ||
        s.assetClass.toLowerCase().includes(q)
      );
    });
  }, [query, assetFilter]);

  return (
    <ModalBackdrop
      title={mode === 'compare' ? 'Compare or Add Symbol Overlay' : 'Symbol Search'}
      subtitle={
        mode === 'compare'
          ? 'Overlay a normalized percentage comparison curve on the active chart'
          : 'Switch instrument across Forex, Metals, Indices, Equities, Futures & Crypto'
      }
      isDark={isDark}
      onClose={onClose}
    >
      <div className={`p-3 border-b ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-slate-50 border-slate-300'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, name, or exchange (e.g. XAUUSD, BTCUSDT, NAS100, AAPL)..."
            className="w-full bg-transparent outline-none text-xs"
          />
        </div>
        {recentSymbols.length > 0 && !query.trim() && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
              Recent:
            </span>
            {recentSymbols.slice(0, 6).map((symKey) => (
              <button
                key={symKey}
                type="button"
                onClick={() => {
                  onSelectSymbol(symKey);
                  onClose();
                }}
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center gap-1 ${
                  isDark
                    ? 'border-[#2A2E39] bg-[#0B0F17] hover:bg-[#1E222D]'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <SymbolBadge symbol={symKey} size={13} />
                <span>{symKey}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {ASSET_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setAssetFilter(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                assetFilter === cat
                  ? 'bg-[#2962FF] text-white'
                  : isDark
                    ? 'bg-[#1E222D] text-slate-300 hover:bg-[#2A2E39]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-500/15 max-h-[52vh] overflow-y-auto">
        {filtered.map((sym) => {
          const quote = quotes[sym.key];
          return (
            <button
              key={sym.key}
              type="button"
              onClick={() => {
                onSelectSymbol(sym.key);
                onClose();
              }}
              className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                isDark ? 'hover:bg-[#1E222D]' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <SymbolBadge symbol={sym.key} size={22} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{sym.ticker}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400">
                      {sym.assetClass}
                    </span>
                    <span className="text-[10px] text-slate-500">{sym.exchange}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{sym.label}</p>
                </div>
              </div>
              <div className="text-right font-mono tabular-nums shrink-0 ml-3">
                {quote ? (
                  <>
                    <div className="text-xs font-bold">{formatSimPrice(quote.price, sym.decimals)}</div>
                    <div
                      className={`text-[10px] ${
                        quote.changePercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                      }`}
                    >
                      {quote.changePercent >= 0 ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-500">{sym.sessionHours}</span>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            No matching instruments for &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 2. INDICATORS MODAL (33 Built-in Studies + Favorites)
 * ========================================================================== */
const IND_CATEGORIES: ('All' | IndicatorCategory)[] = [
  'All',
  'Trend',
  'Momentum',
  'Volume',
  'Volatility',
  'Other',
];

export function IndicatorsModal({
  favoriteIds,
  activeIndicators,
  isDark,
  onAddIndicator,
  onToggleFavorite,
  onClose,
}: {
  favoriteIds: IndicatorId[];
  activeIndicators: IndicatorInstance[];
  isDark: boolean;
  onAddIndicator: (id: IndicatorId) => void;
  onToggleFavorite: (id: IndicatorId) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | IndicatorCategory>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INDICATOR_DEFINITIONS.filter((ind) => {
      if (category !== 'All' && ind.category !== category) return false;
      if (!q) return true;
      return (
        ind.name.toLowerCase().includes(q) ||
        ind.shortName.toLowerCase().includes(q) ||
        ind.description.toLowerCase().includes(q) ||
        ind.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <ModalBackdrop
      title="Technical Indicators"
      subtitle="33 quantitative studies across Trend, Momentum, Volume, and Volatility"
      isDark={isDark}
      maxWidth="max-w-3xl"
      onClose={onClose}
    >
      <div className={`p-3 border-b ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-slate-50 border-slate-300'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search indicators (RSI, MACD, VWAP, Supertrend, Ichimoku, Bollinger, OBV)..."
            className="w-full bg-transparent outline-none text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-2.5">
          {IND_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                category === cat
                  ? 'bg-[#2962FF] text-white'
                  : isDark
                    ? 'bg-[#1E222D] text-slate-300 hover:bg-[#2A2E39]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-500/15 max-h-[54vh] overflow-y-auto">
        {filtered.map((ind) => {
          const isFav = favoriteIds.includes(ind.id);
          const countActive = activeIndicators.filter((a) => a.indicatorId === ind.id).length;
          return (
            <div
              key={ind.id}
              className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
                isDark ? 'hover:bg-[#1E222D]' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleFavorite(ind.id)}
                  className={`p-1 rounded ${
                    isFav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-300'
                  }`}
                  title={isFav ? 'Remove from favorites' : 'Pin to quick favorites'}
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{ind.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400">
                      {ind.category} · {ind.placement === 'overlay' ? 'Overlay' : 'Sub-Pane'}
                    </span>
                    {countActive > 0 && (
                      <span className="text-[10px] font-mono text-[#089981]">
                        ({countActive} active)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{ind.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAddIndicator(ind.id)}
                className="px-3 py-1 rounded bg-[#2962FF] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold shrink-0 transition-colors"
              >
                Add
              </button>
            </div>
          );
        })}
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 3. INDICATOR SETTINGS MODAL (Inputs, Source, Style)
 * ========================================================================== */
const SOURCES: {value: PriceSourceKey; label: string}[] = [
  {value: 'close', label: 'Close'},
  {value: 'open', label: 'Open'},
  {value: 'high', label: 'High'},
  {value: 'low', label: 'Low'},
  {value: 'hl2', label: '(H + L) / 2'},
  {value: 'hlc3', label: '(H + L + C) / 3'},
  {value: 'ohlc4', label: '(O + H + L + C) / 4'},
];

export function IndicatorSettingsModal({
  indicator,
  isDark,
  onSave,
  onClose,
}: {
  indicator: IndicatorInstance;
  isDark: boolean;
  onSave: (updated: IndicatorInstance) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<IndicatorInstance>(() => ({
    ...indicator,
    inputs: {...indicator.inputs},
    colors: [...indicator.colors],
  }));

  const def = INDICATOR_DEFINITIONS.find((d) => d.id === indicator.indicatorId);

  return (
    <ModalBackdrop
      title={`Indicator Settings — ${indicator.name}`}
      subtitle="Adjust calculation inputs, price source, and series styling"
      isDark={isDark}
      maxWidth="max-w-md"
      onClose={onClose}
    >
      <div className="p-4 space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Price Source
          </label>
          <select
            value={draft.source}
            onChange={(e) => setDraft({...draft, source: e.target.value as PriceSourceKey})}
            className={`w-full px-2.5 py-1.5 rounded border text-xs ${
              isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-white border-slate-300'
            }`}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {Object.keys(draft.inputs).length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Inputs
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(draft.inputs).map(([k, v]) => (
                <label key={k} className="block">
                  <span className="text-[11px] text-slate-400 capitalize">{k}</span>
                  <input
                    type="number"
                    step="any"
                    value={String(v)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        inputs: {...draft.inputs, [k]: Number(e.target.value)},
                      })
                    }
                    className={`mt-1 w-full px-2.5 py-1.5 rounded border font-mono text-xs ${
                      isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-white border-slate-300'
                    }`}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Colors &amp; Line Weight
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {draft.colors.map((col, idx) => (
              <label key={idx} className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="color"
                  value={col}
                  onChange={(e) => {
                    const next = [...draft.colors];
                    next[idx] = e.target.value;
                    setDraft({...draft, colors: next});
                  }}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span>Plot {idx + 1}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 ml-auto text-[11px]">
              <span>Width</span>
              <select
                value={draft.lineWidth}
                onChange={(e) => setDraft({...draft, lineWidth: Number(e.target.value)})}
                className={`px-2 py-1 rounded border text-xs ${
                  isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-white border-slate-300'
                }`}
              >
                {[1, 2, 3, 4].map((w) => (
                  <option key={w} value={w}>
                    {w}px
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-500/20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (!def) return;
              setDraft({
                ...draft,
                source: 'close',
                inputs: {...def.defaultInputs},
                colors: [...def.defaultColors],
                lineWidth: 2,
              });
            }}
            className="px-2.5 py-1.5 rounded border border-slate-500/30 text-[11px] hover:bg-slate-500/15"
          >
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-500/30 text-[11px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded bg-[#2962FF] text-white text-[11px] font-semibold"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 4. CHART SETTINGS MODAL (7 Categories)
 * ========================================================================== */
type SettingsTab =
  | 'Symbol'
  | 'Status Line'
  | 'Scales & Lines'
  | 'Canvas'
  | 'Trading'
  | 'Appearance'
  | 'Shortcuts';

export function ChartSettingsModal({
  settings,
  isDark,
  onSave,
  onClose,
}: {
  settings: ChartSettingsConfig;
  isDark: boolean;
  onSave: (next: ChartSettingsConfig) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>('Symbol');
  const [draft, setDraft] = useState<ChartSettingsConfig>({...DEFAULT_SETTINGS, ...settings});

  const tabs: SettingsTab[] = [
    'Symbol',
    'Status Line',
    'Scales & Lines',
    'Canvas',
    'Trading',
    'Appearance',
    'Shortcuts',
  ];

  const renderToggle = (key: keyof ChartSettingsConfig, label: string) => (
    <label className="flex items-center justify-between py-1.5 text-xs cursor-pointer">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(draft[key])}
        onChange={(e) => setDraft({...draft, [key]: e.target.checked})}
        className="w-4 h-4 accent-[#2962FF]"
      />
    </label>
  );

  return (
    <ModalBackdrop
      title="Chart Settings"
      subtitle="Configure candles, status line, price/time scales, canvas grid, trading & shortcuts"
      isDark={isDark}
      maxWidth="max-w-2xl"
      onClose={onClose}
    >
      <div className="flex flex-col sm:flex-row min-h-[360px]">
        <div
          className={`sm:w-44 p-2 border-b sm:border-b-0 sm:border-r flex sm:flex-col gap-1 overflow-x-auto ${
            isDark ? 'border-[#2A2E39] bg-[#0B0F17]/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-left text-xs font-medium shrink-0 transition-colors ${
                tab === t
                  ? 'bg-[#2962FF] text-white font-semibold'
                  : isDark
                    ? 'text-slate-300 hover:bg-[#1E222D]'
                    : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 space-y-3 text-xs">
          {tab === 'Symbol' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Bull Body</span>
                  <input
                    type="color"
                    value={draft.bullColor}
                    onChange={(e) => setDraft({...draft, bullColor: e.target.value})}
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Bear Body</span>
                  <input
                    type="color"
                    value={draft.bearColor}
                    onChange={(e) => setDraft({...draft, bearColor: e.target.value})}
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Bull Border</span>
                  <input
                    type="color"
                    value={draft.borderBullColor}
                    onChange={(e) => setDraft({...draft, borderBullColor: e.target.value})}
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Bear Border</span>
                  <input
                    type="color"
                    value={draft.borderBearColor}
                    onChange={(e) => setDraft({...draft, borderBearColor: e.target.value})}
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Bull Wick</span>
                  <input
                    type="color"
                    value={draft.wickBullColor}
                    onChange={(e) => setDraft({...draft, wickBullColor: e.target.value})}
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Bear Wick</span>
                  <input
                    type="color"
                    value={draft.wickBearColor}
                    onChange={(e) => setDraft({...draft, wickBearColor: e.target.value})}
                  />
                </label>
              </div>
              {renderToggle('showLastPriceLine', 'Show Last Price Line & Tag')}
              {renderToggle('showPrevCloseLine', 'Show Previous Close Reference Line')}
            </>
          )}

          {tab === 'Status Line' && (
            <>
              {renderToggle('showSymbolTitle', 'Show Symbol Title, Exchange & Feed Status')}
              {renderToggle('showOhlcValues', 'Show Live / Crosshair OHLC Values')}
              {renderToggle('showBarChangeValues', 'Show Bar Change & % Delta')}
              {renderToggle('showVolumeInStatus', 'Show Bar Volume Readout')}
              {renderToggle('showIndicatorValues', 'Show Overlay Indicator Values')}
            </>
          )}

          {tab === 'Scales & Lines' && (
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span>Price Axis Position</span>
                <select
                  value={draft.scalePosition || 'right'}
                  onChange={(e) =>
                    setDraft({...draft, scalePosition: e.target.value as 'right' | 'left'})
                  }
                  className="px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  <option value="right" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Right Axis</option>
                  <option value="left" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Left Axis</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Price Axis Precision</span>
                <select
                  value={draft.priceAxisPrecision}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      priceAxisPrecision: e.target.value as ChartSettingsConfig['priceAxisPrecision'],
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  <option value="auto" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Auto (By Symbol)</option>
                  <option value="2" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>2 Decimals</option>
                  <option value="3" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>3 Decimals</option>
                  <option value="4" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>4 Decimals</option>
                  <option value="5" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>5 Decimals</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Timezone</span>
                <select
                  value={draft.timezone}
                  onChange={(e) => setDraft({...draft, timezone: e.target.value})}
                  className="px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.id} value={tz.id} className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Top Margin ({Math.round((draft.scaleMarginTop ?? 0.08) * 100)}%)</span>
                <input
                  type="range"
                  min={0.02}
                  max={0.35}
                  step={0.01}
                  value={draft.scaleMarginTop ?? 0.08}
                  onChange={(e) => setDraft({...draft, scaleMarginTop: Number(e.target.value)})}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Bottom Margin ({Math.round((draft.scaleMarginBottom ?? 0.08) * 100)}%)</span>
                <input
                  type="range"
                  min={0.02}
                  max={0.35}
                  step={0.01}
                  value={draft.scaleMarginBottom ?? 0.08}
                  onChange={(e) => setDraft({...draft, scaleMarginBottom: Number(e.target.value)})}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Right Margin Bars ({draft.rightOffsetBars})</span>
                <input
                  type="range"
                  min={2}
                  max={36}
                  value={draft.rightOffsetBars}
                  onChange={(e) => setDraft({...draft, rightOffsetBars: Number(e.target.value)})}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Candle Spacing ({draft.barSpacing}px)</span>
                <input
                  type="range"
                  min={4}
                  max={22}
                  value={draft.barSpacing}
                  onChange={(e) => setDraft({...draft, barSpacing: Number(e.target.value)})}
                />
              </label>
              {renderToggle('showCountdown', 'Show Candle Close Countdown')}
              {renderToggle('showSessionBreaks', 'Show Daily Session Breaks')}
            </div>
          )}

          {tab === 'Canvas' && (
            <>
              <div className="grid grid-cols-2 gap-3 pb-1">
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Background</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={draft.canvasBgColor || (isDark ? '#0B0F17' : '#FFFFFF')}
                      onChange={(e) => setDraft({...draft, canvasBgColor: e.target.value})}
                    />
                    {draft.canvasBgColor && (
                      <button
                        type="button"
                        onClick={() => setDraft({...draft, canvasBgColor: ''})}
                        className={`text-[10px] ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        title="Reset to theme default"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                </label>
                <label className="flex items-center justify-between p-2 rounded border border-slate-500/25">
                  <span>Grid Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={draft.gridColor || (isDark ? '#1E293B' : '#E2E8F0')}
                      onChange={(e) => setDraft({...draft, gridColor: e.target.value})}
                    />
                    {draft.gridColor && (
                      <button
                        type="button"
                        onClick={() => setDraft({...draft, gridColor: ''})}
                        className={`text-[10px] ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        title="Reset to theme default"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                </label>
              </div>
              {renderToggle('showVertGrid', 'Show Vertical Grid Lines')}
              {renderToggle('showHorzGrid', 'Show Horizontal Grid Lines')}
              {renderToggle('showWatermark', 'Show Background Ticker Watermark')}
              <label className="flex items-center justify-between py-1.5">
                <span>Crosshair Line Style</span>
                <select
                  value={draft.crosshairStyle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      crosshairStyle: e.target.value as ChartSettingsConfig['crosshairStyle'],
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  <option value="dashed" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dashed</option>
                  <option value="dotted" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dotted</option>
                  <option value="solid" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Solid</option>
                </select>
              </label>
            </>
          )}

          {tab === 'Trading' && (
            <>
              {renderToggle('showOneClickTrading', 'Show One-Click Buy / Sell Spread Buttons')}
              {renderToggle('showPositionOverlay', 'Show Active Order / Entry / TP / SL Price Lines')}
            </>
          )}

          {tab === 'Appearance' && (
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span>Terminal Theme</span>
                <select
                  value={draft.themeOverride}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      themeOverride: e.target.value as ChartSettingsConfig['themeOverride'],
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  <option value="inherit" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Match Dashboard Theme</option>
                  <option value="dark" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dark Pro Canvas</option>
                  <option value="light" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Light Clean Canvas</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Scale Font Size ({draft.chartFontSize}px)</span>
                <input
                  type="range"
                  min={10}
                  max={14}
                  value={draft.chartFontSize}
                  onChange={(e) => setDraft({...draft, chartFontSize: Number(e.target.value)})}
                />
              </label>
            </div>
          )}

          {tab === 'Shortcuts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {[
                ['Ctrl/Cmd + K or /', 'Quick Command Search'],
                ['Ctrl/Cmd + S', 'Save Workspace'],
                ['Ctrl/Cmd + Z / Y', 'Undo / Redo Action'],
                ['Ctrl/Cmd + C / V', 'Copy / Paste Drawing'],
                ['Ctrl/Cmd + + / -', 'Zoom In / Zoom Out'],
                ['Alt + R', 'Reset Chart View'],
                ['F', 'Toggle Fullscreen'],
                ['Delete / Backspace', 'Remove Selected Drawing'],
                ['Alt + T', 'Trend Line Tool'],
                ['Alt + H / J / V / C', 'HLine / HRay / VLine / Cross'],
                ['Alt + F', 'Fibonacci Retracement'],
                ['L / S / R / T / M', 'Long / Short / Rect / Text / Measure'],
                ['Esc', 'Cancel Drawing / Cursor Mode'],
                ['← / → (Replay)', 'Step Replay Back / Forward'],
              ].map(([k, desc]) => (
                <div
                  key={k}
                  className="p-2 rounded border border-slate-500/20 flex items-center justify-between gap-2"
                >
                  <span className="text-slate-400">{desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 font-mono text-[10px]">
                    {k}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={`px-4 py-3 border-t flex items-center justify-between ${
          isDark ? 'border-[#2A2E39]' : 'border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setDraft({...DEFAULT_SETTINGS})}
          className="px-3 py-1.5 rounded border border-slate-500/30 text-xs hover:bg-slate-500/15"
        >
          Reset Defaults
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-500/30 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-[#2962FF] text-white text-xs font-semibold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 5. DRAWING CONFIG & FIBONACCI LEVEL EDITOR MODAL
 * ========================================================================== */
function toDateTimeLocalStr(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

export function DrawingConfigModal({
  drawing,
  fibTemplates,
  isDark,
  onSave,
  onSaveFibTemplate,
  onDeleteFibTemplate,
  onClose,
}: {
  drawing: ChartDrawing;
  fibTemplates: {name: string; levels: FibLevelItem[]}[];
  isDark: boolean;
  onSave: (updated: ChartDrawing) => void;
  onSaveFibTemplate: (name: string, levels: FibLevelItem[]) => void;
  onDeleteFibTemplate: (name: string) => void;
  onClose: () => void;
}) {
  const isFib = ['fib', 'fibext', 'fibtrendext', 'fibchannel', 'fibwedge'].includes(drawing.tool);
  const isPos = drawing.tool === 'longpos' || drawing.tool === 'shortpos';
  const isText = [
    'text',
    'anchoredtext',
    'note',
    'callout',
    'pricenote',
    'signpost',
  ].includes(drawing.tool);

  const [draft, setDraft] = useState<ChartDrawing>(() => ({
    ...drawing,
    points: drawing.points.map((p) => ({...p})),
    fibLevels:
      drawing.fibLevels && drawing.fibLevels.length > 0
        ? drawing.fibLevels.map((l) => ({...l}))
        : drawing.tool === 'fib' || drawing.tool === 'fibchannel' || drawing.tool === 'fibwedge'
          ? DEFAULT_FIB_RETRACE_LEVELS.map((l) => ({...l}))
          : DEFAULT_FIB_EXT_LEVELS.map((l) => ({...l})),
  }));
  const [newLevelInput, setNewLevelInput] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedTpl, setSelectedTpl] = useState('');

  return (
    <ModalBackdrop
      title={`Object Properties — ${drawing.tool.toUpperCase()}`}
      subtitle="Customize stroke, fill, exact coordinates, text formatting & Fibonacci ratios"
      isDark={isDark}
      maxWidth="max-w-xl"
      onClose={onClose}
    >
      <div className="p-4 space-y-4 text-xs">
        {/* General Appearance */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <label className="block">
            <span className="text-[11px] text-slate-400">Stroke Color</span>
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft({...draft, color: e.target.value})}
              className="mt-1 block w-full h-8 rounded cursor-pointer bg-transparent"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400">Fill Color</span>
            <input
              type="color"
              value={draft.fillColor || draft.color}
              onChange={(e) => setDraft({...draft, fillColor: e.target.value})}
              className="mt-1 block w-full h-8 rounded cursor-pointer bg-transparent"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400">Line Width</span>
            <select
              value={draft.lineWidth || 2}
              onChange={(e) => setDraft({...draft, lineWidth: Number(e.target.value)})}
              className="mt-1 w-full px-2 py-1.5 rounded border border-slate-500/30 bg-transparent"
            >
              {[1, 2, 3, 4].map((w) => (
                <option key={w} value={w} className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>
                  {w} px
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400">Line Style</span>
            <select
              value={draft.lineStyle || 'solid'}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  lineStyle: e.target.value as ChartDrawing['lineStyle'],
                })
              }
              className="mt-1 w-full px-2 py-1.5 rounded border border-slate-500/30 bg-transparent"
            >
              <option value="solid" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Solid</option>
              <option value="dashed" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dashed</option>
              <option value="dotted" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dotted</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400">
              Opacity ({Math.round((draft.fillOpacity ?? 0.14) * 100)}%)
            </span>
            <input
              type="range"
              min={0}
              max={0.65}
              step={0.02}
              value={draft.fillOpacity ?? 0.14}
              onChange={(e) => setDraft({...draft, fillOpacity: Number(e.target.value)})}
              className="mt-2.5 w-full"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(draft.extendLeft)}
              onChange={(e) => setDraft({...draft, extendLeft: e.target.checked})}
              className="accent-[#2962FF]"
            />
            <span>Extend Left</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(draft.extendRight)}
              onChange={(e) => setDraft({...draft, extendRight: e.target.checked})}
              className="accent-[#2962FF]"
            />
            <span>Extend Right</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.showLabels !== false}
              onChange={(e) => setDraft({...draft, showLabels: e.target.checked})}
              className="accent-[#2962FF]"
            />
            <span>Show Labels</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.showValues !== false}
              onChange={(e) => setDraft({...draft, showValues: e.target.checked})}
              className="accent-[#2962FF]"
            />
            <span>Show Values</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(e) => setDraft({...draft, visible: e.target.checked})}
              className="accent-[#2962FF]"
            />
            <span>Visible</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.locked}
              onChange={(e) => setDraft({...draft, locked: e.target.checked})}
              className="accent-[#2962FF]"
            />
            <span>Locked</span>
          </label>
        </div>

        {/* Exact Point Coordinates Editor */}
        {draft.points.length <= 8 && (
          <div className="space-y-2 pt-2 border-t border-slate-500/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Coordinates ({draft.points.length} Anchor{draft.points.length > 1 ? 's' : ''})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {draft.points.map((pt, idx) => (
                <div key={idx} className="grid grid-cols-[52px_1fr_1fr] items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">Pt #{idx + 1}</span>
                  <input
                    type="number"
                    step="any"
                    value={pt.price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isFinite(val)) return;
                      setDraft({
                        ...draft,
                        points: draft.points.map((p, i) => (i === idx ? {...p, price: val} : p)),
                      });
                    }}
                    className="px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono text-[11px]"
                    title="Price"
                  />
                  <input
                    type="datetime-local"
                    value={toDateTimeLocalStr(pt.time)}
                    onChange={(e) => {
                      const ms = Date.parse(`${e.target.value}:00Z`);
                      if (!Number.isFinite(ms)) return;
                      setDraft({
                        ...draft,
                        points: draft.points.map((p, i) =>
                          i === idx ? {...p, time: Math.floor(ms / 1000)} : p,
                        ),
                      });
                    }}
                    className="px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono text-[11px]"
                    title="Timestamp (UTC)"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Annotation Text Editor */}
        {isText && (
          <div className="space-y-2.5 pt-2 border-t border-slate-500/20">
            <label className="block">
              <span className="text-[11px] text-slate-400">Annotation Text / Note</span>
              <input
                value={draft.text || ''}
                onChange={(e) => setDraft({...draft, text: e.target.value})}
                placeholder="Enter chart note or callout label..."
                className={`mt-1 w-full px-2.5 py-1.5 rounded border text-xs ${
                  isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-white border-slate-300'
                }`}
              />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
              <label className="block">
                <span className="text-[11px] text-slate-400">Font ({draft.fontSize || 11}px)</span>
                <input
                  type="range"
                  min={10}
                  max={22}
                  value={draft.fontSize || 11}
                  onChange={(e) => setDraft({...draft, fontSize: Number(e.target.value)})}
                  className="mt-1.5 w-full"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-slate-400">Font Family</span>
                <select
                  value={draft.fontFamily || 'sans'}
                  onChange={(e) =>
                    setDraft({...draft, fontFamily: e.target.value as ChartDrawing['fontFamily']})
                  }
                  className="mt-1 w-full px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  <option value="sans" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Sans</option>
                  <option value="mono" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Monospace</option>
                  <option value="serif" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Serif</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] text-slate-400">Alignment</span>
                <select
                  value={draft.textAlign || 'left'}
                  onChange={(e) =>
                    setDraft({...draft, textAlign: e.target.value as ChartDrawing['textAlign']})
                  }
                  className="mt-1 w-full px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                >
                  <option value="left" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Left</option>
                  <option value="center" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Center</option>
                  <option value="right" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Right</option>
                </select>
              </label>
              <div className="flex items-center justify-between gap-2 pt-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.textBgEnabled !== false}
                    onChange={(e) => setDraft({...draft, textBgEnabled: e.target.checked})}
                    className="accent-[#2962FF]"
                  />
                  <span>BG</span>
                </label>
                <input
                  type="color"
                  value={draft.textBgColor || draft.color}
                  onChange={(e) => setDraft({...draft, textBgColor: e.target.value})}
                  title="Text Background Color"
                />
              </div>
            </div>
          </div>
        )}

        {/* Position Tool Settings */}
        {isPos && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-500/20">
            <label className="block">
              <span className="text-[11px] text-slate-400">Entry Price</span>
              <input
                type="number"
                step="any"
                value={draft.points[0]?.price ?? 0}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setDraft({
                    ...draft,
                    points: draft.points.map((pt, idx) => (idx === 0 ? {...pt, price: p} : pt)),
                  });
                }}
                className="mt-1 w-full px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-400">Take Profit</span>
              <input
                type="number"
                step="any"
                value={draft.targetPrice ?? 0}
                onChange={(e) => setDraft({...draft, targetPrice: Number(e.target.value)})}
                className="mt-1 w-full px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-400">Stop Loss</span>
              <input
                type="number"
                step="any"
                value={draft.stopPrice ?? 0}
                onChange={(e) => setDraft({...draft, stopPrice: Number(e.target.value)})}
                className="mt-1 w-full px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-400">Risk % of Equity</span>
              <input
                type="number"
                step="0.25"
                min={0.1}
                max={25}
                value={draft.riskPercent ?? 1}
                onChange={(e) => setDraft({...draft, riskPercent: Number(e.target.value)})}
                className="mt-1 w-full px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono"
              />
            </label>
          </div>
        )}

        {/* Fibonacci Level Editor */}
        {isFib && draft.fibLevels && (
          <div className="space-y-3 pt-3 border-t border-slate-500/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
                Fibonacci Levels
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.fibShowPrices !== false}
                    onChange={(e) => setDraft({...draft, fibShowPrices: e.target.checked})}
                    className="accent-[#2962FF]"
                  />
                  <span>Prices</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.fibShowPercents)}
                    onChange={(e) => setDraft({...draft, fibShowPercents: e.target.checked})}
                    className="accent-[#2962FF]"
                  />
                  <span>% Labels</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.fibBgFill !== false}
                    onChange={(e) => setDraft({...draft, fibBgFill: e.target.checked})}
                    className="accent-[#2962FF]"
                  />
                  <span>Zone Fill</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.fibReverse)}
                    onChange={(e) => setDraft({...draft, fibReverse: e.target.checked})}
                    className="accent-[#2962FF]"
                  />
                  <span>Reverse</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      fibLevels:
                        drawing.tool === 'fib' || drawing.tool === 'fibchannel' || drawing.tool === 'fibwedge'
                          ? DEFAULT_FIB_RETRACE_LEVELS.map((l) => ({...l}))
                          : DEFAULT_FIB_EXT_LEVELS.map((l) => ({...l})),
                    })
                  }
                  className="px-2 py-0.5 rounded border border-slate-500/30 text-[10px] hover:bg-slate-500/15"
                >
                  Reset Levels
                </button>
              </div>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {draft.fibLevels.map((lv, idx) => (
                <div key={`${lv.level}_${idx}`} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lv.enabled}
                    onChange={(e) => {
                      const next = [...draft.fibLevels!];
                      next[idx] = {...lv, enabled: e.target.checked};
                      setDraft({...draft, fibLevels: next});
                    }}
                    className="accent-[#2962FF]"
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={lv.level}
                    onChange={(e) => {
                      const next = [...draft.fibLevels!];
                      next[idx] = {...lv, level: Number(e.target.value)};
                      setDraft({...draft, fibLevels: next});
                    }}
                    className="w-20 px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono"
                  />
                  <input
                    type="color"
                    value={lv.color}
                    onChange={(e) => {
                      const next = [...draft.fibLevels!];
                      next[idx] = {...lv, color: e.target.value};
                      setDraft({...draft, fibLevels: next});
                    }}
                  />
                  <select
                    value={lv.lineStyle}
                    onChange={(e) => {
                      const next = [...draft.fibLevels!];
                      next[idx] = {...lv, lineStyle: e.target.value as FibLevelItem['lineStyle']};
                      setDraft({...draft, fibLevels: next});
                    }}
                    className="px-1.5 py-1 rounded border border-slate-500/30 bg-transparent"
                  >
                    <option value="solid" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Solid</option>
                    <option value="dashed" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dashed</option>
                    <option value="dotted" className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>Dotted</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        fibLevels: draft.fibLevels!.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1 text-slate-400 hover:text-rose-400 ml-auto"
                    title="Delete level"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="number"
                step="0.001"
                value={newLevelInput}
                onChange={(e) => setNewLevelInput(e.target.value)}
                placeholder="Add ratio (e.g. 0.886)"
                className="w-36 px-2 py-1 rounded border border-slate-500/30 bg-transparent font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const v = Number(newLevelInput);
                  if (!Number.isFinite(v)) return;
                  setDraft({
                    ...draft,
                    fibLevels: [
                      ...draft.fibLevels!,
                      {level: v, enabled: true, color: '#2962FF', lineStyle: 'dashed' as const, lineWidth: 1},
                    ].sort((a, b) => a.level - b.level),
                  });
                  setNewLevelInput('');
                }}
                className="px-2.5 py-1 rounded bg-slate-500/20 hover:bg-slate-500/30 font-semibold"
              >
                + Add Level
              </button>

              {fibTemplates.length > 0 && (
                <div className="flex items-center gap-1 ml-auto">
                  <select
                    value={selectedTpl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTpl(val);
                      const tpl = fibTemplates.find((t) => t.name === val);
                      if (tpl) setDraft({...draft, fibLevels: tpl.levels.map((l) => ({...l}))});
                    }}
                    className="px-2 py-1 rounded border border-slate-500/30 bg-transparent"
                  >
                    <option value="" disabled className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>
                      Apply Fib Template...
                    </option>
                    {fibTemplates.map((t) => (
                      <option key={t.name} value={t.name} className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {selectedTpl && fibTemplates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteFibTemplate(selectedTpl);
                        setSelectedTpl('');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Delete selected template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Save current levels as template..."
                className="flex-1 px-2 py-1 rounded border border-slate-500/30 bg-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  if (!templateName.trim()) return;
                  onSaveFibTemplate(templateName.trim(), draft.fibLevels!);
                  setSelectedTpl(templateName.trim());
                  setTemplateName('');
                }}
                className="px-2.5 py-1 rounded border border-slate-500/35 hover:bg-slate-500/15"
              >
                Save Template
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className={`px-4 py-3 border-t flex items-center justify-end gap-2 ${
          isDark ? 'border-[#2A2E39]' : 'border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded border border-slate-500/30 text-xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onSave(draft);
            onClose();
          }}
          className="px-4 py-1.5 rounded bg-[#2962FF] text-white text-xs font-semibold"
        >
          Apply Changes
        </button>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 6. WORKSPACE MANAGEMENT MODAL
 * ========================================================================== */
export function WorkspaceModal({
  workspaces,
  activeWorkspaceId,
  isDark,
  onSelectWorkspace,
  onCreateWorkspace,
  onRenameWorkspace,
  onDuplicateWorkspace,
  onDeleteWorkspace,
  onClose,
}: {
  workspaces: SavedWorkspace[];
  activeWorkspaceId: string;
  isDark: boolean;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onDuplicateWorkspace: (id: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  return (
    <ModalBackdrop
      title="Chart Workspaces"
      subtitle="Save, switch, rename, duplicate, or delete persistent charting layouts"
      isDark={isDark}
      maxWidth="max-w-lg"
      onClose={onClose}
    >
      <div className="p-4 space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New workspace name (e.g. London Gold Scalp)..."
            className={`flex-1 px-3 py-1.5 rounded-lg border ${
              isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-white border-slate-300'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              if (!newName.trim()) return;
              onCreateWorkspace(newName.trim());
              setNewName('');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#2962FF] text-white font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Save New
          </button>
        </div>

        <div className="divide-y divide-slate-500/15 border rounded-lg border-slate-500/20">
          {workspaces.map((ws) => {
            const isCurr = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                className={`p-3 flex items-center justify-between gap-2 ${
                  isCurr ? 'bg-[#2962FF]/10' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  {editingId === ws.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editVal.trim()) {
                            onRenameWorkspace(ws.id, editVal.trim());
                            setEditingId(null);
                          }
                        }}
                        className="px-2 py-1 rounded border border-[#2962FF] bg-transparent w-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editVal.trim()) onRenameWorkspace(ws.id, editVal.trim());
                          setEditingId(null);
                        }}
                        className="p-1 text-[#089981]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectWorkspace(ws.id);
                        onClose();
                      }}
                      className="text-left w-full"
                    >
                      <div className="font-bold flex items-center gap-2">
                        <span>{ws.name}</span>
                        {isCurr && (
                          <span className="px-1.5 py-0.5 rounded bg-[#2962FF] text-white text-[9px]">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ws.layoutMode} · {ws.panes.map((p) => p.symbol).join(', ')} · Updated{' '}
                        {new Date(ws.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      onClose();
                    }}
                    className="p-1.5 rounded hover:bg-slate-500/15"
                    title="Load workspace"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(ws.id);
                      setEditVal(ws.name);
                    }}
                    className="px-2 py-1 rounded hover:bg-slate-500/15 text-[10px]"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateWorkspace(ws.id)}
                    className="p-1.5 rounded hover:bg-slate-500/15"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {workspaces.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteWorkspace(ws.id)}
                      className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400"
                      title="Delete workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 7. QUICK SEARCH PALETTE (Ctrl+K / /)
 * ========================================================================== */
export function QuickSearchModal({
  customTimeframes = [],
  isDark,
  onSelectSymbol,
  onSelectTimeframe,
  onAddIndicator,
  onSelectTool,
  onAction,
  onClose,
}: {
  customTimeframes?: CustomTimeframeDef[];
  isDark: boolean;
  onSelectSymbol: (symbol: string) => void;
  onSelectTimeframe: (tf: TimeframeKey) => void;
  onAddIndicator: (ind: IndicatorId) => void;
  onSelectTool: (tool: DrawingToolId) => void;
  onAction: (action: 'settings' | 'replay' | 'snapshot' | 'fullscreen') => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: {
      id: string;
      kind: 'Symbol' | 'Timeframe' | 'Indicator' | 'Tool' | 'Action';
      label: string;
      sub: string;
      run: () => void;
    }[] = [];

    SYMBOL_CATALOG.forEach((s) => {
      if (!q || s.key.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)) {
        items.push({
          id: `sym_${s.key}`,
          kind: 'Symbol',
          label: `${s.ticker} — ${s.label}`,
          sub: `${s.assetClass} · ${s.exchange}`,
          run: () => onSelectSymbol(s.key),
        });
      }
    });

    [...TIMEFRAMES, ...customTimeframes].forEach((tf) => {
      if (!q || tf.label.toLowerCase().includes(q) || tf.longLabel.toLowerCase().includes(q)) {
        items.push({
          id: `tf_${tf.key}`,
          kind: 'Timeframe',
          label: `Switch Timeframe: ${tf.longLabel}`,
          sub: tf.section,
          run: () => onSelectTimeframe(tf.key),
        });
      }
    });

    INDICATOR_DEFINITIONS.forEach((ind) => {
      if (!q || ind.name.toLowerCase().includes(q) || ind.shortName.toLowerCase().includes(q)) {
        items.push({
          id: `ind_${ind.id}`,
          kind: 'Indicator',
          label: `Add ${ind.name}`,
          sub: ind.category,
          run: () => onAddIndicator(ind.id),
        });
      }
    });

    DRAWING_CATALOG.forEach((t) => {
      if (!q || t.label.toLowerCase().includes(q) || t.group.toLowerCase().includes(q)) {
        items.push({
          id: `tool_${t.id}`,
          kind: 'Tool',
          label: `Tool: ${t.label}`,
          sub: t.shortcut ? `${t.group} · ${t.shortcut}` : t.group,
          run: () => onSelectTool(t.id),
        });
      }
    });

    [
      {id: 'settings' as const, label: 'Open Chart Settings'},
      {id: 'replay' as const, label: 'Toggle Bar Replay Mode'},
      {id: 'snapshot' as const, label: 'Export / Snapshot Chart'},
      {id: 'fullscreen' as const, label: 'Toggle Fullscreen Terminal'},
    ].forEach((act) => {
      if (!q || act.label.toLowerCase().includes(q)) {
        items.push({
          id: `act_${act.id}`,
          kind: 'Action',
          label: act.label,
          sub: 'Command',
          run: () => onAction(act.id),
        });
      }
    });

    return items.slice(0, 32);
  }, [query, customTimeframes, onSelectSymbol, onSelectTimeframe, onAddIndicator, onSelectTool, onAction]);

  return (
    <ModalBackdrop
      title="Quick Command Search"
      subtitle="Jump to any symbol, timeframe, technical indicator, drawing tool, or workspace command"
      isDark={isDark}
      maxWidth="max-w-xl"
      onClose={onClose}
    >
      <div className={`p-3 border-b ${isDark ? 'border-[#2A2E39]' : 'border-slate-200'}`}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-slate-50 border-slate-300'
          }`}
        >
          <Search className="w-4 h-4 text-[#2962FF]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type e.g. XAUUSD, 4h, RSI, Fib, Long Position, Settings..."
            className="w-full bg-transparent outline-none text-xs"
          />
        </div>
      </div>
      <div className="divide-y divide-slate-500/15 max-h-[52vh] overflow-y-auto">
        {results.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              item.run();
              onClose();
            }}
            className={`w-full px-4 py-2 flex items-center justify-between text-left ${
              isDark ? 'hover:bg-[#1E222D]' : 'hover:bg-slate-50'
            }`}
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{item.label}</div>
              <div className="text-[10px] text-slate-400">{item.sub}</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-500/15 text-[10px] font-mono text-slate-400 shrink-0 ml-2">
              {item.kind}
            </span>
          </button>
        ))}
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 8. SNAPSHOT & EXPORT MODAL (PNG Composite, SVG Vector, CSV, Dimensions)
 * ========================================================================== */
const DIMENSION_PRESETS = [
  {id: 'native', label: 'Current Viewport', w: 0, h: 0},
  {id: 'hd', label: '1280 × 720 (HD)', w: 1280, h: 720},
  {id: 'fhd', label: '1920 × 1080 (Full HD)', w: 1920, h: 1080},
  {id: 'qhd', label: '2560 × 1440 (2K)', w: 2560, h: 1440},
] as const;

export function SnapshotModal({
  initialPngDataUrl,
  csvPayload,
  symbol,
  interval,
  isDark,
  onGenerateSnapshot,
  onClose,
}: {
  initialPngDataUrl: string | null;
  csvPayload: {filename: string; csv: string} | null;
  symbol: string;
  interval: string;
  isDark: boolean;
  onGenerateSnapshot: (opts: SnapshotExportOptions) => Promise<{
    png: string | null;
    svg: string | null;
  }>;
  onClose: () => void;
}) {
  const [includeDrawings, setIncludeDrawings] = useState(true);
  const [includeIndicators, setIncludeIndicators] = useState(true);
  const [dimPreset, setDimPreset] = useState<(typeof DIMENSION_PRESETS)[number]['id']>('native');
  const [pngUrl, setPngUrl] = useState<string | null>(initialPngDataUrl);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const onGenerateSnapshotRef = useRef(onGenerateSnapshot);
  onGenerateSnapshotRef.current = onGenerateSnapshot;

  useEffect(() => {
    let cancelled = false;
    const chosen = DIMENSION_PRESETS.find((d) => d.id === dimPreset) || DIMENSION_PRESETS[0];
    void onGenerateSnapshotRef
      .current({
        width: chosen.w || undefined,
        height: chosen.h || undefined,
        includeDrawings,
        includeIndicators,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.png) setPngUrl(res.png);
        setSvgMarkup(res.svg);
      });
    return () => {
      cancelled = true;
    };
  }, [includeDrawings, includeIndicators, dimPreset]);

  const downloadBlob = (content: string | Blob, filename: string, mime?: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], {type: mime || 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const copyPng = async () => {
    if (!pngUrl) return;
    try {
      const res = await fetch(pngUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
      setCopiedMsg('Copied composited chart snapshot to clipboard');
    } catch {
      setCopiedMsg('Clipboard permission unavailable in browser — use Download PNG below');
    }
  };

  return (
    <ModalBackdrop
      title={`Snapshot & Market Export — ${symbol} (${interval})`}
      subtitle="Configure dimensions, drawings, and indicators for PNG, SVG vector, or OHLCV CSV export"
      isDark={isDark}
      maxWidth="max-w-2xl"
      onClose={onClose}
    >
      <div className="p-4 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-500/20">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDrawings}
                onChange={(e) => setIncludeDrawings(e.target.checked)}
                className="accent-[#2962FF]"
              />
              <span>Include Drawings</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeIndicators}
                onChange={(e) => setIncludeIndicators(e.target.checked)}
                className="accent-[#2962FF]"
              />
              <span>Include Indicator Panes</span>
            </label>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-slate-400">Size:</span>
            <select
              value={dimPreset}
              onChange={(e) => setDimPreset(e.target.value as (typeof DIMENSION_PRESETS)[number]['id'])}
              className="px-2 py-1 rounded border border-slate-500/30 bg-transparent text-xs"
            >
              {DIMENSION_PRESETS.map((d) => (
                <option key={d.id} value={d.id} className={isDark ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900'}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {pngUrl ? (
          <div className={`rounded-lg border border-slate-500/25 overflow-hidden ${isDark ? 'bg-[#0B0F17]' : 'bg-slate-100'}`}>
            <img src={pngUrl} alt="Chart snapshot preview" className="w-full h-auto max-h-72 object-contain" />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-500/30 rounded-lg">
            Chart preview unavailable while canvas initializes.
          </div>
        )}

        {copiedMsg && (
          <div className="px-3 py-2 rounded bg-[#089981]/15 border border-[#089981]/30 text-[#089981] text-xs font-medium">
            {copiedMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {pngUrl && (
            <>
              <a
                href={pngUrl}
                download={`${symbol}_${interval}_chart.png`}
                className="px-3.5 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </a>
              <button
                type="button"
                onClick={copyPng}
                className="px-3.5 py-2 rounded-lg border border-slate-500/30 hover:bg-slate-500/15 text-xs font-semibold flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Copy Image
              </button>
            </>
          )}

          {svgMarkup && (
            <button
              type="button"
              onClick={() => downloadBlob(svgMarkup, `${symbol}_${interval}_chart.svg`, 'image/svg+xml')}
              className="px-3.5 py-2 rounded-lg border border-slate-500/30 hover:bg-slate-500/15 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export SVG
            </button>
          )}

          {csvPayload && (
            <button
              type="button"
              onClick={() => downloadBlob(csvPayload.csv, csvPayload.filename, 'text/csv;charset=utf-8')}
              className="px-3.5 py-2 rounded-lg border border-slate-500/30 hover:bg-slate-500/15 text-xs font-semibold flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export OHLCV CSV
            </button>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================================================
 * 9. GO TO DATE MODAL
 * ========================================================================== */
export function GoToDateModal({
  isDark,
  onGoToDate,
  onClose,
}: {
  isDark: boolean;
  onGoToDate: (unixSec: number) => void;
  onClose: () => void;
}) {
  const [dateVal, setDateVal] = useState(() => new Date().toISOString().slice(0, 16));

  return (
    <ModalBackdrop
      title="Go to Date & Time"
      subtitle="Center chart viewport around a specific UTC timestamp"
      isDark={isDark}
      maxWidth="max-w-sm"
      onClose={onClose}
    >
      <div className="p-4 space-y-3 text-xs">
        <input
          type="datetime-local"
          value={dateVal}
          onChange={(e) => setDateVal(e.target.value)}
          className={`w-full px-3 py-2 rounded border font-mono ${
            isDark ? 'bg-[#0B0F17] border-[#2A2E39]' : 'bg-white border-slate-300'
          }`}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-500/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const ms = Date.parse(dateVal);
              if (Number.isFinite(ms)) {
                onGoToDate(Math.floor(ms / 1000));
                onClose();
              }
            }}
            className="px-3.5 py-1.5 rounded bg-[#2962FF] text-white font-semibold"
          >
            Jump to Timestamp
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
