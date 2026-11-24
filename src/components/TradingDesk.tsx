import {useCallback, useEffect, useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calculator,
  Calendar,
  CandlestickChart,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  Play,
  Plus,
  Radio,
  Search,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import type {
  Briefing,
  Course,
  LeadInquiry,
  Lesson,
  PublicUser,
  Signal,
  SignalStatus,
  TakenTrade,
} from '../types';
import {
  calculatePositionSizing,
  formatPrice,
  formatRelativeTime,
} from '../lib/forexMath';
import {apiFetch} from '../lib/apiClient';
import {DEFAULT_ACADEMY_COURSES} from '../lib/academyCatalog';
import {BrandLogo} from './BrandLogo';
import {ChartStructureDiagram} from './ChartStructureDiagram';
import {CoursePlayerWorkspace} from './CoursePlayerWorkspace';
import {LotCalculatorPanel} from './LotCalculatorPanel';
import {ResilientImage} from './ResilientImage';
import {TradingViewSimulator} from './TradingViewSimulator';

type DeskTab =
  | 'dashboard'
  | 'courses'
  | 'copy-trading'
  | 'signals'
  | 'simulator'
  | 'events'
  | 'community'
  | 'academy'
  | 'journal'
  | 'certificates'
  | 'settings'
  | 'support'
  | 'calculator'
  | 'briefings'
  | 'mentor';

interface TradingDeskProps {
  user: PublicUser;
  isDark: boolean;
  onToggleTheme: () => void;
  onBackToLanding: () => void;
  onUserUpdated: (user: PublicUser) => void;
  onLogout: () => void;
}

export function TradingDesk({
  user,
  isDark,
  onToggleTheme,
  onBackToLanding,
  onUserUpdated,
  onLogout,
}: TradingDeskProps) {
  const [activeTab, setActiveTab] = useState<DeskTab>('dashboard');
  const [playgroundSubTab, setPlaygroundSubTab] = useState<'chart' | 'signals' | 'calculator'>('chart');
  const [settingsBalance, setSettingsBalance] = useState(String(user.accountBalance || 10000));
  const [settingsRisk, setSettingsRisk] = useState(String(user.defaultRiskPercent || 1.0));
  const [settingsTimezone, setSettingsTimezone] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem('skfx_timezone')) || 'UTC',
  );
  const [settingsNotifySignals, setSettingsNotifySignals] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('skfx_notify_signals') !== 'false' : true),
  );
  const [settingsNotifySessions, setSettingsNotifySessions] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('skfx_notify_sessions') !== 'false' : true),
  );
  const [settingsConfirmOrders, setSettingsConfirmOrders] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('skfx_confirm_orders') !== 'false' : true),
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<'all' | 'active' | 'won' | 'closed'>('all');
  const [signalQuery, setSignalQuery] = useState('');

  const [trades, setTrades] = useState<TakenTrade[]>([]);
  const [courses, setCourses] = useState<Course[]>(() => DEFAULT_ACADEMY_COURSES);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>(
    () => DEFAULT_ACADEMY_COURSES[0]?.id || '',
  );
  const [activeLessonId, setActiveLessonId] = useState<string>('');

  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [leads, setLeads] = useState<LeadInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{type: 'ok' | 'err'; msg: string} | null>(null);

  const [execRiskPct, setExecRiskPct] = useState(String(user.defaultRiskPercent || 1.0));
  const [execBalance, setExecBalance] = useState(String(user.accountBalance || 10000));
  const [execTargetTier, setExecTargetTier] = useState<'tp1' | 'tp2' | 'tp3'>('tp2');
  const [execNotes, setExecNotes] = useState('');
  const [takingTrade, setTakingTrade] = useState(false);

  const [calcSeed, setCalcSeed] = useState<{
    pair: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
  } | null>(null);

  const [newPair, setNewPair] = useState('XAUUSD');
  const [newDirection, setNewDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [newOrderType, setNewOrderType] = useState<Signal['orderType']>('Buy Limit');
  const [newEntry, setNewEntry] = useState('2642.00');
  const [newSl, setNewSl] = useState('2634.50');
  const [newTp1, setNewTp1] = useState('2652.00');
  const [newTp2, setNewTp2] = useState('2664.00');
  const [newTp3, setNewTp3] = useState('2678.00');
  const [newTf, setNewTf] = useState<Signal['timeframe']>('M15');
  const [newSession, setNewSession] = useState<Signal['session']>('New York');
  const [newThesis, setNewThesis] = useState('');
  const [publishingSignal, setPublishingSignal] = useState(false);

  const [brfTitle, setBrfTitle] = useState('');
  const [brfSession, setBrfSession] = useState<Briefing['session']>('New York');
  const [brfBias, setBrfBias] = useState<Briefing['bias']>('Bullish');
  const [brfPairs, setBrfPairs] = useState('XAUUSD, EURUSD');
  const [brfSummary, setBrfSummary] = useState('');
  const [brfLevels, setBrfLevels] = useState('');

  const [lesCourseId, setLesCourseId] = useState('crs_free_forex');
  const [lesTitle, setLesTitle] = useState('');
  const [lesSummary, setLesSummary] = useState('');
  const [lesDuration, setLesDuration] = useState('24');
  const [lesContent, setLesContent] = useState('');
  const [lesRules, setLesRules] = useState('');
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`skfx_enrolled_courses_${user.id}`);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  });

  const [lastCourseId, setLastCourseId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(`skfx_last_course_${user.id}`) || '';
    } catch {
      return '';
    }
  });
  const [copyTradingConnected, setCopyTradingConnected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`skfx_copy_trading_connected_${user.id}`) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`skfx_enrolled_courses_${user.id}`);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setEnrolledCourseIds(
        Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === 'string')
          : [],
      );
      setLastCourseId(localStorage.getItem(`skfx_last_course_${user.id}`) || '');
      setCopyTradingConnected(
        localStorage.getItem(`skfx_copy_trading_connected_${user.id}`) === 'true',
      );
    } catch {
      setEnrolledCourseIds([]);
      setLastCourseId('');
      setCopyTradingConnected(false);
    }
  }, [user.id]);

  const showToast = useCallback((type: 'ok' | 'err', msg: string) => {
    setToast({type, msg});
    window.setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3500);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [sigRes, trdRes, acdRes, brfRes] = await Promise.all([
        apiFetch('/api/signals'),
        apiFetch('/api/trades'),
        apiFetch('/api/academy'),
        apiFetch('/api/briefings'),
      ]);

      if (sigRes.ok) {
        const d = (await sigRes.json()) as {signals: Signal[]};
        setSignals(d.signals);
        setSelectedSignalId((prev) =>
          prev && d.signals.some((s) => s.id === prev)
            ? prev
            : d.signals[0]?.id || null,
        );
      }
      if (trdRes.ok) {
        const d = (await trdRes.json()) as {trades: TakenTrade[]};
        setTrades(d.trades);
      }
      if (acdRes.ok) {
        const d = (await acdRes.json()) as {
          courses: Course[];
          lessons: Lesson[];
          completedLessonIds: string[];
        };
        const nextCourses =
          Array.isArray(d.courses) && d.courses.length > 0 ? d.courses : DEFAULT_ACADEMY_COURSES;
        const nextLessons = Array.isArray(d.lessons) ? d.lessons : [];
        setCourses(nextCourses);
        setLessons(nextLessons);
        setCompletedLessonIds(Array.isArray(d.completedLessonIds) ? d.completedLessonIds : []);
        setActiveCourseId((prev) =>
          prev && nextCourses.some((c) => c.id === prev)
            ? prev
            : nextCourses[0]?.id || '',
        );
        setActiveLessonId((prev) =>
          prev && nextLessons.some((l) => l.id === prev)
            ? prev
            : nextLessons[0]?.id || '',
        );
        setLesCourseId((prev) =>
          prev && nextCourses.some((c) => c.id === prev)
            ? prev
            : nextCourses[0]?.id || 'crs_free_forex',
        );
      }
      if (brfRes.ok) {
        const d = (await brfRes.json()) as {briefings: Briefing[]};
        setBriefings(d.briefings);
      }
      if (user.role === 'mentor') {
        const leadRes = await apiFetch('/api/leads');
        if (leadRes.ok) {
          const d = (await leadRes.json()) as {leads: LeadInquiry[]};
          setLeads(d.leads);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      if (signalFilter === 'active' && s.status !== 'Active') return false;
      if (
        signalFilter === 'won' &&
        !['TP1 Hit', 'TP2 Hit', 'TP3 Hit'].includes(s.status)
      )
        return false;
      if (
        signalFilter === 'closed' &&
        !['SL Hit', 'Closed'].includes(s.status)
      )
        return false;
      if (signalQuery.trim()) {
        const q = signalQuery.trim().toLowerCase();
        return (
          s.pair.toLowerCase().includes(q) ||
          s.session.toLowerCase().includes(q) ||
          s.thesis.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [signals, signalFilter, signalQuery]);

  const selectedSignal = useMemo(
    () => signals.find((s) => s.id === selectedSignalId) || filteredSignals[0] || null,
    [signals, selectedSignalId, filteredSignals],
  );

  const signalSizing = useMemo(() => {
    if (!selectedSignal) return null;
    const tp =
      execTargetTier === 'tp1'
        ? selectedSignal.tp1
        : execTargetTier === 'tp3'
          ? selectedSignal.tp3
          : selectedSignal.tp2;
    return calculatePositionSizing({
      pair: selectedSignal.pair,
      accountBalance: Math.max(50, Number(execBalance) || user.accountBalance),
      riskPercent: Math.max(0.1, Number(execRiskPct) || user.defaultRiskPercent),
      entry: selectedSignal.entry,
      stopLoss: selectedSignal.stopLoss,
      takeProfit: tp,
    });
  }, [selectedSignal, execBalance, execRiskPct, execTargetTier, user]);

  const handleTakeSignal = async () => {
    if (!selectedSignal || !signalSizing) return;
    setTakingTrade(true);
    try {
      const tp =
        execTargetTier === 'tp1'
          ? selectedSignal.tp1
          : execTargetTier === 'tp3'
            ? selectedSignal.tp3
            : selectedSignal.tp2;
      const res = await apiFetch('/api/trades', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          signalId: selectedSignal.id,
          lotSize: signalSizing.lotSize,
          riskPercent: Number(execRiskPct) || 1.0,
          riskAmount: Math.round(signalSizing.riskAmount * 100) / 100,
          takeProfit: tp,
          notes: execNotes.trim(),
        }),
      });
      const data = (await res.json()) as {trade?: TakenTrade; error?: string};
      if (!res.ok || !data.trade) {
        showToast('err', data.error || 'Could not log trade.');
        return;
      }
      setTrades((prev) => [data.trade!, ...prev]);
      setExecNotes('');
      showToast(
        'ok',
        `Logged ${selectedSignal.pair} ${selectedSignal.direction} (${signalSizing.lotSize.toFixed(2)} lots) to your journal.`,
      );
    } finally {
      setTakingTrade(false);
    }
  };

  const handleUpdateTradeOutcome = async (
    trade: TakenTrade,
    outcome: TakenTrade['outcome'],
  ) => {
    let nextPnl = trade.realizedPnl;
    let nextPips = trade.pipsCaptured;
    if (outcome === 'Won' && nextPnl <= 0) {
      nextPnl = Math.round(trade.riskAmount * 2.5 * 100) / 100;
      nextPips = 50;
    } else if (outcome === 'Lost') {
      nextPnl = -Math.abs(trade.riskAmount);
      nextPips = -25;
    } else if (outcome === 'Breakeven') {
      nextPnl = 0;
      nextPips = 0;
    }

    const res = await apiFetch(`/api/trades/${trade.id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        outcome,
        realizedPnl: nextPnl,
        pipsCaptured: nextPips,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {trade: TakenTrade};
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? data.trade : t)));
      showToast('ok', `Updated ${trade.pair} journal outcome to ${outcome}.`);
    }
  };

  const handleToggleLessonComplete = async (lessonId: string) => {
    const isCompleted = completedLessonIds.includes(lessonId);
    const res = await apiFetch('/api/academy/progress', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({lessonId, completed: !isCompleted}),
    });
    if (res.ok) {
      const data = (await res.json()) as {completedLessonIds: string[]};
      setCompletedLessonIds(data.completedLessonIds);
      showToast(
        'ok',
        !isCompleted ? 'Lesson marked completed.' : 'Lesson completion cleared.',
      );
    }
  };

  const handleSavePrefs = async (balance: number, riskPercent: number) => {
    const res = await apiFetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({accountBalance: balance, defaultRiskPercent: riskPercent}),
    });
    if (res.ok) {
      const data = (await res.json()) as {user: PublicUser};
      onUserUpdated(data.user);
      setExecBalance(String(data.user.accountBalance));
      setExecRiskPct(String(data.user.defaultRiskPercent));
      showToast('ok', 'Account balance and default risk saved.');
    }
  };

  const handlePublishSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingSignal(true);
    try {
      const res = await apiFetch('/api/signals', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          pair: newPair,
          direction: newDirection,
          orderType: newOrderType,
          entry: Number(newEntry),
          stopLoss: Number(newSl),
          tp1: Number(newTp1),
          tp2: Number(newTp2),
          tp3: Number(newTp3),
          timeframe: newTf,
          session: newSession,
          thesis: newThesis,
        }),
      });
      const data = (await res.json()) as {signal?: Signal; error?: string};
      if (!res.ok || !data.signal) {
        showToast('err', data.error || 'Failed to publish signal.');
        return;
      }
      setSignals((prev) => [data.signal!, ...prev]);
      setSelectedSignalId(data.signal.id);
      setNewThesis('');
      showToast('ok', `Published ${data.signal.pair} ${data.signal.direction} signal to all members.`);
    } finally {
      setPublishingSignal(false);
    }
  };

  const handleUpdateSignalStatus = async (
    signalId: string,
    status: SignalStatus,
    pipsResult: number,
  ) => {
    const res = await apiFetch(`/api/signals/${signalId}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status, pipsResult}),
    });
    if (res.ok) {
      const data = (await res.json()) as {signal: Signal};
      setSignals((prev) => prev.map((s) => (s.id === signalId ? data.signal : s)));
      showToast('ok', `Signal marked ${status}.`);
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    const res = await apiFetch(`/api/signals/${signalId}`, {method: 'DELETE'});
    if (res.ok) {
      setSignals((prev) => prev.filter((s) => s.id !== signalId));
      showToast('ok', 'Signal removed from feed.');
    }
  };

  const handlePublishBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/briefings', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        title: brfTitle,
        session: brfSession,
        bias: brfBias,
        pairsWatched: brfPairs,
        summary: brfSummary,
        keyLevels: brfLevels,
      }),
    });
    const data = (await res.json()) as {briefing?: Briefing; error?: string};
    if (!res.ok || !data.briefing) {
      showToast('err', data.error || 'Could not publish briefing.');
      return;
    }
    setBriefings((prev) => [data.briefing!, ...prev]);
    setBrfTitle('');
    setBrfSummary('');
    setBrfLevels('');
    showToast('ok', 'Market briefing published.');
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/academy/lessons', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        courseId: lesCourseId,
        title: lesTitle,
        summary: lesSummary,
        durationMinutes: Number(lesDuration) || 20,
        content: lesContent,
        keyRules: lesRules,
      }),
    });
    const data = (await res.json()) as {lesson?: Lesson; error?: string};
    if (!res.ok || !data.lesson) {
      showToast('err', data.error || 'Could not add lesson.');
      return;
    }
    setLessons((prev) => [...prev, data.lesson!]);
    setLesTitle('');
    setLesSummary('');
    setLesContent('');
    setLesRules('');
    showToast('ok', `Added lesson "${data.lesson.title}" to curriculum.`);
  };

  const journalStats = useMemo(() => {
    const closed = trades.filter((t) => t.outcome !== 'Open');
    const won = closed.filter((t) => t.outcome === 'Won').length;
    const netPnl = trades.reduce((acc, t) => acc + t.realizedPnl, 0);
    const totalPips = trades.reduce((acc, t) => acc + t.pipsCaptured, 0);
    const winRate = closed.length > 0 ? Math.round((won / closed.length) * 100) : 0;
    return {
      netPnl,
      totalPips,
      winRate,
      openCount: trades.filter((t) => t.outcome === 'Open').length,
    };
  }, [trades]);

  const isCourseEnrolled = useCallback(
    (course: Course) => enrolledCourseIds.includes(course.id),
    [enrolledCourseIds],
  );

  const handleEnrollCourse = useCallback(
    (course: Course) => {
      setEnrolledCourseIds((prev) => {
        if (prev.includes(course.id)) return prev;
        const next = [...prev, course.id];
        try {
          localStorage.setItem(
            `skfx_enrolled_courses_${user.id}`,
            JSON.stringify(next),
          );
        } catch {
          // ignore storage quota errors
        }
        return next;
      });
      showToast('ok', `Enrolled in ${course.title}. All lessons are now unlocked.`);
    },
    [user.id, showToast],
  );

  const handleToggleCopyTradingConnected = useCallback(
    (connected: boolean) => {
      setCopyTradingConnected(connected);
      try {
        localStorage.setItem(
          `skfx_copy_trading_connected_${user.id}`,
          connected ? 'true' : 'false',
        );
      } catch {
        // ignore storage quota errors
      }
      showToast(
        'ok',
        connected
          ? 'Copy Trading marked as connected on your account.'
          : 'Copy Trading connection status cleared.',
      );
    },
    [user.id, showToast],
  );

  const handleOpenCourseInAcademy = useCallback(
    (course: Course) => {
      if (!isCourseEnrolled(course)) {
        setDetailCourseId(course.id);
        return;
      }
      const cLessons = lessons
        .filter((l) => l.courseId === course.id)
        .sort((a, b) => a.order - b.order);
      const nextLesson =
        cLessons.find((l) => !completedLessonIds.includes(l.id)) || cLessons[0];
      setActiveCourseId(course.id);
      setLastCourseId(course.id);
      try {
        localStorage.setItem(`skfx_last_course_${user.id}`, course.id);
      } catch {
        // ignore storage quota errors
      }
      if (nextLesson) setActiveLessonId(nextLesson.id);
      setActiveTab('academy');
    },
    [isCourseEnrolled, lessons, completedLessonIds, user.id],
  );

  const enrolledCourses = useMemo(
    () => courses.filter((c) => isCourseEnrolled(c)),
    [courses, isCourseEnrolled],
  );

  const ongoingCourseEntry = useMemo(() => {
    if (enrolledCourses.length === 0) return null;
    const summarize = (course: Course) => {
      const cLessons = lessons
        .filter((l) => l.courseId === course.id)
        .sort((a, b) => a.order - b.order);
      const cDone = cLessons.filter((l) => completedLessonIds.includes(l.id)).length;
      const pct = cLessons.length > 0 ? Math.round((cDone / cLessons.length) * 100) : 0;
      const nextLesson =
        cLessons.find((l) => !completedLessonIds.includes(l.id)) || cLessons[0] || null;
      return {course, cLessons, cDone, pct, nextLesson};
    };

    const summaries = enrolledCourses.map(summarize);
    const lastMatchIncomplete = summaries.find(
      (item) => item.course.id === lastCourseId && item.pct < 100,
    );
    if (lastMatchIncomplete) return lastMatchIncomplete;
    const anyIncomplete = summaries.find((item) => item.pct < 100);
    if (anyIncomplete) return anyIncomplete;
    const lastMatch = summaries.find((item) => item.course.id === lastCourseId);
    return lastMatch || summaries[0];
  }, [enrolledCourses, lessons, completedLessonIds, lastCourseId]);

  const allCatalogCourses = useMemo(() => {
    const order: Record<string, number> = {
      crs_forex_mastery_premium: 0,
      crs_free_forex: 1,
      crs_free_prop_firm: 2,
      crs_xau_masterclass: 3,
    };
    return [...courses].sort(
      (a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99),
    );
  }, [courses]);

  const detailCourse = useMemo(
    () => courses.find((c) => c.id === detailCourseId) || null,
    [courses, detailCourseId],
  );

  const navItems: {id: DeskTab; label: string; icon: typeof Radio}[] = [
    {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {id: 'courses', label: 'Courses', icon: BookOpen},
    {id: 'copy-trading', label: 'Copy Trading', icon: Copy},
    {id: 'signals', label: 'VIP Signals', icon: Radio},
    {id: 'simulator', label: 'Trading Playground', icon: CandlestickChart},
    {id: 'events', label: 'Event and Webinars', icon: Calendar},
    {id: 'community', label: 'Community', icon: Users},
  ];

  const activeTabLabel =
    navItems.find((n) => n.id === activeTab)?.label ||
    (activeTab === 'academy'
      ? 'Courses'
      : activeTab === 'calculator'
        ? 'Lot Calculator'
        : activeTab === 'mentor'
          ? 'SK Mentor Desk'
          : 'Dashboard');

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F8FAFC] dark:bg-[#070B14] text-[#0F172A] dark:text-[#F8FAFC] flex">
      {/* Desktop Sidebar (hidden during full-page Lesson Player) */}
      {activeTab !== 'academy' && (
      <aside className="relative z-10 hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200/85 dark:border-blue-400/15 bg-white dark:bg-[#0D2448] text-[#0F172A] dark:text-white">
        <div className="px-5 py-4 border-b border-slate-200/85 dark:border-blue-400/20 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2.5 font-display text-base font-bold tracking-tight text-[#0F172A] dark:text-white hover:text-[#1D4ED8] dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
            <span>SKFX ACADEMY</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'text-white'
                    : 'text-slate-600 dark:text-blue-100/80 hover:bg-slate-100/80 dark:hover:bg-blue-900/40 hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="desk-sidebar-active"
                    transition={{type: 'spring', stiffness: 450, damping: 35}}
                    className="absolute inset-0 rounded-xl bg-[#2563EB] shadow-sm"
                  />
                )}
                <Icon className="relative z-10 w-4 h-4 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/85 dark:border-blue-400/20">
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-slate-200/90 dark:border-blue-400/30 bg-[#F8FAFC] dark:bg-transparent text-xs font-medium text-slate-600 dark:text-blue-200 hover:text-[#DC2626] dark:hover:text-[#F87171] hover:border-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.18}}
              className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{x: -264}}
              animate={{x: 0}}
              exit={{x: -264}}
              transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
              className="relative z-10 w-64 max-w-[82vw] max-h-screen overflow-y-auto bg-white dark:bg-[#0D2448] text-[#0F172A] dark:text-white border-r border-slate-200/85 dark:border-blue-400/20 flex flex-col p-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/85 dark:border-blue-400/20">
                <div className="inline-flex items-center gap-2.5">
                  <BrandLogo className="w-7 h-7 rounded-full shadow-sm" />
                  <span className="font-display font-bold text-[#0F172A] dark:text-white">
                    SKFX ACADEMY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-500 dark:text-blue-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    activeTab === item.id ||
                    (item.id === 'courses' && activeTab === 'academy');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-slate-600 dark:text-blue-100/80 hover:bg-slate-100/80 dark:hover:bg-blue-900/40'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="desk-drawer-active"
                          transition={{type: 'spring', stiffness: 450, damping: 35}}
                          className="absolute inset-0 rounded-xl bg-[#2563EB]"
                        />
                      )}
                      <Icon className="relative z-10 w-4 h-4 shrink-0" />
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto pt-3 border-t border-slate-200/85 dark:border-blue-400/20">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 px-3 rounded-lg border border-red-300 dark:border-red-400/40 text-xs font-medium text-[#DC2626] dark:text-red-300"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Workspace Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/85 dark:border-blue-400/15 bg-white/95 dark:bg-[#071122]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200/90 dark:border-blue-400/20 text-[#0F172A] dark:text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              <BrandLogo
                className={`w-7 h-7 rounded-full shadow-sm ${
                  activeTab === 'academy' ? 'inline-flex' : 'lg:hidden'
                }`}
              />
              <span className="font-semibold text-[#0F172A] dark:text-white truncate">
                {activeTab === 'academy' ? 'SKFX ACADEMY' : activeTabLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-200/90 dark:border-blue-400/20 text-[#0F172A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12223F] transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user.role === 'mentor' && (
              <button
                type="button"
                onClick={() => setActiveTab('mentor')}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Publish Signal</span>
                <span className="sm:hidden">Publish</span>
              </button>
            )}
          </div>
        </header>

        {/* Feedback Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{opacity: 0, y: -8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -8}}
              transition={{duration: 0.18}}
              className="px-4 sm:px-6 pt-4"
            >
              <div
                className={`rounded-lg px-4 py-2.5 text-xs font-medium border ${
                  toast.type === 'ok'
                    ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#15803D] dark:text-emerald-400'
                    : 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626] dark:text-red-400'
                }`}
              >
                {toast.msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main
          className={`flex-1 w-full ${
            activeTab === 'academy'
              ? 'p-2 sm:p-4 max-w-none'
              : activeTab === 'simulator' && playgroundSubTab === 'chart'
                ? 'p-2 sm:p-3.5 max-w-none'
                : 'p-4 sm:p-6 max-w-none'
          }`}
        >
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 rounded-xl bg-slate-200/70 dark:bg-[#0B1528] animate-pulse" />
              <div className="h-80 rounded-xl bg-slate-200/70 dark:bg-[#0B1528] animate-pulse" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{opacity: 0, y: 6}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
            >
              {/* TAB 1: LIVE SIGNALS FEED */}
              {activeTab === 'signals' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0B1528] border border-slate-200/85 dark:border-blue-400/20 self-start">
                      {[
                        {id: 'all', label: 'All Setups'},
                        {id: 'active', label: 'Active'},
                        {id: 'won', label: 'Targets Hit'},
                        {id: 'closed', label: 'Closed / SL'},
                      ].map((tab) => {
                        const active = signalFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() =>
                              setSignalFilter(tab.id as typeof signalFilter)
                            }
                            className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                              active
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white'
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="desk-signal-filter"
                                transition={{type: 'spring', stiffness: 450, damping: 34}}
                                className="absolute inset-0 rounded-md bg-[#1D4ED8] shadow-sm"
                              />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signalQuery}
                        onChange={(e) => setSignalQuery(e.target.value)}
                        placeholder="Filter pair or session..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] text-xs text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Signals List */}
                    <div className="xl:col-span-7 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] overflow-hidden">
                      {filteredSignals.length === 0 ? (
                        <div className="p-10 text-center">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            No signals match this filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSignalFilter('all');
                              setSignalQuery('');
                            }}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-medium"
                          >
                            Reset Filter
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200/80 dark:divide-blue-400/15">
                          {filteredSignals.map((sig) => {
                            const isSelected = selectedSignal?.id === sig.id;
                            const isBuy = sig.direction === 'BUY';
                            const isWin = ['TP1 Hit', 'TP2 Hit', 'TP3 Hit'].includes(
                              sig.status,
                            );
                            const isLoss = sig.status === 'SL Hit';
                            return (
                              <button
                                key={sig.id}
                                type="button"
                                onClick={() => setSelectedSignalId(sig.id)}
                                className={`w-full text-left p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-[#132648]'
                                    : 'hover:bg-slate-50 dark:hover:bg-[#10203B]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-display font-bold text-base text-[#0F172A] dark:text-white">
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
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      · {sig.orderType}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {sig.session} Session · {sig.timeframe} ·{' '}
                                    {formatRelativeTime(sig.createdAt)}
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                                  <span className="font-mono tabular-nums text-xs font-semibold text-[#0F172A] dark:text-slate-100">
                                    Entry {formatPrice(sig.pair, sig.entry)} ·{' '}
                                    <span className="text-[#DC2626] dark:text-red-400">
                                      SL {formatPrice(sig.pair, sig.stopLoss)}
                                    </span>
                                  </span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      isWin
                                        ? 'text-[#16A34A] dark:text-emerald-400'
                                        : isLoss
                                          ? 'text-[#DC2626] dark:text-red-400'
                                          : 'text-[#1D4ED8] dark:text-blue-400'
                                    }`}
                                  >
                                    {sig.status} · {sig.riskReward} R:R
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Signal Inspector & One-Click Execution */}
                    <div className="xl:col-span-5 space-y-4">
                      {selectedSignal && (
                        <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-5 space-y-5">
                          <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
                            <div>
                              <p className="text-xs font-medium text-[#1D4ED8] dark:text-blue-400">
                                {selectedSignal.confidence} · {selectedSignal.session} Killzone
                              </p>
                              <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white mt-0.5">
                                {selectedSignal.pair}{' '}
                                <span
                                  className={
                                    selectedSignal.direction === 'BUY'
                                      ? 'text-[#16A34A]'
                                      : 'text-[#DC2626]'
                                  }
                                >
                                  {selectedSignal.direction}
                                </span>
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCalcSeed({
                                  pair: selectedSignal.pair,
                                  entry: selectedSignal.entry,
                                  stopLoss: selectedSignal.stopLoss,
                                  takeProfit: selectedSignal.tp2,
                                });
                                setActiveTab('calculator');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-blue-400/25 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#132648] transition-colors whitespace-nowrap"
                            >
                              Open in Calculator
                            </button>
                          </div>

                          <ChartStructureDiagram mode="signal" signal={selectedSignal} />

                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs">
                            <div className="p-2 sm:p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 min-w-0">
                              <span className="text-slate-500 dark:text-slate-400 block">
                                Entry
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-[#1D4ED8] dark:text-blue-400">
                                {formatPrice(selectedSignal.pair, selectedSignal.entry)}
                              </span>
                            </div>
                            <div className="p-2 sm:p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 min-w-0">
                              <span className="text-slate-500 dark:text-slate-400 block">
                                Stop Loss
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-[#DC2626]">
                                {formatPrice(selectedSignal.pair, selectedSignal.stopLoss)}
                              </span>
                            </div>
                            <div className="p-2 sm:p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 min-w-0">
                              <span className="text-slate-500 dark:text-slate-400 block">
                                TP1 / TP2 / TP3
                              </span>
                              <span className="font-mono tabular-nums font-semibold text-[#16A34A] dark:text-emerald-400">
                                {formatPrice(selectedSignal.pair, selectedSignal.tp1)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xs font-semibold text-[#0F172A] dark:text-white mb-1">
                              SKFX ACADEMY Institutional Thesis
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {selectedSignal.thesis}
                            </p>
                          </div>

                          {/* Execution & Log Panel */}
                          <div className="pt-4 border-t border-slate-200/80 dark:border-blue-400/15 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-semibold text-[#0F172A] dark:text-white">
                                Take Signal & Log to Journal
                              </span>
                              {signalSizing && (
                                <span className="font-mono tabular-nums text-xs font-bold text-[#1D4ED8] dark:text-blue-400">
                                  Recommended: {signalSizing.lotSize.toFixed(2)} lots
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
                              <div>
                                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                  Balance ($)
                                </label>
                                <input
                                  type="number"
                                  value={execBalance}
                                  onChange={(e) => setExecBalance(e.target.value)}
                                  className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                  Risk (%)
                                </label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={execRiskPct}
                                  onChange={(e) => setExecRiskPct(e.target.value)}
                                  className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                  Target Tier
                                </label>
                                <select
                                  value={execTargetTier}
                                  onChange={(e) =>
                                    setExecTargetTier(e.target.value as 'tp1' | 'tp2' | 'tp3')
                                  }
                                  className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2 py-1.5 text-xs font-mono"
                                >
                                  <option value="tp1">TP1</option>
                                  <option value="tp2">TP2</option>
                                  <option value="tp3">TP3</option>
                                </select>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={execNotes}
                              onChange={(e) => setExecNotes(e.target.value)}
                              placeholder="Optional execution note (e.g. entered on M15 CHoCH)..."
                              className="w-full rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                            />

                            <button
                              type="button"
                              disabled={takingTrade}
                              onClick={handleTakeSignal}
                              className="w-full py-2.5 px-4 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors disabled:opacity-60"
                            >
                              {takingTrade
                                ? 'Logging Execution...'
                                : `Take Trade (${signalSizing?.lotSize.toFixed(2) || '0.10'} lots · Risk $${signalSizing?.riskAmount.toFixed(0) || '100'})`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE COURSE LESSON PLAYER */}
              {activeTab === 'academy' && (
                <CoursePlayerWorkspace
                  userId={user.id}
                  courses={allCatalogCourses}
                  lessons={lessons}
                  activeCourseId={activeCourseId}
                  activeLessonId={activeLessonId}
                  completedLessonIds={completedLessonIds}
                  isCourseEnrolled={isCourseEnrolled}
                  onSelectCourse={(course) => {
                    const cLessons = lessons
                      .filter((l) => l.courseId === course.id)
                      .sort((a, b) => a.order - b.order);
                    const nextLesson =
                      cLessons.find((l) => !completedLessonIds.includes(l.id)) ||
                      cLessons[0];
                    setActiveCourseId(course.id);
                    if (nextLesson) setActiveLessonId(nextLesson.id);
                  }}
                  onSelectLesson={(lessonId) => setActiveLessonId(lessonId)}
                  onToggleLessonComplete={handleToggleLessonComplete}
                  onEnrollCourse={handleEnrollCourse}
                  onBackToCourses={() => setActiveTab('courses')}
                  onOpenSimulator={() => {
                    setPlaygroundSubTab('chart');
                    setActiveTab('simulator');
                  }}
                  onOpenCalculator={() => {
                    setPlaygroundSubTab('calculator');
                    setActiveTab('simulator');
                  }}
                />
              )}

              {/* TAB 3: PERSONAL TRADE JOURNAL */}
              {activeTab === 'journal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Realized P&L
                      </span>
                      <div
                        className={`mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums ${
                          journalStats.netPnl >= 0
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {journalStats.netPnl >= 0 ? '+' : ''}$
                        {journalStats.netPnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Net Pips Captured
                      </span>
                      <div className="mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums text-[#0F172A] dark:text-white">
                        {journalStats.totalPips >= 0 ? '+' : ''}
                        {journalStats.totalPips} pips
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Closed Win Rate
                      </span>
                      <div className="mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums text-[#1D4ED8] dark:text-blue-400">
                        {journalStats.winRate}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-3.5 sm:p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Open Executions
                      </span>
                      <div className="mt-1 text-xl sm:text-2xl font-display font-bold font-mono tabular-nums text-[#0F172A] dark:text-white">
                        {journalStats.openCount}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-blue-400/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          Executed Signals Ledger
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Track trades taken from SKFX ACADEMY’s live feed and record settled outcomes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('signals')}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors whitespace-nowrap"
                      >
                        Browse Live Signals
                      </button>
                    </div>

                    {trades.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          You haven’t logged any signals yet.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Select any active setup in Live Signals and click "Take Trade" to start tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F1F5F9] dark:bg-[#0D2448] text-[#0F172A] dark:text-blue-100 text-xs font-semibold">
                              <th className="py-3 px-4">Pair & Direction</th>
                              <th className="py-3 px-4 text-right">Lots</th>
                              <th className="py-3 px-4 text-right">Entry / SL / TP</th>
                              <th className="py-3 px-4 text-right">Risk ($)</th>
                              <th className="py-3 px-4 text-right">Realized P&L</th>
                              <th className="py-3 px-4">Settle Outcome</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80 dark:divide-blue-400/15 text-sm">
                            {trades.map((trd) => (
                              <tr key={trd.id}>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-[#0F172A] dark:text-white">
                                    {trd.pair} ·{' '}
                                    <span
                                      className={
                                        trd.direction === 'BUY'
                                          ? 'text-[#16A34A]'
                                          : 'text-[#DC2626]'
                                      }
                                    >
                                      {trd.direction}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                    {trd.notes}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                                  {trd.lotSize.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                                  {formatPrice(trd.pair, trd.entryPrice)} /{' '}
                                  <span className="text-[#DC2626]">
                                    {formatPrice(trd.pair, trd.stopLoss)}
                                  </span>{' '}
                                  /{' '}
                                  <span className="text-[#16A34A]">
                                    {formatPrice(trd.pair, trd.takeProfit)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                  ${trd.riskAmount.toFixed(2)}
                                </td>
                                <td
                                  className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold ${
                                    trd.realizedPnl > 0
                                      ? 'text-[#16A34A]'
                                      : trd.realizedPnl < 0
                                        ? 'text-[#DC2626]'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {trd.realizedPnl >= 0 ? '+' : ''}$
                                  {trd.realizedPnl.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <select
                                    value={trd.outcome}
                                    onChange={(e) =>
                                      handleUpdateTradeOutcome(
                                        trd,
                                        e.target.value as TakenTrade['outcome'],
                                      )
                                    }
                                    className="rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1 text-xs font-medium"
                                  >
                                    <option value="Open">Open</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Breakeven">Breakeven</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: LOT CALCULATOR */}
              {activeTab === 'calculator' && (
                <LotCalculatorPanel
                  initialPair={calcSeed?.pair || 'XAUUSD'}
                  initialBalance={user.accountBalance}
                  initialRiskPercent={user.defaultRiskPercent}
                  initialEntry={calcSeed?.entry || 2638.5}
                  initialStopLoss={calcSeed?.stopLoss || 2631.0}
                  initialTakeProfit={calcSeed?.takeProfit || 2658.5}
                  onSavePreferences={handleSavePrefs}
                />
              )}

              {/* TAB 5: MARKET BRIEFINGS */}
              {activeTab === 'briefings' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Institutional Market Briefings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Session outlooks and macro liquidity roadmaps authored by SKFX ACADEMY.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {briefings.map((brf) => (
                      <article
                        key={brf.id}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-6 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {brf.session} Session · {brf.pairsWatched.join(', ')}
                          </span>
                          <span
                            className={`font-semibold ${
                              brf.bias === 'Bullish'
                                ? 'text-[#16A34A]'
                                : brf.bias === 'Bearish'
                                  ? 'text-[#DC2626]'
                                  : 'text-[#1D4ED8] dark:text-blue-400'
                            }`}
                          >
                            {brf.bias} Bias
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          {brf.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {brf.summary}
                        </p>
                        <div className="pt-3 border-t border-slate-200/80 dark:border-blue-400/15 text-xs font-mono text-[#1D4ED8] dark:text-blue-400">
                          {brf.keyLevels}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TRADING PLAYGROUND (TradingView Simulator, Live Signals, Lot Calculator) */}
              {activeTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
                        Trading Playground
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live TradingView Bar Replay, real-time institutional setups, and position sizing.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0B1528] border border-slate-200/85 dark:border-blue-400/20">
                      {[
                        {id: 'chart' as const, label: 'TradingView Simulator'},
                        {id: 'signals' as const, label: `Live Signals (${signals.length})`},
                        {id: 'calculator' as const, label: 'Lot Calculator'},
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setPlaygroundSubTab(sub.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            playgroundSubTab === sub.id
                              ? 'bg-[#2563EB] text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {playgroundSubTab === 'chart' && (
                    <TradingViewSimulator user={user} isDark={isDark} />
                  )}

                  {playgroundSubTab === 'signals' && (
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] divide-y divide-slate-200/80 dark:divide-blue-400/15">
                      {signals.map((sig) => (
                        <div
                          key={sig.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-sm text-[#0F172A] dark:text-white">
                                {sig.pair}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  sig.direction === 'BUY' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                }`}
                              >
                                {sig.direction}
                              </span>
                              <span className="text-xs text-slate-500">
                                · {sig.timeframe} · {sig.session}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {sig.thesis}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                            <span>
                              Entry {formatPrice(sig.pair, sig.entry)} · SL{' '}
                              <span className="text-[#DC2626]">{formatPrice(sig.pair, sig.stopLoss)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSignalId(sig.id);
                                setActiveTab('signals');
                              }}
                              className="font-sans px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {playgroundSubTab === 'calculator' && (
                    <LotCalculatorPanel
                      initialPair={calcSeed?.pair || 'XAUUSD'}
                      initialBalance={user.accountBalance}
                      initialRiskPercent={user.defaultRiskPercent}
                      initialEntry={calcSeed?.entry || 2638.5}
                      initialStopLoss={calcSeed?.stopLoss || 2631.0}
                      initialTakeProfit={calcSeed?.takeProfit || 2658.5}
                      onSavePreferences={handleSavePrefs}
                    />
                  )}
                </div>
              )}

              {/* TAB: DASHBOARD (DEFAULT LANDING VIEW ON LOGIN) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Welcome Header Card */}
                  <section className="rounded-2xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0D1322] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#2563EB] dark:text-[#60A5FA] font-semibold">
                        SKFX ACADEMY WORKSPACE
                      </p>
                      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                        Welcome to SKFX Academy, {user.name}
                      </h1>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Access your institutional forex curriculum, review VIP market setups, practice execution in Trading Playground, or sync your Copy Trading account.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('courses')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Browse Courses</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('simulator')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0F172A] dark:text-white transition-colors whitespace-nowrap"
                      >
                        <CandlestickChart className="w-4 h-4" />
                        <span>Trading Playground</span>
                      </button>
                    </div>
                  </section>

                  {/* Primary Action Cards: Pick Up Where You Left Off + Copy Trading Redirect */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Ongoing Course Card */}
                    <section className="lg:col-span-7 rounded-2xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0D1322] p-6 flex flex-col justify-between gap-5">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="font-display text-lg font-bold tracking-tight text-[#0F172A] dark:text-white">
                              Pick up where you left off
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Continue your active academy training
                            </p>
                          </div>
                          {ongoingCourseEntry && (
                            <span className="font-mono text-xs font-bold tabular-nums text-[#D97706] dark:text-[#E8C468]">
                              {ongoingCourseEntry.pct}% complete
                            </span>
                          )}
                        </div>

                        {ongoingCourseEntry ? (
                          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-4 flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-36 aspect-video sm:aspect-auto sm:h-24 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                              <ResilientImage
                                src={ongoingCourseEntry.course.thumbnailUrl}
                                alt={ongoingCourseEntry.course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                              <div>
                                <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white truncate">
                                  {ongoingCourseEntry.course.title}
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                                  {ongoingCourseEntry.nextLesson
                                    ? `Next lesson: ${ongoingCourseEntry.nextLesson.title}`
                                    : `${ongoingCourseEntry.course.categoryLabel} · ${ongoingCourseEntry.course.durationLabel}`}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-[#D97706] dark:bg-[#E8C468] transition-all duration-300"
                                    style={{width: `${ongoingCourseEntry.pct}%`}}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                  <span>
                                    {ongoingCourseEntry.cLessons.length > 0
                                      ? `${ongoingCourseEntry.cDone} of ${ongoingCourseEntry.cLessons.length} lessons completed`
                                      : 'Ready to begin'}
                                  </span>
                                  <span>{ongoingCourseEntry.course.durationLabel}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300/90 dark:border-white/15 p-5 space-y-2">
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                              No ongoing course started yet
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              Enroll in any free or mentorship course to track lesson completion and resume directly from your dashboard.
                            </p>
                          </div>
                        )}

                        {enrolledCourses.length > 1 && (
                          <div className="pt-1 border-t border-slate-200/75 dark:border-white/10 space-y-2">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Other enrolled courses
                            </p>
                            <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                              {enrolledCourses
                                .filter((c) => c.id !== ongoingCourseEntry?.course.id)
                                .slice(0, 3)
                                .map((c) => {
                                  const cl = lessons.filter((l) => l.courseId === c.id);
                                  const cd = cl.filter((l) =>
                                    completedLessonIds.includes(l.id),
                                  ).length;
                                  const cp = cl.length > 0 ? Math.round((cd / cl.length) * 100) : 0;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleOpenCourseInAcademy(c)}
                                      className="w-full py-2 flex items-center justify-between gap-3 text-left hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                                    >
                                      <span className="text-xs font-medium truncate">
                                        {c.title}
                                      </span>
                                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                        {cp}% · Continue
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {ongoingCourseEntry ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenCourseInAcademy(ongoingCourseEntry.course)
                            }
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {ongoingCourseEntry.pct === 100
                                ? 'Review Course'
                                : ongoingCourseEntry.cDone > 0
                                  ? 'Continue Learning'
                                  : 'Start Learning'}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('courses')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Explore Courses</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab('courses')}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0F172A] dark:text-white transition-colors"
                        >
                          <span>View All Courses</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </section>

                    {/* Copy Trading Connection Card */}
                    <section className="lg:col-span-5 rounded-2xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0D1322] p-6 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 font-semibold">
                            Automated Mirroring
                          </span>
                          {copyTradingConnected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Connected
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-600 dark:text-[#E8C468]">
                              Action Required
                            </span>
                          )}
                        </div>

                        <h2 className="font-display text-lg font-bold tracking-tight text-[#0F172A] dark:text-white">
                          {copyTradingConnected
                            ? 'Copy Trading Account Connected'
                            : 'Connect to Copy Trading'}
                        </h2>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {copyTradingConnected
                            ? 'Your HFM trading account is linked to follow the SKFX Strategy Provider setups automatically.'
                            : "You haven't connected your Copy Trading account yet. Connect your HFM trading account now to mirror SKFX institutional setups automatically."}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('copy-trading')}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                            copyTradingConnected
                              ? 'border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-[#0F172A] dark:text-white'
                              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                          }`}
                        >
                          <span>
                            {copyTradingConnected
                              ? 'Manage Copy Trading'
                              : 'Go to Copy Trading Setup'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* TAB: ALL COURSES */}
              {activeTab === 'courses' && (
                <div className="space-y-10">
                  {/* SECTION 1: CONTINUE LEARNING (SHOWN ONLY WHEN ENROLLED) */}
                  {enrolledCourses.length > 0 && (
                    <section className="space-y-5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                            Continue learning
                          </h2>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Your enrolled courses, right where you left off
                          </p>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                          {enrolledCourses.length}{' '}
                          {enrolledCourses.length === 1 ? 'course' : 'courses'}
                        </span>
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
                      {enrolledCourses.map((course) => {
                        const cLessons = lessons
                          .filter((l) => l.courseId === course.id)
                          .sort((a, b) => a.order - b.order);
                        const cDone = cLessons.filter((l) =>
                          completedLessonIds.includes(l.id),
                        ).length;
                        const pct =
                          cLessons.length > 0
                            ? Math.round((cDone / cLessons.length) * 100)
                            : 0;
                        const statusLabel =
                          pct === 100
                            ? 'COMPLETED'
                            : cDone > 0
                              ? 'IN PROGRESS'
                              : 'READY TO START';

                        return (
                          <div
                            key={course.id}
                            className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1322] p-3.5 flex flex-col transition-colors hover:border-slate-300 dark:hover:border-white/20"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950">
                              <ResilientImage
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-400/25 text-emerald-300 text-[11px] font-semibold">
                                Enrolled
                              </span>
                              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono tabular-nums">
                                {course.durationLabel}
                              </span>
                            </div>

                            <div className="pt-4 flex-1 flex flex-col">
                              <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white leading-snug">
                                {course.title}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                                {course.description}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>{course.level}</span>
                                <span aria-hidden="true">·</span>
                                <span>{course.categoryLabel || 'Course'}</span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={
                                    course.accessType === 'Premium'
                                      ? 'text-[#D97706] dark:text-[#E8C468] font-semibold'
                                      : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  }
                                >
                                  {course.priceLabel}
                                </span>
                              </div>

                              <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] p-3 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold tracking-[0.1em] text-slate-500 dark:text-slate-400">
                                    {statusLabel}
                                  </span>
                                  <span className="font-mono font-bold tabular-nums text-[#D97706] dark:text-[#E8C468]">
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-[#D97706] dark:bg-[#E8C468] transition-all duration-300"
                                    style={{width: `${pct}%`}}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums pt-0.5">
                                  <span>
                                    {cLessons.length > 0
                                      ? `${cDone} of ${cLessons.length} lessons`
                                      : '0 lessons added yet'}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {course.durationLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCourseInAcademy(course)}
                                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>
                                    {pct === 100
                                      ? 'Review course'
                                      : cDone > 0
                                        ? 'Continue learning'
                                        : 'Start learning'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDetailCourseId(course.id)}
                                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0F172A] dark:text-white transition-colors"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </section>
                  )}

                  {/* SECTION 2: ALL COURSES (ALL FOUR CURRICULUM CARDS) */}
                  <section className="space-y-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                          All courses
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Free lessons and premium mentorships, all in one place
                        </p>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        {allCatalogCourses.length}{' '}
                        {allCatalogCourses.length === 1 ? 'course' : 'courses'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
                      {allCatalogCourses.map((course) => {
                        const unlocked = isCourseEnrolled(course);
                        const cLessons = lessons.filter(
                          (l) => l.courseId === course.id,
                        );
                        const cDone = cLessons.filter((l) =>
                          completedLessonIds.includes(l.id),
                        ).length;
                        const pct =
                          cLessons.length > 0
                            ? Math.round((cDone / cLessons.length) * 100)
                            : 0;

                        return (
                          <div
                            key={course.id}
                            className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1322] p-3.5 flex flex-col transition-colors hover:border-slate-300 dark:hover:border-white/20"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950">
                              <ResilientImage
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                              <span
                                className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${
                                  unlocked || course.accessType === 'Free'
                                    ? 'bg-emerald-950/80 border-emerald-400/25 text-emerald-300'
                                    : 'bg-amber-950/85 border-[#E8C468]/35 text-[#F5D06F]'
                                }`}
                              >
                                {unlocked ? 'Enrolled' : course.accessType}
                              </span>
                              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono tabular-nums">
                                {course.durationLabel}
                              </span>
                            </div>

                            <div className="pt-4 flex-1 flex flex-col">
                              <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white leading-snug">
                                {course.title}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2 flex-1">
                                {course.description}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span>{course.level}</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {course.categoryLabel ||
                                    (course.accessType === 'Premium'
                                      ? 'Mentorship'
                                      : 'Course')}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`font-semibold font-mono tabular-nums ${
                                    course.accessType === 'Premium'
                                      ? 'text-[#D97706] dark:text-[#E8C468]'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {course.priceLabel}
                                </span>
                              </div>

                              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                {unlocked ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                                    <span className="font-mono tabular-nums">
                                      {cLessons.length > 0
                                        ? `${cDone}/${cLessons.length} lessons · ${course.durationLabel}`
                                        : `0 lessons added yet · ${course.durationLabel}`}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>
                                      {cLessons.length > 0
                                        ? `Enroll to unlock ${cLessons.length} lessons`
                                        : 'Enroll to access this course'}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="mt-4 flex items-center gap-2.5">
                                {unlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCourseInAcademy(course)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>
                                      {pct === 100
                                        ? 'Review course'
                                        : cDone > 0
                                          ? 'Continue learning'
                                          : 'Start learning'}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (course.accessType === 'Free') {
                                        handleEnrollCourse(course);
                                      } else {
                                        setDetailCourseId(course.id);
                                      }
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>
                                      {course.accessType === 'Free'
                                        ? 'Enroll for Free'
                                        : `Enroll for ${course.priceLabel}`}
                                    </span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDetailCourseId(course.id)}
                                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0F172A] dark:text-white transition-colors"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {/* TAB: COPY TRADING */}
              {activeTab === 'copy-trading' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                      Copy Trading
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Connect your HFM trading account to follow SKFX institutional setups automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1322] p-5 space-y-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB] text-white font-mono text-xs font-bold">
                        01
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Fund Your HFM Trading Account
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Deposit a minimum of $50 into your HFM trading account to activate automated position mirroring.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1322] p-5 space-y-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB] text-white font-mono text-xs font-bold">
                        02
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Follow the SKFX Strategy Provider
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Open the official HFM copy-trading profile link below or copy it directly into your HFM app.
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2.5">
                        <a
                          href="https://my.hfm.com/en/copy-trading/provider-details.html?provider=147060067"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                        >
                          <span>Open HFM Provider Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              'https://my.hfm.com/en/copy-trading/provider-details.html?provider=147060067',
                            );
                            showToast('ok', 'HFM Copy Trading provider link copied.');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0F172A] dark:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1322] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                        {copyTradingConnected
                          ? 'Copy Trading Connection Confirmed'
                          : 'Finished Connecting Your HFM Account?'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {copyTradingConnected
                          ? 'Your dashboard reflects that your HFM trading account is following the SKFX Strategy Provider.'
                          : 'Once you have followed the SKFX Strategy Provider on HFM, confirm your connection status so your dashboard updates.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleCopyTradingConnected(!copyTradingConnected)
                        }
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                          copyTradingConnected
                            ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {copyTradingConnected
                            ? 'Connected (Click to Reset)'
                            : "I've Connected Copy Trading"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1322] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                        Prefer Manual Confirmation?
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Review every setup with live entry, Stop Loss, and TP1–TP3 parameters inside VIP Signals or test setups in Trading Playground.
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('signals')}
                        className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors"
                      >
                        Open VIP Signals
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('simulator')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0F172A] dark:text-white transition-colors"
                      >
                        Trading Playground
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: EVENTS & WEBINARS */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Events, Live Webinars &amp; Session Briefings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Weekly live mentorship schedule and institutional market outlooks.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        day: 'MONDAYS · 13:30 UTC',
                        title: 'Weekly XAUUSD Liquidity Outlook',
                        host: 'Kombat Sampson (SK)',
                        desc: 'Higher-timeframe bias mapping for Gold, EURUSD, and GBPUSD ahead of London/NY overlap.',
                      },
                      {
                        day: 'WEDNESDAYS · 13:00 UTC',
                        title: 'Live NY Killzone Execution Lab',
                        host: 'SKFX Mentorship Desk',
                        desc: 'Real-time chart markups, liquidity sweep setups, and live Q&A trade reviews.',
                      },
                      {
                        day: 'FRIDAYS · 16:00 UTC',
                        title: 'Trade Journal & Psychology Audit',
                        host: 'Kombat Sampson (SK)',
                        desc: 'Review weekly wins/losses, R-multiple consistency, and discipline checkpoints.',
                      },
                    ].map((ev) => (
                      <div
                        key={ev.title}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2.5"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">
                          {ev.day}
                        </p>
                        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {ev.desc}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 pt-1">
                          Host: {ev.host}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                      Latest Institutional Briefings
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {briefings.map((brf) => (
                        <article
                          key={brf.id}
                          className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {brf.session} Session · {brf.pairsWatched.join(', ')}
                            </span>
                            <span
                              className={`font-semibold ${
                                brf.bias === 'Bullish'
                                  ? 'text-[#16A34A]'
                                  : brf.bias === 'Bearish'
                                    ? 'text-[#DC2626]'
                                    : 'text-[#1D4ED8]'
                              }`}
                            >
                              {brf.bias} Bias
                            </span>
                          </div>
                          <h4 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                            {brf.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {brf.summary}
                          </p>
                          <div className="pt-2 border-t border-slate-200/80 dark:border-blue-400/15 text-xs font-mono text-[#1D4ED8] dark:text-blue-400">
                            {brf.keyLevels}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: COMMUNITY */}
              {activeTab === 'community' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                        SKFX Traders Community &amp; Live Setups
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Shared institutional market setups, active signals, and peer execution discussions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaygroundSubTab('signals');
                        setActiveTab('signals');
                      }}
                      className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] self-start"
                    >
                      Open Full Signal Inspector
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {signals.slice(0, 6).map((sig) => (
                      <div
                        key={sig.id}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base text-[#0F172A] dark:text-white">
                              {sig.pair}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                sig.direction === 'BUY' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              {sig.direction}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#1D4ED8] dark:text-blue-400 font-semibold">
                            {sig.status} · {sig.riskReward}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {sig.thesis}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-blue-400/15 text-[11px] text-slate-500">
                          <span>
                            Shared by <strong className="text-[#0F172A] dark:text-white">{sig.authorName}</strong> · {sig.session}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSignalId(sig.id);
                              setActiveTab('signals');
                            }}
                            className="text-[#2563EB] dark:text-blue-400 font-semibold hover:underline"
                          >
                            Log to Journal →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: CERTIFICATES */}
              {activeTab === 'certificates' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Certificates &amp; Credentials
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Complete every lesson inside a course track to unlock your verified SKFX Academy certificate.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {courses.map((course) => {
                      const cLessons = lessons.filter((l) => l.courseId === course.id);
                      const cDone = cLessons.filter((l) => completedLessonIds.includes(l.id)).length;
                      const unlocked = cLessons.length > 0 && cDone === cLessons.length;
                      return (
                        <div
                          key={course.id}
                          className={`rounded-xl border p-5 space-y-3 ${
                            unlocked
                              ? 'border-[#16A34A]/50 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Award className={`w-6 h-6 ${unlocked ? 'text-[#16A34A]' : 'text-slate-400'}`} />
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                unlocked
                                  ? 'bg-[#16A34A]/15 text-[#15803D] dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                              }`}
                            >
                              {unlocked ? 'Earned' : `${cDone}/${cLessons.length} Lessons`}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Issued to {user.name} upon 100% completion of module checkpoints.
                          </p>
                          {!unlocked && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCourseId(course.id);
                                if (cLessons[0]) setActiveLessonId(cLessons[0].id);
                                setActiveTab('academy');
                              }}
                              className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 hover:underline"
                            >
                              Resume Course →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: GENERAL SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      General Settings
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Manage your account profile, workspace appearance, session timezone, and default trading parameters.
                    </p>
                  </div>

                  {/* Account Profile Card */}
                  <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Account Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Full Name
                        </span>
                        <span className="font-semibold text-[#0F172A] dark:text-white mt-0.5 block truncate">
                          {user.name}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Email Address
                        </span>
                        <span className="font-medium text-[#0F172A] dark:text-slate-200 mt-0.5 block truncate">
                          {user.email}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15">
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Account Access
                        </span>
                        <span className="font-semibold text-[#15803D] dark:text-emerald-400 mt-0.5 block">
                          {user.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* General Preferences Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('skfx_timezone', settingsTimezone);
                        localStorage.setItem('skfx_notify_signals', String(settingsNotifySignals));
                        localStorage.setItem('skfx_notify_sessions', String(settingsNotifySessions));
                        localStorage.setItem('skfx_confirm_orders', String(settingsConfirmOrders));
                      }
                      handleSavePrefs(
                        Math.max(100, Number(settingsBalance) || 10000),
                        Math.max(0.1, Math.min(10, Number(settingsRisk) || 1.0)),
                      );
                    }}
                    className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 sm:p-6 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Workspace &amp; Trading Defaults</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Default Account Balance ($)
                          </label>
                          <input
                            type="number"
                            min="100"
                            step="any"
                            value={settingsBalance}
                            onChange={(e) => setSettingsBalance(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-sm font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Default Risk Per Trade (%)
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={settingsRisk}
                            onChange={(e) => setSettingsRisk(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-sm font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Display Timezone
                          </label>
                          <select
                            value={settingsTimezone}
                            onChange={(e) => setSettingsTimezone(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-sm"
                          >
                            <option value="UTC">UTC (Universal)</option>
                            <option value="Europe/London">London (GMT / BST)</option>
                            <option value="America/New_York">New York (EST / EDT)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-200/80 dark:border-blue-400/15 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                        <Bell className="w-3.5 h-3.5" />
                        <span>General Preferences &amp; Alerts</span>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          {
                            label: 'Live Signal Desk Notifications',
                            desc: 'Highlight new mentor trade setups and TP/SL updates across the workspace.',
                            checked: settingsNotifySignals,
                            onChange: setSettingsNotifySignals,
                          },
                          {
                            label: 'London & New York Session Reminders',
                            desc: 'Display killzone session markers inside your trading tools and briefings.',
                            checked: settingsNotifySessions,
                            onChange: setSettingsNotifySessions,
                          },
                          {
                            label: 'Order Execution Confirmation',
                            desc: 'Require confirmation summaries before logging simulated or paper trades.',
                            checked: settingsConfirmOrders,
                            onChange: setSettingsConfirmOrders,
                          },
                        ].map((pref) => (
                          <label
                            key={pref.label}
                            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200/80 dark:border-blue-400/15 bg-[#F8FAFC] dark:bg-[#071122] cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold text-[#0F172A] dark:text-white">
                                {pref.label}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {pref.desc}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={pref.checked}
                              onChange={(e) => pref.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] shrink-0"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-blue-400/15">
                      <button
                        type="button"
                        onClick={onToggleTheme}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200/85 dark:border-blue-400/25 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#132648] transition-colors"
                      >
                        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        <span>{isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}</span>
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors"
                      >
                        Save General Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: HELP & SUPPORT */}
              {activeTab === 'support' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      Help &amp; Support
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Guidance for using the SKFX Academy lessons, TradingView Bar Replay simulator, and trade journal.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                        How to Use Bar Replay
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Open <strong>Trading Playground</strong>, click <strong>Bar Replay</strong> (or the Scissors tool), and click any historical candle on the chart to rewind time. Use Play or +1 Bar to step forward into future candles while practicing Buy/Sell setups.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-5 space-y-2">
                      <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                        Mentorship &amp; Account Desk
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Need help with your membership tier, Exness copy-trading setup, or lesson progression? Reach the SKFX support team at <strong>support@skfxacademy.com</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SK MENTOR ADMIN DESK */}
              {activeTab === 'mentor' && user.role === 'mentor' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <form
                      onSubmit={handlePublishSignal}
                      className="xl:col-span-6 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-4"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Publish Live Forex Signal
                      </h2>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Pair</label>
                          <input
                            type="text"
                            required
                            value={newPair}
                            onChange={(e) => setNewPair(e.target.value.toUpperCase())}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Direction</label>
                          <select
                            value={newDirection}
                            onChange={(e) => {
                              const d = e.target.value as 'BUY' | 'SELL';
                              setNewDirection(d);
                              setNewOrderType(d === 'BUY' ? 'Buy Limit' : 'Sell Limit');
                            }}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Order Type</label>
                          <select
                            value={newOrderType}
                            onChange={(e) =>
                              setNewOrderType(e.target.value as Signal['orderType'])
                            }
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2 py-2 text-xs"
                          >
                            <option>Market Execution</option>
                            <option>Buy Limit</option>
                            <option>Sell Limit</option>
                            <option>Buy Stop</option>
                            <option>Sell Stop</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Session</label>
                          <select
                            value={newSession}
                            onChange={(e) =>
                              setNewSession(e.target.value as Signal['session'])
                            }
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option>London</option>
                            <option>New York</option>
                            <option>Asian</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TF</label>
                          <select
                            value={newTf}
                            onChange={(e) =>
                              setNewTf(e.target.value as Signal['timeframe'])
                            }
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2 py-2 text-xs font-mono"
                          >
                            <option>M15</option>
                            <option>M30</option>
                            <option>H1</option>
                            <option>H4</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Entry</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newEntry}
                            onChange={(e) => setNewEntry(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Stop Loss</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newSl}
                            onChange={(e) => setNewSl(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TP1</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newTp1}
                            onChange={(e) => setNewTp1(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TP2</label>
                          <input
                            type="number"
                            step="any"
                            value={newTp2}
                            onChange={(e) => setNewTp2(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">TP3</label>
                          <input
                            type="number"
                            step="any"
                            value={newTp3}
                            onChange={(e) => setNewTp3(e.target.value)}
                            className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          SMC Execution Thesis
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newThesis}
                          onChange={(e) => setNewThesis(e.target.value)}
                          placeholder="Explain the liquidity sweep, BOS, and Order Block / FVG entry..."
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={publishingSignal}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors disabled:opacity-60"
                      >
                        {publishingSignal ? 'Publishing...' : 'Publish Signal to Desk'}
                      </button>
                    </form>

                    <div className="xl:col-span-6 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-4">
                      <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Manage Live Signal Statuses
                      </h2>
                      <div className="divide-y divide-slate-200/80 dark:divide-blue-400/15 max-h-[380px] overflow-y-auto">
                        {signals.map((sig) => (
                          <div
                            key={sig.id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-semibold text-sm text-[#0F172A] dark:text-white">
                                {sig.pair}{' '}
                                <span
                                  className={
                                    sig.direction === 'BUY'
                                      ? 'text-[#16A34A]'
                                      : 'text-[#DC2626]'
                                  }
                                >
                                  {sig.direction}
                                </span>
                              </span>
                              <span className="text-xs text-slate-500 ml-2 font-mono tabular-nums">
                                @ {formatPrice(sig.pair, sig.entry)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={sig.status}
                                onChange={(e) => {
                                  const st = e.target.value as SignalStatus;
                                  const pips =
                                    st === 'TP1 Hit'
                                      ? 45
                                      : st === 'TP2 Hit'
                                        ? 95
                                        : st === 'TP3 Hit'
                                          ? 180
                                          : st === 'SL Hit'
                                            ? -30
                                            : 0;
                                  handleUpdateSignalStatus(sig.id, st, pips);
                                }}
                                className="rounded-md border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-1 text-xs"
                              >
                                <option>Active</option>
                                <option>TP1 Hit</option>
                                <option>TP2 Hit</option>
                                <option>TP3 Hit</option>
                                <option>SL Hit</option>
                                <option>Closed</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteSignal(sig.id)}
                                aria-label={`Delete ${sig.pair} signal`}
                                className="p-1.5 text-slate-400 hover:text-[#DC2626] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <form
                      onSubmit={handleAddLesson}
                      className="xl:col-span-6 rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-3.5"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                        Add Lesson to SK Academy
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={lesCourseId}
                          onChange={(e) => setLesCourseId(e.target.value)}
                          className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={lesDuration}
                          onChange={(e) => setLesDuration(e.target.value)}
                          placeholder="Minutes (e.g. 25)"
                          className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={lesTitle}
                        onChange={(e) => setLesTitle(e.target.value)}
                        placeholder="Lesson Title"
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        value={lesSummary}
                        onChange={(e) => setLesSummary(e.target.value)}
                        placeholder="One-line summary"
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <textarea
                        rows={3}
                        required
                        value={lesContent}
                        onChange={(e) => setLesContent(e.target.value)}
                        placeholder="Lesson study notes (separate paragraphs with new lines)..."
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <textarea
                        rows={2}
                        value={lesRules}
                        onChange={(e) => setLesRules(e.target.value)}
                        placeholder="Key rules (one per line)..."
                        className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] transition-colors"
                      >
                        Publish Academy Lesson
                      </button>
                    </form>

                    <div className="xl:col-span-6 space-y-6">
                      <form
                        onSubmit={handlePublishBriefing}
                        className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6 space-y-3"
                      >
                        <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                          Post Market Briefing
                        </h2>
                        <input
                          type="text"
                          required
                          value={brfTitle}
                          onChange={(e) => setBrfTitle(e.target.value)}
                          placeholder="Briefing headline..."
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            value={brfSession}
                            onChange={(e) =>
                              setBrfSession(e.target.value as Briefing['session'])
                            }
                            className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option>London</option>
                            <option>New York</option>
                            <option>Asian</option>
                          </select>
                          <select
                            value={brfBias}
                            onChange={(e) =>
                              setBrfBias(e.target.value as Briefing['bias'])
                            }
                            className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs"
                          >
                            <option>Bullish</option>
                            <option>Bearish</option>
                            <option>Neutral</option>
                          </select>
                          <input
                            type="text"
                            value={brfPairs}
                            onChange={(e) => setBrfPairs(e.target.value)}
                            placeholder="XAUUSD, EURUSD"
                            className="rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-2.5 py-2 text-xs font-mono"
                          />
                        </div>
                        <textarea
                          rows={2}
                          required
                          value={brfSummary}
                          onChange={(e) => setBrfSummary(e.target.value)}
                          placeholder="Macro liquidity roadmap..."
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          value={brfLevels}
                          onChange={(e) => setBrfLevels(e.target.value)}
                          placeholder="Key levels (e.g. XAUUSD Demand 2635.00)"
                          className="w-full rounded-lg border border-slate-200/85 dark:border-blue-400/20 bg-[#F8FAFC] dark:bg-[#071122] px-3 py-2 text-xs font-mono"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors"
                        >
                          Publish Briefing
                        </button>
                      </form>

                      <div className="rounded-xl border border-slate-200/85 dark:border-blue-400/20 bg-white dark:bg-[#0B1528] p-4 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A] dark:text-white mb-3">
                          Mentorship & Partner Leads ({leads.length})
                        </h2>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {leads.map((ld) => (
                            <div
                              key={ld.id}
                              className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#071122] border border-slate-200/80 dark:border-blue-400/15 text-xs"
                            >
                              <div className="flex items-center justify-between font-semibold text-[#0F172A] dark:text-white">
                                <span>{ld.name}</span>
                                <span className="text-[#1D4ED8] dark:text-blue-400">
                                  {ld.interest}
                                </span>
                              </div>
                              <p className="text-slate-500 mt-0.5">
                                {ld.email} · {ld.experience}
                              </p>
                              {ld.message && (
                                <p className="text-slate-600 dark:text-slate-300 mt-1">
                                  {ld.message}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* COURSE DETAILS & ENROLLMENT MODAL */}
      {detailCourse && (() => {
        const modalLessons = lessons
          .filter((l) => l.courseId === detailCourse.id)
          .sort((a, b) => a.order - b.order);
        const modalEnrolled = isCourseEnrolled(detailCourse);
        const modalDone = modalLessons.filter((l) =>
          completedLessonIds.includes(l.id),
        ).length;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetailCourseId(null)}
          >
            <div
              className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1322] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <ResilientImage
                  src={detailCourse.thumbnailUrl}
                  alt={detailCourse.title}
                  className="w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
                <button
                  type="button"
                  onClick={() => setDetailCourseId(null)}
                  aria-label="Close course details"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold mb-1.5 ${
                        modalEnrolled || detailCourse.accessType === 'Free'
                          ? 'bg-emerald-950/85 border border-emerald-400/30 text-emerald-300'
                          : 'bg-amber-950/85 border border-[#E8C468]/35 text-[#F5D06F]'
                      }`}
                    >
                      {modalEnrolled
                        ? 'Enrolled'
                        : detailCourse.accessType === 'Free'
                          ? 'Free'
                          : `${detailCourse.accessType} · ${detailCourse.priceLabel}`}
                    </span>
                    <h3 className="font-display text-xl font-bold text-white">
                      {detailCourse.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-black/75 text-white text-[11px] font-mono tabular-nums shrink-0">
                    {detailCourse.durationLabel}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{detailCourse.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>{detailCourse.categoryLabel || 'Course'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{detailCourse.instructor}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {modalLessons.length} lessons
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {detailCourse.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Course Syllabus
                    </h4>
                    {modalEnrolled && (
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {modalDone}/{modalLessons.length} completed
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200/80 dark:border-white/10 divide-y divide-slate-200/75 dark:divide-white/10">
                    {modalLessons.length === 0 ? (
                      <div className="px-4 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                        No lessons published for this course yet.
                      </div>
                    ) : (
                      modalLessons.map((les) => {
                        const done = completedLessonIds.includes(les.id);
                        return (
                          <div
                            key={les.id}
                            className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {modalEnrolled ? (
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 ${
                                    done
                                      ? 'text-[#16A34A]'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ) : (
                                <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              )}
                              <span className="font-medium text-[#0F172A] dark:text-white truncate">
                                {les.order}. {les.title}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                              {les.durationMinutes} min
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDetailCourseId(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Close
                  </button>
                  {modalEnrolled ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = detailCourse;
                        setDetailCourseId(null);
                        handleOpenCourseInAcademy(target);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Open Course Player</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const target = detailCourse;
                        handleEnrollCourse(target);
                        setDetailCourseId(null);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {detailCourse.accessType === 'Free'
                          ? 'Enroll for Free'
                          : `Enroll & Unlock · ${detailCourse.priceLabel}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
