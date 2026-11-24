import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  Check,
  Mail,
  MessageCircle,
  Moon,
  Send,
  ShieldAlert,
  Sun,
  X,
} from 'lucide-react';
import type {ShowcasePayload} from '../types';
import {apiFetch} from '../lib/apiClient';
import {BrandLogo} from './BrandLogo';
import type {SiteRoute} from './DedicatedPages';

interface SignalsAnalysisPageProps {
  showcase: ShowcasePayload | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate: (route: SiteRoute | 'dashboard') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onEnterDesk: () => void;
  isSignedIn: boolean;
}

interface ActionOffer {
  id: 'signals' | 'copy' | 'mentorship' | 'courses';
  tag: string;
  title: string;
  cta: string;
  interest: 'VIP Signals & Academy' | 'Exness Partner Free Access' | '1-on-1 SK Mentorship';
}

const COPY_TRADING_BENEFITS = [
  'Trades execute on your account automatically 24/5.',
  'Built-in proportional lot sizing based on your balance.',
  'Pause, adjust risk, or disconnect anytime.',
];

const VIP_SIGNALS_BENEFITS = [
  'Clear entry price, stop loss, and take-profit targets.',
  'Pip distances and risk-to-reward on every alert.',
  'Delivered directly to your exclusive VIP WhatsApp channel.',
  'Included across Monthly, 3-Month, 6-Month & Yearly plans.',
];

export function SignalsAnalysisPage({
  showcase: _showcase,
  isDark,
  onToggleTheme,
  onNavigate,
  onOpenAuth,
  onEnterDesk,
  isSignedIn,
}: SignalsAnalysisPageProps) {
  const [activeOffer, setActiveOffer] = useState<ActionOffer | null>(null);
  const [infoModal, setInfoModal] = useState<{title: string; body: string} | null>(null);
  const [accessErrorOverlay, setAccessErrorOverlay] = useState<{
    code: string;
    message: string;
  } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState<
    'Beginner (0–6 Months)' | 'Intermediate (6–24 Months)' | 'Funded / Advanced'
  >('Intermediate (6–24 Months)');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const openModal = (offer: ActionOffer) => {
    setSubmitted(false);
    setError('');
    setActiveOffer(offer);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffer) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          email,
          experience,
          interest: activeOffer.interest,
          message: `[${activeOffer.tag} · ${activeOffer.title}] ${message}`.trim(),
        }),
      });
      if (res.status === 403) {
        setActiveOffer(null);
        setAccessErrorOverlay({
          code: 'Error 403',
          message:
            'The server blocked this access request because active VIP authentication is required.',
        });
        return;
      }
      const data = (await res.json()) as {error?: string};
      if (!res.ok) {
        setError(data.error || 'Could not submit request.');
        return;
      }
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] text-[#0F172A] dark:bg-none dark:bg-[#050B24] dark:text-white selection:bg-[#2563EB]/25 selection:text-[#0F172A] dark:selection:text-white transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:text-[#050B24] focus:text-xs focus:font-bold"
      >
        Skip to content
      </a>

      {/* Atmospheric glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden opacity-35 dark:opacity-100">
        <div className="absolute -top-40 right-[-8%] w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12),rgba(56,189,248,0.06)_50%,transparent_74%)] dark:bg-[radial-gradient(circle,rgba(37,99,235,0.28),rgba(29,78,216,0.1)_50%,transparent_74%)] blur-3xl" />
        <div className="absolute top-[52%] -left-48 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_72%)] dark:bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_72%)] blur-3xl" />
      </div>

      <div id="main-content" className="relative z-10">
        {/* 1. HERO SECTION */}
        <section className="max-w-[780px] mx-auto px-4 sm:px-6 pt-7 pb-9 sm:pt-12 sm:pb-12 lg:pt-14 lg:pb-14">
          <motion.div
            initial={{opacity: 0, y: 14}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4, ease: [0.16, 1, 0.3, 1]}}
            className="space-y-4 sm:space-y-5"
          >
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.24em] text-[#1D4ED8] dark:text-blue-400">
              SKFX ACADEMY · VIP SIGNALS
            </p>

            <h1 className="font-display font-extrabold text-[1.75rem] sm:text-[2.5rem] lg:text-[3.1rem] leading-[1.08] sm:leading-[1.06] tracking-tight text-[#0F172A] dark:text-white">
              <span className="block">Trade With Confidence.</span>
              <span className="block text-[#2563EB] dark:text-blue-400">
                Stay Ahead of the Market.
              </span>
            </h1>

            <div className="space-y-3 text-xs sm:text-sm lg:text-base text-slate-700 dark:text-blue-100/80 leading-relaxed max-w-xl">
              <p>
                Success in trading starts with the right preparation, discipline, and strategy.
              </p>
              <p>
                Get access to premium XAUUSD trading signals delivered directly to your WhatsApp, complete with clearly defined entry prices, stop losses, and take-profit targets.
              </p>
              <p>
                Stop navigating the markets without a plan. Get structured trade setups, stay informed, and approach every opportunity with greater confidence.
              </p>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <motion.button
                whileHover={{y: -2}}
                whileTap={{scale: 0.97}}
                type="button"
                onClick={() => onNavigate('plans')}
                className="w-full sm:w-auto text-center px-6 py-3 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] dark:bg-white dark:text-[#050B24] dark:hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(37,99,235,0.28)] dark:shadow-[0_8px_24px_rgba(255,255,255,0.18)] transition-all whitespace-nowrap"
              >
                GET ACCESS TO VIP SIGNALS
              </motion.button>

              <a
                href="#ways-to-join"
                className="w-full sm:w-auto text-center px-5 py-3 rounded-full border border-slate-300/90 bg-white/95 hover:bg-white text-[#0F172A] dark:border-blue-300/25 dark:bg-[#0A1738] dark:hover:bg-[#132659] dark:text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shadow-sm"
              >
                Compare Ways to Join
              </a>
            </div>
          </motion.div>
        </section>

        {/* 2. ANATOMY OF A SIGNAL — SINGLE-COLUMN VERTICAL FLOW */}
        <section
          id="anatomy-sample"
          className="max-w-[780px] mx-auto px-4 sm:px-6 py-9 sm:py-12 lg:py-14 border-t border-slate-200/85 dark:border-blue-300/15 space-y-5 sm:space-y-6"
        >
          <div className="space-y-3">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#1D4ED8] dark:text-blue-400">
              ANATOMY OF A SIGNAL
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-[1.1] tracking-tight text-[#0F172A] dark:text-white">
              Every Great Trade Starts With a Plan.
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
              The difference between guessing and trading with a strategy is having a clear plan.
            </p>
            <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
              Inside our exclusive VIP WhatsApp channel, every signal is delivered with the essential details you need to understand the setup:
            </p>
          </div>

          <ul className="rounded-3xl border border-slate-200/85 bg-white dark:border-blue-300/20 dark:bg-[#0A1738] p-5 sm:p-8 space-y-4 text-sm sm:text-base text-slate-700 dark:text-blue-50 shadow-[0_14px_38px_-15px_rgba(15,23,42,0.08)] dark:shadow-none">
            {[
              {
                label: 'Entry Price:',
                desc: 'Know where the trade opportunity begins.',
              },
              {
                label: 'Stop Loss:',
                desc: 'Have a predefined risk level.',
              },
              {
                label: 'Take Profit Targets:',
                desc: 'Know your planned exit objectives.',
              },
              {
                label: 'Pip Distance:',
                desc: 'Understand the potential movement between entry, stop loss, and targets.',
              },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 mt-1 shrink-0" />
                <span>
                  <strong className="font-bold text-[#0F172A] dark:text-white">
                    {item.label}
                  </strong>{' '}
                  {item.desc}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-sm sm:text-base text-slate-600 dark:text-blue-100/80 leading-relaxed">
            No random entries. No trading blindly. Just structured XAUUSD setups designed to help you approach the market with discipline and consistency.
          </p>

          <div className="pt-2 space-y-2.5">
            <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0F172A] dark:text-white tracking-tight">
              Your Trading Journey Deserves a Better Strategy.
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-blue-100/80">
              Stay focused. Stay disciplined. Keep improving.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.14em] text-[#1D4ED8] hover:text-[#0F172A] dark:text-blue-300 dark:hover:text-white transition-colors"
              >
                JOIN SKFX ACADEMY VIP TODAY.
              </button>
            </div>
          </div>
        </section>

        {/* 3. TWO WAYS TO JOIN — SINGLE-COLUMN VERTICAL FLOW OF SELF-CONTAINED CARDS */}
        <section
          id="ways-to-join"
          className="max-w-[780px] mx-auto px-4 sm:px-6 py-9 sm:py-12 lg:py-14 border-t border-slate-200/85 dark:border-blue-300/15 space-y-6 sm:space-y-8"
        >
          <div className="space-y-2.5">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#1D4ED8] dark:text-blue-400">
              ACCESS OPTIONS
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-[1.1] tracking-tight text-[#0F172A] dark:text-white">
              Two ways to join. The same VIP signals.
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
              Start free through our Exness partnership, or pick a plan and skip the broker.
            </p>
          </div>

          <div className="space-y-5 sm:space-y-6">
            {/* Card 1: Copy Trading */}
            <div className="rounded-2xl border border-slate-200/85 bg-white dark:border-blue-300/20 dark:bg-[#0A1738] p-5 sm:p-7 shadow-[0_18px_45px_-15px_rgba(15,23,42,0.1)] dark:shadow-[0_22px_54px_rgba(2,6,26,0.58)] backdrop-blur-xl">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-blue-400">
                AUTOMATED EXECUTION
              </p>
              <h3 className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">
                Copy Trading
              </h3>
              <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
                Link your trading account once and mirror every position automatically in real time—no charts or manual entries required.
              </p>

              {/* Subtle Horizontal Hairline Rule */}
              <div className="my-5 sm:my-6 border-t border-slate-200 dark:border-blue-200/12" />

              {/* Anchored Metric Callout */}
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                  100% Automated
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-blue-200/80">
                  Hands-free execution · Free via Exness partner
                </span>
              </div>

              {/* Single-Line Checkmark Rows */}
              <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-blue-50">
                {COPY_TRADING_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('hfm-connect')}
                  className="w-full sm:w-auto text-center px-6 py-3 rounded-full bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-white dark:text-[#050B24] dark:hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-[0_8px_22px_rgba(15,23,42,0.16)] dark:shadow-[0_8px_22px_rgba(255,255,255,0.14)] transition-colors"
                >
                  Connect Copy Trading →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('copy-trading')}
                  className="text-center sm:text-left py-1 text-xs sm:text-sm font-semibold text-[#1D4ED8] hover:text-[#0F172A] dark:text-blue-300 dark:hover:text-white transition-colors"
                >
                  See performance stats →
                </button>
              </div>
            </div>

            {/* Card 2: VIP Signals (Paid Access — Anchored Price Callout) */}
            <div className="rounded-2xl border border-[#2563EB]/35 bg-gradient-to-b from-white to-blue-50/75 dark:border-blue-400/45 dark:bg-gradient-to-b dark:from-[#0E2052] dark:to-[#081333] p-5 sm:p-7 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.16)] dark:shadow-[0_24px_64px_rgba(37,99,235,0.22)]">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-blue-400">
                PAID ACCESS
              </p>
              <h3 className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">
                VIP Signals
              </h3>
              <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
                Receive exact entry prices, stop-loss levels, and take-profit targets delivered straight to your exclusive VIP WhatsApp channel.
              </p>

              {/* Subtle Horizontal Hairline Rule */}
              <div className="my-5 sm:my-6 border-t border-slate-200 dark:border-blue-200/12" />

              {/* XAUUSD VIP Signal Execution Summary */}
              <div className="mb-5 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-blue-300/25 bg-white shadow-[0_14px_38px_-12px_rgba(15,23,42,0.12)]">
                <div className="px-3.5 sm:px-4 py-2 bg-[#F8FAFC] dark:bg-[#071122] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                  <span className="font-bold text-[#0F172A] dark:text-white">
                    XAUUSD · 30m Short Execution
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Entry 4,299.69 · TP Hit 4,234.42
                  </span>
                </div>
              </div>

              {/* Membership Plan Callout (No direct price — routed to Plans) */}
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                  Plan Access
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-blue-200/80">
                  · Monthly, 3-Month, 6-Month &amp; Yearly packages
                </span>
              </div>

              {/* Single-Line Checkmark Rows */}
              <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-blue-50">
                {VIP_SIGNALS_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('plans')}
                  className="w-full sm:w-auto text-center px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-[0_10px_28px_rgba(37,99,235,0.34)] transition-colors"
                >
                  Get VIP Signals →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('plans')}
                  className="text-center sm:text-left py-1 text-xs sm:text-sm font-semibold text-[#1D4ED8] hover:text-[#0F172A] dark:text-blue-300 dark:hover:text-white transition-colors"
                >
                  View all membership plans →
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/85 bg-[#F1F5F9]/90 text-[#0F172A] dark:border-blue-300/15 dark:bg-[#030719] dark:text-white py-16 transition-colors">
        <div className="max-w-[820px] mx-auto px-5 sm:px-6 space-y-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-wider text-[#0F172A] dark:text-white">
              <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
              <span>SKFX ACADEMY</span>
            </div>
            <p className="text-xs font-semibold tracking-wider text-[#1D4ED8] dark:text-blue-300">
              Trading Signals | Copy Trading | Live Mentorship | SKFX Academy
            </p>
            <p className="text-sm text-slate-600 dark:text-blue-100/75 max-w-xl">
              Empowering traders through structured Forex &amp; Gold signals, copy-trading frameworks, practical mentorship, and SKFX Academy education.
            </p>
            <button
              type="button"
              onClick={onToggleTheme}
              className="liquid-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0F172A] dark:text-blue-100 hover:brightness-105 transition-all"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-sky-300" /> : <Moon className="w-3.5 h-3.5 text-[#1D4ED8]" />}
              <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D4ED8] dark:text-blue-400 mb-3">
                SERVICES
              </h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-blue-200/80">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('plans')}
                    className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                  >
                    VIP Signals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('copy-trading')}
                    className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                  >
                    Copy Trading
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('plans')}
                    className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                  >
                    Live Mentorship
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D4ED8] dark:text-blue-400 mb-3">
                NAVIGATION
              </h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-blue-200/80">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('mentorship')}
                    className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                  >
                    SKFX Academy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('community')}
                    className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                  >
                    Community
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#DC2626] dark:text-red-400 mb-3">
                LEGAL
              </h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-blue-200/80">
                {[
                  {
                    title: 'Terms of Service',
                    body: 'All trading signals, educational modules, and live sessions are provided strictly for personal educational study.',
                  },
                  {
                    title: 'Privacy Policy',
                    body: 'Account and inquiry details are used exclusively to deliver requested trading education and updates.',
                  },
                  {
                    title: 'Risk Disclaimer',
                    body: 'Trading Forex and Gold involves substantial risk. No profits or outcomes are guaranteed.',
                  },
                ].map((doc) => (
                  <li key={doc.title}>
                    <button
                      type="button"
                      onClick={() => setInfoModal(doc)}
                      className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                    >
                      {doc.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1D4ED8] dark:text-blue-400 mb-3">
                SUPPORT
              </h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-blue-200/80">
                <li className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-300 mt-0.5 shrink-0" />
                  <span>support@skfxacademy.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>+233 20 555 0147</span>
                </li>
                <li className="flex items-start gap-2">
                  <Send className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400 mt-0.5 shrink-0" />
                  <span>@SKFXAcademyDesk</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/85 dark:border-blue-300/15 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-blue-200/75 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-[#DC2626] dark:text-red-400 mt-0.5 shrink-0" />
              <p>
                SKFX ACADEMY provides trading education, signals, copy-trading information, mentorship, and market commentary for informational and educational purposes only. Nothing provided constitutes financial, trading, or investment advice.
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-blue-300/60">
              © 2026 SKFX ACADEMY. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Enrollment / Request Modal */}
      <AnimatePresence>
        {activeOffer && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#020514]/80 backdrop-blur-md p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveOffer(null);
            }}
          >
            <motion.div
              initial={{opacity: 0, scale: 0.96, y: 8}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96, y: 8}}
              transition={{duration: 0.18}}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white text-[#0F172A] dark:border-blue-400/35 dark:bg-[#0A1738] dark:text-white p-5 sm:p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-blue-200/15">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8] dark:text-blue-400">
                    {activeOffer.tag}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#0F172A] dark:text-white">
                    {activeOffer.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOffer(null)}
                  aria-label="Close dialog"
                  className="p-1.5 rounded-full text-slate-500 hover:text-[#0F172A] dark:text-blue-200/70 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitted ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/15 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                    Request logged for <strong>{activeOffer.title}</strong>. Access instructions will be sent to your email.
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOffer(null);
                        if (isSignedIn) onEnterDesk();
                        else onOpenAuth('register');
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#2563EB] text-white dark:bg-white dark:text-[#050B24] text-xs font-bold hover:bg-[#1D4ED8] dark:hover:bg-blue-50"
                    >
                      {isSignedIn ? 'Open My Dashboard' : 'Create Desk Account'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnrollSubmit} className="mt-4 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-blue-100/85 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#0F172A] dark:border-blue-300/20 dark:bg-[#050B24] dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-blue-100/85 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#0F172A] dark:border-blue-300/20 dark:bg-[#050B24] dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-blue-100/85 mb-1">
                      Trading Experience
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value as typeof experience)}
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#0F172A] dark:border-blue-300/20 dark:bg-[#050B24] dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="Beginner (0–6 Months)">Beginner (0–6 Months)</option>
                      <option value="Intermediate (6–24 Months)">
                        Intermediate (6–24 Months)
                      </option>
                      <option value="Funded / Advanced">Funded / Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-blue-100/85 mb-1">
                      Notes / Telegram Handle (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your goals or preferred platform..."
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#0F172A] dark:border-blue-300/20 dark:bg-[#050B24] dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-700 dark:text-red-300 bg-red-500/15 border border-red-400/25 rounded-xl px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] dark:bg-white dark:text-[#050B24] dark:hover:bg-blue-50 text-xs sm:text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : activeOffer.cta}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Error 403 Access Block Overlay */}
      <AnimatePresence>
        {accessErrorOverlay && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#F8FAFC]/92 dark:bg-[#030719]/88 backdrop-blur-xl p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAccessErrorOverlay(null);
            }}
          >
            <motion.div
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 8}}
              className="max-w-md w-full text-center space-y-5"
            >
              <div className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                {accessErrorOverlay.code}
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-blue-100/80 leading-relaxed">
                {accessErrorOverlay.message}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAccessErrorOverlay(null);
                    onOpenAuth('register');
                  }}
                  className="px-6 py-3 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] dark:bg-white dark:text-[#050B24] dark:hover:bg-blue-50 text-xs sm:text-sm font-bold transition-colors"
                >
                  Sign Up for Access
                </button>
                <button
                  type="button"
                  onClick={() => setAccessErrorOverlay(null)}
                  className="px-6 py-3 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A] dark:border-blue-300/25 dark:bg-[#0A1738] dark:hover:bg-[#132659] dark:text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoModal && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#020514]/80 backdrop-blur-md p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInfoModal(null);
            }}
          >
            <motion.div
              initial={{opacity: 0, scale: 0.96, y: 8}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96, y: 8}}
              transition={{duration: 0.18}}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white text-[#0F172A] dark:border-blue-300/25 dark:bg-[#0A1738] dark:text-white p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-blue-200/15">
                <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                  {infoModal.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  aria-label="Close modal"
                  className="p-1.5 rounded-full text-slate-500 hover:text-[#0F172A] dark:text-blue-200/70 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-blue-100/80 leading-relaxed">
                {infoModal.body}
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  className="px-5 py-2 rounded-full bg-[#2563EB] text-white dark:bg-white dark:text-[#050B24] text-xs font-bold hover:bg-[#1D4ED8] dark:hover:bg-blue-50"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
