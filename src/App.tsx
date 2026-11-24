import {useCallback, useEffect, useState} from 'react';
import {AnimatePresence, MotionConfig, motion} from 'motion/react';
import type {PublicUser, ShowcasePayload} from './types';
import {apiFetch, setInMemorySessionToken} from './lib/apiClient';
import {
  hydrateSupabaseConfig,
  isSupabaseConfigured,
  resolveSupabaseAccessTokenFromCallback,
  signOutSupabase,
} from './lib/supabase';
import {BrandLogo} from './components/BrandLogo';
import {LandingPage} from './components/LandingPage';
import {TradingDesk} from './components/TradingDesk';

export default function App() {
  const [view, setView] = useState<'landing' | 'desk'>('landing');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [showcase, setShowcase] = useState<ShowcasePayload | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('skfx-theme');
      if (saved === 'light-blue') return false;
      if (saved === 'dark') return true;
    } catch {
      // ignore storage errors
    }
    return true;
  });
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('skfx-theme', isDark ? 'dark' : 'light-blue');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  const loadBootstrap = useCallback(async () => {
    try {
      // Complete OAuth callback if loaded via top-level redirect fallback
      const searchParams = new URLSearchParams(window.location.search || '');
      const hashRaw = window.location.hash ? window.location.hash.slice(1) : '';
      const hashParams = new URLSearchParams(hashRaw);
      const oauthCode = searchParams.get('code') || undefined;
      const oauthAccessToken = hashParams.get('access_token') || undefined;
      const oauthRefreshToken = hashParams.get('refresh_token') || undefined;

      let oauthAuthedUser: PublicUser | null = null;
      if (oauthCode || oauthAccessToken) {
        await hydrateSupabaseConfig();
      }
      if ((oauthCode || oauthAccessToken) && isSupabaseConfigured()) {
        try {
          const accessToken = await resolveSupabaseAccessTokenFromCallback({
            code: oauthCode,
            accessToken: oauthAccessToken,
            refreshToken: oauthRefreshToken,
          });
          const res = await apiFetch('/api/auth/supabase', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({accessToken}),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              user?: PublicUser;
              sessionToken?: string;
            };
            if (data.sessionToken) {
              setInMemorySessionToken(data.sessionToken);
            }
            if (data.user) {
              oauthAuthedUser = data.user;
              setUser(data.user);
              setView('desk');
            }
          }
        } catch {
          // ignore fallback exchange error so app still loads
        } finally {
          window.history.replaceState({}, '', '/');
        }
      }

      const [meRes, pubRes] = await Promise.all([
        oauthAuthedUser ? Promise.resolve(null) : apiFetch('/api/auth/me'),
        apiFetch('/api/public/showcase'),
      ]);
      if (meRes && meRes.ok) {
        const meData = (await meRes.json()) as {user: PublicUser | null};
        setUser(meData.user);
      }
      if (pubRes.ok) {
        const pubData = (await pubRes.json()) as ShowcasePayload;
        setShowcase(pubData);
      }
    } finally {
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const handleAuthenticated = (authedUser: PublicUser) => {
    setUser(authedUser);
    setView('desk');
  };

  const handleLogout = async () => {
    setInMemorySessionToken(null);
    await Promise.all([
      apiFetch('/api/auth/logout', {method: 'POST'}),
      signOutSupabase(),
    ]);
    setUser(null);
    setView('landing');
    loadBootstrap();
  };

  if (!bootstrapped) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-[#050924] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
        }`}
      >
        <div className="text-center space-y-2.5">
          <BrandLogo className="w-12 h-12 rounded-full mx-auto shadow-md" />
          <div className="font-display text-lg font-bold tracking-tight">
            SKFX ACADEMY
          </div>
          <p className={`text-xs ${isDark ? 'text-blue-200/80' : 'text-slate-500'}`}>
            Loading trading desk...
          </p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {view === 'desk' && user ? (
          <motion.div
            key="desk-view"
            initial={{opacity: 0, y: 6}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -6}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
          >
            <TradingDesk
              user={user}
              isDark={isDark}
              onToggleTheme={() => setIsDark((d) => !d)}
              onBackToLanding={() => {
                setView('landing');
                loadBootstrap();
              }}
              onUserUpdated={(updated) => setUser(updated)}
              onLogout={handleLogout}
            />
          </motion.div>
        ) : (
          <motion.div
            key="landing-view"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
          >
            <LandingPage
              showcase={showcase}
              currentUser={user}
              isDark={isDark}
              onToggleTheme={() => setIsDark((d) => !d)}
              onAuthenticated={handleAuthenticated}
              onEnterDesk={() => setView('desk')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
