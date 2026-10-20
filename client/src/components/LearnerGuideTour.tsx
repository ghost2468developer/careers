import React, { useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  GraduationCap,
  FileText,
  BookOpen,
  Play,
  Award,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export interface GuideStep {
  id: string;
  targetId: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
  icon: React.ReactNode;
}

export const LEARNER_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step-grade',
    targetId: 'guide-grade-selector',
    badge: 'Step 1 of 5 · Your Grade',
    title: 'Choose Your Grade (10, 11, or 12)',
    description:
      'Tap Grade 10, Grade 11, or Grade 12 here. We automatically filter the entire app so you only see subjects, past papers, and quizzes for your selected grade.',
    tip: 'Grade 10 shows only Grade 10 · Grade 11 shows only Grade 11 · Grade 12 shows only Grade 12.',
    icon: <GraduationCap className="h-5 w-5 text-emerald-400" />,
  },
  {
    id: 'step-sides',
    targetId: 'guide-side-switcher',
    badge: 'Step 2 of 5 · Exams vs. Quizzes',
    title: 'Switch Between Exams (150m) & Quizzes (100m)',
    description:
      'Use these big tabs to switch between the Past Paper Exams Side (10 past-paper questions = 150 Marks) and the Revision Quiz Side (10 quick questions = 100 Marks).',
    tip: 'Start with a 100-Mark Quiz for quick revision, then tackle a 150-Mark Past Paper Exam!',
    icon: <FileText className="h-5 w-5 text-indigo-400" />,
  },
  {
    id: 'step-subjects',
    targetId: 'guide-subject-pills',
    badge: 'Step 3 of 5 · Pick a Subject',
    title: 'Filter by Your 5 Subjects',
    description:
      'Tap any subject pill - Mathematics, Mathematical Literacy, Physical Sciences, Life Sciences, or Geography - to focus on one subject at a time.',
    tip: 'Tap "All Subjects" anytime to see all 5 subjects together.',
    icon: <BookOpen className="h-5 w-5 text-sky-400" />,
  },
  {
    id: 'step-start',
    targetId: 'guide-paper-cards',
    badge: 'Step 4 of 5 · Start Practicing',
    title: 'Choose Practice Mode or Timed Mode',
    description:
      'Every paper has two friendly ways to study: "Practice Mode" lets you check each answer immediately and read the worked memorandum, while "Timed Mode" simulates a real exam.',
    tip: 'Our smart marker gives you partial marks for showing working steps or key concepts!',
    icon: <Play className="h-5 w-5 text-amber-400" />,
  },
  {
    id: 'step-results',
    targetId: 'guide-side-switcher',
    badge: 'Step 5 of 5 · Track Your Progress',
    title: 'Review Your Marks & Teacher Feedback',
    description:
      'Click "My Results & Memos" at any time to see your scores, CAPS achievement level, step-by-step worked answers, and feedback from your teacher.',
    tip: 'You can re-open this Floating Guide anytime using the "Guide Me" button!',
    icon: <Award className="h-5 w-5 text-rose-400" />,
  },
];

interface LearnerGuideTourProps {
  isOpen: boolean;
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectStep: (idx: number) => void;
  onClose: () => void;
  onOpen: () => void;
  learnerName?: string;
}

export const LearnerGuideTour: React.FC<LearnerGuideTourProps> = ({
  isOpen,
  currentStepIndex,
  onNext,
  onPrev,
  onSelectStep,
  onClose,
  onOpen,
  learnerName,
}) => {
  const step = LEARNER_GUIDE_STEPS[currentStepIndex] || LEARNER_GUIDE_STEPS[0];

  // Scroll the highlighted target section smoothly into view and apply a visual highlight ring
  useEffect(() => {
    if (!isOpen) return;

    const targetEl = document.getElementById(step.targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add(
        'ring-4',
        'ring-emerald-400/80',
        'ring-offset-4',
        'ring-offset-slate-950',
        'transition-all',
        'duration-300'
      );

      return () => {
        targetEl.classList.remove(
          'ring-4',
          'ring-emerald-400/80',
          'ring-offset-4',
          'ring-offset-slate-950'
        );
      };
    }
  }, [isOpen, step.targetId, currentStepIndex]);

  return (
    <>
      {/* =================================================================== */}
      {/* FLOATING TRIGGER BUTTON (Bottom-Right Corner - Always Accessible)   */}
      {/* =================================================================== */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="group flex items-center gap-2.5 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-extrabold text-white shadow-2xl shadow-emerald-600/40 transition-all hover:scale-105 hover:from-emerald-500 hover:to-teal-500"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <HelpCircle className="h-4 w-4 text-white" />
            </span>
            <span>Guide Me · How It Works</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-200 animate-pulse" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING INTERACTIVE COACHMARK / GUIDE CARD                         */}
      {/* =================================================================== */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="rounded-3xl border-2 border-emerald-400/60 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/90 backdrop-blur-xl">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
                  {step.icon}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    {step.badge}
                  </span>
                  {currentStepIndex === 0 && learnerName && (
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                      Welcome, {learnerName.split(' ')[0]}! Let&apos;s take a 20-second tour:
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close Guide"
                className="rounded-xl bg-slate-800/90 p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Title & Friendly Explanation */}
            <div className="mt-4 space-y-2.5">
              <h3 className="text-base font-extrabold text-white leading-snug">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                {step.description}
              </p>

              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-950/30 p-3 text-[11px] text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{step.tip}</span>
              </div>
            </div>

            {/* Step Progress Dots & Controls */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
              {/* Step Dots */}
              <div className="flex items-center gap-1.5">
                {LEARNER_GUIDE_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectStep(idx)}
                    aria-label={`Go to step ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-6 bg-emerald-400'
                        : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                {currentStepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={onPrev}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Skip Tour
                  </button>
                )}

                {currentStepIndex < LEARNER_GUIDE_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
                  >
                    Next Tip
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Got It, Let&apos;s Study!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
