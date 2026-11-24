import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type {NextFunction, Request, Response} from 'express';
import {
  createInitialStore,
  hashPassword,
  verifyPassword,
} from './server/seedData.ts';
import type {StoredUser, StoreDatabase} from './server/seedData.ts';
import type {
  Briefing,
  LeadInquiry,
  Lesson,
  PublicUser,
  Signal,
  SignalStatus,
  TakenTrade,
} from './src/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

function resolveWritableDataDir(): string {
  const preferred = path.resolve(process.cwd(), '.data');
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, {recursive: true});
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), 'skfx-data');
    try {
      if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, {recursive: true});
      }
    } catch {
      // ignore fallback creation error
    }
    return fallback;
  }
}

const DATA_DIR = resolveWritableDataDir();
const DATA_FILE = path.join(DATA_DIR, 'skfx-store.json');
const SESSION_COOKIE = 'skfx_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto
    .createHash('sha256')
    .update(`skfx-desk-${process.cwd()}`)
    .digest('hex');

function ensureStore(): StoreDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createInitialStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreDatabase;
    const hasLegacyCourses =
      !Array.isArray(parsed.courses) ||
      parsed.courses.length < 4 ||
      !parsed.courses.some((c) => c.id === 'crs_xau_masterclass') ||
      parsed.courses.some(
        (c) =>
          c.id === 'crs_smc_liquidity' ||
          (c.id === 'crs_forex_mastery_premium' && c.title !== 'Forex Mastery') ||
          !String(c.thumbnailUrl || '').startsWith('/assets/aistudio/'),
      );
    const validCourseIds = new Set([
      'crs_free_forex',
      'crs_free_prop_firm',
      'crs_forex_mastery_premium',
      'crs_xau_masterclass',
    ]);
    const hasSeededLessons =
      Array.isArray(parsed.lessons) &&
      parsed.lessons.some(
        (l) =>
          /^les_(0[1-9]|1[0-9]|20)$/.test(l.id) ||
          !validCourseIds.has(l.courseId),
      );
    const hasSeededSignals =
      Array.isArray(parsed.signals) &&
      parsed.signals.some((s) => /^sig_0[1-9]$/.test(s.id));
    const hasSeededBriefings =
      Array.isArray(parsed.briefings) &&
      parsed.briefings.some((b) => /^brf_0[1-9]$/.test(b.id));
    const demoUserIds = new Set([
      'usr_demo_student',
      'usr_kombat_sampson',
      'usr_830d00e7',
    ]);
    const demoEmails = new Set([
      'student@kombatsampson.com',
      'sk@kombatsampson.com',
      'test_1795380165146@example.com',
    ]);
    const hasDemoUsers =
      Array.isArray(parsed.users) &&
      parsed.users.some(
        (u) =>
          demoUserIds.has(u.id) ||
          demoEmails.has(String(u.email || '').toLowerCase()),
      );

    if (
      hasLegacyCourses ||
      hasSeededLessons ||
      hasSeededSignals ||
      hasSeededBriefings ||
      hasDemoUsers
    ) {
      const fresh = createInitialStore();
      parsed.courses = fresh.courses;
      parsed.lessons = Array.isArray(parsed.lessons)
        ? parsed.lessons.filter(
            (l) =>
              !/^les_(0[1-9]|1[0-9]|20)$/.test(l.id) &&
              validCourseIds.has(l.courseId),
          )
        : [];
      parsed.signals = Array.isArray(parsed.signals)
        ? parsed.signals.filter((s) => !/^sig_0[1-9]$/.test(s.id))
        : [];
      parsed.briefings = Array.isArray(parsed.briefings)
        ? parsed.briefings.filter((b) => !/^brf_0[1-9]$/.test(b.id))
        : [];
      parsed.users = Array.isArray(parsed.users)
        ? parsed.users.filter(
            (u) =>
              !demoUserIds.has(u.id) &&
              !demoEmails.has(String(u.email || '').toLowerCase()),
          )
        : [];
      parsed.completedLessonsByUser = {};
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch {
    const initial = createInitialStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

let db: StoreDatabase = ensureStore();

function saveStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    accountBalance: user.accountBalance,
    defaultRiskPercent: user.defaultRiskPercent,
    createdAt: user.createdAt,
  };
}

function signSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({uid: userId, iat: Date.now()}),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as {uid?: string};
    return parsed.uid || null;
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const chunk of header.split(';')) {
    const idx = chunk.indexOf('=');
    if (idx === -1) continue;
    const key = chunk.slice(0, idx).trim();
    const val = chunk.slice(idx + 1).trim();
    result[key] = decodeURIComponent(val);
  }
  return result;
}

function isHttpsRequest(req: Request): boolean {
  return Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
}

function buildSessionSetCookieHeader(
  token: string,
  isSecure: boolean,
  maxAgeSec: number,
): string {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSec}`,
    `SameSite=${isSecure ? 'None' : 'Lax'}`,
  ];
  if (isSecure) {
    attrs.push('Secure', 'Partitioned');
  }
  return attrs.join('; ');
}

function setSessionCookie(req: Request, res: Response, userId: string): string {
  const token = signSessionToken(userId);
  const isSecure = isHttpsRequest(req);
  res.setHeader(
    'Set-Cookie',
    buildSessionSetCookieHeader(token, isSecure, 60 * 60 * 24 * 14),
  );
  return token;
}

function clearSessionCookie(req: Request, res: Response): void {
  const isSecure = isHttpsRequest(req);
  res.setHeader('Set-Cookie', buildSessionSetCookieHeader('', isSecure, 0));
}

interface AuthedRequest extends Request {
  currentUser?: StoredUser;
  authViaCookie?: boolean;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    const uid = verifySessionToken(bearerToken);
    if (uid) {
      req.currentUser = db.users.find((u) => u.id === uid);
      req.authViaCookie = false;
      next();
      return;
    }
  }

  const cookies = parseCookies(req);
  const uid = verifySessionToken(cookies[SESSION_COOKIE]);
  if (uid) {
    req.currentUser = db.users.find((u) => u.id === uid);
    req.authViaCookie = true;
  }
  next();
}

function requireSameOriginForCookieMutations(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    next();
    return;
  }
  if (!req.authViaCookie || !req.currentUser) {
    next();
    return;
  }
  const expectedHost = cleanStr(
    req.headers['x-forwarded-host'] || req.headers.host || '',
    200,
  ).toLowerCase();
  const originHeader = cleanStr(req.headers.origin || '', 300);
  const refererHeader = cleanStr(req.headers.referer || '', 300);
  const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';

  let sourceHost = '';
  const candidateUrl = originHeader || refererHeader;
  if (candidateUrl) {
    try {
      sourceHost = new URL(candidateUrl).host.toLowerCase();
    } catch {
      sourceHost = '';
    }
  }

  if (expectedHost && sourceHost && sourceHost !== expectedHost) {
    res.status(403).json({error: 'Cross-origin request rejected.'});
    return;
  }
  if (!sourceHost && !hasCustomHeader) {
    res.status(403).json({error: 'Missing origin verification header.'});
    return;
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(401).json({error: 'Sign in required to access your trading desk.'});
    return;
  }
  next();
}

function requireMentor(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(401).json({error: 'Sign in required.'});
    return;
  }
  if (req.currentUser.role !== 'mentor') {
    res.status(403).json({error: 'Mentor clearance required for this action.'});
    return;
  }
  next();
}

function cleanStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function cleanNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({limit: '1mb'}));
  app.use(attachUser);
  app.use('/api', requireSameOriginForCookieMutations);

  app.get('/api/health', (_req, res) => {
    res.json({ok: true, service: 'kombat-sampson-skfx'});
  });

  app.get('/api/public/config', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      supabaseUrl: cleanStr(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
        300,
      ).replace(/\/+$/, ''),
      supabasePublishableKey: cleanStr(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          '',
        300,
      ),
    });
  });

  // Public Showcase Endpoint
  app.get('/api/public/showcase', (_req, res) => {
    const resolvedSignals = db.signals.filter((s) => s.status !== 'Active');
    const wins = resolvedSignals.filter(
      (s) => s.status === 'TP1 Hit' || s.status === 'TP2 Hit' || s.status === 'TP3 Hit' || s.pipsResult > 0,
    ).length;
    const winRatePercent =
      resolvedSignals.length > 0
        ? Math.round((wins / resolvedSignals.length) * 100)
        : 0;
    const netPips90Days = resolvedSignals.reduce((acc, s) => acc + s.pipsResult, 0);

    res.json({
      metrics: {
        winRatePercent,
        netPips90Days,
        activeSignalsCount: db.signals.filter((s) => s.status === 'Active').length,
        totalLessonsCount: db.lessons.length,
        avgRiskReward: db.signals.length > 0 ? db.signals[0].riskReward : '0:0',
      },
      recentSignals: db.signals.slice(0, 6),
      courses: db.courses.map((c) => ({
        ...c,
        lessonCount: db.lessons.filter((l) => l.courseId === c.id).length,
      })),
      briefings: db.briefings.slice(0, 3),
    });
  });

  // Authentication Routes
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      res.json({user: null});
      return;
    }
    res.json({user: toPublicUser(req.currentUser)});
  });

  app.post('/api/auth/register', (req: AuthedRequest, res) => {
    const name = cleanStr(req.body?.name, 80);
    const email = cleanStr(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const accountBalance = Math.max(100, cleanNum(req.body?.accountBalance, 10000));

    if (name.length < 2) {
      res.status(400).json({error: 'Please enter your full name.'});
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({error: 'Please enter a valid email address.'});
      return;
    }
    if (password.length < 6) {
      res.status(400).json({error: 'Password must be at least 6 characters.'});
      return;
    }
    if (db.users.some((u) => u.email === email)) {
      res.status(409).json({error: 'An account with this email already exists.'});
      return;
    }

    const newUser: StoredUser = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      passwordHash: hashPassword(password),
      role: 'student',
      tier: 'VIP Desk',
      accountBalance,
      defaultRiskPercent: 1.0,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    db.completedLessonsByUser[newUser.id] = [];
    saveStore();
    const sessionToken = setSessionCookie(req, res, newUser.id);
    res.status(201).json({user: toPublicUser(newUser), sessionToken});
  });

  app.post('/api/auth/login', (req: AuthedRequest, res) => {
    const email = cleanStr(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const found = db.users.find((u) => u.email === email);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({error: 'Invalid email or password.'});
      return;
    }
    const sessionToken = setSessionCookie(req, res, found.id);
    res.json({user: toPublicUser(found), sessionToken});
  });

  app.post('/api/auth/supabase', async (req: AuthedRequest, res) => {
    const supabaseUrl = cleanStr(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
      300,
    ).replace(/\/+$/, '');
    const supabaseKey = cleanStr(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        '',
      300,
    );

    if (!supabaseUrl || !supabaseKey) {
      res.status(503).json({error: 'Supabase authentication is not configured.'});
      return;
    }

    const accessToken =
      typeof req.body?.accessToken === 'string'
        ? req.body.accessToken.trim()
        : '';

    if (!accessToken || accessToken.length > 8192) {
      res.status(400).json({error: 'Missing or invalid Supabase access token.'});
      return;
    }

    try {
      const supaRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!supaRes.ok) {
        res.status(401).json({error: 'Google session could not be verified.'});
        return;
      }

      const supaUser = (await supaRes.json()) as {
        id?: string;
        email?: string;
        user_metadata?: {
          full_name?: string;
          name?: string;
        };
      };

      const email = cleanStr(supaUser.email, 120).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(401).json({error: 'Google account did not return a verified email.'});
        return;
      }

      let targetUser = db.users.find((u) => u.email === email);
      if (!targetUser) {
        const rawName =
          supaUser.user_metadata?.full_name ||
          supaUser.user_metadata?.name ||
          email.split('@')[0] ||
          'Trader';
        const displayName = cleanStr(rawName, 80) || 'Trader';

        targetUser = {
          id: `usr_${crypto.randomUUID().slice(0, 8)}`,
          name: displayName,
          email,
          passwordHash: hashPassword(crypto.randomBytes(32).toString('hex')),
          role: 'student',
          tier: 'VIP Desk',
          accountBalance: 10000,
          defaultRiskPercent: 1.0,
          createdAt: new Date().toISOString(),
        };
        db.users.push(targetUser);
        db.completedLessonsByUser[targetUser.id] = [];
        saveStore();
      }

      const sessionToken = setSessionCookie(req, res, targetUser.id);
      res.json({user: toPublicUser(targetUser), sessionToken});
    } catch {
      res.status(502).json({error: 'Unable to reach Supabase authentication service.'});
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(req, res);
    res.json({ok: true});
  });

  app.patch('/api/auth/preferences', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    if (req.body?.accountBalance !== undefined) {
      user.accountBalance = Math.max(50, Math.min(10000000, cleanNum(req.body.accountBalance, user.accountBalance)));
    }
    if (req.body?.defaultRiskPercent !== undefined) {
      user.defaultRiskPercent = Math.max(0.1, Math.min(10, cleanNum(req.body.defaultRiskPercent, user.defaultRiskPercent)));
    }
    saveStore();
    res.json({user: toPublicUser(user)});
  });

  // Signals Endpoints
  app.get('/api/signals', requireAuth, (_req, res) => {
    const sorted = [...db.signals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json({signals: sorted});
  });

  app.post('/api/signals', requireMentor, (req: AuthedRequest, res) => {
    const pair = cleanStr(req.body?.pair, 20).toUpperCase();
    const direction = req.body?.direction === 'SELL' ? 'SELL' : 'BUY';
    const orderType = (
      ['Market Execution', 'Buy Limit', 'Sell Limit', 'Buy Stop', 'Sell Stop'].includes(
        req.body?.orderType,
      )
        ? req.body.orderType
        : direction === 'BUY'
          ? 'Buy Limit'
          : 'Sell Limit'
    ) as Signal['orderType'];

    const entry = cleanNum(req.body?.entry);
    const stopLoss = cleanNum(req.body?.stopLoss);
    const tp1 = cleanNum(req.body?.tp1);
    const tp2 = cleanNum(req.body?.tp2);
    const tp3 = cleanNum(req.body?.tp3);
    const thesis = cleanStr(req.body?.thesis, 800);

    if (!pair || entry <= 0 || stopLoss <= 0 || tp1 <= 0 || !thesis) {
      res.status(400).json({error: 'Pair, valid Entry, Stop Loss, TP1, and Thesis are required.'});
      return;
    }

    const riskDist = Math.abs(entry - stopLoss);
    const rewardDist = Math.abs((tp3 || tp2 || tp1) - entry);
    const rrVal = riskDist > 0 ? (rewardDist / riskDist).toFixed(1) : '3.0';

    const now = new Date().toISOString();
    const created: Signal = {
      id: `sig_${crypto.randomUUID().slice(0, 8)}`,
      pair,
      direction,
      orderType,
      entry,
      stopLoss,
      tp1,
      tp2: tp2 || tp1,
      tp3: tp3 || tp2 || tp1,
      riskReward: `1:${rrVal}`,
      timeframe: ['M15', 'M30', 'H1', 'H4'].includes(req.body?.timeframe)
        ? req.body.timeframe
        : 'M15',
      session: ['London', 'New York', 'Asian'].includes(req.body?.session)
        ? req.body.session
        : 'New York',
      status: 'Active',
      pipsResult: 0,
      confidence: req.body?.confidence === 'Standard Setup' ? 'Standard Setup' : 'High Conviction',
      thesis,
      chartPattern: ['liquidity_sweep', 'order_block', 'fvg_continuation', 'bos_retest'].includes(
        req.body?.chartPattern,
      )
        ? req.body.chartPattern
        : 'liquidity_sweep',
      createdAt: now,
      updatedAt: now,
      authorName: req.currentUser!.name,
    };

    db.signals.unshift(created);
    saveStore();
    res.status(201).json({signal: created});
  });

  app.patch('/api/signals/:id', requireMentor, (req, res) => {
    const signal = db.signals.find((s) => s.id === req.params.id);
    if (!signal) {
      res.status(404).json({error: 'Signal not found.'});
      return;
    }
    const validStatuses: SignalStatus[] = [
      'Active',
      'TP1 Hit',
      'TP2 Hit',
      'TP3 Hit',
      'SL Hit',
      'Closed',
    ];
    if (validStatuses.includes(req.body?.status)) {
      signal.status = req.body.status;
    }
    if (req.body?.pipsResult !== undefined) {
      signal.pipsResult = cleanNum(req.body.pipsResult, signal.pipsResult);
    }
    signal.updatedAt = new Date().toISOString();
    saveStore();
    res.json({signal});
  });

  app.delete('/api/signals/:id', requireMentor, (req, res) => {
    const idx = db.signals.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({error: 'Signal not found.'});
      return;
    }
    db.signals.splice(idx, 1);
    saveStore();
    res.json({ok: true});
  });

  // Personal Trade Journal Endpoints
  app.get('/api/trades', requireAuth, (req: AuthedRequest, res) => {
    const userTrades = db.takenTrades
      .filter((t) => t.userId === req.currentUser!.id)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    res.json({trades: userTrades});
  });

  app.post('/api/trades', requireAuth, (req: AuthedRequest, res) => {
    const signalId = cleanStr(req.body?.signalId, 60);
    const signal = db.signals.find((s) => s.id === signalId);
    if (!signal) {
      res.status(404).json({error: 'Target signal not found.'});
      return;
    }
    const lotSize = Math.max(0.01, cleanNum(req.body?.lotSize, 0.1));
    const riskPercent = Math.max(0.1, cleanNum(req.body?.riskPercent, 1.0));
    const riskAmount = Math.max(1, cleanNum(req.body?.riskAmount, 100));
    const takeProfit = cleanNum(req.body?.takeProfit, signal.tp2);
    const notes = cleanStr(req.body?.notes, 400);

    const newTrade: TakenTrade = {
      id: `trd_${crypto.randomUUID().slice(0, 8)}`,
      userId: req.currentUser!.id,
      signalId: signal.id,
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.entry,
      stopLoss: signal.stopLoss,
      takeProfit,
      lotSize,
      riskPercent,
      riskAmount,
      outcome: 'Open',
      realizedPnl: 0,
      pipsCaptured: 0,
      notes: notes || `Executed ${signal.pair} ${signal.direction} from SK live signal.`,
      takenAt: new Date().toISOString(),
    };

    db.takenTrades.unshift(newTrade);
    saveStore();
    res.status(201).json({trade: newTrade});
  });

  app.patch('/api/trades/:id', requireAuth, (req: AuthedRequest, res) => {
    const trade = db.takenTrades.find(
      (t) => t.id === req.params.id && t.userId === req.currentUser!.id,
    );
    if (!trade) {
      res.status(404).json({error: 'Trade journal entry not found.'});
      return;
    }
    if (['Open', 'Won', 'Lost', 'Breakeven'].includes(req.body?.outcome)) {
      trade.outcome = req.body.outcome;
    }
    if (req.body?.realizedPnl !== undefined) {
      trade.realizedPnl = cleanNum(req.body.realizedPnl, trade.realizedPnl);
    }
    if (req.body?.pipsCaptured !== undefined) {
      trade.pipsCaptured = cleanNum(req.body.pipsCaptured, trade.pipsCaptured);
    }
    if (typeof req.body?.notes === 'string') {
      trade.notes = cleanStr(req.body.notes, 400);
    }
    saveStore();
    res.json({trade});
  });

  // Academy Endpoints
  app.get('/api/academy', requireAuth, (req: AuthedRequest, res) => {
    const completedIds = db.completedLessonsByUser[req.currentUser!.id] || [];
    res.json({
      courses: db.courses,
      lessons: db.lessons,
      completedLessonIds: completedIds,
    });
  });

  app.post('/api/academy/progress', requireAuth, (req: AuthedRequest, res) => {
    const lessonId = cleanStr(req.body?.lessonId, 60);
    const exists = db.lessons.some((l) => l.id === lessonId);
    if (!exists) {
      res.status(404).json({error: 'Lesson not found.'});
      return;
    }
    const uid = req.currentUser!.id;
    const current = db.completedLessonsByUser[uid] || [];
    const shouldComplete =
      typeof req.body?.completed === 'boolean'
        ? req.body.completed
        : !current.includes(lessonId);

    if (shouldComplete && !current.includes(lessonId)) {
      current.push(lessonId);
    } else if (!shouldComplete) {
      const idx = current.indexOf(lessonId);
      if (idx !== -1) current.splice(idx, 1);
    }
    db.completedLessonsByUser[uid] = current;
    saveStore();
    res.json({completedLessonIds: current});
  });

  app.post('/api/academy/lessons', requireMentor, (req, res) => {
    const courseId = cleanStr(req.body?.courseId, 60);
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) {
      res.status(404).json({error: 'Target course not found.'});
      return;
    }
    const title = cleanStr(req.body?.title, 120);
    const summary = cleanStr(req.body?.summary, 280);
    const rawContent = cleanStr(req.body?.content, 3000);
    const rawRules = cleanStr(req.body?.keyRules, 1000);
    const durationMinutes = Math.max(5, Math.min(180, cleanNum(req.body?.durationMinutes, 20)));

    if (!title || !summary || !rawContent) {
      res.status(400).json({error: 'Title, summary, and lesson content are required.'});
      return;
    }

    const courseLessons = db.lessons.filter((l) => l.courseId === courseId);
    const newLesson: Lesson = {
      id: `les_${crypto.randomUUID().slice(0, 8)}`,
      courseId,
      order: courseLessons.length + 1,
      title,
      durationMinutes,
      summary,
      content: rawContent
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
      keyRules: rawRules
        ? rawRules
            .split(/\n+/)
            .map((r) => r.trim())
            .filter(Boolean)
        : ['Verify higher-timeframe liquidity alignment before executing.'],
      diagramType: 'order_block',
      quiz: {
        question: `What is the core institutional takeaway from "${title}"?`,
        options: [
          'Wait for liquidity sweep + structural confirmation inside Premium/Discount',
          'Enter at market regardless of stop-loss distance',
          'Ignore session timing and news calendars',
        ],
        correctIndex: 0,
        explanation: 'Discipline around liquidity and structural confirmation protects capital.',
      },
    };

    db.lessons.push(newLesson);
    saveStore();
    res.status(201).json({lesson: newLesson});
  });

  // Briefings Endpoints
  app.get('/api/briefings', requireAuth, (_req, res) => {
    res.json({briefings: db.briefings});
  });

  app.post('/api/briefings', requireMentor, (req: AuthedRequest, res) => {
    const title = cleanStr(req.body?.title, 140);
    const summary = cleanStr(req.body?.summary, 1200);
    const keyLevels = cleanStr(req.body?.keyLevels, 300);
    const pairsRaw = cleanStr(req.body?.pairsWatched, 120);

    if (!title || !summary) {
      res.status(400).json({error: 'Briefing title and analysis summary are required.'});
      return;
    }

    const briefing: Briefing = {
      id: `brf_${crypto.randomUUID().slice(0, 8)}`,
      title,
      session: ['London', 'New York', 'Asian'].includes(req.body?.session)
        ? req.body.session
        : 'New York',
      bias: ['Bullish', 'Bearish', 'Neutral'].includes(req.body?.bias)
        ? req.body.bias
        : 'Neutral',
      pairsWatched: pairsRaw
        ? pairsRaw.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean)
        : ['XAUUSD', 'EURUSD'],
      summary,
      keyLevels: keyLevels || 'Key zones updated inside live signals feed.',
      publishedAt: new Date().toISOString(),
      author: req.currentUser!.name,
    };

    db.briefings.unshift(briefing);
    saveStore();
    res.status(201).json({briefing});
  });

  // Mentorship & VIP Leads
  app.post('/api/leads', (req, res) => {
    const name = cleanStr(req.body?.name, 80);
    const email = cleanStr(req.body?.email, 120).toLowerCase();
    const message = cleanStr(req.body?.message, 800);

    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({error: 'Please enter a valid name and email address.'});
      return;
    }

    const lead: LeadInquiry = {
      id: `lead_${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      experience: cleanStr(req.body?.experience, 60) as LeadInquiry['experience'] || 'Intermediate (6–24 Months)',
      interest: cleanStr(req.body?.interest, 60) as LeadInquiry['interest'] || 'VIP Signals & Academy',
      message,
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    db.leads.unshift(lead);
    saveStore();
    res.status(201).json({lead});
  });

  app.get('/api/leads', requireMentor, (_req, res) => {
    res.json({leads: db.leads});
  });

  // Persistent User Chart Workspaces API
  app.get('/api/workspaces', requireAuth, (req: AuthedRequest, res) => {
    const uid = req.currentUser!.id;
    const map = db.workspacesByUser || (db.workspacesByUser = {});
    const list = Array.isArray(map[uid]) ? map[uid] : [];
    res.json({workspaces: list});
  });

  app.post('/api/workspaces', requireAuth, (req: AuthedRequest, res) => {
    const uid = req.currentUser!.id;
    const ws = req.body?.workspace;
    if (!ws || typeof ws !== 'object' || typeof ws.id !== 'string' || typeof ws.name !== 'string') {
      res.status(400).json({error: 'Invalid workspace payload.'});
      return;
    }
    const map = db.workspacesByUser || (db.workspacesByUser = {});
    const list = Array.isArray(map[uid]) ? [...(map[uid] as Array<{id: string}>)] : [];
    const idx = list.findIndex((item) => item.id === ws.id);
    const cleaned = {...ws, name: cleanStr(ws.name, 60) || 'Workspace', updatedAt: new Date().toISOString()};
    if (idx >= 0) {
      list[idx] = cleaned;
    } else {
      list.unshift(cleaned);
    }
    map[uid] = list.slice(0, 25);
    saveStore();
    res.json({workspace: cleaned, workspaces: map[uid]});
  });

  app.delete('/api/workspaces/:id', requireAuth, (req: AuthedRequest, res) => {
    const uid = req.currentUser!.id;
    const map = db.workspacesByUser || (db.workspacesByUser = {});
    const list = Array.isArray(map[uid]) ? (map[uid] as Array<{id: string}>) : [];
    map[uid] = list.filter((w) => w.id !== req.params.id);
    saveStore();
    res.json({ok: true, workspaces: map[uid]});
  });

  // Real Market OHLCV Candles & Quotes Proxy for Charting Terminal
  interface MarketCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }

  interface ServerSymbolCfg {
    yahoo: string;
    binance?: string;
    name: string;
    exchange: string;
    assetClass: string;
    decimals: number;
    defaultPrice: number;
    pipSize: number;
  }

  const SYMBOL_CONFIG: Record<string, ServerSymbolCfg> = {
    XAUUSD: {yahoo: 'GC=F', name: 'Gold / US Dollar', exchange: 'COMEX / OANDA', assetClass: 'Metals', decimals: 3, defaultPrice: 3538.128, pipSize: 0.1},
    XAGUSD: {yahoo: 'SI=F', name: 'Silver / US Dollar', exchange: 'COMEX', assetClass: 'Metals', decimals: 3, defaultPrice: 31.85, pipSize: 0.01},
    EURUSD: {yahoo: 'EURUSD=X', name: 'Euro / US Dollar', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 5, defaultPrice: 1.0975, pipSize: 0.0001},
    GBPUSD: {yahoo: 'GBPUSD=X', name: 'British Pound / US Dollar', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 5, defaultPrice: 1.2845, pipSize: 0.0001},
    USDJPY: {yahoo: 'USDJPY=X', name: 'US Dollar / Japanese Yen', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 3, defaultPrice: 152.45, pipSize: 0.01},
    AUDUSD: {yahoo: 'AUDUSD=X', name: 'Australian Dollar / USD', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 5, defaultPrice: 0.6584, pipSize: 0.0001},
    NZDUSD: {yahoo: 'NZDUSD=X', name: 'New Zealand Dollar / USD', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 5, defaultPrice: 0.5942, pipSize: 0.0001},
    USDCAD: {yahoo: 'USDCAD=X', name: 'US Dollar / Canadian Dollar', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 5, defaultPrice: 1.3895, pipSize: 0.0001},
    USDCHF: {yahoo: 'USDCHF=X', name: 'US Dollar / Swiss Franc', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 5, defaultPrice: 0.8812, pipSize: 0.0001},
    EURJPY: {yahoo: 'EURJPY=X', name: 'Euro / Japanese Yen', exchange: 'OANDA / FX', assetClass: 'Forex', decimals: 3, defaultPrice: 165.8, pipSize: 0.01},
    WTI: {yahoo: 'CL=F', name: 'WTI Crude Oil Futures', exchange: 'NYMEX', assetClass: 'Commodities', decimals: 2, defaultPrice: 70.45, pipSize: 0.01},
    BRENT: {yahoo: 'BZ=F', name: 'Brent Crude Oil Futures', exchange: 'ICE', assetClass: 'Commodities', decimals: 2, defaultPrice: 74.1, pipSize: 0.01},
    DXY: {yahoo: 'DX-Y.NYB', name: 'US Dollar Index', exchange: 'ICE / TVC', assetClass: 'Indices', decimals: 3, defaultPrice: 104.25, pipSize: 0.01},
    SPX: {yahoo: '^GSPC', name: 'S&P 500 Index', exchange: 'SP / CBOE', assetClass: 'Indices', decimals: 2, defaultPrice: 5985.2, pipSize: 0.25},
    NAS100: {yahoo: 'NQ=F', name: 'Nasdaq 100 Index', exchange: 'NASDAQ / CME', assetClass: 'Indices', decimals: 2, defaultPrice: 20480.5, pipSize: 0.25},
    US30: {yahoo: '^DJI', name: 'Dow Jones Industrial Average', exchange: 'CBOT / DJI', assetClass: 'Indices', decimals: 2, defaultPrice: 43850.0, pipSize: 1.0},
    AAPL: {yahoo: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', assetClass: 'Stocks', decimals: 2, defaultPrice: 229.8, pipSize: 0.01},
    NVDA: {yahoo: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', assetClass: 'Stocks', decimals: 2, defaultPrice: 141.6, pipSize: 0.01},
    TSLA: {yahoo: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', assetClass: 'Stocks', decimals: 2, defaultPrice: 342.5, pipSize: 0.01},
    MSFT: {yahoo: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', assetClass: 'Stocks', decimals: 2, defaultPrice: 424.1, pipSize: 0.01},
    SPY: {yahoo: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE ARCA', assetClass: 'ETFs', decimals: 2, defaultPrice: 597.3, pipSize: 0.01},
    QQQ: {yahoo: 'QQQ', name: 'Invesco QQQ Trust ETF', exchange: 'NASDAQ', assetClass: 'ETFs', decimals: 2, defaultPrice: 508.9, pipSize: 0.01},
    'ES1!': {yahoo: 'ES=F', name: 'E-Mini S&P 500 Futures', exchange: 'CME', assetClass: 'Futures', decimals: 2, defaultPrice: 6012.25, pipSize: 0.25},
    'NQ1!': {yahoo: 'NQ=F', name: 'E-Mini Nasdaq 100 Futures', exchange: 'CME', assetClass: 'Futures', decimals: 2, defaultPrice: 20945.5, pipSize: 0.25},
    BTCUSDT: {yahoo: 'BTC-USD', binance: 'BTCUSDT', name: 'Bitcoin / TetherUS', exchange: 'BINANCE', assetClass: 'Crypto', decimals: 2, defaultPrice: 91250.0, pipSize: 1.0},
    ETHUSDT: {yahoo: 'ETH-USD', binance: 'ETHUSDT', name: 'Ethereum / TetherUS', exchange: 'BINANCE', assetClass: 'Crypto', decimals: 2, defaultPrice: 3180.0, pipSize: 0.1},
    SOLUSDT: {yahoo: 'SOL-USD', binance: 'SOLUSDT', name: 'Solana / TetherUS', exchange: 'BINANCE', assetClass: 'Crypto', decimals: 2, defaultPrice: 215.4, pipSize: 0.01},
  };

  const INTERVAL_MAP: Record<
    string,
    {
      yahooInterval: string;
      binanceInterval?: string;
      fromUnix?: number;
      periodDays?: number;
      range?: string;
      aggregateStepSec?: number;
      stepSec: number;
    }
  > = {
    '1s': {yahooInterval: '1m', binanceInterval: '1s', range: '5d', stepSec: 1},
    '5s': {yahooInterval: '1m', binanceInterval: '1s', range: '5d', aggregateStepSec: 5, stepSec: 5},
    '10s': {yahooInterval: '1m', binanceInterval: '1s', range: '5d', aggregateStepSec: 10, stepSec: 10},
    '15s': {yahooInterval: '1m', binanceInterval: '1s', range: '5d', aggregateStepSec: 15, stepSec: 15},
    '30s': {yahooInterval: '1m', binanceInterval: '1s', range: '5d', aggregateStepSec: 30, stepSec: 30},
    '1m': {yahooInterval: '1m', binanceInterval: '1m', range: '7d', stepSec: 60},
    '3m': {yahooInterval: '1m', binanceInterval: '3m', range: '7d', aggregateStepSec: 180, stepSec: 180},
    '5m': {yahooInterval: '5m', binanceInterval: '5m', range: '60d', stepSec: 300},
    '15m': {yahooInterval: '15m', binanceInterval: '15m', range: '60d', stepSec: 900},
    '30m': {yahooInterval: '30m', binanceInterval: '30m', range: '60d', stepSec: 1800},
    '45m': {yahooInterval: '15m', binanceInterval: '15m', range: '60d', aggregateStepSec: 2700, stepSec: 2700},
    '1h': {yahooInterval: '1h', binanceInterval: '1h', periodDays: 725, stepSec: 3600},
    '2h': {yahooInterval: '1h', binanceInterval: '2h', periodDays: 725, aggregateStepSec: 7200, stepSec: 7200},
    '3h': {yahooInterval: '1h', binanceInterval: '1h', periodDays: 725, aggregateStepSec: 10800, stepSec: 10800},
    '4h': {yahooInterval: '1h', binanceInterval: '4h', periodDays: 725, aggregateStepSec: 14400, stepSec: 14400},
    '6h': {yahooInterval: '1h', binanceInterval: '6h', periodDays: 725, aggregateStepSec: 21600, stepSec: 21600},
    '8h': {yahooInterval: '1h', binanceInterval: '8h', periodDays: 725, aggregateStepSec: 28800, stepSec: 28800},
    '12h': {yahooInterval: '1h', binanceInterval: '12h', periodDays: 725, aggregateStepSec: 43200, stepSec: 43200},
    '1d': {yahooInterval: '1d', binanceInterval: '1d', fromUnix: 1420070400, stepSec: 86400},
    '1wk': {yahooInterval: '1wk', binanceInterval: '1w', fromUnix: 1420070400, stepSec: 604800},
    '1mo': {yahooInterval: '1mo', binanceInterval: '1M', fromUnix: 1420070400, stepSec: 2592000},
  };

  type ServerFeedStatus = 'real-time' | 'delayed' | 'cached' | 'simulated';

  interface CachedMarketPayload {
    symbol: string;
    displayName: string;
    exchange: string;
    assetClass: string;
    interval: string;
    decimals: number;
    pipSize: number;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    source: string;
    feedStatus: ServerFeedStatus;
    supportedIntervals: string[];
    dateRange: {from: number; to: number; count: number};
    candles: MarketCandle[];
  }

  const MARKET_CACHE_DIR = path.join(DATA_DIR, 'market-cache');
  const marketCache = new Map<string, {expiresAt: number; payload: CachedMarketPayload}>();

  function readDiskMarketCache(symbolKey: string, intervalKey: string): CachedMarketPayload | null {
    try {
      const safeSym = symbolKey.replace(/[^A-Za-z0-9._-]/g, '_');
      const file = path.join(MARKET_CACHE_DIR, `${safeSym}-${intervalKey}.json`);
      if (!fs.existsSync(file)) return null;
      return JSON.parse(fs.readFileSync(file, 'utf8')) as CachedMarketPayload;
    } catch {
      return null;
    }
  }

  function writeDiskMarketCache(symbolKey: string, intervalKey: string, payload: CachedMarketPayload): void {
    try {
      if (!fs.existsSync(MARKET_CACHE_DIR)) {
        fs.mkdirSync(MARKET_CACHE_DIR, {recursive: true});
      }
      const safeSym = symbolKey.replace(/[^A-Za-z0-9._-]/g, '_');
      const file = path.join(MARKET_CACHE_DIR, `${safeSym}-${intervalKey}.json`);
      fs.writeFileSync(file, JSON.stringify(payload), 'utf8');
    } catch {
      // ignore disk cache write failures
    }
  }

  function roundPrice(val: number, decimals: number): number {
    const f = 10 ** decimals;
    return Math.round(val * f) / f;
  }

  function aggregateCandlesStep(candles: MarketCandle[], stepSec: number): MarketCandle[] {
    const buckets = new Map<number, MarketCandle>();
    for (const c of candles) {
      const bucketTime = Math.floor(c.time / stepSec) * stepSec;
      const existing = buckets.get(bucketTime);
      if (!existing) {
        buckets.set(bucketTime, {...c, time: bucketTime});
      } else {
        existing.high = Math.max(existing.high, c.high);
        existing.low = Math.min(existing.low, c.low);
        existing.close = c.close;
        existing.volume += c.volume;
      }
    }
    return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
  }

  function expandMinuteCandlesToSubSeconds(
    minuteBars: MarketCandle[],
    stepSec: number,
    decimals: number,
  ): MarketCandle[] {
    if (minuteBars.length === 0 || stepSec >= 60 || stepSec <= 0) return minuteBars;
    const subCount = Math.max(2, Math.floor(60 / stepSec));
    const maxMinuteBars =
      stepSec === 1 ? 20 : stepSec === 5 ? 60 : stepSec === 10 ? 120 : stepSec === 15 ? 180 : 300;
    const recent = minuteBars.slice(-maxMinuteBars);
    const out: MarketCandle[] = [];

    for (let bIdx = 0; bIdx < recent.length; bIdx++) {
      const bar = recent[bIdx];
      const baseTime = Math.floor(bar.time / 60) * 60;
      const bullish = bar.close >= bar.open;
      const e1 = bullish ? bar.low : bar.high;
      const e2 = bullish ? bar.high : bar.low;
      const range = Math.max(0, bar.high - bar.low);
      let prevClose = bar.open;
      const volPerSub = Math.max(1, Math.round((bar.volume || subCount * 10) / subCount));

      for (let s = 0; s < subCount; s++) {
        const u = (s + 1) / subCount;
        let targetC: number;
        if (s === subCount - 1) {
          targetC = bar.close;
        } else if (u <= 0.3) {
          const k = u / 0.3;
          targetC = bar.open + (e1 - bar.open) * k;
        } else if (u <= 0.72) {
          const k = (u - 0.3) / 0.42;
          targetC = e1 + (e2 - e1) * k;
        } else {
          const k = (u - 0.72) / 0.28;
          targetC = e2 + (bar.close - e2) * k;
        }
        const microWave =
          s === subCount - 1
            ? 0
            : Math.sin((bIdx * 13 + s * 2.1)) * range * 0.06;
        const cPrice = roundPrice(
          Math.max(bar.low, Math.min(bar.high, targetC + microWave)),
          decimals,
        );
        const oPrice = roundPrice(prevClose, decimals);
        let hPrice = roundPrice(Math.max(oPrice, cPrice), decimals);
        let lPrice = roundPrice(Math.min(oPrice, cPrice), decimals);

        const ext1Idx = Math.max(0, Math.round(subCount * 0.28) - 1);
        const ext2Idx = Math.max(0, Math.round(subCount * 0.7) - 1);
        if (s === ext1Idx) {
          if (bullish) lPrice = bar.low;
          else hPrice = bar.high;
        }
        if (s === ext2Idx) {
          if (bullish) hPrice = bar.high;
          else lPrice = bar.low;
        }

        out.push({
          time: baseTime + s * stepSec,
          open: oPrice,
          high: Math.min(bar.high, Math.max(hPrice, oPrice, cPrice)),
          low: Math.max(bar.low, Math.min(lPrice, oPrice, cPrice)),
          close: cPrice,
          volume: volPerSub,
        });
        prevClose = cPrice;
      }
    }
    return out;
  }

  async function fetchBinanceChart(symbolKey: string, intervalKey: string): Promise<CachedMarketPayload> {
    const cfg = SYMBOL_CONFIG[symbolKey];
    const iv = INTERVAL_MAP[intervalKey] || INTERVAL_MAP['1d'];
    if (!cfg?.binance || !iv.binanceInterval) throw new Error('Not a Binance pair');

    const limit = 1000;
    const batches = intervalKey === '1d' ? 4 : intervalKey === '1wk' ? 2 : 1;
    const allRows: Array<[number, string, string, string, string, string]> = [];
    let endTime: number | undefined = undefined;

    for (let b = 0; b < batches; b++) {
      const endParam = endTime ? `&endTime=${endTime}` : '';
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(cfg.binance)}&interval=${encodeURIComponent(iv.binanceInterval)}&limit=${limit}${endParam}`;
      const response = await fetch(url, {
        headers: {Accept: 'application/json'},
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) {
        if (b === 0) throw new Error(`Binance HTTP ${response.status}`);
        break;
      }
      const rows = (await response.json()) as Array<[number, string, string, string, string, string]>;
      if (!Array.isArray(rows) || rows.length === 0) break;
      allRows.unshift(...rows);
      const oldestMs = Number(rows[0][0]);
      if (!Number.isFinite(oldestMs) || rows.length < limit) break;
      endTime = oldestMs - 1;
    }

    if (allRows.length === 0) throw new Error('Empty Binance klines');

    const dedup = new Map<number, MarketCandle>();
    for (const r of allRows) {
      const t = Math.floor(Number(r[0]) / 1000);
      dedup.set(t, {
        time: t,
        open: roundPrice(Number(r[1]), cfg.decimals),
        high: roundPrice(Number(r[2]), cfg.decimals),
        low: roundPrice(Number(r[3]), cfg.decimals),
        close: roundPrice(Number(r[4]), cfg.decimals),
        volume: Math.round(Number(r[5]) || 0),
      });
    }
    let candles = Array.from(dedup.values()).sort((a, b) => a.time - b.time);

    if (iv.aggregateStepSec && iv.binanceInterval === '1s') {
      candles = aggregateCandlesStep(candles, iv.aggregateStepSec);
    } else if (iv.aggregateStepSec && iv.binanceInterval === '1h') {
      candles = aggregateCandlesStep(candles, iv.aggregateStepSec);
    } else if (iv.aggregateStepSec && iv.binanceInterval === '15m') {
      candles = aggregateCandlesStep(candles, iv.aggregateStepSec);
    }

    const last = candles[candles.length - 1];
    const prev = candles[Math.max(0, candles.length - 2)];
    const change = roundPrice(last.close - prev.open, cfg.decimals);
    const changePercent = prev.open > 0 ? Number((((last.close - prev.open) / prev.open) * 100).toFixed(2)) : 0;

    return {
      symbol: symbolKey,
      displayName: cfg.name,
      exchange: cfg.exchange,
      assetClass: cfg.assetClass,
      interval: intervalKey,
      decimals: cfg.decimals,
      pipSize: cfg.pipSize,
      price: last.close,
      previousClose: prev.open,
      change,
      changePercent,
      source: 'Binance Spot Real-Time',
      feedStatus: 'real-time',
      supportedIntervals: Object.keys(INTERVAL_MAP),
      dateRange: {from: candles[0].time, to: last.time, count: candles.length},
      candles,
    };
  }

  async function fetchMarketChart(symbolKey: string, intervalKey: string): Promise<CachedMarketPayload> {
    const cfg = SYMBOL_CONFIG[symbolKey] || SYMBOL_CONFIG.XAUUSD;
    const iv = INTERVAL_MAP[intervalKey] || INTERVAL_MAP['1d'];
    const cacheKey = `${symbolKey}:${intervalKey}`;
    const cached = marketCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }

    if (cfg.binance) {
      try {
        const binancePayload = await fetchBinanceChart(symbolKey, intervalKey);
        marketCache.set(cacheKey, {expiresAt: Date.now() + (iv.stepSec <= 60 ? 12_000 : 45_000), payload: binancePayload});
        writeDiskMarketCache(symbolKey, intervalKey, binancePayload);
        return binancePayload;
      } catch {
        // fall through to Yahoo if Binance fails
      }
    }

    const nowSec = Math.floor(Date.now() / 1000);
    let queryParams: string;
    if (iv.fromUnix) {
      queryParams = `period1=${iv.fromUnix}&period2=${nowSec}&interval=${iv.yahooInterval}`;
    } else if (iv.periodDays) {
      const p1 = Math.max(1420070400, nowSec - iv.periodDays * 86400);
      queryParams = `period1=${p1}&period2=${nowSec}&interval=${iv.yahooInterval}`;
    } else {
      queryParams = `range=${iv.range || '60d'}&interval=${iv.yahooInterval}`;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cfg.yahoo)}?${queryParams}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SKFXDesk/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (!response.ok) {
      throw new Error(`Feed HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            regularMarketChangePercent?: number;
            exchangeName?: string;
            currency?: string;
          };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: Array<number | null>;
              high?: Array<number | null>;
              low?: Array<number | null>;
              close?: Array<number | null>;
              volume?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const quote = result?.indicators?.quote?.[0];
    if (!result || !quote || timestamps.length === 0) {
      throw new Error('Empty candle payload');
    }

    const dedup = new Map<number, MarketCandle>();
    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      const v = quote.volume?.[i] ?? 0;
      if (
        typeof t !== 'number' ||
        typeof o !== 'number' ||
        typeof h !== 'number' ||
        typeof l !== 'number' ||
        typeof c !== 'number' ||
        !Number.isFinite(o) ||
        !Number.isFinite(h) ||
        !Number.isFinite(l) ||
        !Number.isFinite(c)
      ) {
        continue;
      }
      dedup.set(t, {
        time: t,
        open: roundPrice(o, cfg.decimals),
        high: roundPrice(Math.max(o, h, l, c), cfg.decimals),
        low: roundPrice(Math.min(o, h, l, c), cfg.decimals),
        close: roundPrice(c, cfg.decimals),
        volume: typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0,
      });
    }

    let candles = Array.from(dedup.values()).sort((a, b) => a.time - b.time);
    const isSubMinute = iv.stepSec < 60 && iv.yahooInterval === '1m';
    if (isSubMinute) {
      candles = expandMinuteCandlesToSubSeconds(candles, iv.stepSec, cfg.decimals);
    } else if (iv.aggregateStepSec) {
      candles = aggregateCandlesStep(candles, iv.aggregateStepSec);
    }

    if (candles.length > 8000 && !iv.fromUnix) {
      candles = candles.slice(-8000);
    }

    if (candles.length === 0) {
      throw new Error('No valid OHLC bars returned');
    }

    const last = candles[candles.length - 1];
    const prevBar = candles[Math.max(0, candles.length - 2)];
    const price = result.meta?.regularMarketPrice
      ? roundPrice(result.meta.regularMarketPrice, cfg.decimals)
      : last.close;
    const prevClose =
      typeof result.meta?.previousClose === 'number' &&
      result.meta.previousClose > 0 &&
      Math.abs(result.meta.previousClose - price) > 1e-9
        ? result.meta.previousClose
        : prevBar.close;
    const change = roundPrice(price - prevClose, cfg.decimals);
    const changePercent =
      prevClose > 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;

    const payload: CachedMarketPayload = {
      symbol: symbolKey,
      displayName: cfg.name,
      exchange: cfg.exchange,
      assetClass: cfg.assetClass,
      interval: intervalKey,
      decimals: cfg.decimals,
      pipSize: cfg.pipSize,
      price,
      previousClose: roundPrice(prevClose, cfg.decimals),
      change,
      changePercent,
      source: isSubMinute
        ? `Yahoo 1m · Sub-Minute (${intervalKey})`
        : result.meta?.exchangeName
          ? `Yahoo · ${result.meta.exchangeName} (Delayed)`
          : 'Yahoo Finance (Delayed)',
      feedStatus: 'delayed',
      supportedIntervals: Object.keys(INTERVAL_MAP),
      dateRange: {
        from: candles[0].time,
        to: candles[candles.length - 1].time,
        count: candles.length,
      },
      candles,
    };

    marketCache.set(cacheKey, {
      expiresAt: Date.now() + (isSubMinute ? 15_000 : 60_000),
      payload,
    });
    writeDiskMarketCache(symbolKey, intervalKey, payload);
    return payload;
  }

  app.get('/api/market/candles', async (req, res) => {
    const rawSymbol = cleanStr(req.query.symbol, 16).toUpperCase() || 'XAUUSD';
    const rawInterval = cleanStr(req.query.interval, 8).toLowerCase() || '1d';
    const symbolKey = SYMBOL_CONFIG[rawSymbol] ? rawSymbol : 'XAUUSD';
    const cfg = SYMBOL_CONFIG[symbolKey];
    const intervalKey = INTERVAL_MAP[rawInterval] ? rawInterval : '1d';

    try {
      const payload = await fetchMarketChart(symbolKey, intervalKey);
      res.json(payload);
    } catch {
      const diskCached = readDiskMarketCache(symbolKey, intervalKey);
      if (diskCached && diskCached.candles.length > 0) {
        res.json({
          ...diskCached,
          supportedIntervals: Object.keys(INTERVAL_MAP),
          source: 'Cached Historical Feed',
          feedStatus: 'cached',
        });
        return;
      }

      const iv = INTERVAL_MAP[intervalKey];
      const nowSec = Math.floor(Date.now() / 1000);
      const count = 260;
      const candles: MarketCandle[] = [];
      let p = cfg.defaultPrice * 0.985;
      const step = cfg.pipSize * (symbolKey === 'XAUUSD' ? 28 : symbolKey === 'NAS100' || symbolKey === 'NQ1!' ? 42 : symbolKey.endsWith('USDT') ? 280 : 14);
      const seed = symbolKey.charCodeAt(0) * 0.17 + intervalKey.charCodeAt(0) * 0.09;
      for (let i = count; i >= 1; i--) {
        const t = Math.floor((nowSec - i * iv.stepSec) / iv.stepSec) * iv.stepSec;
        const wave = Math.sin((i + seed) * 0.19) * 0.65 + Math.cos((i + seed) * 0.07) * 0.45;
        const delta = wave * step;
        const open = roundPrice(p, cfg.decimals);
        const close = roundPrice(p + delta, cfg.decimals);
        const wickUp = Math.abs(Math.sin(i * 0.43)) * step * 0.9;
        const wickDn = Math.abs(Math.cos(i * 0.37)) * step * 0.9;
        const high = roundPrice(Math.max(open, close) + wickUp, cfg.decimals);
        const low = roundPrice(Math.min(open, close) - wickDn, cfg.decimals);
        candles.push({
          time: t,
          open,
          high,
          low,
          close,
          volume: Math.round(1200 + Math.abs(wave) * 2400),
        });
        p = close;
      }
      const last = candles[candles.length - 1];
      const first = candles[0];
      res.json({
        symbol: symbolKey,
        displayName: cfg.name,
        exchange: cfg.exchange,
        assetClass: cfg.assetClass,
        interval: intervalKey,
        decimals: cfg.decimals,
        pipSize: cfg.pipSize,
        price: last.close,
        previousClose: first.open,
        change: roundPrice(last.close - first.open, cfg.decimals),
        changePercent: Number((((last.close - first.open) / first.open) * 100).toFixed(2)),
        source: 'Simulated Fallback (Feed Offline)',
        feedStatus: 'simulated',
        supportedIntervals: Object.keys(INTERVAL_MAP),
        dateRange: {from: first.time, to: last.time, count: candles.length},
        candles,
      });
    }
  });

  app.get('/api/market/quotes', async (_req, res) => {
    const keys = Object.keys(SYMBOL_CONFIG);
    const quotes = await Promise.all(
      keys.map(async (sym) => {
        const cfg = SYMBOL_CONFIG[sym];
        try {
          const data = await fetchMarketChart(sym, '1d');
          return {
            symbol: sym,
            name: cfg.name,
            exchange: cfg.exchange,
            assetClass: cfg.assetClass,
            decimals: cfg.decimals,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            feedStatus: data.feedStatus,
          };
        } catch {
          const cached = readDiskMarketCache(sym, '1d');
          return {
            symbol: sym,
            name: cfg.name,
            exchange: cfg.exchange,
            assetClass: cfg.assetClass,
            decimals: cfg.decimals,
            price: cached?.price ?? cfg.defaultPrice,
            change: cached?.change ?? 0,
            changePercent: cached?.changePercent ?? 0,
            feedStatus: cached ? 'cached' : 'simulated',
          };
        }
      }),
    );
    res.json({quotes});
  });

  // Standalone OAuth Callback Handler (for popup postMessage + top-level fallback)
  app.get(['/auth/callback', '/auth/callback/'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SKFX Academy · Signing in</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #070B14;
        color: #F8FAFC;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .card {
        max-width: 360px;
        padding: 28px 24px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(13, 21, 40, 0.92);
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 700;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: #94A3B8;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>SKFX Academy</h1>
      <p id="status">Completing Google sign-in...</p>
    </div>
    <script>
      (function () {
        var searchParams = new URLSearchParams(window.location.search || '');
        var hashRaw = window.location.hash ? window.location.hash.slice(1) : '';
        var hashParams = new URLSearchParams(hashRaw);

        var code = searchParams.get('code') || undefined;
        var accessToken = hashParams.get('access_token') || undefined;
        var refreshToken = hashParams.get('refresh_token') || undefined;
        var error =
          searchParams.get('error') ||
          hashParams.get('error') ||
          undefined;
        var errorDescription =
          searchParams.get('error_description') ||
          hashParams.get('error_description') ||
          undefined;

        var statusEl = document.getElementById('status');

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: 'SUPABASE_OAUTH_CALLBACK',
              code: code,
              accessToken: accessToken,
              refreshToken: refreshToken,
              error: error,
              errorDescription: errorDescription
            },
            '*'
          );
          if (statusEl) {
            statusEl.textContent = error
              ? 'Sign-in could not be completed. You may close this window.'
              : 'Sign-in complete! Returning to your trading desk...';
          }
          setTimeout(function () {
            window.close();
          }, 150);
          return;
        }

        // Fallback if user navigated directly without a popup opener
        var target = '/' + (window.location.search || '') + (window.location.hash || '');
        window.location.replace(target);
      })();
    </script>
  </body>
</html>`);
  });

  // Vite or Static Frontend Serving
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(distIndexPath));

  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (!fs.existsSync(distIndexPath)) {
      console.error(
        `Missing production build at ${distIndexPath}. Run "npm run build" before starting.`,
      );
    }
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        maxAge: '1y',
        immutable: true,
      }),
    );
    app.use('/assets', (_req, res) => {
      res.status(404).type('text/plain').send('Asset not found');
    });
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader(
              'Cache-Control',
              'no-store, no-cache, must-revalidate, proxy-revalidate',
            );
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      }),
    );
    app.use('/api', (_req, res) => {
      res.status(404).json({error: 'API endpoint not found.'});
    });
    app.get('*', (_req, res) => {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(distIndexPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SKFX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
