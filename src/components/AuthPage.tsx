import {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import type {PublicUser} from '../types';
import {apiFetch, setInMemorySessionToken} from '../lib/apiClient';
import {
  ensureSupabaseClient,
  isSupabaseConfigured,
  resolveSupabaseAccessTokenFromCallback,
  type SupabaseOAuthCallbackPayload,
} from '../lib/supabase';
import type {SiteRoute} from './DedicatedPages';
import {BackgroundTopology} from './BackgroundTopology';
import {BrandLogo} from './BrandLogo';

interface AuthPageProps {
  initialMode: 'login' | 'register';
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate: (route: SiteRoute) => void;
  onAuthenticated: (user: PublicUser) => void;
}

const AMBIENT_CANDLES = [
  {x: 90, o: 420, c: 370, h: 350, l: 438, bull: true, delay: 0},
  {x: 160, o: 370, c: 392, h: 358, l: 408, bull: false, delay: 0.4},
  {x: 230, o: 392, c: 325, h: 310, l: 402, bull: true, delay: 0.8},
  {x: 300, o: 325, c: 280, h: 262, l: 338, bull: true, delay: 1.2},
  {x: 370, o: 280, c: 305, h: 268, l: 322, bull: false, delay: 1.6},
  {x: 840, o: 310, c: 255, h: 240, l: 325, bull: true, delay: 0.3},
  {x: 910, o: 255, c: 274, h: 245, l: 290, bull: false, delay: 0.7},
  {x: 980, o: 274, c: 210, h: 192, l: 284, bull: true, delay: 1.1},
  {x: 1050, o: 210, c: 162, h: 146, l: 226, bull: true, delay: 1.5},
  {x: 1120, o: 162, c: 184, h: 150, l: 198, bull: false, delay: 1.9},
  {x: 1190, o: 184, c: 122, h: 104, l: 196, bull: true, delay: 2.3},
];

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.9 9.6-7.4 0-.5 0-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M3.5 7.4l3.2 2.4C7.6 7.9 9.6 6 12 6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4c-3.7 0-6.9 2.1-8.5 5z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.8.6-1.9 1.3-3.4 1.3-3.9 0-5.2-2.6-5.5-3.8l-3.2 2.5C4.9 19.5 8.2 21.6 12 21.6z"
      />
      <path
        fill="#4285F4"
        d="M21.6 14.2c.1-.4.1-.8.1-1.3 0-.5 0-.9-.1-1.3H12v3.9h5.5c-.3 1.4-1.1 2.4-2.1 3l3 2.5c1.8-1.6 3.2-4 3.2-6.8z"
      />
    </svg>
  );
}

export function AuthPage({
  initialMode,
  isDark,
  onToggleTheme,
  onNavigate,
  onAuthenticated,
}: AuthPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotNotice, setForgotNotice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const oauthCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      oauthCleanupRef.current?.();
      oauthCleanupRef.current = null;
    };
  }, []);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setRegisterStep(1);
    setError('');
    setForgotNotice(false);
    const targetPath = nextMode === 'login' ? '/signin' : '/signup';
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = (await res.json()) as {
        user?: PublicUser;
        sessionToken?: string;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setError(data.error || 'Authentication failed.');
        return;
      }
      if (data.sessionToken) {
        setInMemorySessionToken(data.sessionToken);
      }
      window.history.replaceState({}, '', '/');
      onAuthenticated(data.user);
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerStep === 1) {
      if (name.trim().length < 2) {
        setError('Please enter your full name.');
        return;
      }
      setRegisterStep(2);
      return;
    }

    if (registerStep === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
      setRegisterStep(3);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          accountBalance: 10000,
        }),
      });
      const data = (await res.json()) as {
        user?: PublicUser;
        sessionToken?: string;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setError(data.error || 'Registration failed.');
        return;
      }
      if (data.sessionToken) {
        setInMemorySessionToken(data.sessionToken);
      }
      window.history.replaceState({}, '', '/');
      onAuthenticated(data.user);
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithGoogle = async () => {
    setError('');
    const supabase = await ensureSupabaseClient();
    if (!isSupabaseConfigured() || !supabase) {
      setError('Google Sign-In via Supabase is not configured in this environment.');
      return;
    }

    oauthCleanupRef.current?.();
    oauthCleanupRef.current = null;

    // Pre-open popup synchronously on user gesture to avoid popup blockers
    const width = 520;
    const height = 660;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
    const popup = window.open(
      'about:blank',
      'skfx_google_oauth',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`,
    );

    if (!popup) {
      setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      return;
    }

    setLoading(true);
    setGoogleLoading(true);

    let finished = false;
    let pollTimer: number | null = null;
    let closeGraceTimer: number | null = null;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
      if (closeGraceTimer !== null) {
        window.clearTimeout(closeGraceTimer);
        closeGraceTimer = null;
      }
      oauthCleanupRef.current = null;
    };

    const isTrustedOrigin = (origin: string): boolean => {
      if (origin === window.location.origin) return true;
      try {
        const parsed = new URL(origin);
        return (
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname.endsWith('.run.app')
        );
      } catch {
        return false;
      }
    };

    const handleMessage = async (event: MessageEvent) => {
      if (!isTrustedOrigin(event.origin)) return;
      const payload = event.data as Partial<SupabaseOAuthCallbackPayload> | null;
      if (!payload || payload.type !== 'SUPABASE_OAUTH_CALLBACK') return;

      if (finished) return;
      finished = true;
      cleanup();

      try {
        popup.close();
      } catch {
        // ignore cross-window close failure
      }

      try {
        const accessToken = await resolveSupabaseAccessTokenFromCallback(payload);
        const res = await apiFetch('/api/auth/supabase', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({accessToken}),
        });
        const data = (await res.json()) as {
          user?: PublicUser;
          sessionToken?: string;
          error?: string;
        };
        if (!res.ok || !data.user) {
          setError(data.error || 'Unable to verify Google account.');
          return;
        }
        if (data.sessionToken) {
          setInMemorySessionToken(data.sessionToken);
        }
        window.history.replaceState({}, '', '/');
        onAuthenticated(data.user);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Google sign-in could not be completed.',
        );
      } finally {
        setLoading(false);
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    oauthCleanupRef.current = cleanup;

    pollTimer = window.setInterval(() => {
      if (popup.closed && !finished) {
        if (pollTimer !== null) {
          window.clearInterval(pollTimer);
          pollTimer = null;
        }
        closeGraceTimer = window.setTimeout(() => {
          if (!finished) {
            finished = true;
            cleanup();
            setLoading(false);
            setGoogleLoading(false);
          }
        }, 350);
      }
    }, 400);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const {data, error: oauthErr} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthErr || !data?.url) {
        throw new Error(oauthErr?.message || 'Unable to start Google sign-in.');
      }

      popup.location.href = data.url;
    } catch (err) {
      finished = true;
      cleanup();
      try {
        popup.close();
      } catch {
        // ignore close failure
      }
      setLoading(false);
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Unable to start Google sign-in.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] dark:bg-[#070B14] dark:text-white flex flex-col justify-between transition-colors">
      <BackgroundTopology />

      {/* Animated Ambient Background Layer (Light & Dark Modes) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      >
        <div
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.22]"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.045) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 88%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 88%)',
          }}
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: ['-6%', '8%', '-4%', '-6%'],
                  y: ['-4%', '10%', '2%', '-4%'],
                  scale: [1, 1.12, 0.96, 1],
                }
          }
          transition={{duration: 18, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute -top-36 left-[12%] w-[640px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),rgba(56,189,248,0.06)_52%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(37,99,235,0.28),rgba(56,189,248,0.08)_55%,transparent_74%)] blur-3xl"
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: ['6%', '-10%', '4%', '6%'],
                  y: ['4%', '-8%', '8%', '4%'],
                  scale: [1.05, 0.94, 1.1, 1.05],
                }
          }
          transition={{duration: 22, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute bottom-[-16%] right-[4%] w-[620px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.14),rgba(37,99,235,0.05)_55%,transparent_74%)] dark:bg-[radial-gradient(circle,rgba(56,189,248,0.20),rgba(37,99,235,0.08)_55%,transparent_74%)] blur-3xl"
        />

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: ['-4%', '7%', '-2%', '-4%'],
                  y: ['6%', '-6%', '3%', '6%'],
                  opacity: [0.65, 1, 0.72, 0.65],
                }
          }
          transition={{duration: 16, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute top-[38%] -left-24 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.10),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.14),transparent_70%)] blur-3xl"
        />

        <svg
          viewBox="0 0 1280 540"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full opacity-60 dark:opacity-75"
        >
          <defs>
            <linearGradient id="authWaveBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
              <stop offset="28%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="72%" stopColor="#2563EB" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="authWaveSoft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            d="M -40 440 C 160 400, 260 320, 420 350 C 580 380, 700 280, 860 250 C 1020 220, 1140 160, 1320 110"
            fill="none"
            stroke="url(#authWaveSoft)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
            animate={shouldReduceMotion ? undefined : {strokeDashoffset: [0, -56]}}
            transition={{duration: 6, repeat: Infinity, ease: 'linear'}}
          />

          <motion.path
            d="M -40 465 C 120 420, 220 380, 340 310 C 460 240, 560 320, 680 265 C 800 210, 920 240, 1040 170 C 1140 112, 1220 138, 1320 75"
            fill="none"
            stroke="url(#authWaveBlue)"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{pathLength: 0.2, opacity: 0.45}}
            animate={
              shouldReduceMotion
                ? {pathLength: 1, opacity: 0.65}
                : {pathLength: [0.15, 1, 1], opacity: [0.35, 0.85, 0.35]}
            }
            transition={{duration: 7.5, repeat: Infinity, ease: 'easeInOut'}}
          />

          {AMBIENT_CANDLES.map((c) => {
            const top = Math.min(c.o, c.c);
            const height = Math.max(8, Math.abs(c.c - c.o));
            const color = c.bull ? '#16A34A' : '#EF4444';
            return (
              <motion.g
                key={c.x}
                initial={{opacity: 0.25, y: 0}}
                animate={
                  shouldReduceMotion
                    ? {opacity: 0.32}
                    : {opacity: [0.18, 0.52, 0.18], y: [0, -10, 0]}
                }
                transition={{duration: 5.5, delay: c.delay, repeat: Infinity, ease: 'easeInOut'}}
              >
                <line
                  x1={c.x}
                  y1={c.h}
                  x2={c.x}
                  y2={c.l}
                  stroke={color}
                  strokeWidth="1.4"
                  strokeOpacity="0.6"
                />
                <rect
                  x={c.x - 5}
                  y={top}
                  width="10"
                  height={height}
                  rx="2.5"
                  fill={color}
                  fillOpacity="0.42"
                />
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Minimal Top Navigation Bar */}
      <header className="relative z-10 max-w-[1200px] w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-slate-200/90 bg-white/95 hover:bg-white shadow-sm text-xs font-semibold text-[#0F172A] dark:border-white/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="hidden sm:inline-flex items-center gap-2.5 font-display text-sm font-bold tracking-tight text-[#0F172A] dark:text-white"
        >
          <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
          <span>SKFX ACADEMY</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-slate-200/90 bg-white/95 hover:bg-white shadow-sm text-xs font-semibold text-[#0F172A] dark:border-white/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white transition-all"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-sky-300" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Centered Auth Card (maintains SKFX design & colors, content updated to match images) */}
      <main className="relative z-10 flex-1 w-full px-4 sm:px-6 py-5 sm:py-8 flex items-center justify-center">
        <motion.div
          initial={{opacity: 0, y: 16, scale: 0.98}}
          animate={{opacity: 1, y: 0, scale: 1}}
          transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
          className="w-full max-w-[440px]"
        >
          <div className="rounded-3xl border border-slate-200/90 bg-white/92 dark:border-white/[0.12] dark:bg-[#0D1528]/88 backdrop-blur-2xl shadow-[0_24px_70px_-15px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden">
            {/* Top Header Band */}
            <div className="px-6 sm:px-7 pt-6 pb-4 text-center border-b border-slate-200/80 dark:border-white/[0.08]">
              <div className="mx-auto w-12 h-12 rounded-full overflow-hidden shadow-md ring-2 ring-[#2563EB]/30 dark:ring-[#38BDF8]/35">
                <BrandLogo className="w-12 h-12 rounded-full" />
              </div>

              <h1 className="mt-3.5 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#0F172A] dark:text-white">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>

              {mode === 'login' && (
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
                  Your learning, your community, your next step.
                </p>
              )}
            </div>

            {/* Body */}
            <div className="px-6 sm:px-7 py-5">
              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Address * */}
                  <div className="relative">
                    <span className="absolute -top-2 left-3.5 px-1 bg-white dark:bg-[#0D1528] text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                      Email address *
                    </span>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 focus-within:ring-2 focus-within:ring-[#2563EB] dark:border-white/[0.14] dark:bg-[#070B14]">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] shrink-0" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-[#64748B]"
                      />
                    </div>
                  </div>

                  {/* Password * */}
                  <div className="relative">
                    <span className="absolute -top-2 left-3.5 px-1 bg-white dark:bg-[#0D1528] text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                      Password *
                    </span>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 focus-within:ring-2 focus-within:ring-[#2563EB] dark:border-white/[0.14] dark:bg-[#070B14]">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password *"
                        className="w-full bg-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-[#64748B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password? */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotNotice((v) => !v)}
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#38BDF8] dark:hover:text-sky-200 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {forgotNotice && (
                    <div className="rounded-xl border border-[#2563EB]/25 bg-[#2563EB]/8 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                      Sign in with your registered email and password, or use <strong>Continue with Google</strong> below to access your trading desk.
                    </div>
                  )}

                  {error && (
                    <p className="text-xs font-medium text-[#DC2626] dark:text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-2.5">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-sm font-semibold transition-all disabled:opacity-60 shadow-md"
                  >
                    {loading && !googleLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterStepSubmit} className="space-y-5">
                  {/* 3-Step Indicator: NAME -> EMAIL -> PASSWORD */}
                  <div className="flex items-center justify-between px-2">
                    {[
                      {step: 1 as const, label: 'NAME', icon: User},
                      {step: 2 as const, label: 'EMAIL', icon: Mail},
                      {step: 3 as const, label: 'PASSWORD', icon: Lock},
                    ].map((s, idx) => {
                      const Icon = s.icon;
                      const active = registerStep === s.step;
                      const done = registerStep > s.step;
                      return (
                        <div key={s.label} className="flex items-center flex-1 last:flex-none">
                          <button
                            type="button"
                            onClick={() => {
                              if (s.step < registerStep) setRegisterStep(s.step);
                            }}
                            disabled={s.step > registerStep}
                            className="flex flex-col items-center gap-1.5 group"
                          >
                            <span
                              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                                active
                                  ? 'border-[#2563EB] dark:border-[#38BDF8] bg-[#2563EB]/12 text-[#2563EB] dark:text-[#38BDF8] shadow-[0_0_16px_rgba(37,99,235,0.28)]'
                                  : done
                                    ? 'border-[#16A34A] bg-[#16A34A]/15 text-[#16A34A]'
                                    : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-[#94A3B8]'
                              }`}
                            >
                              {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </span>
                            <span
                              className={`text-[10px] font-bold tracking-[0.14em] ${
                                active
                                  ? 'text-[#2563EB] dark:text-[#38BDF8]'
                                  : done
                                    ? 'text-[#16A34A]'
                                    : 'text-slate-400 dark:text-[#94A3B8]'
                              }`}
                            >
                              {s.label}
                            </span>
                          </button>

                          {idx < 2 && (
                            <div
                              className={`flex-1 h-[1.5px] mx-2 -mt-5 transition-colors ${
                                registerStep > s.step
                                  ? 'bg-[#2563EB] dark:bg-[#38BDF8]'
                                  : 'bg-slate-200 dark:bg-white/15'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    {registerStep === 1 && (
                      <motion.div
                        key="reg-step-1"
                        initial={{opacity: 0, x: 8}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -8}}
                        transition={{duration: 0.16}}
                        className="space-y-4"
                      >
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                          Hi there. What should we call you?
                        </p>
                        <div className="relative">
                          <span className="absolute -top-2 left-3.5 px-1 bg-white dark:bg-[#0D1528] text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                            Full name *
                          </span>
                          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 focus-within:ring-2 focus-within:ring-[#2563EB] dark:border-white/[0.14] dark:bg-[#070B14]">
                            <User className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] shrink-0" />
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full bg-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-[#64748B]"
                              autoFocus
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {registerStep === 2 && (
                      <motion.div
                        key="reg-step-2"
                        initial={{opacity: 0, x: 8}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -8}}
                        transition={{duration: 0.16}}
                        className="space-y-4"
                      >
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                          Nice to meet you, {name.trim().split(' ')[0]}. What&apos;s your email?
                        </p>
                        <div className="relative">
                          <span className="absolute -top-2 left-3.5 px-1 bg-white dark:bg-[#0D1528] text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                            Email address *
                          </span>
                          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 focus-within:ring-2 focus-within:ring-[#2563EB] dark:border-white/[0.14] dark:bg-[#070B14]">
                            <Mail className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] shrink-0" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full bg-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-[#64748B]"
                              autoFocus
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {registerStep === 3 && (
                      <motion.div
                        key="reg-step-3"
                        initial={{opacity: 0, x: 8}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -8}}
                        transition={{duration: 0.16}}
                        className="space-y-4"
                      >
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                          Choose a password to secure your account.
                        </p>
                        <div className="relative">
                          <span className="absolute -top-2 left-3.5 px-1 bg-white dark:bg-[#0D1528] text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                            Password *
                          </span>
                          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 focus-within:ring-2 focus-within:ring-[#2563EB] dark:border-white/[0.14] dark:bg-[#070B14]">
                            <Lock className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] shrink-0" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Minimum 6 characters"
                              className="w-full bg-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-[#64748B]"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <p className="text-xs font-medium text-[#DC2626] dark:text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-2.5">
                      {error}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {registerStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setRegisterStep((s) => (s === 3 ? 2 : 1))}
                        className="px-4 py-3 rounded-full border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-sm font-semibold transition-all disabled:opacity-60 shadow-md"
                    >
                      <span>
                        {loading
                          ? 'Creating account...'
                          : registerStep < 3
                            ? 'Continue'
                            : 'Create account'}
                      </span>
                      {registerStep < 3 && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              )}

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.1]" />
                <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.1]" />
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                disabled={loading}
                onClick={handleContinueWithGoogle}
                className="w-full py-3 px-5 rounded-full border border-slate-200 hover:bg-slate-50 text-[#0F172A] dark:border-white/[0.16] dark:hover:bg-white/[0.06] dark:text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
              >
                <GoogleGlyph />
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Mode Toggle Prompt */}
              <p className="mt-6 text-center text-xs text-slate-500 dark:text-[#94A3B8]">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-semibold text-[#2563EB] hover:underline dark:text-[#38BDF8]"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-semibold text-[#2563EB] hover:underline dark:text-[#38BDF8]"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Bottom Security Footer inside Card */}
            <div className="px-6 py-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8]">
              <Lock className="w-3 h-3" />
              <span>SKFX Academy · © 2026</span>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 max-w-[1200px] w-full mx-auto px-5 sm:px-6 py-5 text-center text-[11px] text-slate-500 dark:text-[#64748B]">
        © 2026 SKFX ACADEMY · PROTECTED TRADING DESK ACCESS
      </footer>
    </div>
  );
}
