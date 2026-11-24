import {useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion, useScroll, useTransform} from 'motion/react';
import {
  ArrowRight,
  Check,
  ShieldAlert,
  X,
} from 'lucide-react';
import {apiFetch} from '../lib/apiClient';
import {BrandLogo} from './BrandLogo';
import type {SiteRoute} from './DedicatedPages';

interface MentorshipGoldStrategyPageProps {
  initialHighlight?: 'mentorship' | 'gold';
  onNavigate: (route: SiteRoute | 'dashboard') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onEnterDesk: () => void;
  isSignedIn: boolean;
}

interface OfferItem {
  id: 'mentorship' | 'courses' | 'gold';
  categoryTag: string;
  title: string;
  subtitle: string;
  accessLabel: string;
  qualifierSuffix: string;
  billingNote: string;
  bullets: string[];
  cta: string;
  highlighted?: boolean;
}

const OFFERS: OfferItem[] = [
  {
    id: 'mentorship',
    categoryTag: 'COHORT MENTORSHIP',
    title: 'Live Mentorship',
    subtitle:
      'Personalized live sessions, institutional chart analysis, and guided execution coaching.',
    accessLabel: 'Included in Plans',
    qualifierSuffix: 'Monthly · 3-Month · 6-Month · Yearly',
    billingNote: 'Available through our structured Kombat Sampson membership plans',
    bullets: [
      'Live mentorship classes directly with SKFX ACADEMY',
      'Real-time chart analysis & institutional breakdowns',
      'Trading psychology & execution discipline coaching',
    ],
    cta: 'View Plans for Live Mentorship →',
    highlighted: true,
  },
  {
    id: 'courses',
    categoryTag: 'SELF-PACED ACADEMY',
    title: 'Trading Courses',
    subtitle:
      'Structured Forex and market structure education built to take you from zero to disciplined execution.',
    accessLabel: 'Included in Plans',
    qualifierSuffix: 'Full Academy access across plan tiers',
    billingNote: 'Unlock structured Forex & Gold courses inside your membership package',
    bullets: [
      'Step-by-step Forex & technical curriculum',
      'Market structure, liquidity & risk modules',
      'Practical chart examples & demonstrations',
    ],
    cta: 'View Plans for Trading Courses →',
  },
  {
    id: 'gold',
    categoryTag: 'MEMBERSHIP ACCESS',
    title: 'Premium Gold Strategy',
    subtitle:
      'Exclusive subscription access to the SKFX ACADEMY XAUUSD strategy and weekly Gold breakdowns.',
    accessLabel: 'Included in Plans',
    qualifierSuffix: 'XAUUSD updates & weekly breakdowns',
    billingNote: 'Choose Monthly, 3-Month, 6-Month, or Yearly membership for full access',
    bullets: [
      'Premium XAUUSD gold market analysis',
      'Exclusive gold setups with entry, SL & TP levels',
      'Ongoing strategy improvements & breakdowns',
    ],
    cta: 'View Plans for Gold Strategy →',
  },
];

const PILLARS = [
  {
    tag: 'PILLAR 01 · MENTORSHIP',
    title: 'Live Trading Mentorship',
    lead: 'Get personalized guidance, chart breakdowns, and direct feedback from SKFX ACADEMY.',
    points: [
      'Live mentorship sessions every week.',
      'Real-time market analysis and chart breakdowns.',
      'Trading psychology and execution discipline.',
      'Strategy development and personal progress reviews.',
    ],
    cta: 'Apply for Mentorship',
  },
  {
    tag: 'PILLAR 02 · CURRICULUM',
    title: 'Professional Trading Courses',
    lead: 'Build lasting market knowledge with structured modules designed from fundamentals to execution.',
    points: [
      'Step-by-step beginner to advanced lessons.',
      'Technical analysis, liquidity, and market structure.',
      'Risk management and trade execution frameworks.',
      'Lifetime course access on selected packages.',
    ],
    cta: 'Explore Trading Courses',
  },
  {
    tag: 'PILLAR 03 · PREMIUM SUBSCRIPTION',
    title: 'Premium Gold Strategy',
    lead: 'Unlock exclusive XAUUSD setups, session timing, and institutional gold market commentary.',
    points: [
      'Premium XAUUSD gold market analysis.',
      'Clear entry, stop-loss, and take-profit targets.',
      'London & New York killzone breakdown updates.',
      'Ongoing strategy refinements and study notes.',
    ],
    cta: 'Join Premium Gold Strategy',
  },
];

const SESSIONS = [
  {
    tag: 'SESSION 1',
    title: 'Market Foundations',
    desc: 'Understand how the financial markets work, including price action, market structure, and trading fundamentals.',
  },
  {
    tag: 'SESSION 2',
    title: 'Strategy Development',
    desc: 'Learn how to identify high-probability setups and build a repeatable, rules-based trading plan.',
  },
  {
    tag: 'SESSION 3',
    title: 'Trading Psychology',
    desc: 'Develop patience, emotional control, and the discipline to execute your plan without hesitation.',
  },
  {
    tag: 'SESSION 4',
    title: 'Risk Management',
    desc: 'Master position sizing, risk-to-reward ratios, capital preservation, and drawdown rules.',
  },
  {
    tag: 'SESSION 5',
    title: 'Live Market Application',
    desc: 'Apply your knowledge through practical chart markups, live mentorship, and guided trade reviews.',
  },
];

function StackedCard({
  index,
  total,
  children,
}: {
  index: number;
  total: number;
  children: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    target: cardRef,
    offset: ['start 25%', 'end start'],
  });
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, Math.max(0.93, 1 - (total - index) * 0.012)],
  );

  return (
    <div
      ref={cardRef}
      className="sticky top-[var(--stack-top-mobile)] md:top-[var(--stack-top)]"
      style={
        {
          '--stack-top-mobile': `${66 + index * 10}px`,
          '--stack-top': `${92 + index * 18}px`,
          zIndex: index + 1,
        } as React.CSSProperties
      }
    >
      <motion.div style={{scale}} className="origin-top will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

export function MentorshipGoldStrategyPage({
  initialHighlight = 'mentorship',
  onNavigate,
  onOpenAuth,
  onEnterDesk,
  isSignedIn,
}: MentorshipGoldStrategyPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [applyModalOffer, setApplyModalOffer] = useState<OfferItem | null>(null);
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

  const openApplication = (_offer: OfferItem) => {
    onNavigate('plans');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const interest =
        applyModalOffer?.id === 'gold'
          ? 'VIP Signals & Academy'
          : '1-on-1 SK Mentorship';
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          email,
          experience,
          interest,
          message: `[${applyModalOffer?.title}] ${message}`.trim(),
        }),
      });
      if (res.status === 403) {
        setApplyModalOffer(null);
        setAccessErrorOverlay({
          code: 'Error 403',
          message:
            'The server declined this enrollment request because member authentication is required.',
        });
        return;
      }
      const data = (await res.json()) as {error?: string};
      if (!res.ok) {
        setError(data.error || 'Could not submit application.');
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
    <div className="relative min-h-screen overflow-x-clip bg-[#F8FAFC] text-[#0F172A] dark:bg-[#050B24] dark:text-white selection:bg-[#2563EB]/25 selection:text-[#0F172A] dark:selection:text-white transition-colors">
      {/* SKFX Academy Full Background Artwork (uncropped full-frame across all viewports) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden select-none"
      >
        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
          }}
        >
          {/* Animated Full-Width Uncropped Golden Bull Artwork */}
          <motion.img
            src="/assets/aistudio/image_03741139.png"
            alt=""
            referrerPolicy="no-referrer"
            decoding="async"
            initial={false}
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [0.985, 1, 0.99, 1, 0.985],
                    y: [0, -4, 2, -3, 0],
                  }
            }
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="block w-full h-auto object-contain object-center origin-center opacity-[0.62] mix-blend-multiply dark:opacity-[0.58] dark:mix-blend-normal will-change-transform transition-opacity duration-500"
          />

          {/* Living 24K Gold Bull Aura Pulse */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.26, 0.62, 0.34, 0.58, 0.26],
                    scale: [0.96, 1.08, 1.0, 1.06, 0.96],
                  }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[16%] left-[14%] w-[56%] h-[58%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.18),rgba(37,99,235,0.10)_52%,transparent_74%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.28),rgba(37,99,235,0.16)_52%,transparent_74%)] mix-blend-multiply dark:mix-blend-screen blur-3xl will-change-transform"
          />

          {/* Ascending Golden Chart Shimmer */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.16, 0.45, 0.22, 0.42, 0.16],
                    x: ['-5%', '5%', '-2%', '4%', '-5%'],
                  }
            }
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[12%] right-[6%] w-[46%] h-[44%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.16),rgba(56,189,248,0.12)_48%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.24),rgba(56,189,248,0.18)_48%,transparent_72%)] mix-blend-multiply dark:mix-blend-screen blur-2xl will-change-transform"
          />

          {/* Subtle Holographic Gold Light Sweep */}
          {!shouldReduceMotion && (
            <motion.div
              animate={{
                x: ['-120%', '160%'],
                opacity: [0, 0.34, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-400/15 dark:via-amber-300/20 to-transparent mix-blend-multiply dark:mix-blend-screen"
            />
          )}

          {/* Subtle Rising Bullish Gold & Cyan Energy Pulses */}
          {!shouldReduceMotion &&
            [
              {left: '18%', top: '54%', h: 'h-16', color: 'from-amber-500/40 dark:from-amber-400/55', dur: 6.5, delay: 0},
              {left: '34%', top: '42%', h: 'h-20', color: 'from-amber-400/40 dark:from-yellow-300/50', dur: 7.5, delay: 1.4},
              {left: '56%', top: '38%', h: 'h-24', color: 'from-blue-500/35 dark:from-amber-300/50', dur: 8.2, delay: 0.8},
              {left: '74%', top: '28%', h: 'h-20', color: 'from-sky-500/40 dark:from-sky-400/50', dur: 6.8, delay: 2.1},
              {left: '88%', top: '22%', h: 'h-16', color: 'from-amber-500/40 dark:from-yellow-200/55', dur: 7.8, delay: 1.0},
            ].map((bar, idx) => (
              <motion.span
                key={idx}
                style={{left: bar.left, top: bar.top}}
                animate={{
                  y: [24, -42],
                  opacity: [0, 0.75, 0],
                  scaleY: [0.85, 1.25, 0.9],
                }}
                transition={{
                  duration: bar.dur,
                  repeat: Infinity,
                  delay: bar.delay,
                  ease: 'easeInOut',
                }}
                className={`absolute w-[2px] ${bar.h} rounded-full bg-gradient-to-t ${bar.color} to-transparent blur-[0.5px]`}
              />
            ))}

          {/* Theme Contrast Scrim for Crisp Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/30 via-[#F8FAFC]/18 to-[#F8FAFC]/78 dark:from-[#050B24]/38 dark:via-[#050B24]/24 dark:to-[#050B24]/78" />
        </div>
      </div>

      <div className="relative z-10">
        {/* 2. SINGLE-COLUMN HERO SECTION */}
        <section className="max-w-[780px] mx-auto px-4 sm:px-6 pt-7 pb-9 sm:pt-12 sm:pb-12 lg:pt-14 lg:pb-14">
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4, ease: [0.16, 1, 0.3, 1]}}
            className="space-y-4 sm:space-y-5"
          >
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.24em] text-[#1D4ED8] dark:text-blue-400">
              SKFX ACADEMY · MENTORSHIP &amp; GOLD STRATEGY
            </p>

            <h1 className="font-display font-extrabold text-[1.75rem] sm:text-[2.5rem] lg:text-[3.1rem] leading-[1.08] sm:leading-[1.06] tracking-tight text-[#0F172A] dark:text-white [text-wrap:balance]">
              Master the Markets. Build Your Trading Edge.
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-700 dark:text-blue-100/80 leading-relaxed max-w-xl">
              Take your trading to the next level with SKFX ACADEMY. Access practical trading education, live mentorship, and our Gold trading strategy in one structured programme.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <motion.button
                whileHover={{y: -2}}
                whileTap={{scale: 0.97}}
                type="button"
                onClick={() =>
                  openApplication(initialHighlight === 'gold' ? OFFERS[2] : OFFERS[0])
                }
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-[0_12px_30px_rgba(37,99,235,0.30)] transition-all whitespace-nowrap"
              >
                <span>Apply for Mentorship</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* 3. SINGLE-COLUMN PILLARS */}
        <section
          id="pillars"
          className="max-w-[780px] mx-auto px-4 sm:px-6 py-9 sm:py-12 lg:py-14 border-t border-slate-200/85 dark:border-blue-300/15"
        >
          <div className="space-y-2.5 mb-6 sm:mb-9">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#1D4ED8] dark:text-blue-400">
              THE SKFX ACADEMY EXPERIENCE
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Three Pillars. One Trading Vision.
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/75">
              Each pillar builds a distinct part of your edge—moving cleanly from theory to live execution.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8 pb-4 sm:pb-8">
            {PILLARS.map((pillar, idx) => (
              <StackedCard key={pillar.tag} index={idx} total={PILLARS.length}>
                <div
                  className={`rounded-2xl border p-5 sm:p-7 shadow-[0_18px_45px_-15px_rgba(15,23,42,0.1)] dark:shadow-[0_24px_60px_rgba(2,6,26,0.65)] backdrop-blur-xl ${
                    idx === 2
                      ? 'border-[#2563EB]/35 bg-gradient-to-b from-white to-blue-50/75 dark:border-blue-400/40 dark:bg-gradient-to-b dark:from-[#0E2052] dark:to-[#081333]'
                      : 'border-slate-200/85 bg-white dark:border-blue-300/20 dark:bg-none dark:bg-[#0A1738]'
                  }`}
                >
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-blue-400">
                    {pillar.tag}
                  </p>
                  <h3 className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-blue-100/80 leading-relaxed">
                    {pillar.lead}
                  </p>

                  {/* Subtle horizontal hairline rule */}
                  <div className="my-6 sm:my-7 border-t border-slate-200 dark:border-blue-200/12" />

                  <ul className="space-y-3 text-sm text-slate-700 dark:text-blue-50">
                    {pillar.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#2563EB] dark:text-blue-400 mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 sm:mt-8">
                    <button
                      type="button"
                      onClick={() => openApplication(OFFERS[idx])}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-white dark:text-[#050B24] dark:hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-[0_8px_22px_rgba(15,23,42,0.16)] dark:shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition-colors"
                    >
                      <span>{pillar.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </StackedCard>
            ))}
          </div>
        </section>

        {/* 4. SINGLE-COLUMN TRADING TRANSFORMATION (SESSION 1–5) */}
        <section className="max-w-[780px] mx-auto px-4 sm:px-6 py-9 sm:py-12 lg:py-14 border-t border-slate-200/85 dark:border-blue-300/15 space-y-6 sm:space-y-8">
          <div className="space-y-2.5">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-[#1D4ED8] dark:text-blue-400">
              THE TRADING TRANSFORMATION
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              From Learning to Execution.
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/75">
              Five progressive sessions designed to turn chart study into repeatable habits.
            </p>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {SESSIONS.map((sess, idx) => (
              <div
                key={sess.tag}
                className="rounded-2xl border border-slate-200/85 bg-white dark:border-blue-300/20 dark:bg-[#0A1738] p-5 sm:p-7 space-y-2.5 shadow-[0_14px_36px_-15px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_46px_rgba(2,6,26,0.5)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-blue-400">
                    {sess.tag}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2563EB]/80 dark:text-blue-300/70 tabular-nums">
                    0{idx + 1} / 05
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                  {sess.title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
                  {sess.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. WHY SKFX ACADEMY */}
        <section className="max-w-[780px] mx-auto px-4 sm:px-6 py-9 sm:py-12 lg:py-14 border-t border-slate-200/85 dark:border-blue-300/15">
          <div className="rounded-2xl border border-slate-200/85 bg-gradient-to-b from-white to-slate-50/90 dark:border-blue-400/30 dark:from-[#0D1E4D] dark:to-[#081333] p-5 sm:p-7 space-y-4 sm:space-y-5 shadow-[0_18px_45px_-15px_rgba(15,23,42,0.08)] dark:shadow-none">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-blue-400">
              WHY SKFX ACADEMY?
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Your Growth. Your Discipline. Your Trading Journey.
            </h2>
            <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-blue-100/80 leading-relaxed">
              SKFX ACADEMY is committed to helping aspiring and developing traders improve their market understanding through practical mentorship, structured courses, and premium gold strategy commentary.
            </p>

            <div className="border-t border-slate-200 dark:border-blue-200/12 pt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => openApplication(OFFERS[0])}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-[0_10px_28px_rgba(37,99,235,0.30)] transition-colors"
              >
                Apply for Mentorship
              </button>
              <button
                type="button"
                onClick={() => openApplication(OFFERS[2])}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-[#0F172A] dark:border-blue-300/25 dark:bg-[#0A1738] dark:hover:bg-[#132659] dark:text-white text-sm font-bold transition-colors"
              >
                Join Premium Gold Strategy
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 7. FOOTER & LEGAL DISCLAIMER */}
      <footer className="relative z-10 border-t border-slate-200/85 bg-[#F1F5F9]/90 text-[#0F172A] dark:border-blue-300/15 dark:bg-[#030719]/90 backdrop-blur-xl dark:text-white py-16 transition-colors">
        <div className="max-w-[820px] mx-auto px-5 sm:px-6 space-y-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-wider text-[#0F172A] dark:text-white">
              <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
              <span>SKFX ACADEMY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-blue-200/75 leading-relaxed max-w-lg">
              Empowering traders through practical trading education, personalized mentorship, and premium gold trading strategies.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-200/85 dark:border-blue-300/15 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-blue-200/75 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-[#DC2626] dark:text-red-400 mt-0.5 shrink-0" />
              <p>
                <strong className="text-[#DC2626] dark:text-red-400">Financial Risk Disclaimer:</strong> SKFX ACADEMY provides trading education, mentorship, market analysis, and strategy-related content for informational and educational purposes only. Nothing provided constitutes financial or investment advice. Trading forex, gold, and other financial instruments involves substantial risk.
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-blue-300/60">
              © 2026 SKFX ACADEMY. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mentorship / Gold Strategy Enrollment Modal */}
      <AnimatePresence>
        {applyModalOffer && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#020514]/80 backdrop-blur-md p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setApplyModalOffer(null);
            }}
          >
            <motion.div
              initial={{opacity: 0, scale: 0.96, y: 8}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96, y: 8}}
              transition={{duration: 0.18}}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white text-[#0F172A] dark:border-blue-400/30 dark:bg-[#0A1738] dark:text-white p-5 sm:p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-blue-200/15">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8] dark:text-blue-400">
                    {applyModalOffer.categoryTag}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#0F172A] dark:text-white">
                    {applyModalOffer.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyModalOffer(null)}
                  aria-label="Close enrollment dialog"
                  className="p-1.5 rounded-full text-slate-500 hover:text-[#0F172A] dark:text-blue-200/70 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitted ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/15 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                    Application received for <strong>{applyModalOffer.title}</strong>. Our SK Mentorship Desk has logged your request.
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setApplyModalOffer(null);
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
                <form onSubmit={handleApplySubmit} className="mt-4 space-y-3.5">
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
                      Goals / Questions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell SKFX ACADEMY what you want to achieve..."
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
                    className="w-full py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : applyModalOffer.cta}
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
    </div>
  );
}
