import crypto from 'node:crypto';
import type {
  Briefing,
  Course,
  LeadInquiry,
  Lesson,
  Signal,
  TakenTrade,
} from '../src/types.ts';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'mentor';
  tier: 'Standard' | 'VIP Desk' | 'Mentor';
  accountBalance: number;
  defaultRiskPercent: number;
  createdAt: string;
}

export interface StoreDatabase {
  users: StoredUser[];
  signals: Signal[];
  takenTrades: TakenTrade[];
  courses: Course[];
  lessons: Lesson[];
  completedLessonsByUser: Record<string, string[]>;
  briefings: Briefing[];
  leads: LeadInquiry[];
  workspacesByUser?: Record<string, unknown[]>;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function createInitialStore(): StoreDatabase {
  const courses: Course[] = [
    {
      id: 'crs_free_forex',
      slug: 'free-forex-trading',
      title: 'Free Forex Trading',
      subtitle: 'Learn • Analyze • Trade',
      level: 'Foundation',
      categoryLabel: 'Course',
      accessType: 'Free',
      priceLabel: 'Free',
      durationLabel: '2h 21min',
      thumbnailUrl: '/assets/aistudio/image_d4a348cf.png',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 2.4,
      description:
        'Start your Forex trading journey for free with currency pairs, pip sizing, market sessions, and core price structure.',
    },
    {
      id: 'crs_free_prop_firm',
      slug: 'free-prop-firm-series',
      title: 'Free Prop Firm Series',
      subtitle: 'Get Funded • Trade • Keep Profits',
      level: 'Intermediate',
      categoryLabel: 'Course',
      accessType: 'Free',
      priceLabel: 'Free',
      durationLabel: '2h 30min',
      thumbnailUrl: '/assets/aistudio/image_49af9904.png',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 2.5,
      description:
        'Navigate FTMO, FundedNext, and prop firm challenges—mastering drawdown rules, risk scaling, and funded payouts.',
    },
    {
      id: 'crs_forex_mastery_premium',
      slug: 'forex-mastery-premium',
      title: 'Forex Mastery',
      subtitle: 'Learn • Analyze • Trade • Profit',
      level: 'Institutional',
      categoryLabel: 'Mentorship',
      accessType: 'Premium',
      priceLabel: '$75',
      durationLabel: '5h 34min',
      thumbnailUrl: '/assets/aistudio/image_bfc6171c.png',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 5.6,
      description:
        'A complete Forex trading course by SKFX covering institutional order flow, liquidity sweeps, multi-pair execution, and risk architecture.',
    },
    {
      id: 'crs_xau_masterclass',
      slug: 'xau-masterclass',
      title: 'XAU Masterclass',
      subtitle: 'Analyze • Strategize • Trade',
      level: 'Institutional',
      categoryLabel: 'Masterclass',
      accessType: 'Premium',
      priceLabel: '$95',
      durationLabel: '4h 15min',
      thumbnailUrl: '/assets/aistudio/image_2b744ebe.png',
      instructor: 'Kombat Sampson (SK)',
      estimatedHours: 4.25,
      description:
        'Specialized Gold (XAUUSD) institutional playbook—Asian range manipulation, killzone sweeps, precision entries, and scaling protocol.',
    },
  ];

  const lessons: Lesson[] = [];

  const signals: Signal[] = [];

  const takenTrades: TakenTrade[] = [];

  const briefings: Briefing[] = [];

  const leads: LeadInquiry[] = [];

  return {
    users: [],
    signals,
    takenTrades,
    courses,
    lessons,
    completedLessonsByUser: {},
    briefings,
    leads,
    workspacesByUser: {},
  };
}
