import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  FolderOpen,
  HelpCircle,
  ListOrdered,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Search,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {Course, Lesson} from '../types';
import {BrandLogo} from './BrandLogo';
import {ChartStructureDiagram} from './ChartStructureDiagram';
import {ResilientImage} from './ResilientImage';

interface CourseModuleGroup {
  id: string;
  numberLabel: string;
  title: string;
  lessons: Lesson[];
}

type PlayerTab = 'summary' | 'checkpoint' | 'resources' | 'notes';

interface CoursePlayerWorkspaceProps {
  userId: string;
  courses: Course[];
  lessons: Lesson[];
  activeCourseId: string;
  activeLessonId: string;
  completedLessonIds: string[];
  isCourseEnrolled: (course: Course) => boolean;
  onSelectCourse: (course: Course) => void;
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onEnrollCourse: (course: Course) => void;
  onBackToCourses: () => void;
  onOpenSimulator: () => void;
  onOpenCalculator: () => void;
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CoursePlayerWorkspace({
  userId,
  courses,
  lessons,
  activeCourseId,
  activeLessonId,
  completedLessonIds,
  isCourseEnrolled,
  onSelectCourse,
  onSelectLesson,
  onToggleLessonComplete,
  onEnrollCourse,
  onBackToCourses,
  onOpenSimulator,
  onOpenCalculator,
}: CoursePlayerWorkspaceProps) {
  const activeCourse = useMemo(
    () => courses.find((c) => c.id === activeCourseId) || courses[0] || null,
    [courses, activeCourseId],
  );

  const courseLessons = useMemo(
    () =>
      lessons
        .filter((l) => l.courseId === (activeCourse?.id || ''))
        .sort((a, b) => a.order - b.order),
    [lessons, activeCourse],
  );

  const activeLesson = useMemo(
    () =>
      courseLessons.find((l) => l.id === activeLessonId) ||
      courseLessons[0] ||
      null,
    [courseLessons, activeLessonId],
  );

  const activeIndex = useMemo(
    () =>
      activeLesson
        ? courseLessons.findIndex((l) => l.id === activeLesson.id)
        : -1,
    [courseLessons, activeLesson],
  );

  const modules: CourseModuleGroup[] = useMemo(() => {
    if (!activeCourse || courseLessons.length === 0) return [];
    return [
      {
        id: `${activeCourse.id}_mod_1`,
        numberLabel: '01',
        title: `${activeCourse.title} Curriculum`,
        lessons: courseLessons,
      },
    ];
  }, [activeCourse, courseLessons]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const [lessonQuery, setLessonQuery] = useState('');
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([]);
  const [playerTab, setPlayerTab] = useState<PlayerTab>('summary');

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpandedStage, setIsExpandedStage] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({});
  const [lessonNote, setLessonNote] = useState('');
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const totalSec = (activeLesson?.durationMinutes || 20) * 60;

  // Ensure module containing active lesson is expanded by default
  useEffect(() => {
    if (!activeLesson || modules.length === 0) return;
    const ownerMod = modules.find((m) =>
      m.lessons.some((l) => l.id === activeLesson.id),
    );
    if (ownerMod) {
      setExpandedModuleIds((prev) =>
        prev.includes(ownerMod.id) ? prev : [...prev, ownerMod.id],
      );
    }
  }, [activeLesson, modules]);

  // Reset player state & load saved notes/checklist when active lesson changes
  useEffect(() => {
    setIsPlaying(false);
    setElapsedSec(0);
    setQuizAnswer(null);
    if (!activeLesson || typeof window === 'undefined') return;
    try {
      const savedNote = localStorage.getItem(
        `skfx_note_${userId}_${activeLesson.id}`,
      );
      setLessonNote(savedNote || '');
      setNoteSavedAt(null);

      const savedRulesRaw = localStorage.getItem(
        `skfx_rules_${userId}_${activeLesson.id}`,
      );
      setCheckedRules(
        savedRulesRaw ? (JSON.parse(savedRulesRaw) as Record<string, boolean>) : {},
      );
    } catch {
      setLessonNote('');
      setCheckedRules({});
    }
  }, [activeLesson?.id, userId]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !activeLesson) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + playbackSpeed;
        if (next >= totalSec) {
          setIsPlaying(false);
          return totalSec;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalSec, activeLesson]);

  const filteredModules = useMemo(() => {
    const q = lessonQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules
      .map((mod) => ({
        ...mod,
        lessons: mod.lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.summary.toLowerCase().includes(q) ||
            mod.title.toLowerCase().includes(q),
        ),
      }))
      .filter((mod) => mod.lessons.length > 0);
  }, [modules, lessonQuery]);

  const completedInCourse = useMemo(
    () =>
      courseLessons.filter((l) => completedLessonIds.includes(l.id)).length,
    [courseLessons, completedLessonIds],
  );

  const coursePct =
    courseLessons.length > 0
      ? Math.round((completedInCourse / courseLessons.length) * 100)
      : 0;

  const toggleModule = (modId: string) => {
    setExpandedModuleIds((prev) =>
      prev.includes(modId)
        ? prev.filter((id) => id !== modId)
        : [...prev, modId],
    );
  };

  const handleRuleToggle = (idx: number) => {
    if (!activeLesson) return;
    const key = String(idx);
    setCheckedRules((prev) => {
      const next = {...prev, [key]: !prev[key]};
      try {
        localStorage.setItem(
          `skfx_rules_${userId}_${activeLesson.id}`,
          JSON.stringify(next),
        );
      } catch {
        // ignore storage quota
      }
      return next;
    });
  };

  const handleNoteChange = (val: string) => {
    setLessonNote(val);
    if (!activeLesson || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`skfx_note_${userId}_${activeLesson.id}`, val);
      setNoteSavedAt(
        new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      );
    } catch {
      // ignore storage quota
    }
  };

  const handleStampTimestamp = () => {
    const stamp = `[${formatMmSs(elapsedSec)}] `;
    const next = lessonNote
      ? `${lessonNote}${lessonNote.endsWith('\n') ? '' : '\n'}${stamp}`
      : stamp;
    handleNoteChange(next);
  };

  const handleDownloadCheatSheet = () => {
    if (!activeLesson || !activeCourse) return;
    const content = [
      `SKFX ACADEMY — STUDY CHEAT SHEET`,
      `Course: ${activeCourse.title} (${activeCourse.level})`,
      `Lesson ${activeLesson.order}: ${activeLesson.title}`,
      `Duration: ${activeLesson.durationMinutes} min`,
      ``,
      `SUMMARY`,
      activeLesson.summary,
      ``,
      `CORE BREAKDOWN`,
      ...activeLesson.content.map((p, i) => `${i + 1}. ${p}`),
      ``,
      `SK EXECUTION RULES`,
      ...activeLesson.keyRules.map((r, i) => `[ ] 0${i + 1}. ${r}`),
      ``,
      `CHECKPOINT QUESTION`,
      activeLesson.quiz.question,
      `Answer: ${activeLesson.quiz.options[activeLesson.quiz.correctIndex]}`,
      `Note: ${activeLesson.quiz.explanation}`,
    ].join('\n');

    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SKFX-${activeCourse.slug}-lesson-${activeLesson.order}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chapters = useMemo(() => {
    if (!activeLesson) return [];
    const seg = Math.max(60, Math.floor(totalSec / 4));
    return [
      {
        id: 'ch_1',
        timeSec: 0,
        title: 'Lesson Objective & Market Context',
        body: activeLesson.summary,
      },
      {
        id: 'ch_2',
        timeSec: seg,
        title: 'Institutional Price Structure Breakdown',
        body:
          activeLesson.content[0] ||
          'Examine liquidity zones and clean structural alignment before execution.',
      },
      {
        id: 'ch_3',
        timeSec: seg * 2,
        title: 'SK Execution Rules & Invalidation',
        body:
          activeLesson.content[1] ||
          activeLesson.keyRules[0] ||
          'Enforce predefined Stop Loss and Take Profit targets on every setup.',
      },
      {
        id: 'ch_4',
        timeSec: seg * 3,
        title: 'Trade Checklist & Checkpoint Prep',
        body:
          activeLesson.keyRules.join(' · ') ||
          'Confirm all institutional confluences prior to execution.',
      },
    ];
  }, [activeLesson, totalSec]);

  const currentChapterIndex = useMemo(() => {
    if (chapters.length === 0) return 0;
    let idx = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (elapsedSec >= chapters[i].timeSec) idx = i;
    }
    return idx;
  }, [chapters, elapsedSec]);

  const handleToggleFullscreen = () => {
    if (!stageRef.current) {
      setIsExpandedStage((prev) => !prev);
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => setIsExpandedStage(false));
      setIsExpandedStage(false);
    } else if (stageRef.current.requestFullscreen) {
      stageRef.current
        .requestFullscreen()
        .then(() => setIsExpandedStage(true))
        .catch(() => setIsExpandedStage((prev) => !prev));
    } else {
      setIsExpandedStage((prev) => !prev);
    }
  };

  if (!activeCourse) {
    return null;
  }

  const enrolled = isCourseEnrolled(activeCourse);
  const progressPct = totalSec > 0 ? Math.min(100, (elapsedSec / totalSec) * 100) : 0;
  const isLessonDone = activeLesson
    ? completedLessonIds.includes(activeLesson.id)
    : false;

  // Curriculum sidebar JSX helper
  const renderCurriculumSidebar = (isMobileOverlay = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0D1017] border border-slate-200/85 dark:border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F172A] dark:text-white">
              Course Content
            </h2>
            <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1">
              {modules.length} {modules.length === 1 ? 'module' : 'modules'} ·{' '}
              {courseLessons.length}{' '}
              {courseLessons.length === 1 ? 'lesson' : 'lessons'} ·{' '}
              {activeCourse.durationLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              isMobileOverlay
                ? setMobileCurriculumOpen(false)
                : setSidebarCollapsed(true)
            }
            aria-label="Collapse course content"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors shrink-0"
          >
            {isMobileOverlay ? (
              <X className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search Lessons */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={lessonQuery}
            onChange={(e) => setLessonQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full rounded-xl border border-slate-200/85 dark:border-white/10 bg-slate-50 dark:bg-[#080B10] pl-8 pr-8 py-2 text-xs text-[#0F172A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C468]/60"
          />
          {lessonQuery && (
            <button
              type="button"
              onClick={() => setLessonQuery('')}
              aria-label="Clear lesson search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Accordion Modules List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200/75 dark:divide-white/[0.07]">
        {filteredModules.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {lessonQuery
              ? `No lessons match "${lessonQuery}".`
              : 'No lessons have been added to this course yet.'}
          </div>
        ) : (
          filteredModules.map((mod) => {
            const isExpanded =
              lessonQuery.trim().length > 0 || expandedModuleIds.includes(mod.id);
            const hasActive = mod.lessons.some((l) => l.id === activeLesson?.id);
            const modDone = mod.lessons.filter((l) =>
              completedLessonIds.includes(l.id),
            ).length;
            const modDuration = mod.lessons.reduce(
              (acc, l) => acc + l.durationMinutes,
              0,
            );

            return (
              <div key={mod.id} className="py-2">
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full px-4 py-2.5 flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <span
                    className={`font-display text-sm font-bold font-mono tabular-nums pt-0.5 shrink-0 ${
                      hasActive
                        ? 'text-[#D97706] dark:text-[#E8C468]'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {mod.numberLabel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-white leading-snug">
                      {mod.title}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                      {modDone}/{mod.lessons.length}{' '}
                      {mod.lessons.length === 1 ? 'lesson' : 'lessons'} ·{' '}
                      {modDuration}m
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="pl-5 pr-3 pb-2 pt-1 space-y-1.5 relative">
                    {/* Vertical timeline guide */}
                    <div
                      aria-hidden="true"
                      className="absolute left-[26px] top-3 bottom-4 w-px bg-slate-200 dark:bg-white/10"
                    />
                    {mod.lessons.map((les) => {
                      const isSelected = activeLesson?.id === les.id;
                      const done = completedLessonIds.includes(les.id);
                      return (
                        <div key={les.id} className="relative pl-5">
                          <span
                            aria-hidden="true"
                            className={`absolute left-[3px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 ${
                              isSelected
                                ? 'bg-[#E8C468] border-[#E8C468]'
                                : done
                                  ? 'bg-[#16A34A] border-[#16A34A]'
                                  : 'bg-white dark:bg-[#0D1017] border-slate-300 dark:border-slate-600'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLesson(les.id);
                              if (isMobileOverlay) setMobileCurriculumOpen(false);
                            }}
                            className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 border transition-colors ${
                              isSelected
                                ? 'border-[#E8C468]/70 bg-[#E8C468]/10 dark:bg-[#E8C468]/[0.08]'
                                : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                done
                                  ? 'bg-emerald-500/15 text-[#16A34A] dark:text-emerald-400'
                                  : isSelected
                                    ? 'bg-[#E8C468]/20 text-[#B45309] dark:text-[#E8C468]'
                                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {done ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  isSelected
                                    ? 'text-[#0F172A] dark:text-[#F8E7B2]'
                                    : 'text-[#0F172A] dark:text-slate-200'
                                }`}
                              >
                                {les.title}
                              </p>
                              <p className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
                                LESSON · {les.durationMinutes}:00
                              </p>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Progress Footer */}
      <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#090B10] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-white">
            <Trophy className="w-3.5 h-3.5 text-[#D97706] dark:text-[#E8C468]" />
            <span>Your Progress</span>
          </span>
          <span className="font-mono font-bold tabular-nums text-[#D97706] dark:text-[#E8C468]">
            {coursePct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#E8C468] transition-all duration-300"
            style={{width: `${coursePct}%`}}
          />
        </div>
        <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {completedInCourse} of {courseLessons.length}{' '}
          {courseLessons.length === 1 ? 'lesson' : 'lessons'} completed
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Slim Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToCourses}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1322] text-xs font-semibold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Courses</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileCurriculumOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8C468]/45 bg-[#E8C468]/10 text-xs font-semibold text-[#B45309] dark:text-[#E8C468] whitespace-nowrap shrink-0"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Course Content</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo className="w-8 h-8 rounded-full shadow-sm" />
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0F172A] dark:text-white truncate">
                {activeCourse.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activeCourse.level} · {activeCourse.instructor} ·{' '}
                {activeCourse.durationLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Course Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="course-player-switcher"
            className="hidden sm:inline text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            Switch Course:
          </label>
          <select
            id="course-player-switcher"
            value={activeCourse.id}
            onChange={(e) => {
              const target = courses.find((c) => c.id === e.target.value);
              if (target) onSelectCourse(target);
            }}
            className="rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#0D1322] px-3 py-1.5 text-xs font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:border-[#E8C468]/60"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({isCourseEnrolled(c) ? 'Enrolled' : c.priceLabel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enrollment Lock Gate if user switched to an un-enrolled course */}
      {!enrolled ? (
        <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1017] p-8 sm:p-10 text-center space-y-5 max-w-2xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-[#D97706] dark:text-[#E8C468]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-bold text-[#0F172A] dark:text-white">
              Enroll to unlock {activeCourse.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Enroll in this course to launch its interactive lesson player, structural diagrams, study cheat sheets, and personal notes.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackToCourses}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              Back to Courses
            </button>
            <button
              type="button"
              onClick={() => onEnrollCourse(activeCourse)}
              className="px-5 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
            >
              {activeCourse.accessType === 'Free'
                ? 'Enroll for Free'
                : `Enroll & Unlock · ${activeCourse.priceLabel}`}
            </button>
          </div>
        </div>
      ) : (
        /* Main Two-Column Course Player Grid */
        <div className="flex flex-col lg:flex-row items-start gap-5">
          {/* Desktop Left Curriculum Sidebar */}
          {sidebarCollapsed ? (
            <div className="hidden lg:flex shrink-0">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                title="Expand Course Content"
                className="px-3 py-3 rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1017] text-xs font-semibold text-[#0F172A] dark:text-white hover:border-[#E8C468]/60 flex items-center gap-2 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#D97706] dark:text-[#E8C468]" />
                <span>Content</span>
              </button>
            </div>
          ) : (
            <aside className="hidden lg:block w-[310px] xl:w-[330px] shrink-0 lg:sticky lg:top-20 max-h-[calc(100vh-6.5rem)]">
              <div className="h-[calc(100vh-7rem)] min-h-[540px]">
                {renderCurriculumSidebar(false)}
              </div>
            </aside>
          )}

          {/* Mobile Curriculum Drawer */}
          {mobileCurriculumOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <button
                type="button"
                aria-label="Close curriculum drawer"
                onClick={() => setMobileCurriculumOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div className="relative z-10 w-[86vw] max-w-[340px] h-full p-3">
                {renderCurriculumSidebar(true)}
              </div>
            </div>
          )}

          {/* Right Interactive Stage + Controls + Tabs */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {!activeLesson ? (
              <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1017] p-8 sm:p-12 text-center space-y-4">
                <BrandLogo className="w-12 h-12 rounded-full mx-auto shadow-md" />
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-white">
                    No content in {activeCourse.title} yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    This course currently has zero lessons. Once new lessons are added, they will appear in the Course Content panel and interactive player automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBackToCourses}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Courses</span>
                </button>
              </div>
            ) : (
              <>
                {/* 1. Cinema Interactive Presentation Player */}
                <div
                  ref={stageRef}
                  className={`relative rounded-2xl border border-slate-200/85 dark:border-white/10 bg-[#0A0D13] text-white overflow-hidden shadow-sm ${
                    isExpandedStage ? 'fixed inset-4 z-50 flex flex-col' : ''
                  }`}
                >
                  <div
                    className={`relative w-full ${
                      isExpandedStage ? 'flex-1 min-h-0' : 'aspect-video'
                    } flex flex-col justify-between overflow-hidden`}
                  >
                    {/* Atmospheric course backdrop */}
                    <div className="pointer-events-none absolute inset-0 opacity-20">
                      <ResilientImage
                        src={activeCourse.thumbnailUrl}
                        alt={activeCourse.title}
                        className="w-full h-full object-cover blur-[2px] scale-105"
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070A0F]/90 via-[#0B111C]/88 to-[#05070B]/95" />

                    {/* Top cinema header */}
                    <div className="relative z-10 px-4 sm:px-6 pt-3.5 sm:pt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BrandLogo className="w-7 h-7 rounded-full shadow-sm" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-[#E8C468] uppercase tracking-wider">
                            Lesson {activeLesson.order} ·{' '}
                            {chapters[currentChapterIndex]?.title ||
                              'Interactive Study'}
                          </p>
                          <h3 className="font-display text-sm sm:text-lg font-bold text-white truncate mt-0.5">
                            {activeLesson.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPlaybackSpeed((prev) =>
                              prev === 1
                                ? 1.25
                                : prev === 1.25
                                  ? 1.5
                                  : prev === 1.5
                                    ? 2
                                    : 1,
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-mono font-semibold tabular-nums text-white transition-colors"
                          title="Playback Speed"
                        >
                          {playbackSpeed}x
                        </button>
                      </div>
                    </div>

                    {/* Interactive Stage Content: Live Structure Chart + Synced Concept Deck */}
                    <div className="relative z-10 flex-1 min-h-0 px-4 sm:px-6 py-2 sm:py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center overflow-y-auto">
                      <div className="md:col-span-7 dark">
                        <ChartStructureDiagram
                          mode="lesson"
                          diagramType={activeLesson.diagramType}
                        />
                      </div>

                      <div className="md:col-span-5 flex flex-col justify-center space-y-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-3.5 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>
                              Slide {currentChapterIndex + 1} /{' '}
                              {chapters.length}
                            </span>
                            <span className="text-[#E8C468]">
                              {isPlaying ? 'Playing' : 'Paused'}
                            </span>
                          </div>
                          <h4 className="font-display text-sm sm:text-base font-bold text-white leading-snug">
                            {chapters[currentChapterIndex]?.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                            {chapters[currentChapterIndex]?.body}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPlaying((p) => !p)}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A] text-xs font-bold transition-colors"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Pause Lesson</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>
                                  {elapsedSec > 0
                                    ? 'Resume Lesson'
                                    : 'Play Lesson'}
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextIdx =
                                (currentChapterIndex + 1) % chapters.length;
                              setElapsedSec(chapters[nextIdx]?.timeSec || 0);
                            }}
                            className="px-3 py-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors whitespace-nowrap"
                          >
                            Next Slide
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Cinema Scrubber Controls (mirrors screenshot player bar) */}
                    <div className="relative z-10 px-4 sm:px-6 pb-3 pt-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={totalSec}
                        value={elapsedSec}
                        onChange={(e) => setElapsedSec(Number(e.target.value))}
                        aria-label="Lesson timeline scrubber"
                        className="w-full h-1.5 accent-[#E8C468] cursor-pointer rounded-lg bg-white/20"
                      />
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsPlaying((p) => !p)}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                            className="hover:text-[#E8C468] transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </button>
                          <span className="font-mono tabular-nums text-[11px]">
                            {formatMmSs(elapsedSec)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsMuted((m) => !m)}
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                            className="hover:text-[#E8C468] transition-colors"
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleToggleFullscreen}
                            aria-label="Toggle fullscreen"
                            className="hover:text-[#E8C468] transition-colors"
                          >
                            {isExpandedStage ? (
                              <Minimize2 className="w-4 h-4" />
                            ) : (
                              <Maximize2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Transport Control Strip (Prev / Replay / Next | Time Scrubber | Mark Complete) */}
                <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1017] px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141821] p-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={activeIndex <= 0}
                        onClick={() => {
                          if (activeIndex > 0) {
                            onSelectLesson(courseLessons[activeIndex - 1].id);
                          }
                        }}
                        aria-label="Previous lesson"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.08] disabled:opacity-35 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setElapsedSec(0);
                          setIsPlaying(true);
                        }}
                        aria-label="Restart lesson"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.08] transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          activeIndex === -1 ||
                          activeIndex >= courseLessons.length - 1
                        }
                        onClick={() => {
                          if (
                            activeIndex >= 0 &&
                            activeIndex < courseLessons.length - 1
                          ) {
                            onSelectLesson(courseLessons[activeIndex + 1].id);
                          }
                        }}
                        aria-label="Next lesson"
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.08] disabled:opacity-35 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                      <strong className="text-[#0F172A] dark:text-white">
                        {formatMmSs(elapsedSec)}
                      </strong>{' '}
                      <span className="text-slate-400">
                        / {formatMmSs(totalSec)}
                      </span>
                    </span>

                    <div className="hidden sm:block flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#E8C468] transition-all duration-200"
                        style={{width: `${progressPct}%`}}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleLessonComplete(activeLesson.id)}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                      isLessonDone
                        ? 'bg-emerald-500/15 border border-emerald-500/35 text-[#15803D] dark:text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-[#E8C468] hover:bg-[#DFB651] text-[#0F172A]'
                    }`}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{isLessonDone ? 'Completed' : 'Mark complete'}</span>
                  </button>
                </div>

                {/* 3. Interactive Study Tab Bar (Summary / Checkpoint / Resources / Notes) */}
                <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1017] px-2 sm:px-4 flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      {id: 'summary', label: 'Summary', icon: FileText},
                      {id: 'checkpoint', label: 'Checkpoint', icon: HelpCircle},
                      {id: 'resources', label: 'Resources', icon: FolderOpen},
                      {id: 'notes', label: 'Notes', icon: PenLine},
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = playerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPlayerTab(tab.id)}
                        className={`relative inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                          active
                            ? 'border-[#D97706] dark:border-[#E8C468] text-[#0F172A] dark:text-[#F8E7B2]'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 4. Active Study Tab Panel */}
                <div className="rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-[#0D1017] p-5 sm:p-6">
                  {playerTab === 'summary' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A] dark:text-white">
                          <FileText className="w-4 h-4 text-[#D97706] dark:text-[#E8C468]" />
                          <h3>Lesson Summary</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {activeLesson.summary}
                        </p>
                      </div>

                      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl">
                        {activeLesson.content.map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                          SK Execution Checklist
                        </h4>
                        <div className="space-y-2">
                          {activeLesson.keyRules.map((rule, idx) => {
                            const checked = Boolean(checkedRules[String(idx)]);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleRuleToggle(idx)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl border flex items-start gap-3 transition-colors ${
                                  checked
                                    ? 'border-emerald-500/35 bg-emerald-500/[0.06] text-[#0F172A] dark:text-emerald-200'
                                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#131722] text-slate-700 dark:text-slate-300 hover:border-[#E8C468]/50'
                                }`}
                              >
                                <CheckCircle2
                                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                                    checked
                                      ? 'text-[#16A34A] dark:text-emerald-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                                <span className="text-xs sm:text-sm leading-snug">
                                  <span className="font-mono text-[11px] font-bold text-[#D97706] dark:text-[#E8C468] mr-2">
                                    0{idx + 1}.
                                  </span>
                                  {rule}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {playerTab === 'checkpoint' && (
                    <div className="space-y-4 max-w-2xl">
                      <div className="space-y-1">
                        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                          Comprehension Checkpoint
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Verify your mastery of Lesson {activeLesson.order} before moving ahead.
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                        {activeLesson.quiz.question}
                      </p>

                      <div className="space-y-2.5">
                        {activeLesson.quiz.options.map((opt, idx) => {
                          const chosen = quizAnswer === idx;
                          const isCorrect =
                            idx === activeLesson.quiz.correctIndex;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setQuizAnswer(idx)}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm transition-colors ${
                                chosen
                                  ? isCorrect
                                    ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#15803D] dark:text-emerald-300 font-semibold'
                                    : 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-semibold'
                                  : 'border-slate-200/85 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizAnswer !== null && (
                        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#131722] p-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          {quizAnswer === activeLesson.quiz.correctIndex
                            ? `Correct — ${activeLesson.quiz.explanation}`
                            : `Review: ${activeLesson.quiz.explanation}`}
                        </div>
                      )}
                    </div>
                  )}

                  {playerTab === 'resources' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                          Lesson Resources & Desk Tools
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Download the study sheet or apply this concept immediately inside the SKFX Trading Playground.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <button
                          type="button"
                          onClick={handleDownloadCheatSheet}
                          className="text-left rounded-xl border border-slate-200/85 dark:border-white/10 bg-slate-50/70 dark:bg-[#131722] hover:border-[#E8C468]/60 p-4 space-y-2 transition-colors"
                        >
                          <Download className="w-4 h-4 text-[#D97706] dark:text-[#E8C468]" />
                          <p className="text-xs font-bold text-[#0F172A] dark:text-white">
                            Download Lesson Cheat Sheet
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Save summary, rules, and checkpoint answers as a .txt study guide.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenSimulator}
                          className="text-left rounded-xl border border-slate-200/85 dark:border-white/10 bg-slate-50/70 dark:bg-[#131722] hover:border-[#E8C468]/60 p-4 space-y-2 transition-colors"
                        >
                          <BookOpen className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                          <p className="text-xs font-bold text-[#0F172A] dark:text-white">
                            Practice on Trading Playground
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Open the interactive chart workspace to mark structure &amp; FVGs live.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenCalculator}
                          className="text-left rounded-xl border border-slate-200/85 dark:border-white/10 bg-slate-50/70 dark:bg-[#131722] hover:border-[#E8C468]/60 p-4 space-y-2 transition-colors"
                        >
                          <FolderOpen className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
                          <p className="text-xs font-bold text-[#0F172A] dark:text-white">
                            Open Risk &amp; Lot Calculator
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Compute exact fractional lot sizing before placing live orders.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {playerTab === 'notes' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-display text-base font-bold text-[#0F172A] dark:text-white">
                            Personal Lesson Notes
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Saved automatically for Lesson {activeLesson.order}
                            {noteSavedAt ? ` · Last saved ${noteSavedAt}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleStampTimestamp}
                            className="px-3 py-1.5 rounded-lg border border-[#E8C468]/50 bg-[#E8C468]/10 text-xs font-semibold text-[#B45309] dark:text-[#E8C468] hover:bg-[#E8C468]/20 transition-colors"
                          >
                            + Stamp {formatMmSs(elapsedSec)}
                          </button>
                          {lessonNote && (
                            <button
                              type="button"
                              onClick={() => handleNoteChange('')}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={6}
                        value={lessonNote}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        placeholder={`Write your chart observations, entry triggers, and rules for "${activeLesson.title}"...`}
                        className="w-full rounded-xl border border-slate-200/85 dark:border-white/10 bg-slate-50 dark:bg-[#080B10] p-3.5 text-sm text-[#0F172A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C468]/60"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
