import {useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  LayoutDashboard,
  Moon,
  Sun,
  UserPlus,
  X,
} from 'lucide-react';
import type {PublicUser, ShowcasePayload} from '../types';
import {AuthPage} from './AuthPage';
import {BrandLogo} from './BrandLogo';
import {KombatHomeView} from './KombatHomeView';
import {MentorshipGoldStrategyPage} from './MentorshipGoldStrategyPage';
import {SignalsAnalysisPage} from './SignalsAnalysisPage';
import {
  DedicatedSubPage,
  ROUTE_PATHS,
  pathToRoute,
} from './DedicatedPages';
import type {
  FeaturedResource,
  SiteRoute,
  SubscriptionPlan,
} from './DedicatedPages';

interface LandingPageProps {
  showcase: ShowcasePayload | null;
  currentUser: PublicUser | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onAuthenticated: (user: PublicUser) => void;
  onEnterDesk: () => void;
}

const FEATURED_RESOURCES: FeaturedResource[] = [
  {
    id: 'res_fundamentals',
    title: 'Forex Trading Fundamentals',
    access: 'Free',
    level: 'Beginner',
    description:
      'Learn the foundations of Forex trading, including currency pairs, pips, spreads, market sessions, and how the Forex market works.',
  },
  {
    id: 'res_structure',
    title: 'Understanding Market Structure',
    access: 'Free',
    level: 'Beginner – Intermediate',
    description:
      'Learn how to identify market trends, swing highs and lows, break of structure, and changes in market direction.',
  },
  {
    id: 'res_smc',
    title: 'Smart Money Concepts (SMC)',
    access: 'Premium',
    level: 'Intermediate',
    description:
      'Explore liquidity, order blocks, fair value gaps, displacement, and institutional price delivery concepts.',
  },
  {
    id: 'res_advanced',
    title: 'Advanced Trading Strategies',
    access: 'Premium',
    level: 'Advanced',
    description:
      'Develop a deeper understanding of trading models, confluences, entries, exits, and trade management.',
  },
  {
    id: 'res_risk',
    title: 'Risk Management & Trading Psychology',
    access: 'Free',
    level: 'All Levels',
    description:
      'Understand position sizing, risk-to-reward, emotional discipline, and the importance of protecting trading capital.',
  },
];

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [];

const NAV_LINKS: {id: SiteRoute; label: string; mobileLabel: string}[] = [
  {id: 'home', label: 'Home', mobileLabel: 'Home'},
  {id: 'mentorship', label: 'SKFX Academy', mobileLabel: 'Academy'},
  {id: 'signals', label: 'Signals & Analysis', mobileLabel: 'Signals'},
  {id: 'plans', label: 'Plans', mobileLabel: 'Plans'},
];

export function LandingPage({
  showcase,
  currentUser,
  isDark,
  onToggleTheme,
  onAuthenticated,
  onEnterDesk,
}: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentRoute, setCurrentRoute] = useState<SiteRoute>(() =>
    pathToRoute(window.location.pathname),
  );
  const [infoModal, setInfoModal] = useState<{title: string; body: string} | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(pathToRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const syncMobile = () => setIsMobile(mq.matches);
    syncMobile();
    mq.addEventListener('change', syncMobile);

    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled((prev) => (prev ? y > 12 : y > 28));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});

    return () => {
      mq.removeEventListener('change', syncMobile);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const navigateTo = (route: SiteRoute | 'dashboard') => {
    if (route === 'dashboard') {
      if (currentUser) onEnterDesk();
      else navigateTo('signin');
      return;
    }
    const targetPath = ROUTE_PATHS[route];
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentRoute(route);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    navigateTo(mode === 'register' ? 'signup' : 'signin');
  };

  const handlePrimaryAction = () => {
    if (currentUser) onEnterDesk();
    else handleOpenAuth('register');
  };

  const handleSignInAction = () => {
    if (currentUser) onEnterDesk();
    else handleOpenAuth('login');
  };

  if (currentRoute === 'signin' || currentRoute === 'signup') {
    return (
      <AuthPage
        key={currentRoute}
        initialMode={currentRoute === 'signup' ? 'register' : 'login'}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onNavigate={navigateTo}
        onAuthenticated={onAuthenticated}
      />
    );
  }

  const collapseBrandOnMobile = isMobile && isScrolled;
  const usesPageOwnedChrome =
    currentRoute === 'mentorship' || currentRoute === 'signals';

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F8FAFC] text-[#0F172A] dark:bg-none dark:bg-[#050924] dark:text-[#F8FAFC] transition-colors">
      {/* Subtle refractive color depth across downstream sections (non-fixed) */}
      {!usesPageOwnedChrome && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-35 dark:opacity-100"
        >
          <div className="absolute top-[30%] -left-40 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12),rgba(56,189,248,0.06)_52%,transparent_74%)] dark:bg-[radial-gradient(circle,rgba(37,99,235,0.2),rgba(22,163,74,0.08)_52%,transparent_74%)] blur-3xl" />
          <div className="absolute top-[56%] right-[-10%] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12),rgba(37,99,235,0.06)_52%,transparent_74%)] dark:bg-[radial-gradient(circle,rgba(56,189,248,0.18),rgba(22,163,74,0.12)_52%,transparent_74%)] blur-3xl" />
          <div className="absolute bottom-[4%] left-[18%] w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.14),rgba(37,99,235,0.06)_52%,transparent_75%)] dark:bg-[radial-gradient(circle,rgba(220,38,38,0.12),rgba(37,99,235,0.14)_52%,transparent_75%)] blur-3xl" />
        </div>
      )}

      {/* Floating Liquid Glass Header — Brand Left, Nav Center, Theme + Sign Up Icon Right */}
      <header className="sticky top-0 z-40 px-2 sm:px-6 pt-2.5 sm:pt-3">
        <div className="relative max-w-[1260px] mx-auto">
          <div className="liquid-glass-bar px-2 sm:px-6 py-1.5 sm:py-2.5 rounded-full flex items-center justify-between gap-1.5 sm:gap-6">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              aria-label="SKFX Home"
              className="inline-flex items-center sm:gap-2.5 font-display text-xs sm:text-base font-bold tracking-tight text-[#0F172A] dark:text-white shrink-0"
            >
              <motion.span
                animate={
                  shouldReduceMotion
                    ? undefined
                    : collapseBrandOnMobile
                      ? {scale: [1, 1.12, 1]}
                      : {scale: 1}
                }
                transition={{duration: 0.32, ease: [0.16, 1, 0.3, 1]}}
                className="liquid-glass-btn relative z-10 inline-flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0"
              >
                <BrandLogo className="w-full h-full rounded-full" />
              </motion.span>
              <motion.span
                initial={false}
                animate={
                  collapseBrandOnMobile
                    ? {
                        x: -18,
                        opacity: 0,
                        scale: 0.55,
                        width: 0,
                        paddingLeft: 0,
                      }
                    : {
                        x: 0,
                        opacity: 1,
                        scale: 1,
                        width: 'auto',
                        paddingLeft: isMobile ? 6 : 0,
                      }
                }
                transition={{
                  duration: shouldReduceMotion ? 0.01 : 0.28,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block overflow-hidden whitespace-nowrap origin-left"
              >
                SKFX
              </motion.span>
            </button>

            <nav
              aria-label="Primary navigation"
              className="liquid-glass-pill flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full min-w-0 overflow-x-auto no-scrollbar"
            >
              {NAV_LINKS.map((item) => {
                const isActive = currentRoute === item.id;
                const isPlan = item.id === 'plans';
                if (isPlan && isMobile) {
                  return (
                    <AnimatePresence key={item.id} initial={false}>
                      {collapseBrandOnMobile && (
                        <motion.button
                          key="mobile-plans-btn"
                          type="button"
                          initial={{opacity: 0, scale: 0.72, x: 10, width: 0, paddingLeft: 0, paddingRight: 0}}
                          animate={{opacity: 1, scale: 1, x: 0, width: 'auto', paddingLeft: 8, paddingRight: 8}}
                          exit={{opacity: 0, scale: 0.72, x: 10, width: 0, paddingLeft: 0, paddingRight: 0}}
                          transition={{duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1]}}
                          onClick={() => navigateTo(item.id)}
                          className={`relative py-1 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap shrink-0 overflow-hidden ${
                            isActive
                              ? 'text-[#0F172A] dark:text-white font-semibold'
                              : 'text-slate-600 dark:text-slate-200/80 hover:text-[#0F172A] dark:hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="top-nav-pill"
                              transition={{type: 'spring', stiffness: 440, damping: 34}}
                              className="absolute inset-0 rounded-full bg-white dark:bg-[#2563EB]/40 shadow-[0_2px_8px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_12px_rgba(2,6,26,0.28)]"
                            />
                          )}
                          <span className="relative z-10">{item.mobileLabel}</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-[#0F172A] dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-200/80 hover:text-[#0F172A] dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="top-nav-pill"
                        transition={{type: 'spring', stiffness: 440, damping: 34}}
                        className="absolute inset-0 rounded-full bg-white dark:bg-[#2563EB]/40 shadow-[0_2px_8px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_12px_rgba(2,6,26,0.28)]"
                      />
                    )}
                    <span className="relative z-10 sm:hidden">{item.mobileLabel}</span>
                    <span className="relative z-10 hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
                title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
                className="liquid-glass-pill inline-flex items-center justify-center gap-1.5 w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-full text-xs font-semibold text-[#0F172A] dark:text-white hover:brightness-105 transition-all whitespace-nowrap shrink-0"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <span className="hidden xl:inline">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                    <span className="hidden xl:inline">Dark Mode</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrimaryAction}
                aria-label={currentUser ? 'My Dashboard' : 'Sign Up'}
                title={currentUser ? 'My Dashboard' : 'Sign Up'}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:text-[#070B14] dark:hover:bg-slate-100 text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] dark:shadow-[0_6px_18px_rgba(37,99,235,0.22)] transition-all shrink-0"
              >
                {currentUser ? (
                  <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10">
        <AnimatePresence mode="wait">
          {currentRoute === 'mentorship' ? (
            <motion.div
              key="mentorship-view"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
            >
              <MentorshipGoldStrategyPage
                onNavigate={navigateTo}
                onOpenAuth={handleOpenAuth}
                onEnterDesk={onEnterDesk}
                isSignedIn={Boolean(currentUser)}
              />
            </motion.div>
          ) : currentRoute === 'signals' ? (
            <motion.div
              key="signals-view"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
            >
              <SignalsAnalysisPage
                showcase={showcase}
                isDark={isDark}
                onToggleTheme={onToggleTheme}
                onNavigate={navigateTo}
                onOpenAuth={handleOpenAuth}
                onEnterDesk={onEnterDesk}
                isSignedIn={Boolean(currentUser)}
              />
            </motion.div>
          ) : currentRoute !== 'home' ? (
            <DedicatedSubPage
              key={currentRoute}
              route={currentRoute}
              showcase={showcase}
              featuredResources={FEATURED_RESOURCES}
              subscriptionPlans={SUBSCRIPTION_PLANS}
              onNavigate={(r) => navigateTo(r)}
              onOpenAuth={handleOpenAuth}
              onEnterDesk={onEnterDesk}
              isSignedIn={Boolean(currentUser)}
            />
          ) : (
            <motion.div
              key="home-view"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
            >
              <KombatHomeView
                onNavigate={navigateTo}
                onOpenAuth={handleOpenAuth}
                onOpenInfoModal={setInfoModal}
                isSignedIn={Boolean(currentUser)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* SECTION 10 / LIQUID GLASS DIRECTORY FOOTER */}
      {!usesPageOwnedChrome && (
        <footer className="relative z-10 border-t border-slate-200/85 dark:border-white/[0.08] bg-[#F1F5F9]/90 dark:bg-[#050912] backdrop-blur-2xl text-[#0F172A] dark:text-white py-12 sm:py-14 transition-colors">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 space-y-10">
          {currentRoute === 'home' ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-2 lg:col-span-4 space-y-3.5">
                  <div className="inline-flex items-center gap-2.5">
                    <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
                    <p className="font-display text-base font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                      KOMBAT SAMPSON
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-xs">
                    Trading Signals | Copy Trading | Live Mentorship | Trading Courses
                  </p>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="liquid-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0F172A] dark:text-blue-100 hover:brightness-105 transition-all"
                  >
                    {isDark ? (
                      <Sun className="w-3.5 h-3.5 text-sky-300" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    )}
                    <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                  </button>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1D4ED8] dark:text-[#94A3B8] mb-3.5">
                    EXPLORE
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                    {[
                      {label: 'VIP Signals', route: 'plans' as const},
                      {label: 'Copy Trading', route: 'copy-trading' as const},
                      {label: 'Live Mentorship', route: 'plans' as const},
                      {label: 'Trading Courses', route: 'plans' as const},
                      {label: 'Premium Gold Strategy', route: 'plans' as const},
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => navigateTo(item.route)}
                          className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1D4ED8] dark:text-[#94A3B8] mb-3.5">
                    RESOURCES
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                    {[
                      {label: 'About Kombat', route: 'mentorship' as const},
                      {label: 'Membership Plans', route: 'plans' as const},
                      {label: 'Trading Simulator', route: 'simulator' as const},
                      {label: 'Community', route: 'community' as const},
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => navigateTo(item.route)}
                          className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1D4ED8] dark:text-[#94A3B8] mb-3.5">
                    COMPANY
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('collaborate')
                            ?.scrollIntoView({behavior: 'smooth'})
                        }
                        className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                      >
                        Collaborations
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('faq')
                            ?.scrollIntoView({behavior: 'smooth'})
                        }
                        className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                      >
                        FAQs
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleSignInAction}
                        className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                      >
                        {currentUser ? 'Member Dashboard' : 'Client Login'}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          setInfoModal({
                            title: 'Contact Kombat Sampson Support',
                            body: 'Need help with membership onboarding, broker setup, or copy trading access? Submit an inquiry through the collaboration/contact form or open your Member Dashboard.',
                          })
                        }
                        className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                      >
                        Contact Support
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#1D4ED8] dark:text-[#94A3B8] mb-3.5">
                    LEGAL
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-[#94A3B8]">
                    {[
                      {
                        title: 'Privacy Policy',
                        body: 'We collect only the account information required to manage your learning progress, trading journal, and community preferences.',
                      },
                      {
                        title: 'Terms & Conditions',
                        body: 'Access to Kombat Sampson trading education, analysis, and community tools is granted strictly for educational study and personal skill development.',
                      },
                      {
                        title: 'Risk Disclosure',
                        body: 'Trading foreign exchange and Gold (XAUUSD) on margin carries a high level of risk and may not be suitable for all investors.',
                      },
                      {
                        title: 'Refund Policy',
                        body: 'Because digital educational modules and live community materials are accessible immediately upon enrollment, please review plan previews carefully before upgrading.',
                      },
                    ].map((doc) => (
                      <li key={doc.title}>
                        <button
                          type="button"
                          onClick={() => setInfoModal(doc)}
                          className="hover:text-[#0F172A] dark:hover:text-white transition-colors text-left"
                        >
                          {doc.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Social Strip */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-[#64748B]">
                  OFFICIAL CHANNELS
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  {['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Telegram', 'WhatsApp'].map(
                    (channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() =>
                          setInfoModal({
                            title: `Kombat Sampson on ${channel}`,
                            body: `Official ${channel} market updates, educational breakdowns, and community announcements are shared directly with registered Kombat Sampson members.`,
                          })
                        }
                        className="hover:text-[#0F172A] dark:hover:text-white transition-colors"
                      >
                        {channel}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  <strong className="text-[#DC2626] dark:text-[#F87171]">
                    Risk Disclaimer:
                  </strong>{' '}
                  Trading foreign exchange and Gold (XAUUSD) on margin carries a high level
                  of risk and may not be suitable for all investors. Past performance is
                  not indicative of future results. All signals, mentorship sessions,
                  courses, and copy trading tools provided by Kombat Sampson are for
                  educational and informational purposes only and do not constitute
                  financial advice.
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-[#64748B]">
                  © 2026 KOMBAT SAMPSON. ALL RIGHTS RESERVED.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8">
                <div className="col-span-2 lg:col-span-4 space-y-3">
                  <div className="inline-flex items-center gap-2.5">
                    <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
                    <p className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                      SKFX ACADEMY
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-blue-100/85 leading-relaxed max-w-xs">
                    Building better traders through knowledge, discipline, and continuous learning.
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

                <div className="lg:col-span-2">
                  <h3 className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 mb-3">Pages</h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-blue-100/85">
                    {[
                      {label: 'Home', route: 'home' as const},
                      {label: 'Academy', route: 'academy' as const},
                      {label: 'Signals & Analysis', route: 'signals' as const},
                      {label: 'Mentorship', route: 'mentorship' as const},
                      {label: 'Trading Simulator', route: 'simulator' as const},
                      {label: 'Subscription Plans', route: 'plans' as const},
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => navigateTo(item.route)}
                          className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-xs font-semibold text-[#1D4ED8] dark:text-sky-300 mb-3">Features</h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-blue-100/85">
                    {[
                      {label: 'VIP Signals', route: 'plans' as const},
                      {label: 'Copy Trading', route: 'copy-trading' as const},
                      {label: 'Live Mentorship', route: 'plans' as const},
                      {label: 'Trading Simulator', route: 'simulator' as const},
                      {label: 'Trading Courses', route: 'plans' as const},
                      {label: 'Premium Gold Strategy', route: 'plans' as const},
                      {label: 'SK Trading Community', route: 'community' as const},
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => navigateTo(item.route)}
                          className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-xs font-semibold text-[#1D4ED8] dark:text-sky-300 mb-3">Connect</h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-blue-100/85">
                    {['Telegram', 'YouTube', 'Instagram', 'TikTok', 'X'].map((channel) => (
                      <li key={channel}>
                        <button
                          type="button"
                          onClick={() =>
                            setInfoModal({
                              title: `SKFX ACADEMY on ${channel}`,
                              body: `Official ${channel} updates, educational market breakdowns, and community announcements are shared directly with registered SK Trading Desk members.`,
                            })
                          }
                          className="hover:text-[#1D4ED8] dark:hover:text-white transition-colors"
                        >
                          {channel}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-xs font-semibold text-[#DC2626] dark:text-[#F87171] mb-3">Legal</h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-blue-100/85">
                    {[
                      {
                        title: 'Terms & Conditions',
                        body: 'Access to SKFX ACADEMY educational resources and community discussions is granted for personal study and disciplined skill development.',
                      },
                      {
                        title: 'Privacy Policy',
                        body: 'We collect only the account information required to manage your learning progress, trading journal, and community preferences.',
                      },
                      {
                        title: 'Risk Disclaimer',
                        body: 'All content provided by SKFX ACADEMY is for educational and informational purposes only and should not be considered financial or investment advice. Trading financial markets involves substantial risk and may not be suitable for everyone.',
                      },
                      {
                        title: 'Refund Policy',
                        body: 'Because digital educational modules and live community materials are accessible immediately upon enrollment, please review course previews carefully before upgrading.',
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
              </div>

              <div className="pt-8 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                <p className="text-xs text-slate-600 dark:text-blue-200/90 leading-relaxed">
                  <strong className="text-[#DC2626] dark:text-[#F87171]">Risk Disclaimer:</strong> All content provided by SKFX ACADEMY is for educational and informational purposes only and should not be considered financial or investment advice. Trading financial markets involves substantial risk and may not be suitable for everyone. Past performance does not guarantee future results. No profits or trading outcomes are guaranteed.
                </p>
                <p className="text-xs text-slate-500 dark:text-blue-300/75">
                  © 2026 SKFX ACADEMY. All rights reserved.
                </p>
              </div>
            </>
          )}
        </div>
        </footer>
      )}

      {/* Liquid Glass Info Modal */}
      <AnimatePresence>
        {infoModal && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-[#04071A]/75 backdrop-blur-md p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInfoModal(null);
            }}
          >
            <motion.div
              initial={{opacity: 0, scale: 0.96, y: 8}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96, y: 8}}
              transition={{duration: 0.18}}
              className="liquid-glass-card w-full max-w-md rounded-3xl p-6"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200/70 dark:border-white/15">
                <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                  {infoModal.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  aria-label="Close modal"
                  className="p-1.5 rounded-full text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-200/90 leading-relaxed">
                {infoModal.body}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInfoModal(null);
                    handleSignInAction();
                  }}
                  className="liquid-glass-btn px-5 py-2 rounded-full bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  Enter My Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
