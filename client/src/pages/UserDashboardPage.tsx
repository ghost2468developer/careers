import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Play,
  FileText,
  Zap,
  User as UserIcon,
  Lock,
  Eye,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  AssessmentType,
  EXAM_OPERATIONS,
  ExamAttempt,
  ExamPaper,
  graphqlRequest,
  LearnerProgressSummary,
  QUESTION_TYPE_LABELS,
  SUBJECT_METADATA,
  SubjectCode,
  User,
  USER_OPERATIONS,
} from '../lib/graphql';
import { useAuth } from '../context/AuthContext';
import { LearnerGuideTour, LEARNER_GUIDE_STEPS } from '../components/LearnerGuideTour';

const GUIDE_SEEN_KEY = 'matricprep_learner_guide_dismissed_v1';

export const UserDashboardPage: React.FC = () => {
  const { user, updateUserState } = useAuth();
  const navigate = useNavigate();

  const [activeGrade, setActiveGrade] = useState<number>(user?.grade || 10);
  const [selectedSubject, setSelectedSubject] = useState<'ALL' | SubjectCode>('ALL');
  const [activeTab, setActiveTab] = useState<'EXAM' | 'QUIZ' | 'history' | 'profile'>(
    'EXAM'
  );

  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [progress, setProgress] = useState<LearnerProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingGrade, setSwitchingGrade] = useState(false);

  const [inspectedAttempt, setInspectedAttempt] = useState<ExamAttempt | null>(null);

  // Floating Guide Tour State - automatically opens for learners when they log in!
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(() => {
    return localStorage.getItem(GUIDE_SEEN_KEY) !== 'true';
  });
  const [guideStepIndex, setGuideStepIndex] = useState<number>(0);

  // Profile & Password state
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadGradePortal = useCallback(
    async (
      gradeToLoad: number,
      subjectFilter: 'ALL' | SubjectCode,
      assessmentFilter?: AssessmentType
    ) => {
      setLoading(true);
      try {
        const data = await graphqlRequest<{
          examPapersForGrade: ExamPaper[];
          myAcademicProgress: LearnerProgressSummary;
        }>(EXAM_OPERATIONS.LEARNER_GRADE_PORTAL, {
          grade: gradeToLoad,
          subject: subjectFilter === 'ALL' ? null : subjectFilter,
          assessmentType: assessmentFilter || null,
        });

        setPapers(data.examPapersForGrade);
        setProgress(data.myAcademicProgress);
      } catch (err) {
        console.error('Failed to load learner grade portal:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const assessmentFilter: AssessmentType | undefined =
      activeTab === 'EXAM' ? 'EXAM' : activeTab === 'QUIZ' ? 'QUIZ' : undefined;
    loadGradePortal(activeGrade, selectedSubject, assessmentFilter);
  }, [activeGrade, selectedSubject, activeTab, loadGradePortal]);

  const handleOpenGuide = () => {
    if (activeTab === 'history' || activeTab === 'profile') {
      setActiveTab('EXAM');
    }
    setGuideStepIndex(0);
    setIsGuideOpen(true);
  };

  const handleCloseGuide = () => {
    localStorage.setItem(GUIDE_SEEN_KEY, 'true');
    setIsGuideOpen(false);
  };

  const handleNextGuideStep = () => {
    setGuideStepIndex((prev) =>
      prev < LEARNER_GUIDE_STEPS.length - 1 ? prev + 1 : prev
    );
  };

  const handlePrevGuideStep = () => {
    setGuideStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleSelectGrade = async (newGrade: number) => {
    if (newGrade === activeGrade) return;
    setSwitchingGrade(true);
    setActiveGrade(newGrade);
    try {
      const data = await graphqlRequest<{ setLearnerGrade: User }>(
        USER_OPERATIONS.SET_LEARNER_GRADE,
        { grade: newGrade }
      );
      updateUserState(data.setLearnerGrade);
    } catch (err) {
      console.error('Error switching grade:', err);
    } finally {
      setSwitchingGrade(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const data = await graphqlRequest<{ updateProfile: User }>(
        USER_OPERATIONS.UPDATE_PROFILE,
        {
          input: { name, grade: activeGrade },
        }
      );
      updateUserState(data.updateProfile);
      setProfileMsg({ type: 'success', text: 'Your profile has been saved!' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      await graphqlRequest(USER_OPERATIONS.CHANGE_PASSWORD, {
        input: { currentPassword, newPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Learner';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-24">
      {/* =================================================================== */}
      {/* FRIENDLY HERO BANNER + STEP 1: CHOOSE YOUR GRADE                    */}
      {/* =================================================================== */}
      <div className="rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-xs font-extrabold text-emerald-300">
                <GraduationCap className="h-4 w-4" />
                Grade {activeGrade} Study Space
              </span>

              {/* Button to Trigger the Floating Interactive Guide */}
              <button
                type="button"
                onClick={handleOpenGuide}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
                <span>Show Interactive Guide</span>
              </button>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin Console
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hi {firstName}! Ready to practice for Grade {activeGrade}?
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Everything on this page is filtered strictly for{' '}
              <strong className="text-emerald-300">Grade {activeGrade}</strong>. Pick{' '}
              <strong className="text-indigo-300">150-Mark Past Paper Exams</strong> or{' '}
              <strong className="text-emerald-300">100-Mark Quizzes</strong> below to start!
            </p>
          </div>

          {/* STEP 1: Grade 10 / 11 / 12 Selector (Highlighted by Guide Step 1) */}
          <div
            id="guide-grade-selector"
            className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                1. Your Grade Level
              </span>
              <span className="text-[11px] text-slate-400">
                Showing Grade {activeGrade} only
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[10, 11, 12].map((g) => {
                const isSelected = activeGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={switchingGrade}
                    onClick={() => handleSelectGrade(g)}
                    className={`flex flex-col items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-extrabold">Grade {g}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelected ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {g === 12 ? 'Matric' : `Gr ${g} Only`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Simple, Encouraging 3-Pill Summary */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-800/80 pt-5">
          <div className="flex items-center gap-3.5 rounded-2xl border border-indigo-500/25 bg-indigo-950/25 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                Grade {activeGrade} Past Paper Exams
              </p>
              <p className="text-base font-extrabold text-white">
                {progress?.totalExamsInGrade ?? 5} Exams · 150 Marks Each
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                Grade {activeGrade} Revision Quizzes
              </p>
              <p className="text-base font-extrabold text-white">
                {progress?.totalQuizzesInGrade ?? 5} Quizzes · 100 Marks Each
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-amber-500/25 bg-amber-950/20 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Your Average Score</p>
              <p className="text-base font-extrabold text-white">
                {progress?.totalAttempts
                  ? `${progress.averagePercentage}% (${progress.totalAttempts} completed)`
                  : 'Ready for your first paper!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* STEP 2: BIG, FRIENDLY SIDE SWITCHER (EXAMS 150m vs QUIZZES 100m)    */}
      {/* =================================================================== */}
      <div id="guide-side-switcher" className="space-y-2.5 rounded-3xl">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Choose What You Want to Do Today
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Side A: Past Paper Exams (150 Marks · 10 Questions) */}
          <button
            type="button"
            onClick={() => setActiveTab('EXAM')}
            className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
              activeTab === 'EXAM'
                ? 'border-indigo-400 bg-indigo-600/20 shadow-lg shadow-indigo-600/15'
                : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                activeTab === 'EXAM'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-indigo-300'
              }`}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Past Paper Exams</p>
              <p className="mt-0.5 text-xs font-semibold text-indigo-300">
                150 Marks · 10 Questions
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Full past-paper questions (15m each)
              </p>
            </div>
          </button>

          {/* Side B: Revision Quizzes (100 Marks · 10 Questions) */}
          <button
            type="button"
            onClick={() => setActiveTab('QUIZ')}
            className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
              activeTab === 'QUIZ'
                ? 'border-emerald-400 bg-emerald-600/20 shadow-lg shadow-emerald-600/15'
                : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                activeTab === 'QUIZ'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-emerald-300'
              }`}
            >
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Revision Quizzes</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-300">
                100 Marks · 10 Questions
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Quick topic mastery quizzes (10m each)
              </p>
            </div>
          </button>

          {/* Side C: My Results & Worked Memorandums */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
              activeTab === 'history'
                ? 'border-amber-400 bg-amber-600/20 shadow-lg shadow-amber-600/15'
                : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-amber-300'
              }`}
            >
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">My Results & Memos</p>
              <p className="mt-0.5 text-xs font-semibold text-amber-300">
                {progress?.recentAttempts.length ?? 0} Completed Scripts
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                See marks & teacher feedback
              </p>
            </div>
          </button>

          {/* Side D: My Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
              activeTab === 'profile'
                ? 'border-sky-400 bg-sky-600/20 shadow-lg'
                : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                activeTab === 'profile'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800 text-sky-300'
              }`}
            >
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">My Profile</p>
              <p className="mt-0.5 text-xs font-semibold text-sky-300">
                Grade {activeGrade} Settings
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Update name or password
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* STEP 3: FRIENDLY SUBJECT FILTER PILLS (WHEN ON EXAMS OR QUIZZES)    */}
      {/* =================================================================== */}
      {(activeTab === 'EXAM' || activeTab === 'QUIZ') && (
        <div id="guide-subject-pills" className="space-y-3 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              3. Pick a Grade {activeGrade} Subject
            </span>
            {selectedSubject !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedSubject('ALL')}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                Show All 5 Subjects
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedSubject('ALL')}
              className={`rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition-all ${
                selectedSubject === 'ALL'
                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              All 5 Subjects
            </button>

            {(progress?.subjectSummaries || []).map((subj) => {
              const isSelected = selectedSubject === subj.subject;
              return (
                <button
                  key={subj.subject}
                  type="button"
                  onClick={() => setSelectedSubject(subj.subject)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{subj.label}</span>
                  {subj.attemptsCount > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      Best: {subj.bestPercentage}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 4: SIMPLE, FRIENDLY EXAM (150m) & QUIZ (100m) CARDS            */}
      {/* =================================================================== */}
      {(activeTab === 'EXAM' || activeTab === 'QUIZ') && (
        <div id="guide-paper-cards" className="space-y-4 rounded-3xl">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-300 gap-2.5">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="text-sm font-medium">
                Loading your Grade {activeGrade}{' '}
                {activeTab === 'EXAM' ? '150-Mark Past Paper Exams' : '100-Mark Quizzes'}...
              </span>
            </div>
          ) : papers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <p className="text-sm text-slate-400">
                No {activeTab === 'EXAM' ? 'exams' : 'quizzes'} found for this filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {papers.map((paper) => {
                const meta = SUBJECT_METADATA[paper.subject];
                const isExam = paper.assessmentType === 'EXAM';

                return (
                  <div
                    key={paper.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-lg transition-all hover:border-slate-700"
                  >
                    <div className="space-y-3">
                      {/* Friendly Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-xl border px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="rounded-xl bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                            Grade {paper.grade}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-extrabold ${
                            isExam
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {paper.questionCount} Questions · {paper.totalMarks} Marks
                        </span>
                      </div>

                      {/* Title & Friendly Description */}
                      <h3 className="text-lg font-extrabold text-white leading-snug">
                        {paper.title}
                      </h3>

                      {paper.pastPaperSource && (
                        <p className="text-xs font-medium text-sky-300">
                          📄 {paper.pastPaperSource}
                        </p>
                      )}

                      <p className="text-xs leading-relaxed text-slate-400">
                        {paper.description}
                      </p>

                      {/* Simple, Friendly Question Summary Pill */}
                      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 px-3.5 py-2.5 text-[11px] text-slate-300 flex items-center justify-between">
                        <span>
                          Includes Multiple Choice, Calculations, True/False & Explain
                        </span>
                        <span className="font-bold text-amber-300 shrink-0 ml-2">
                          {isExam ? '15m per Q' : '10m per Q'}
                        </span>
                      </div>
                    </div>

                    {/* Two Simple, Friendly Action Buttons */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800/80 pt-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/exam/${paper.id}?mode=REVISION`)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
                      >
                        <Sparkles className="h-4 w-4" />
                        Practice Mode (With Memo)
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/exam/${paper.id}?mode=EXAM`)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-3 text-xs font-bold text-indigo-200 transition hover:bg-indigo-500/25"
                      >
                        <Play className="h-4 w-4" />
                        Start Timed ({paper.totalMarks} Marks)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MY GRADED RESULTS & MEMORANDUMS (FRIENDLY CARD LIST)         */}
      {/* =================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {!progress || progress.recentAttempts.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center space-y-3">
              <p className="text-base font-bold text-white">
                No completed Grade {activeGrade} papers yet!
              </p>
              <p className="text-xs text-slate-400">
                Complete a 150-Mark Exam or 100-Mark Quiz to see your marks and worked answers here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('EXAM')}
                className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950"
              >
                Go to Grade {activeGrade} Past Paper Exams
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {progress.recentAttempts.map((att) => {
                const meta = SUBJECT_METADATA[att.subject];
                return (
                  <div
                    key={att.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/85 p-5 space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-xl border px-2.5 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-0.5 text-xs font-extrabold text-emerald-300">
                          {att.scoreEarned} / {att.totalMarks} Marks ({att.percentage}%)
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white">
                        {att.examPaperTitle}
                      </h3>
                      <p className="text-xs font-semibold text-amber-300">
                        {att.gradeSymbol}
                      </p>

                      {att.teacherFeedback && (
                        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-xs text-indigo-200">
                          <strong>Teacher Note:</strong> &ldquo;{att.teacherFeedback}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-[11px] text-slate-400">
                        {new Date(att.completedAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectedAttempt(att)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-400" />
                        View Worked Answers
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: LEARNER PROFILE & PASSWORD SETTINGS                          */}
      {/* =================================================================== */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <UserIcon className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">My Learner Profile</h3>
            </div>

            {profileMsg && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
                  profileMsg.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Your Grade Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 11, 12].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSelectGrade(g)}
                      className={`rounded-xl border py-2 text-xs font-bold ${
                        activeGrade === g
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Grade {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Profile
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Change Password</h3>
            </div>

            {passwordMsg && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs ${
                  passwordMsg.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 6 characters)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              />
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PAST ATTEMPT MEMORANDUM & EXPLANATION VIEWER                 */}
      {/* =================================================================== */}
      {inspectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  Grade {inspectedAttempt.grade} · {inspectedAttempt.assessmentType} ·{' '}
                  {inspectedAttempt.percentage}% ({inspectedAttempt.scoreEarned}/
                  {inspectedAttempt.totalMarks} Marks)
                </span>
                <h3 className="mt-1.5 text-lg font-extrabold text-white">
                  {inspectedAttempt.examPaperTitle}
                </h3>
                <p className="text-xs text-amber-300">{inspectedAttempt.gradeSymbol}</p>
              </div>
              <button
                onClick={() => setInspectedAttempt(null)}
                className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {inspectedAttempt.teacherFeedback && (
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-200">
                <strong>Teacher Feedback:</strong> &ldquo;
                {inspectedAttempt.teacherFeedback}&rdquo;
              </div>
            )}

            <div className="space-y-4">
              {inspectedAttempt.answers.map((ans) => (
                <div
                  key={ans.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      Q{ans.questionNumber}: {ans.questionTopic} (
                      {QUESTION_TYPE_LABELS[ans.questionType]})
                    </span>
                    <span className="font-bold text-emerald-300">
                      {ans.marksEarned} / {ans.maxMarks} Marks
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium">{ans.questionPrompt}</p>
                  <p className="text-slate-400">
                    <strong>Your Answer:</strong> {ans.studentAnswer || '(Blank)'}
                  </p>
                  <p className="text-emerald-300">
                    <strong>Model Answer:</strong> {ans.correctAnswer}
                  </p>
                  <p className="text-sky-300">
                    <strong>Worked Explanation:</strong> {ans.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING INTERACTIVE LEARNER GUIDE & TRIGGER BUTTON                 */}
      {/* =================================================================== */}
      <LearnerGuideTour
        isOpen={isGuideOpen}
        currentStepIndex={guideStepIndex}
        onNext={handleNextGuideStep}
        onPrev={handlePrevGuideStep}
        onSelectStep={(idx) => setGuideStepIndex(idx)}
        onClose={handleCloseGuide}
        onOpen={handleOpenGuide}
        learnerName={user?.name}
      />
    </div>
  );
};
