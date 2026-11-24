export type UserRole = 'student' | 'mentor';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: 'Standard' | 'VIP Desk' | 'Mentor';
  accountBalance: number;
  defaultRiskPercent: number;
  createdAt: string;
}

export type SignalDirection = 'BUY' | 'SELL';
export type SignalStatus = 'Active' | 'TP1 Hit' | 'TP2 Hit' | 'TP3 Hit' | 'SL Hit' | 'Closed';
export type TradingSession = 'London' | 'New York' | 'Asian';

export interface Signal {
  id: string;
  pair: string;
  direction: SignalDirection;
  orderType: 'Market Execution' | 'Buy Limit' | 'Sell Limit' | 'Buy Stop' | 'Sell Stop';
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: string;
  timeframe: 'M15' | 'M30' | 'H1' | 'H4';
  session: TradingSession;
  status: SignalStatus;
  pipsResult: number;
  confidence: 'High Conviction' | 'Standard Setup';
  thesis: string;
  chartPattern: 'liquidity_sweep' | 'order_block' | 'fvg_continuation' | 'bos_retest';
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

export interface TakenTrade {
  id: string;
  userId: string;
  signalId: string;
  pair: string;
  direction: SignalDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskPercent: number;
  riskAmount: number;
  outcome: 'Open' | 'Won' | 'Lost' | 'Breakeven';
  realizedPnl: number;
  pipsCaptured: number;
  notes: string;
  takenAt: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  durationMinutes: number;
  summary: string;
  content: string[];
  keyRules: string[];
  diagramType: 'liquidity_sweep' | 'bos_choch' | 'fvg_imbalance' | 'order_block' | 'gold_killzone' | 'risk_curve';
  quiz: LessonQuiz;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  level: 'Foundation' | 'Intermediate' | 'Institutional';
  categoryLabel?: string;
  accessType: 'Free' | 'Premium';
  priceLabel: string;
  durationLabel: string;
  thumbnailUrl: string;
  instructor: string;
  estimatedHours: number;
  description: string;
}

export interface Briefing {
  id: string;
  title: string;
  session: TradingSession;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  pairsWatched: string[];
  summary: string;
  keyLevels: string;
  publishedAt: string;
  author: string;
}

export interface LeadInquiry {
  id: string;
  name: string;
  email: string;
  experience: 'Beginner (0–6 Months)' | 'Intermediate (6–24 Months)' | 'Funded / Advanced';
  interest: 'VIP Signals & Academy' | 'Exness Partner Free Access' | '1-on-1 SK Mentorship';
  message: string;
  status: 'New' | 'Reviewed';
  createdAt: string;
}

export interface ShowcasePayload {
  metrics: {
    winRatePercent: number;
    netPips90Days: number;
    activeSignalsCount: number;
    totalLessonsCount: number;
    avgRiskReward: string;
  };
  recentSignals: Signal[];
  courses: (Course & { lessonCount: number })[];
  briefings: Briefing[];
}
