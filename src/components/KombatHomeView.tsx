import {useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  GraduationCap,
  MessageCircle,
  Radio,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type {SiteRoute} from './DedicatedPages';

interface KombatHomeViewProps {
  onNavigate: (route: SiteRoute | 'dashboard') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenInfoModal: (info: {title: string; body: string}) => void;
  isSignedIn: boolean;
}

const STAT_BAR_ITEMS = [
  {value: '1,000+', label: 'ACTIVE MEMBERS'},
  {value: '1,000+', label: 'TRADERS REACHED'},
  {value: '4+', label: 'YEARS EXPERIENCE'},
  {value: 'XAU / FX', label: 'CORE FOCUS'},
] as const;

interface ServiceBentoItem {
  num: string;
  title: string;
  badge: string;
  description: string;
  tags: string[];
  ctaLabel: string;
  route: SiteRoute;
  icon: typeof Radio;
}

const SERVICES_GRID: ServiceBentoItem[] = [
  {
    num: '01',
    title: 'SKFX Academy',
    badge: 'MENTORSHIP & COURSES',
    description:
      'Build lasting market mastery from the ground up with Kombat Sampson. Access structured Forex and Gold courses, live mentorship sessions, chart breakdowns, and the Premium Gold Strategy.',
    tags: ['Live Mentorship', 'Trading Courses', 'Premium Gold Strategy'],
    ctaLabel: 'Explore SKFX Academy →',
    route: 'mentorship',
    icon: GraduationCap,
  },
  {
    num: '02',
    title: 'Signals & Analysis',
    badge: 'VIP SIGNALS & INSIGHTS',
    description:
      'Receive structured market trade alerts and daily analysis across major Forex pairs and Gold (XAUUSD) — complete with clear entry zones, stop loss, and take profit targets.',
    tags: ['VIP Signals', 'XAUUSD Breakdowns', 'Daily Market Analysis'],
    ctaLabel: 'Explore Signals & Analysis →',
    route: 'signals',
    icon: Radio,
  },
];

const ADVANTAGE_ITEMS = [
  {
    num: '01',
    title: 'Market Opportunities',
    body: 'Access curated trade setups, real-time alerts, and automated strategy replication.',
    icon: TrendingUp,
  },
  {
    num: '02',
    title: 'Practical Experience',
    body: 'Learn directly through live market sessions, chart breakdowns, and real execution analysis.',
    icon: Compass,
  },
  {
    num: '03',
    title: 'Structured Education',
    body: 'Move from trading fundamentals to advanced price action and risk management at your own pace.',
    icon: BookOpen,
  },
  {
    num: '04',
    title: 'Trader Development',
    body: 'Build the consistency, confidence, and risk awareness required for long-term market participation.',
    icon: ShieldCheck,
  },
] as const;

const WHATSAPP_BENEFITS = [
  'Real-time trading signals and alerts',
  'Daily market analysis and breakdowns',
  'Exclusive chart setups',
  'Direct updates from SK',
  'Join a growing community of 200K+ traders',
  '100% FREE — No subscription required!',
] as const;

interface FaqEntry {
  id: string;
  tag: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    id: 'overview',
    tag: 'OVERVIEW',
    question: 'What is Kombat Sampson?',
    answer:
      'Kombat Sampson is a complete trading ecosystem offering Forex and Gold trading signals, copy trading access, live mentorship, and structured trading courses for beginners and experienced traders.',
  },
  {
    id: 'markets',
    tag: 'MARKETS',
    question: 'What markets do you focus on?',
    answer:
      'Our primary focus is the Foreign Exchange (Forex) market and Gold (XAUUSD) trading, combining institutional price delivery, liquidity sweeps, and disciplined risk frameworks.',
  },
  {
    id: 'signals',
    tag: 'SIGNALS',
    question: 'How do Trading Signals work?',
    answer:
      'Members receive structured trade alerts outlining the instrument, direction, entry zone, stop loss, and take profit targets alongside session commentary so every trade is backed by clear invalidation.',
  },
  {
    id: 'copy-trading',
    tag: 'COPY TRADING',
    question: 'How does Copy Trading work?',
    answer:
      "Once your compatible trading account is linked, approved trade setups executed on Kombat Sampson's strategy desk can be mirrored proportionally according to your account balance and risk preferences.",
  },
  {
    id: 'education',
    tag: 'EDUCATION',
    question: 'Are Trading Courses suitable for complete beginners?',
    answer:
      'Yes. Our Academy paths start from Forex fundamentals, pip math, and market sessions before progressing into market structure, Smart Money Concepts, and Gold execution models.',
  },
  {
    id: 'mentorship',
    tag: 'MENTORSHIP',
    question: 'How does Live Mentorship work?',
    answer:
      'Live Mentorship pairs recurring interactive chart walkthroughs, London and New York session prep, and open Q&A reviews so you can ask questions directly and sharpen execution in real time.',
  },
  {
    id: 'getting-started',
    tag: 'GETTING STARTED',
    question: 'How do I get started?',
    answer:
      'Review our membership plans or create a free member account to explore starter educational lessons, preview community channels, and select the access tier tailored to your trading stage.',
  },
  {
    id: 'risk-safety',
    tag: 'RISK & SAFETY',
    question: 'Are profits guaranteed?',
    answer:
      'No. Financial trading carries significant risk and no profits or outcomes are ever guaranteed. Every tool and educational module inside the ecosystem emphasizes capital preservation and risk discipline first.',
  },
  {
    id: 'support',
    tag: 'SUPPORT',
    question: 'How do I contact support?',
    answer:
      'Members receive support directly inside the dashboard and private community channels. For brand partnerships or onboarding inquiries, use the collaboration form above.',
  },
];

function SectionMicroLabel({
  label,
  centered = true,
}: {
  label: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 ${
        centered ? 'justify-center' : 'justify-start'
      }`}
    >
      <span className="h-px w-8 sm:w-12 bg-[#1D4ED8]/25 dark:bg-white/15 shrink-0" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1D4ED8] dark:text-[#94A3B8]">
        {label}
      </span>
      {centered && (
        <span className="h-px w-8 sm:w-12 bg-[#1D4ED8]/25 dark:bg-white/15 shrink-0" />
      )}
    </div>
  );
}

export function KombatHomeView({onNavigate}: KombatHomeViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [openFaqId, setOpenFaqId] = useState<string>('overview');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  return (
    <div className="relative overflow-x-clip bg-transparent transition-colors">
      {/* Home Page Full Background Artwork (full-width extended & completely uncropped across all viewports) */}
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
          {/* Animated Full-Width Uncropped Image */}
          <motion.img
            src="/assets/aistudio/image_e21719ea.png"
            alt=""
            referrerPolicy="no-referrer"
            decoding="async"
            initial={false}
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [0.99, 1, 0.995, 1, 0.99],
                    y: [0, -5, 3, -4, 0],
                  }
            }
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="block w-full h-auto object-contain object-top origin-center opacity-[0.44] mix-blend-multiply dark:mix-blend-normal dark:opacity-[0.62] will-change-transform transition-opacity duration-500"
          />

          {/* Living Blue & Cyan Rim-Light Pulse */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.22, 0.52, 0.3, 0.48, 0.22],
                    scale: [0.96, 1.08, 1.0, 1.06, 0.96],
                  }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[78%] h-[48%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.16),rgba(37,99,235,0.08)_48%,transparent_74%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.32),rgba(37,99,235,0.2)_48%,transparent_74%)] mix-blend-multiply dark:mix-blend-screen blur-3xl will-change-transform"
          />

          {/* Golden Candlestick Reflection Shimmer across Visor */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.15, 0.45, 0.2, 0.42, 0.15],
                    x: ['-6%', '6%', '-3%', '4%', '-6%'],
                  }
            }
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[16%] left-[26%] w-[48%] h-[24%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.18),rgba(45,212,191,0.12)_45%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.22),rgba(45,212,191,0.18)_45%,transparent_72%)] mix-blend-multiply dark:mix-blend-screen blur-2xl will-change-transform"
          />

          {/* Subtle Holographic Light Sweep */}
          {!shouldReduceMotion && (
            <motion.div
              animate={{
                x: ['-120%', '160%'],
                opacity: [0, 0.35, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/12 dark:via-sky-300/20 to-transparent mix-blend-multiply dark:mix-blend-screen"
            />
          )}

          {/* Subtle Rising Candlestick / Energy Pulses */}
          {!shouldReduceMotion &&
            [
              {left: '16%', top: '52%', h: 'h-16', color: 'from-blue-500/35 dark:from-cyan-400/50', dur: 6.5, delay: 0},
              {left: '28%', top: '34%', h: 'h-20', color: 'from-amber-500/35 dark:from-yellow-300/45', dur: 7.5, delay: 1.4},
              {left: '52%', top: '26%', h: 'h-24', color: 'from-emerald-500/35 dark:from-emerald-300/45', dur: 8.2, delay: 0.8},
              {left: '74%', top: '44%', h: 'h-16', color: 'from-sky-500/35 dark:from-sky-400/55', dur: 6.8, delay: 2.1},
              {left: '84%', top: '56%', h: 'h-20', color: 'from-blue-600/35 dark:from-blue-400/50', dur: 7.8, delay: 1.0},
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

          {/* Theme Contrast Scrim for Crisp Text Readability without hiding the artwork */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/30 via-[#F8FAFC]/18 to-[#F8FAFC]/78 dark:from-[#050924]/34 dark:via-[#050924]/22 dark:to-[#050924]/78" />
        </div>
      </div>

      {/* ====================================================================
          SECTION 01: HERO SECTION + 4-COLUMN STAT BAR + EDITORIAL PHOTO
      ==================================================================== */}
      <section className="relative z-10 max-w-[1040px] mx-auto px-4 sm:px-6 pt-5 sm:pt-12 pb-8 sm:pb-12">
        <motion.div
          initial={{opacity: 0, y: 16}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
          className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-5 dark:drop-shadow-[0_2px_18px_rgba(5,9,36,0.92)]"
        >
          <SectionMicroLabel label="THE NEXT LEVEL OF TRADING STARTS HERE" />

          <h1 className="font-display text-[1.75rem] sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-[-0.03em] leading-[1.08] sm:leading-[1.06] text-[#0F172A] dark:text-white [text-wrap:balance]">
            Where Serious Traders
            <span className="block text-slate-600 dark:text-slate-300">
              Build Their Edge.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-sm lg:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed">
            Trade smarter with Kombat Sampson. Access institutional-grade trading
            signals, automated copy trading, live interactive mentorship, and
            structured educational courses built to accelerate your growth in the
            Forex and Gold markets.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('community')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-white dark:text-[#070B14] dark:hover:bg-slate-100 text-xs font-bold tracking-wide shadow-lg transition-all"
            >
              <span>JOIN THE COMMUNITY</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('services')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-slate-300/80 bg-white/90 hover:bg-white text-[#0F172A] dark:border-white/[0.14] dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:text-white text-xs font-semibold tracking-wide shadow-sm dark:shadow-none transition-all"
            >
              <span>EXPLORE OUR SERVICES</span>
            </button>
          </div>

          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.16em] text-slate-500 dark:text-[#94A3B8] pt-0.5 leading-relaxed">
            TRADING SIGNALS &nbsp;·&nbsp; COPY TRADING &nbsp;·&nbsp; LIVE MENTORSHIP &nbsp;·&nbsp; TRADING COURSES
          </p>
        </motion.div>

        {/* 4-Column Stat Bar */}
        <motion.div
          initial={{opacity: 0, y: 14}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1]}}
          className="mt-7 sm:mt-9 rounded-2xl border border-slate-200/85 bg-white/90 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] shadow-[0_12px_32px_-14px_rgba(15,23,42,0.08)] dark:shadow-none overflow-hidden"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {STAT_BAR_ITEMS.map((stat, idx) => (
              <div
                key={stat.label}
                className={`px-3 sm:px-5 py-3.5 sm:py-5 text-center flex flex-col items-center justify-center gap-1 border-slate-200/80 dark:border-white/[0.08] ${
                  idx < 2 ? 'border-b lg:border-b-0' : ''
                } ${
                  idx % 2 === 0 ? 'border-r' : 'lg:border-r lg:last:border-r-0'
                }`}
              >
                <span className="font-display tabular-nums text-lg sm:text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                  {stat.value}
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-slate-500 dark:text-[#94A3B8]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ====================================================================
          SECTION 02: BRAND INTRODUCTION
      ==================================================================== */}
      <section className="relative z-10 max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 border-t border-slate-200/80 dark:border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center space-y-5 dark:drop-shadow-[0_2px_16px_rgba(5,9,36,0.92)]">
          <SectionMicroLabel label="MORE THAN JUST TRADING" centered />

          <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold tracking-tight leading-[1.12] text-[#0F172A] dark:text-white [text-wrap:balance]">
            Your Ambition.
            <span className="block text-slate-600 dark:text-slate-300">
              Our Trading Ecosystem.
            </span>
          </h2>

          <div className="space-y-3.5 text-xs sm:text-sm lg:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed">
            <p>
              Trading isn&apos;t about guesswork or chasing hype — it&apos;s about
              developing discipline, understanding market structure, and mastering a
              repeatable process. Whether you are just entering the Forex space or
              looking to refine your current approach, Kombat Sampson provides the
              environment and tools to support your journey.
            </p>
            <p>
              Founded on hands-on experience in Forex and Gold (XAUUSD) trading, our
              platform combines real-time market signals, seamless copy trading,
              direct mentorship, and structured learning under one roof.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => onNavigate('mentorship')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-white dark:text-[#070B14] dark:hover:bg-slate-100 text-xs font-bold tracking-wider transition-all"
            >
              <span>DISCOVER KOMBAT SAMPSON</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 03: OUR SERVICES (2x2 BENTO CARD GRID)
      ==================================================================== */}
      <section
        id="services"
        className="relative z-10 max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 border-t border-slate-200/80 dark:border-white/[0.06]"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <SectionMicroLabel label="WHAT WE OFFER" />
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold tracking-tight leading-[1.12] text-[#0F172A] dark:text-white [text-wrap:balance]">
            Everything You Need to{' '}
            <span className="text-slate-500 dark:text-[#64748B]">
              Elevate Your Trading.
            </span>
          </h2>
          <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-[#94A3B8]">
            Choose the path that fits your current stage and trading goals.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {SERVICES_GRID.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.num}
                onClick={() => onNavigate(service.route)}
                className="group cursor-pointer rounded-2xl border border-slate-200/85 bg-white hover:border-[#2563EB]/45 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.18] p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all shadow-[0_12px_32px_-14px_rgba(15,23,42,0.08)] dark:shadow-none"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-[#1D4ED8] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-[#64748B]">
                        {service.num}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[#1D4ED8] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#94A3B8] text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {service.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                      {service.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-200/75 dark:border-white/[0.06]">
                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-[#94A3B8] text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(service.route);
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#1D4ED8] hover:text-[#0F172A] dark:text-white dark:hover:text-sky-300 transition-colors"
                  >
                    <span>{service.ctaLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          SECTION 04: THE KOMBAT ADVANTAGE (4-COLUMN FEATURE STRIP)
      ==================================================================== */}
      <section className="relative z-10 max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 border-t border-slate-200/80 dark:border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <SectionMicroLabel label="THE KOMBAT ADVANTAGE" />
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold tracking-tight leading-[1.12] text-[#0F172A] dark:text-white [text-wrap:balance]">
            Not Just Signals.{' '}
            <span className="text-slate-500 dark:text-[#64748B]">
              A Complete Trading Experience.
            </span>
          </h2>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {ADVANTAGE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="rounded-2xl border border-slate-200/85 bg-white dark:border-white/[0.08] dark:bg-white/[0.03] p-4 sm:p-5 space-y-3 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.06)] dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1D4ED8] dark:text-[#64748B]">
                    {item.num}
                  </span>
                  <Icon className="w-4 h-4 text-[#1D4ED8] dark:text-[#94A3B8]" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-[#0F172A] dark:text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          SECTION 05: EXCLUSIVE WHATSAPP SIGNAL COMMUNITY (SEAMLESS BLEND)
      ==================================================================== */}
      <section className="relative z-10 max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 border-t border-slate-200/80 dark:border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-center">
          {/* Left Copy & Interactive CTA */}
          <div className="lg:col-span-5 relative z-10 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#16A34A] dark:bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.45)] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#15803D] dark:text-[#4ADE80]">
                FREE WHATSAPP TRADING COMMUNITY
              </span>
            </div>

            <h2 className="font-display text-[1.85rem] sm:text-4xl lg:text-[2.6rem] font-extrabold tracking-[-0.03em] leading-[1.06] text-[#0F172A] dark:text-white">
              Join Our
              <br />
              Free
              <br />
              WhatsApp
              <span className="block italic text-[#0F172A]/25 dark:text-white/25 font-extrabold">
                Community!
              </span>
            </h2>

            <div className="h-px w-44 bg-emerald-500/35 dark:bg-emerald-400/20" />

            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#4ADE80] via-[#25D366] to-[#059669] text-white border border-emerald-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_18px_-4px_rgba(37,211,102,0.7)] shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                </span>
                <span className="font-display text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                  Instant Trading Alerts &amp; High-Conviction Setups
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-md">
                Stay ahead of the markets with real-time trading signals, expert
                market insights, and exclusive chart setups — delivered straight to
                your WhatsApp!
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#15803D] dark:text-[#4ADE80]">
                WHAT YOU&apos;LL GET:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200">
                {WHATSAPP_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.75)] shrink-0 mt-1.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="font-display text-xs font-extrabold uppercase tracking-[0.14em] text-[#0F172A] dark:text-white">
                DON&apos;T MISS THE NEXT BIG MARKET MOVE!
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-md">
                Join thousands of traders staying informed, learning, and spotting
                market opportunities together.
              </p>
            </div>

            <div className="pt-2">
              <motion.button
                type="button"
                onClick={() => onNavigate('community')}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: [0, -3, 0],
                        boxShadow: [
                          'inset 0 1.5px 1px rgba(255,255,255,0.72), inset 0 -3px 6px rgba(4,47,46,0.45), 0 5px 0 0 rgba(5,122,85,0.88), 0 16px 34px -6px rgba(37,211,102,0.42)',
                          'inset 0 1.5px 1px rgba(255,255,255,0.85), inset 0 -3px 6px rgba(4,47,46,0.45), 0 5px 0 0 rgba(5,122,85,0.88), 0 22px 44px -4px rgba(37,211,102,0.62)',
                          'inset 0 1.5px 1px rgba(255,255,255,0.72), inset 0 -3px 6px rgba(4,47,46,0.45), 0 5px 0 0 rgba(5,122,85,0.88), 0 16px 34px -6px rgba(37,211,102,0.42)',
                        ],
                      }
                }
                transition={{
                  duration: 3.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.025,
                        transition: {type: 'spring', stiffness: 420, damping: 22},
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: 3,
                        scale: 0.975,
                        transition: {type: 'spring', stiffness: 520, damping: 26},
                      }
                }
                style={{
                  boxShadow:
                    'inset 0 1.5px 1px rgba(255,255,255,0.72), inset 0 -3px 6px rgba(4,47,46,0.45), 0 5px 0 0 rgba(5,122,85,0.88), 0 16px 34px -6px rgba(37,211,102,0.42)',
                }}
                className="group relative overflow-hidden w-full sm:w-auto max-w-full inline-flex items-center justify-center text-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full border border-emerald-200/70 dark:border-emerald-300/45 bg-gradient-to-b from-[#4ADE80]/90 via-[#25D366]/85 to-[#059669]/95 dark:from-[#25D366]/80 dark:via-[#16A34A]/75 dark:to-[#065F46]/90 backdrop-blur-2xl text-white text-[11px] sm:text-xs font-extrabold tracking-wide leading-snug cursor-pointer"
              >
                {/* 3D Top Curved Glass Refraction Dome */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-1.5 top-0.5 h-[46%] rounded-full bg-gradient-to-b from-white/55 via-white/15 to-transparent"
                />

                {/* Animated Liquid Caustic Sheen Sweep */}
                {!shouldReduceMotion && (
                  <motion.span
                    aria-hidden="true"
                    animate={{x: ['-140%', '220%']}}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      repeatDelay: 2.2,
                      ease: 'easeInOut',
                    }}
                    className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                  />
                )}

                <MessageCircle className="relative z-10 w-4 h-4 shrink-0 drop-shadow-sm" />
                <span className="relative z-10 drop-shadow-sm">
                  JOIN OUR FREE WHATSAPP COMMUNITY NOW!
                </span>
                <ChevronRight className="relative z-10 w-4 h-4 shrink-0 drop-shadow-sm transition-transform duration-200 group-hover:translate-x-1" />
              </motion.button>
            </div>
          </div>

          {/* Right Phone Visual — Clean Studio Frame in Light Mode, Feathered on 4 Edges in Dark Mode */}
          <div className="lg:col-span-7 relative select-none pointer-events-none">
            <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/85 bg-slate-900 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.18)] dark:rounded-none dark:border-0 dark:bg-transparent dark:shadow-none feather-mask-x">
              <div className="relative w-full overflow-hidden feather-mask-y">
                <img
                  src="/assets/aistudio/image_3e1065ca.png"
                  alt="SK XAUUSD Community on smartphone"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  className="block w-full h-auto brightness-[1.03] contrast-[1.01] dark:brightness-[0.94] dark:contrast-[1.04]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 08: FAQ SECTION (CENTERED ACCORDION)
      ==================================================================== */}
      <section
        id="faq"
        className="relative z-10 max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 border-t border-slate-200/80 dark:border-white/[0.06]"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <SectionMicroLabel label="FREQUENTLY ASKED QUESTIONS" />
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold tracking-tight leading-[1.12] text-[#0F172A] dark:text-white [text-wrap:balance]">
            Everything You{' '}
            <span className="text-slate-500 dark:text-[#64748B]">
              Need to Know.
            </span>
          </h2>
        </div>

        <div className="mt-8 sm:mt-10 max-w-3xl mx-auto space-y-2.5">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/85 bg-white dark:border-white/[0.08] dark:bg-white/[0.03] overflow-hidden shadow-[0_6px_20px_-12px_rgba(15,23,42,0.06)] dark:shadow-none transition-colors"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                  className="w-full px-4 sm:px-5 py-4 text-left flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1D4ED8] dark:text-[#64748B]">
                      {item.tag}
                    </span>
                    <p className="font-display text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                      {item.question}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 dark:text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0F172A] dark:text-white' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{height: 0, opacity: 0}}
                      animate={{height: 'auto', opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-slate-200/70 dark:border-white/[0.06] text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
