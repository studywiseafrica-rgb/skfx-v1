import {useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  GraduationCap,
  Radio,
  Send,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  X,
} from 'lucide-react';
import type {ShowcasePayload} from '../types';
import {apiFetch} from '../lib/apiClient';
import {formatPrice, formatRelativeTime} from '../lib/forexMath';
import {AnimatedNumber} from './AnimatedNumber';
import {ChartStructureDiagram} from './ChartStructureDiagram';
import {LotCalculatorPanel} from './LotCalculatorPanel';
import {ResilientImage} from './ResilientImage';

export type SiteRoute =
  | 'home'
  | 'academy'
  | 'signals'
  | 'mentorship'
  | 'simulator'
  | 'copy-trading'
  | 'hfm-connect'
  | 'community'
  | 'plans'
  | 'gold-blueprint'
  | 'signin'
  | 'signup';

export const ROUTE_PATHS: Record<SiteRoute, string> = {
  home: '/',
  academy: '/academy',
  signals: '/signals',
  mentorship: '/mentorship',
  simulator: '/simulator',
  'copy-trading': '/copy-trading',
  'hfm-connect': '/hfm-copy-trading',
  community: '/community',
  plans: '/plans',
  'gold-blueprint': '/gold-blueprint',
  signin: '/signin',
  signup: '/signup',
};

export function pathToRoute(pathname: string): SiteRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.entries(ROUTE_PATHS) as [SiteRoute, string][]).find(
    ([, path]) => path === clean,
  );
  return match ? match[0] : 'home';
}

export interface FeaturedResource {
  id: string;
  title: string;
  access: 'Free' | 'Premium';
  level: string;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  tier: 'FREE' | 'PREMIUM' | 'ELITE';
  name: string;
  subtitle: string;
  priceLabel: string;
  cadence: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  tierColor: string;
}

interface SubPageProps {
  route: Exclude<SiteRoute, 'home' | 'signin' | 'signup'>;
  showcase: ShowcasePayload | null;
  featuredResources: FeaturedResource[];
  subscriptionPlans: SubscriptionPlan[];
  onNavigate: (route: SiteRoute) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onEnterDesk: () => void;
  isSignedIn: boolean;
}

type DiagramPreviewType =
  | 'liquidity_sweep'
  | 'bos_choch'
  | 'fvg_imbalance'
  | 'order_block';

function PageHeaderBar({
  eyebrow,
  title,
  subtitle,
  onBack,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="liquid-glass-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-[#0F172A] dark:text-white hover:brightness-110 transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </button>

      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-[#1D4ED8] dark:text-sky-300 mb-1.5">
          {eyebrow}
        </p>
        <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight [text-wrap:balance]">
          {title}
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-slate-200/85 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

interface TradingMembershipPlan {
  id: 'monthly' | 'three-month' | 'six-month' | 'yearly';
  title: string;
  price: string;
  period: string;
  badge?: {
    label: string;
    variant: 'popular' | 'success';
  };
  featuresHeading: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const PAYMENT_OPTIONS = [
  'Card Payments',
  'Cryptocurrency',
  'Other Supported Payment Methods',
] as const;

const TRADING_MEMBERSHIP_PLANS: TradingMembershipPlan[] = [
  {
    id: 'monthly',
    title: 'MONTHLY PLAN',
    price: '$75.00',
    period: '/ MONTH',
    featuresHeading: 'WHAT YOU GET:',
    features: [
      'Access to VIP Forex and Gold trading signals.',
      'Access to Premium Gold Strategy updates.',
      'Access to selected trading courses.',
      'Private trading community.',
      'Trading education and market updates.',
      'Standard member support.',
    ],
    cta: 'CHOOSE MONTHLY PLAN →',
  },
  {
    id: 'three-month',
    title: '3-MONTH PLAN',
    price: '$197.00',
    period: '/ 3 MONTHS',
    featuresHeading: 'EVERYTHING IN THE MONTHLY PLAN, PLUS:',
    features: [
      'Extended access to VIP trading signals.',
      'Premium Gold Strategy subscription access.',
      'Access to additional trading lessons.',
      'Weekly live educational trading sessions.',
      'Trading journal and planning resources.',
      'Priority community support.',
    ],
    cta: 'CHOOSE 3-MONTH PLAN →',
  },
  {
    id: 'six-month',
    title: '6-MONTH PLAN',
    price: '$339.00',
    period: '/ 6 MONTHS',
    badge: {
      label: 'POPULAR CHOICE',
      variant: 'popular',
    },
    featuresHeading: 'EVERYTHING IN THE 3-MONTH PLAN, PLUS:',
    features: [
      'Six months of membership access.',
      'Extended trading education resources.',
      'Additional live trading analysis sessions.',
      'Advanced Forex and Gold educational content.',
      'Trading performance review resources.',
      'Priority member support.',
    ],
    cta: 'CHOOSE 6-MONTH PLAN →',
    highlighted: true,
  },
  {
    id: 'yearly',
    title: 'YEARLY PLAN',
    price: '$599.00',
    period: '/ YEAR',
    badge: {
      label: 'PREMIUM MEMBERSHIP',
      variant: 'success',
    },
    featuresHeading: 'EVERYTHING IN THE 6-MONTH PLAN, PLUS:',
    features: [
      'Full-year membership access.',
      'Extended access to Premium Gold Strategy updates.',
      'Advanced trading education resources.',
      'Access to exclusive live educational sessions.',
      'Additional trading analysis resources.',
      'Premium community membership.',
      'Highest-priority member support.',
    ],
    cta: 'CHOOSE YEARLY PLAN →',
  },
];

export function DedicatedSubPage({
  route,
  showcase,
  featuredResources,
  subscriptionPlans: _subscriptionPlans,
  onNavigate,
  onOpenAuth,
  onEnterDesk,
  isSignedIn,
}: SubPageProps) {
  const [resourceFilter, setResourceFilter] = useState<'all' | 'Free' | 'Premium'>('all');
  const [learningPath, setLearningPath] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');
  const [hfmLinkCopied, setHfmLinkCopied] = useState(false);
  const [activeDiagram, setActiveDiagram] = useState<DiagramPreviewType>('liquidity_sweep');
  const [simRisk, setSimRisk] = useState(1.0);
  const [simWinRate, setSimWinRate] = useState(60);
  const [simRr, setSimRr] = useState(3.0);

  const [signalAccessMode, setSignalAccessMode] = useState<
    null | 'copy-trading' | 'vip-signals'
  >(null);
  const [joinPath, setJoinPath] = useState<'exness' | 'direct'>('exness');
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinDone, setJoinDone] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [anatomyPulse, setAnatomyPulse] = useState(false);

  const [selectedPlanModal, setSelectedPlanModal] = useState<TradingMembershipPlan | null>(null);
  const [planPaymentMethod, setPlanPaymentMethod] =
    useState<(typeof PAYMENT_OPTIONS)[number]>('Card Payments');
  const [planName, setPlanName] = useState('');
  const [planEmail, setPlanEmail] = useState('');
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planSubmitted, setPlanSubmitted] = useState(false);
  const [planError, setPlanError] = useState('');

  const openPlanCheckout = (plan: TradingMembershipPlan) => {
    setPlanSubmitted(false);
    setPlanError('');
    setSelectedPlanModal(plan);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanModal) return;
    setPlanError('');
    setPlanSubmitting(true);
    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: planName,
          email: planEmail,
          interest: 'VIP Signals & Academy',
          message: `[${selectedPlanModal.title} · ${selectedPlanModal.price} ${selectedPlanModal.period}] Payment Method: ${planPaymentMethod}`,
        }),
      });
      const data = (await res.json()) as {error?: string};
      if (!res.ok) {
        setPlanError(data.error || 'Could not submit plan request.');
        return;
      }
      setPlanSubmitted(true);
      setPlanName('');
      setPlanEmail('');
    } catch {
      setPlanError('Network error. Please try again.');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const openSignalModal = (mode: 'copy-trading' | 'vip-signals') => {
    setJoinDone(false);
    setJoinError('');
    setSignalAccessMode(mode);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSubmitting(true);
    try {
      const interest =
        joinPath === 'exness' ? 'Exness Partner Free Access' : 'VIP Signals & Academy';
      const prefix =
        signalAccessMode === 'copy-trading' ? '[Copy Trading]' : '[VIP Signals]';
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: joinName,
          email: joinEmail,
          interest,
          message: `${prefix} (${joinPath === 'exness' ? 'Exness Partnership' : 'Direct Plan'}) ${joinMessage}`.trim(),
        }),
      });
      const data = (await res.json()) as {error?: string};
      if (!res.ok) {
        setJoinError(data.error || 'Could not submit request.');
        return;
      }
      setJoinDone(true);
      setJoinName('');
      setJoinEmail('');
      setJoinMessage('');
    } catch {
      setJoinError('Network error. Please try again.');
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleDeskAction = () => {
    if (isSignedIn) onEnterDesk();
    else onOpenAuth('register');
  };

  const filteredResources = useMemo(() => {
    return featuredResources.filter((r) => {
      const accessOk = resourceFilter === 'all' || r.access === resourceFilter;
      const levelOk =
        learningPath === 'all' ||
        r.level.toLowerCase().includes(learningPath.toLowerCase()) ||
        r.level === 'All Levels';
      return accessOk && levelOk;
    });
  }, [featuredResources, resourceFilter, learningPath]);

  // Deterministic 20-trade expectancy math for Trading Simulator challenge projection
  const simProjection = useMemo(() => {
    const trades = 20;
    const wins = Math.round((trades * simWinRate) / 100);
    const losses = trades - wins;
    const netReturnPct = wins * simRisk * simRr - losses * simRisk;
    const balance = 10000 * (1 + netReturnPct / 100);
    return {
      wins,
      losses,
      netReturnPct: Math.round(netReturnPct * 10) / 10,
      endingBalance: Math.round(balance),
    };
  }, [simRisk, simWinRate, simRr]);

  return (
    <motion.div
      key={route}
      initial={{opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{duration: 0.24, ease: [0.16, 1, 0.3, 1]}}
      className="max-w-[1040px] mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-10 space-y-6 sm:space-y-8"
    >
      {route === 'academy' && (
        <>
          <PageHeaderBar
            eyebrow="SK Academy · Structured Learning Ecosystem"
            title="Everything You Need to Develop as a Trader."
            subtitle="From your first trading lesson to advanced market analysis, explore an ecosystem designed to support your learning journey."
            onBack={() => onNavigate('home')}
          />

          {/* 3-Pillar Progression Trio (01 / 02 / 03) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {[
              {
                num: '01',
                title: '01. SK Trading Academy',
                tag: 'Start from zero',
                tagColor: 'text-[#16A34A] dark:text-emerald-400',
                desc: 'A structured educational programme that takes you through the fundamentals of Forex trading, technical analysis, market structure, liquidity, price action, risk management, and advanced trading concepts.',
                note: 'Explore beginner, intermediate, and advanced learning paths.',
                cta: 'Explore the Academy →',
                onClick: () => {
                  const el = document.getElementById('academy-curriculum');
                  el?.scrollIntoView({behavior: 'smooth'});
                },
                accentRing: 'hover:ring-1 hover:ring-[#16A34A]/50',
              },
              {
                num: '02',
                title: '02. SK Trading Simulator',
                tag: 'Learn through practice',
                tagColor: 'text-[#1D4ED8] dark:text-sky-300',
                desc: 'Put your knowledge into practice in a simulated trading environment. Study historical price movements, practise analysing charts, test your trading ideas, and monitor your virtual trading performance without risking real money.',
                note: 'Calibrate risk sizing and virtual execution accuracy.',
                cta: 'Explore the Simulator →',
                onClick: () => onNavigate('simulator'),
                accentRing: 'hover:ring-1 hover:ring-[#2563EB]/50',
              },
              {
                num: '03',
                title: '03. SK Gold Blueprint',
                tag: 'Premium exclusive',
                tagColor: 'text-[#DC2626] dark:text-red-400',
                desc: 'Take your Gold trading education further with our exclusive XAUUSD programme. Explore the SK Gold methodology through structured lessons, detailed chart breakdowns, strategy explanations, and historical testing.',
                note: 'Focused XAUUSD London & New York killzone framework.',
                cta: 'Discover Gold Blueprint →',
                onClick: () => onNavigate('gold-blueprint'),
                accentRing: 'ring-1 ring-[#2563EB]/45 dark:ring-sky-400/40',
              },
            ].map((pillar, idx) => (
              <motion.div
                key={pillar.num}
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.28, delay: idx * 0.06}}
                whileHover={{y: -4}}
                className={`liquid-glass-card rounded-3xl p-7 flex flex-col justify-between transition-all ${pillar.accentRing}`}
              >
                <div className="space-y-3">
                  <div className={`text-xs font-semibold ${pillar.tagColor}`}>
                    {pillar.tag}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                    {pillar.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-200/85 leading-relaxed">
                    {pillar.desc}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-300/75 pt-1">
                    {pillar.note}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={pillar.onClick}
                  className="mt-6 liquid-glass-pill inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-[#0F172A] dark:text-white hover:brightness-110 transition-all self-start"
                >
                  <span>{pillar.cta}</span>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Interactive Curriculum & Learning Paths Explorer */}
          <div id="academy-curriculum" className="space-y-6 pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="liquid-glass-pill inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl sm:rounded-full max-w-full">
                  {[
                    {id: 'all', label: 'All Levels'},
                    {id: 'Beginner', label: 'Beginner'},
                    {id: 'Intermediate', label: 'Intermediate'},
                    {id: 'Advanced', label: 'Advanced'},
                  ].map((lvl) => {
                    const active = learningPath === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setLearningPath(lvl.id as typeof learningPath)}
                        className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-200/80'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="academy-level-pill"
                            transition={{type: 'spring', stiffness: 450, damping: 34}}
                            className="absolute inset-0 rounded-full bg-[#16A34A]"
                          />
                        )}
                        <span className="relative z-10">{lvl.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="liquid-glass-pill inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl sm:rounded-full max-w-full">
                  {[
                    {id: 'all', label: 'All Resources'},
                    {id: 'Free', label: 'Free'},
                    {id: 'Premium', label: 'Premium'},
                  ].map((tab) => {
                    const active = resourceFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setResourceFilter(tab.id as typeof resourceFilter)}
                        className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-200/80'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="subpage-academy-filter"
                            transition={{type: 'spring', stiffness: 450, damping: 34}}
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8]"
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeskAction}
                className="liquid-glass-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors self-start lg:self-auto"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Open Full Lessons in My Dashboard</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResources.map((res) => (
                <motion.article
                  key={res.id}
                  layout
                  whileHover={{y: -4}}
                  className="liquid-glass-card rounded-3xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300/80">
                      <span
                        className={`font-semibold ${
                          res.access === 'Free'
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : 'text-[#1D4ED8] dark:text-sky-300'
                        }`}
                      >
                        {res.access}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{res.level}</span>
                    </div>
                    <h3 className="mt-2.5 font-display text-lg font-bold text-[#0F172A] dark:text-white">
                      {res.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-200/85 leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeskAction}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] dark:text-emerald-400 hover:underline self-start"
                  >
                    <span>Start Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.article>
              ))}
            </div>
          </div>

          {showcase?.courses && showcase.courses.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                Interactive Desk Course Tracks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {showcase.courses.map((crs) => (
                  <div
                    key={crs.id}
                    className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col"
                  >
                    <div className="h-44 overflow-hidden">
                      <ResilientImage
                        src={crs.thumbnailUrl}
                        alt={crs.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-300/80">
                          {crs.level} · {crs.lessonCount} Lessons · {crs.estimatedHours}h
                        </div>
                        <h3 className="mt-1.5 font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          {crs.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-200/85">
                          {crs.subtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeskAction}
                        className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] dark:text-sky-300 hover:underline"
                      >
                        <span>Enter Classroom</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {route === 'gold-blueprint' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('academy')}
              className="liquid-glass-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-[#0F172A] dark:text-white hover:brightness-110 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Academy</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="liquid-glass-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:brightness-110 transition-all"
            >
              <span>Home</span>
            </button>
          </div>

          <div className="liquid-glass-card rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-semibold text-[#DC2626] dark:text-red-400">
                03. SK Gold Blueprint · Premium Exclusive
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight [text-wrap:balance]">
                Master the SK Gold (XAUUSD) Methodology
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                Take your Gold trading education further with our exclusive XAUUSD programme. Explore the SK Gold methodology through structured lessons, detailed chart breakdowns, strategy explanations, and historical testing.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDeskAction}
                  className="liquid-glass-btn inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white text-xs sm:text-sm font-semibold hover:brightness-110"
                >
                  <span>Unlock Gold Blueprint in My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('mentorship')}
                  className="liquid-glass-pill px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-[#0F172A] dark:text-white hover:brightness-110"
                >
                  Mentorship & Gold Strategy
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200/85 dark:border-white/15 h-60 sm:h-72 shadow-sm dark:shadow-none">
              <ResilientImage
                src="/src/assets/images/course_xauusd_mastery_1795218762721.jpg"
                alt="SK Gold Blueprint XAUUSD Mastery"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: 'Module 01',
                title: 'Asian Range & Liquidity Sweeps',
                desc: 'Identify high-probability London & New York pre-market highs and lows engineered for Gold stop hunts.',
              },
              {
                num: 'Module 02',
                title: 'Killzone Timing (08:20–10:30 EST)',
                desc: 'Execute cleanly during peak COMEX and US Dollar opening liquidity windows on XAUUSD.',
              },
              {
                num: 'Module 03',
                title: 'Displacement & FVG Entry Precision',
                desc: 'Filter false breakouts using clean structural displacement and 50% Fair Value Gap equilibrium.',
              },
              {
                num: 'Module 04',
                title: 'Historical Backtesting & Volatility Sizing',
                desc: 'Review multi-month Gold case studies and calibrate stop distances for XAUUSD pip dynamics.',
              },
            ].map((mod) => (
              <div key={mod.num} className="liquid-glass-card rounded-3xl p-6 space-y-2">
                <span className="font-mono text-xs font-bold text-[#1D4ED8] dark:text-sky-300">
                  {mod.num}
                </span>
                <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                  {mod.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-200/85 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
              Interactive XAUUSD Killzone Execution Model
            </h2>
            <ChartStructureDiagram mode="lesson" diagramType="gold_killzone" />
          </div>
        </>
      )}

      {route === 'signals' && (
        <>
          {/* Back Navigation */}
          <div>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="liquid-glass-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-[#0F172A] dark:text-white hover:brightness-110 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          {/* 1. HERO: Clear entries. Clear exits. */}
          <section className="liquid-glass-card rounded-3xl p-5 sm:p-12 lg:p-14 relative overflow-hidden">
            <div className="max-w-3xl space-y-5 sm:space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1D4ED8] dark:text-sky-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10">
                  <Send className="w-3 h-3" />
                  Telegram
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10">
                  <Radio className="w-3 h-3" />
                  Discord
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#16A34A]/30 bg-[#16A34A]/10 text-[#15803D] dark:text-emerald-300">
                  <Bell className="w-3 h-3" />
                  Your Phone
                </span>
              </div>

              <h1 className="font-display text-[clamp(2rem,7.5vw,4.25rem)] font-extrabold tracking-tight leading-[1.03] text-[#0F172A] dark:text-white">
                <span className="block">Clear entries.</span>
                <span className="block text-[#1D4ED8] dark:text-sky-300">
                  Clear exits.
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-200/90 leading-relaxed max-w-2xl">
                Premium XAUUSD signals with a defined entry, stop loss, and take profit targets, delivered to Telegram, Discord, and your phone.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{y: -2}}
                  whileTap={{scale: 0.97}}
                  type="button"
                  onClick={() => onNavigate('plans')}
                  className="liquid-glass-btn w-full sm:w-auto justify-center inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white text-sm font-semibold hover:brightness-110 transition-all"
                >
                  <span>Get VIP Signals</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('ways-to-join')
                      ?.scrollIntoView({behavior: 'smooth'});
                  }}
                  className="liquid-glass-pill w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-[#0F172A] dark:text-white hover:brightness-110 transition-all"
                >
                  <span>Compare ways to join</span>
                </button>
              </div>
            </div>
          </section>

          {/* 2. ANATOMY OF A SIGNAL */}
          <section
            id="anatomy-sample"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-sky-300">
                ANATOMY OF A SIGNAL
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.08] text-[#0F172A] dark:text-white">
                <span className="block">A complete plan</span>
                <span className="block">for every trade.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed max-w-xl">
                Every signal lands in the VIP channel just like this: the entry, the stop loss, and take profit targets with their distance in pips, so you always know where to get in, where to get out, and what you are risking.
              </p>
            </div>

            <div className="lg:col-span-6">
              <motion.div
                animate={
                  anatomyPulse
                    ? {scale: [1, 1.02, 1], boxShadow: '0 0 42px rgba(37,99,235,0.45)'}
                    : {}
                }
                transition={{duration: 0.55}}
                className="liquid-glass-card rounded-3xl p-5 sm:p-8 border border-[#2563EB]/35 dark:border-sky-400/35 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-white/12">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#16A34A]/15 text-[#16A34A] dark:text-emerald-400 text-xs font-bold tracking-wide shrink-0">
                      BUY NOW
                    </span>
                    <div>
                      <div className="font-display text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-white">
                        XAUUSD (GOLD)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300/80">
                        New York Killzone · M15 Liquidity Sweep
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1D4ED8] dark:text-sky-300">
                    Max R:R 1:4.0
                  </span>
                </div>

                <div className="space-y-3 font-mono text-sm tabular-nums">
                  <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 px-4 py-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      Entry Price
                    </span>
                    <span className="font-bold text-[#0F172A] dark:text-white">
                      2642.50
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/25 px-4 py-3">
                    <span className="text-xs font-semibold text-[#DC2626] dark:text-red-400 uppercase tracking-wider">
                      Stop Loss
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#DC2626]/90 dark:text-red-300">
                        -45 pips
                      </span>
                      <span className="font-bold text-[#DC2626] dark:text-red-400">
                        2638.00
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {[
                      {label: 'TP 1', price: '2648.50', pips: '+60 pips'},
                      {label: 'TP 2', price: '2654.50', pips: '+120 pips'},
                      {label: 'TP 3', price: '2660.50', pips: '+180 pips'},
                    ].map((tp) => (
                      <div
                        key={tp.label}
                        className="rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/25 px-3.5 py-3"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#16A34A] dark:text-emerald-400">
                          <span>{tp.label}</span>
                          <span>{tp.pips}</span>
                        </div>
                        <div className="mt-1 font-bold text-[#0F172A] dark:text-white">
                          {tp.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 dark:text-slate-300/80">
                  <span>Delivered simultaneously to Telegram, Discord & App</span>
                  <span className="font-semibold text-[#16A34A] dark:text-emerald-400">
                    1% Max Risk Suggested
                  </span>
                </div>
              </motion.div>
            </div>
          </section>

          {/* 3. TWO WAYS TO JOIN — SYMMETRICAL SIDE-BY-SIDE CARDS */}
          <section id="ways-to-join" className="space-y-8 pt-4">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#0F172A] dark:text-white">
                <span className="block">Two ways to join.</span>
                <span className="block text-[#1D4ED8] dark:text-sky-300">
                  The same VIP signals.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85">
                Start free through our Exness partnership, or pick a plan and skip the broker.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Card 1: Copy Trading (Hands-Free Option) */}
              <motion.div
                whileHover={{y: -4}}
                transition={{duration: 0.18}}
                className="liquid-glass-card rounded-3xl p-6 sm:p-10 flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-sky-300">
                    AUTOMATED EXECUTION
                  </p>
                  <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white">
                    Copy Trading
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-normal text-slate-600 dark:text-slate-200/85 leading-relaxed sm:min-h-[3.25rem]">
                    Link your trading account once and mirror every position automatically in real time—no charts or manual entries required.
                  </p>

                  {/* Horizontal Divider Line */}
                  <div className="my-7 border-t border-slate-200/80 dark:border-white/12" />

                  {/* Key Metric / Cost Anchor */}
                  <div className="space-y-1">
                    <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                      100% Automated
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-300/80">
                      Hands-free execution
                    </div>
                  </div>

                  {/* Checklist (Parallel, Action-First Single-Line Bullets) */}
                  <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-200">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>Execute trades on your account automatically 24/5.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>Scale proportional lot sizing based on your balance.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>Pause, adjust risk, or disconnect anytime.</span>
                    </li>
                  </ul>
                </div>

                {/* Action Triggers: One Solid High-Contrast Pill + One Plain Text Link */}
                <div className="mt-8 pt-2 flex flex-col items-start gap-3">
                  <motion.button
                    whileTap={{scale: 0.98}}
                    type="button"
                    onClick={() => openSignalModal('copy-trading')}
                    className="w-full py-3.5 px-6 rounded-full bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-white dark:text-[#030812] dark:hover:bg-slate-100 text-sm font-bold transition-colors shadow-lg"
                  >
                    Connect Copy Trading →
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => onNavigate('copy-trading')}
                    className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#1D4ED8] dark:hover:text-sky-300 transition-colors pl-1"
                  >
                    See performance stats →
                  </button>
                </div>
              </motion.div>

              {/* Card 2: VIP Signals (Manual Control Option) */}
              <motion.div
                whileHover={{y: -4}}
                transition={{duration: 0.18}}
                className="liquid-glass-card rounded-3xl p-6 sm:p-10 ring-1 ring-[#2563EB]/45 dark:ring-sky-400/45 flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#16A34A] dark:text-emerald-400">
                    MANUAL CONTROL
                  </p>
                  <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white">
                    VIP Signals
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-normal text-slate-600 dark:text-slate-200/85 leading-relaxed sm:min-h-[3.25rem]">
                    Receive exact entry, stop-loss, and take-profit levels straight to your phone so you decide which setups to take.
                  </p>

                  {/* Horizontal Divider Line */}
                  <div className="my-7 border-t border-slate-200/80 dark:border-white/12" />

                  {/* Key Metric / Cost Anchor */}
                  <div className="space-y-1">
                    <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                      Full Control
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-300/80">
                      Instant Telegram & app alerts
                    </div>
                  </div>

                  {/* Checklist (Parallel, Action-First Single-Line Bullets) */}
                  <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-200">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>Receive clear entry price, stop loss, and 3 take-profit targets.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>Choose your own lot size and broker on every trade.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>Include market breakdowns and trade management updates.</span>
                    </li>
                  </ul>
                </div>

                {/* Action Triggers: One Solid High-Contrast Pill + One Plain Text Link */}
                <div className="mt-8 pt-2 flex flex-col items-start gap-3">
                  <motion.button
                    whileTap={{scale: 0.98}}
                    type="button"
                    onClick={() => onNavigate('plans')}
                    className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white hover:brightness-110 text-sm font-bold transition-all shadow-lg"
                  >
                    Get VIP Signals →
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnatomyPulse(true);
                      document
                        .getElementById('anatomy-sample')
                        ?.scrollIntoView({behavior: 'smooth', block: 'center'});
                      window.setTimeout(() => setAnatomyPulse(false), 900);
                    }}
                    className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#1D4ED8] dark:hover:text-sky-300 transition-colors pl-1"
                  >
                    View sample signal →
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Interactive Market Structure & Live SK Desk Signals */}
          <div className="liquid-glass-card rounded-3xl p-4 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="liquid-glass-pill inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl sm:rounded-full max-w-full">
                {[
                  {id: 'liquidity_sweep', label: 'Liquidity Sweep'},
                  {id: 'bos_choch', label: 'Market Structure'},
                  {id: 'fvg_imbalance', label: 'Fair Value Gap'},
                  {id: 'order_block', label: 'Order Block'},
                ].map((opt) => {
                  const active = activeDiagram === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setActiveDiagram(opt.id as DiagramPreviewType)}
                      className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-200/80'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="signals-diagram-tab"
                          transition={{type: 'spring', stiffness: 450, damping: 34}}
                          className="absolute inset-0 rounded-full bg-[#2563EB]"
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleDeskAction}
                className="liquid-glass-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D]"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Execute Setups in My Dashboard</span>
              </button>
            </div>

            <ChartStructureDiagram mode="lesson" diagramType={activeDiagram} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(showcase?.recentSignals ?? []).map((sig) => {
              const isBuy = sig.direction === 'BUY';
              return (
                <motion.div
                  key={sig.id}
                  whileHover={{y: -3}}
                  className="liquid-glass-card rounded-3xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        {sig.pair}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isBuy
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : 'text-[#DC2626] dark:text-red-400'
                        }`}
                      >
                        {isBuy ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {sig.direction}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-300/80">
                      {sig.timeframe} · {sig.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-200/85 leading-relaxed">
                    {sig.thesis}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/70 dark:border-white/10 font-mono text-xs tabular-nums">
                    <div>
                      <div className="text-slate-400 text-[11px]">Entry</div>
                      <div className="font-semibold text-[#0F172A] dark:text-white">
                        {formatPrice(sig.pair, sig.entry)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Stop Loss</div>
                      <div className="font-semibold text-[#DC2626] dark:text-red-400">
                        {formatPrice(sig.pair, sig.stopLoss)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">TP1 ({sig.riskReward})</div>
                      <div className="font-semibold text-[#16A34A] dark:text-emerald-400">
                        {formatPrice(sig.pair, sig.tp1)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 text-slate-500 dark:text-slate-300/75">
                    <span>{sig.session} Session · {formatRelativeTime(sig.createdAt)}</span>
                    <button
                      type="button"
                      onClick={handleDeskAction}
                      className="font-semibold text-[#1D4ED8] dark:text-sky-300 hover:underline"
                    >
                      Take Trade
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Interactive Join Modal for Copy Trading & VIP Signals */}
          <AnimatePresence>
            {signalAccessMode && (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#02050D]/75 backdrop-blur-md p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSignalAccessMode(null);
                }}
              >
                <motion.div
                  initial={{opacity: 0, scale: 0.96, y: 8}}
                  animate={{opacity: 1, scale: 1, y: 0}}
                  exit={{opacity: 0, scale: 0.96, y: 8}}
                  transition={{duration: 0.18}}
                  className="liquid-glass-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-white/12">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8] dark:text-sky-300">
                        {signalAccessMode === 'copy-trading'
                          ? 'AUTOMATED EXECUTION'
                          : 'MANUAL CONTROL'}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold text-[#0F172A] dark:text-white">
                        {signalAccessMode === 'copy-trading'
                          ? 'Connect Copy Trading'
                          : 'Get VIP Signals'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignalAccessMode(null)}
                      aria-label="Close modal"
                      className="p-1.5 rounded-full text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {joinDone ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-[#16A34A]/35 bg-[#16A34A]/15 p-4 text-sm text-[#15803D] dark:text-emerald-200">
                        Request submitted. Check your inbox for Telegram, Discord, and desk onboarding instructions.
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSignalAccessMode(null);
                            handleDeskAction();
                          }}
                          className="liquid-glass-btn px-5 py-2.5 rounded-full bg-[#2563EB] text-white text-xs font-semibold"
                        >
                          {isSignedIn ? 'Open My Dashboard' : 'Create Desk Account'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                          Choose Access Path
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setJoinPath('exness')}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                              joinPath === 'exness'
                                ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#15803D] dark:text-emerald-300'
                                : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Exness Free Access
                          </button>
                          <button
                            type="button"
                            onClick={() => setJoinPath('direct')}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                              joinPath === 'direct'
                                ? 'border-[#2563EB] bg-[#2563EB]/15 text-[#1D4ED8] dark:text-sky-300'
                                : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Direct Plan (No Broker)
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <input
                        type="email"
                        required
                        value={joinEmail}
                        onChange={(e) => setJoinEmail(e.target.value)}
                        placeholder="Email Address (for Telegram & App invite)"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <textarea
                        rows={2}
                        value={joinMessage}
                        onChange={(e) => setJoinMessage(e.target.value)}
                        placeholder="Telegram handle or broker note (optional)"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />

                      {joinError && (
                        <p className="text-xs text-[#DC2626]">{joinError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={joinSubmitting}
                        className="liquid-glass-btn w-full py-3 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white text-xs sm:text-sm font-semibold hover:brightness-110 disabled:opacity-60"
                      >
                        {joinSubmitting
                          ? 'Submitting...'
                          : signalAccessMode === 'copy-trading'
                            ? 'Connect Copy Trading →'
                            : 'Get VIP Signals →'}
                      </button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {route === 'simulator' && (
        <>
          <PageHeaderBar
            eyebrow="Trading Simulator · Virtual trading · Challenges"
            title="Virtual Risk Simulator & Position Sizing Lab"
            subtitle="Calibrate exact lot sizes, stop-loss distances, and 20-trade expectancy outcomes before putting live capital at risk."
            onBack={() => onNavigate('home')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <LotCalculatorPanel />
            </div>

            <div className="liquid-glass-card lg:col-span-5 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A] dark:text-emerald-400">
                <Activity className="w-4 h-4" />
                <span>20-Trade Consistency Challenge</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                Virtual Expectancy Simulator ($10,000)
              </h3>

              <div className="space-y-4 text-xs">
                <label className="block space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-200">
                    <span>Risk Per Trade</span>
                    <span className="font-mono tabular-nums">{simRisk.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={simRisk}
                    onChange={(e) => setSimRisk(Number(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-200">
                    <span>Discipline Win Rate</span>
                    <span className="font-mono tabular-nums">{simWinRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="85"
                    step="5"
                    value={simWinRate}
                    onChange={(e) => setSimWinRate(Number(e.target.value))}
                    className="w-full accent-[#16A34A]"
                  />
                </label>

                <label className="block space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-200">
                    <span>Average Target R:R</span>
                    <span className="font-mono tabular-nums">1:{simRr.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="5"
                    step="0.5"
                    value={simRr}
                    onChange={(e) => setSimRr(Number(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200/70 dark:border-white/15 font-mono tabular-nums">
                <div className="rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 p-3.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-300/75">
                    Simulated Return
                  </div>
                  <div
                    className={`mt-1 text-xl font-bold ${
                      simProjection.netReturnPct >= 0
                        ? 'text-[#16A34A] dark:text-emerald-400'
                        : 'text-[#DC2626] dark:text-red-400'
                    }`}
                  >
                    {simProjection.netReturnPct >= 0 ? '+' : ''}
                    {simProjection.netReturnPct}%
                  </div>
                </div>
                <div className="rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 p-3.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-300/75">
                    Projected Equity
                  </div>
                  <div className="mt-1 text-xl font-bold text-[#0F172A] dark:text-white">
                    ${simProjection.endingBalance.toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeskAction}
                className="liquid-glass-btn w-full py-3 rounded-full bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D]"
              >
                Log Simulated Trades in My Dashboard
              </button>
            </div>
          </div>
        </>
      )}

      {route === 'copy-trading' && (
        <>
          <PageHeaderBar
            eyebrow="Copy Trading · Strategy following · Performance"
            title="Strategy Following & Verified Desk Performance"
            subtitle="Inspect SKFX ACADEMY setup execution standards, fixed-fractional risk parameters, and recent desk performance metrics."
            onBack={() => onNavigate('home')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="liquid-glass-card rounded-3xl p-6 space-y-2">
              <TrendingUp className="w-5 h-5 text-[#16A34A] dark:text-emerald-400" />
              <div className="font-display text-3xl font-bold text-[#0F172A] dark:text-white tabular-nums">
                <AnimatedNumber value={showcase?.metrics.winRatePercent ?? 0} suffix="%" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300/80">
                Tracked Desk Accuracy
              </p>
            </div>
            <div className="liquid-glass-card rounded-3xl p-6 space-y-2">
              <Award className="w-5 h-5 text-[#1D4ED8] dark:text-sky-300" />
              <div className="font-display text-3xl font-bold text-[#0F172A] dark:text-white tabular-nums">
                +<AnimatedNumber value={showcase?.metrics.netPips90Days ?? 0} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300/80">
                90-Day Cumulative Pips
              </p>
            </div>
            <div className="liquid-glass-card rounded-3xl p-6 space-y-2">
              <Copy className="w-5 h-5 text-[#DC2626] dark:text-red-400" />
              <div className="font-display text-3xl font-bold text-[#0F172A] dark:text-white tabular-nums">
                {showcase?.metrics.avgRiskReward ?? '0:0'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300/80">
                Target Asymmetric Risk-Reward
              </p>
            </div>
          </div>

          <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#16A34A] dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Capital Protection First</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                Follow Institutional Entries with Fixed Lot Calibration
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-200/85">
                Every followed setup calculates lot size automatically from your chosen risk percentage inside My Dashboard so one losing trade never disrupts your account.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeskAction}
              className="liquid-glass-btn px-6 py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#16A34A] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Connect Strategy Desk
            </button>
          </div>
        </>
      )}

      {route === 'hfm-connect' && (
        <>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onNavigate('signals')}
              className="liquid-glass-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-[#0F172A] dark:text-white hover:brightness-110 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Signals &amp; Analysis</span>
            </button>

            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1D4ED8] dark:text-sky-300 mb-2">
                HFM COPY TRADING GUIDE
              </p>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-[1.1] [text-wrap:balance]">
                HOW TO CONNECT YOUR HFM ACCOUNT TO MY COPY TRADING ACCOUNT
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                Follow the steps below to connect your HFM trading account to mine and allow my trades to be copied to your account.
              </p>
            </div>
          </div>

          <div className="max-w-3xl space-y-4 sm:space-y-5">
            {/* Step 1 */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-8 flex items-start gap-3.5 sm:gap-5">
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#2563EB] text-white font-mono text-xs font-extrabold shrink-0 shadow-[0_6px_18px_rgba(37,99,235,0.35)]">
                01
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                  Step 1: Fund your account
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                  Deposit a minimum of $50 into your HFM trading account to get started.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-8 ring-2 ring-[#2563EB]/50 dark:ring-sky-400/40 flex items-start gap-3.5 sm:gap-5">
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#2563EB] text-white font-mono text-xs font-extrabold shrink-0 shadow-[0_6px_18px_rgba(37,99,235,0.35)]">
                02
              </span>
              <div className="space-y-4 flex-1 min-w-0">
                <div className="space-y-1.5">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                    Step 2: Join my copy trading profile
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                    Click the link below to access my copy trading profile:
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 dark:border-blue-300/20 bg-[#F8FAFC] dark:bg-[#050B24]/75 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <a
                    href="https://my.hfm.com/en/copy-trading/provider-details.html?provider=147060067"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs sm:text-sm text-[#1D4ED8] dark:text-sky-300 hover:underline break-all"
                  >
                    https://my.hfm.com/en/copy-trading/provider-details.html?provider=147060067
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        'https://my.hfm.com/en/copy-trading/provider-details.html?provider=147060067',
                      );
                      setHfmLinkCopied(true);
                      setTimeout(() => setHfmLinkCopied(false), 2200);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-white/15 bg-white dark:bg-white/[0.06] text-[11px] font-semibold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:brightness-110 transition-all shrink-0 self-start sm:self-center"
                  >
                    {hfmLinkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <a
                    href="https://my.hfm.com/en/copy-trading/provider-details.html?provider=147060067"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="liquid-glass-btn w-full sm:w-auto justify-center inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white text-xs sm:text-sm font-bold hover:brightness-110 transition-all"
                  >
                    <span>Open HFM Copy Trading Profile</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-8 flex items-start gap-3.5 sm:gap-5">
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#2563EB] text-white font-mono text-xs font-extrabold shrink-0 shadow-[0_6px_18px_rgba(37,99,235,0.35)]">
                03
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                  Step 3: Connect your account
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                  Follow the instructions on the page to connect your HFM account to my trading profile and set up copy trading.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-8 flex items-start gap-3.5 sm:gap-5">
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#2563EB] text-white font-mono text-xs font-extrabold shrink-0 shadow-[0_6px_18px_rgba(37,99,235,0.35)]">
                04
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                  Step 4: Review your settings
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                  Before confirming, review your copy trading settings, including the amount allocated, risk level, and any applicable fees.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="liquid-glass-card rounded-3xl p-5 sm:p-8 flex items-start gap-3.5 sm:gap-5">
              <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#16A34A] text-white font-mono text-xs font-extrabold shrink-0 shadow-[0_6px_18px_rgba(22,163,74,0.35)]">
                05
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                  Step 5: Monitor your account
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200/85 leading-relaxed">
                  Once connected, trades may be copied to your account automatically. You can monitor your account performance and manage or stop copy trading through your HFM account settings.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {route === 'community' && (
        <>
          <PageHeaderBar
            eyebrow="SK Trading Community · Discussions · Member groups"
            title="Learn Together. Grow Together."
            subtitle="Join fellow disciplined learners discussing market structure, sharing annotated charts, and asking questions directly inside the SK Community."
            onBack={() => onNavigate('home')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              {[
                {
                  room: 'XAUUSD & Major Pairs Lounge',
                  topic: 'Daily London & New York killzone bias discussions and liquidity sweeps.',
                },
                {
                  room: 'Chart Markup & Peer Review',
                  topic: 'Share TradingView markups for Break of Structure, FVG, and Order Block feedback.',
                },
                {
                  room: 'Beginner Foundations Desk',
                  topic: 'Ask foundational questions on pips, spreads, risk sizing, and execution habits.',
                },
              ].map((r) => (
                <div key={r.room} className="liquid-glass-card rounded-3xl p-6 space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1D4ED8] dark:text-sky-300">
                    <Users className="w-3.5 h-3.5" />
                    <span>Member Channel</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                    {r.room}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200/85">
                    {r.topic}
                  </p>
                </div>
              ))}
            </div>

            <div className="liquid-glass-card lg:col-span-6 rounded-3xl p-6 sm:p-8 space-y-5">
              <h3 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                What awaits you in the SK Community
              </h3>
              <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                {[
                  'A community of like-minded learners.',
                  'Trading discussions and educational insights.',
                  'Access to learning resources.',
                  'Opportunities to ask questions.',
                  'Updates on new lessons and content.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleDeskAction}
                className="liquid-glass-btn w-full py-3.5 rounded-full bg-[#16A34A] text-white text-xs sm:text-sm font-semibold hover:bg-[#15803D]"
              >
                Join SKFX ACADEMY Community
              </button>
            </div>
          </div>
        </>
      )}

      {route === 'plans' && (
        <>
          <PageHeaderBar
            eyebrow="CHOOSE YOUR TRADING PLAN"
            title="The Right Access. The Right Trading Experience."
            subtitle="Choose a membership plan that gives you access to the Kombat Sampson trading ecosystem. Get trading signals, copy-trading access, educational resources, and live trading sessions depending on your selected package."
            onBack={() => onNavigate('home')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {TRADING_MEMBERSHIP_PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{y: -4}}
                transition={{duration: 0.18}}
                className={`liquid-glass-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between ${
                  plan.highlighted
                    ? 'ring-2 ring-[#2563EB]/75 dark:ring-sky-400/65 shadow-[0_24px_60px_rgba(37,99,235,0.28)]'
                    : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-base sm:text-lg font-bold tracking-wide text-[#0F172A] dark:text-white">
                      {plan.title}
                    </h2>
                    {plan.badge && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          plan.badge.variant === 'success'
                            ? 'bg-[#16A34A]/15 text-[#15803D] dark:text-emerald-300 border border-[#16A34A]/35'
                            : 'bg-[#2563EB]/15 text-[#1D4ED8] dark:text-sky-300 border border-[#2563EB]/35'
                        }`}
                      >
                        {plan.badge.label}
                      </span>
                    )}
                  </div>

                  <div className="pb-4 border-b border-slate-200/70 dark:border-white/12 flex items-baseline gap-2">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                      {plan.price}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-300/80">
                      {plan.period}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-sky-300">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>PAYMENT OPTIONS AVAILABLE</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-200/85">
                      {PAYMENT_OPTIONS.map((option) => (
                        <li key={option} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-sky-400 shrink-0" />
                          <span>{option}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-sky-200">
                      {plan.featuresHeading}
                    </p>
                    <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-200">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openPlanCheckout(plan)}
                  className={`mt-7 w-full py-3.5 px-5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all ${
                    plan.highlighted
                      ? 'liquid-glass-btn bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white hover:brightness-110'
                      : 'liquid-glass-pill text-[#0F172A] dark:text-white hover:brightness-110'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* WHY JOIN KOMBAT SAMPSON? */}
          <section className="space-y-5 pt-2">
            <div className="max-w-2xl space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                WHY JOIN KOMBAT SAMPSON?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200/85 leading-relaxed">
                Get more than just access to trading signals. Become part of a trading ecosystem built around market analysis, education, strategy development, and disciplined trading.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'TRADING SIGNALS',
                  desc: 'Structured Forex and Gold trade opportunities.',
                  icon: Radio,
                  accent: 'text-[#1D4ED8] dark:text-sky-300',
                },
                {
                  title: 'LIVE MENTORSHIP',
                  desc: 'Practical guidance and educational sessions.',
                  icon: Video,
                  accent: 'text-[#16A34A] dark:text-emerald-400',
                },
                {
                  title: 'TRADING COURSES',
                  desc: 'Structured learning resources for developing your trading knowledge.',
                  icon: BookOpen,
                  accent: 'text-[#1D4ED8] dark:text-sky-300',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="liquid-glass-card rounded-2xl p-5 space-y-2">
                    <Icon className={`w-4 h-4 ${item.accent}`} />
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200/85 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* READY TO GET STARTED? + RISK DISCLAIMER */}
          <section className="liquid-glass-card rounded-2xl p-5 sm:p-7 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                  READY TO GET STARTED?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200/85">
                  Choose your plan and get started with Kombat Sampson.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPlanCheckout(TRADING_MEMBERSHIP_PLANS[2])}
                className="liquid-glass-btn w-full md:w-auto text-center px-6 py-3 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white text-xs sm:text-sm font-bold hover:brightness-110 transition-all sm:whitespace-nowrap shrink-0"
              >
                JOIN THE KOMBAT ECOSYSTEM →
              </button>
            </div>

            <div className="pt-5 border-t border-slate-200/70 dark:border-white/12 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-300/80 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-[#DC2626] dark:text-red-400 mt-0.5 shrink-0" />
              <p className="italic">
                Trading involves substantial financial risk. Signals and copy trading do not guarantee profits. Membership benefits are subject to the selected plan&apos;s terms and conditions.
              </p>
            </div>
          </section>

          {/* Plan Selection Modal */}
          <AnimatePresence>
            {selectedPlanModal && (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#02050D]/75 backdrop-blur-md p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedPlanModal(null);
                }}
              >
                <motion.div
                  initial={{opacity: 0, scale: 0.96, y: 8}}
                  animate={{opacity: 1, scale: 1, y: 0}}
                  exit={{opacity: 0, scale: 0.96, y: 8}}
                  transition={{duration: 0.18}}
                  className="liquid-glass-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-white/12">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1D4ED8] dark:text-sky-300">
                        {selectedPlanModal.price} {selectedPlanModal.period}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold text-[#0F172A] dark:text-white">
                        {selectedPlanModal.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanModal(null)}
                      aria-label="Close modal"
                      className="p-1.5 rounded-full text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {planSubmitted ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-[#16A34A]/35 bg-[#16A34A]/15 p-4 text-sm text-[#15803D] dark:text-emerald-200">
                        Enrollment request logged for <strong>{selectedPlanModal.title}</strong> ({planPaymentMethod}). Payment & onboarding instructions have been queued for your inbox.
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanModal(null);
                            handleDeskAction();
                          }}
                          className="liquid-glass-btn px-5 py-2.5 rounded-full bg-[#2563EB] text-white text-xs font-semibold"
                        >
                          {isSignedIn ? 'Open My Dashboard' : 'Create Desk Account'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePlanSubmit} className="mt-4 space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                          Select Payment Method
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {PAYMENT_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setPlanPaymentMethod(option)}
                              className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                                planPaymentMethod === option
                                  ? 'border-[#2563EB] bg-[#2563EB]/15 text-[#1D4ED8] dark:text-sky-300'
                                  : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <input
                        type="email"
                        required
                        value={planEmail}
                        onChange={(e) => setPlanEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />

                      {planError && <p className="text-xs text-[#DC2626]">{planError}</p>}

                      <button
                        type="submit"
                        disabled={planSubmitting}
                        className="liquid-glass-btn w-full py-3 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#16A34A] text-white text-xs sm:text-sm font-bold hover:brightness-110 disabled:opacity-60"
                      >
                        {planSubmitting ? 'Submitting...' : selectedPlanModal.cta}
                      </button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

    </motion.div>
  );
}
