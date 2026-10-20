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

  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
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
      setProfileMsg({ type: 'success', text: 'Learner profile saved successfully.' });
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
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* =================================================================== */}
      {/* TOP BANNER & STRICT GRADE SELECTOR (GRADE 10 | GRADE 11 | GRADE 12) */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-300">
                <GraduationCap className="h-3.5 w-3.5" />
                GRADE {activeGrade} PAST PAPER EXAMS (150 MARKS) & QUIZZES (100 MARKS)
              </span>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-0.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Switch to Admin Console
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome, {user?.name} - Showing Grade {activeGrade} Only
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Choose between the{' '}
              <strong className="text-indigo-300">
                Past Paper Exam Side (150 Marks · 10 Questions)
              </strong>{' '}
              and the{' '}
              <strong className="text-emerald-300">
                Revision Quiz Side (100 Marks · 10 Questions)
              </strong>{' '}
              filtered strictly to <strong className="text-white">Grade {activeGrade}</strong>.
            </p>
          </div>

          {/* Grade 10 / Grade 11 / Grade 12 Selector Pills */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Select Active Grade Level:
            </span>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
              {[10, 11, 12].map((g) => {
                const isSelected = activeGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={switchingGrade}
                    onClick={() => handleSelectGrade(g)}
                    className={`flex flex-col items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-extrabold">Grade {g}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      {g === 12 ? 'Only Gr 12' : `Only Gr ${g}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grade KPI Summary Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-800/80 pt-5">
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/20 p-3.5">
            <p className="text-[11px] text-indigo-300 font-semibold">
              Grade {activeGrade} Past Paper Exams
            </p>
            <p className="mt-1 text-xl font-extrabold text-white">
              {progress?.totalExamsInGrade ?? 5} Exams (150 Marks)
            </p>
            <p className="text-[11px] text-slate-400">10 Past-Paper Questions each</p>
          </div>

          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3.5">
            <p className="text-[11px] text-emerald-300 font-semibold">
              Grade {activeGrade} Revision Quizzes
            </p>
            <p className="mt-1 text-xl font-extrabold text-white">
              {progress?.totalQuizzesInGrade ?? 5} Quizzes (100 Marks)
            </p>
            <p className="text-[11px] text-slate-400">10 Quiz Questions each</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] text-slate-400">Your Grade {activeGrade} Average</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-300">
              {progress?.averagePercentage ?? 0}%
            </p>
            <p className="text-[11px] text-slate-400">
              Across {progress?.totalAttempts ?? 0} attempts
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] text-slate-400">CAPS Achievement Level</p>
            <p className="mt-1 text-sm font-extrabold text-amber-300 truncate">
              {progress?.achievementLevel || 'Ready to start'}
            </p>
            <p className="text-[11px] text-slate-400">
              {progress?.papersCompleted ?? 0} papers completed
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5 SUBJECT CARDS FOR ACTIVE GRADE                                    */}
      {/* =================================================================== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            Grade {activeGrade} Subjects (Mathematics, Maths Literacy, Physical Sciences, Life Sciences, Geography)
          </h2>
          {selectedSubject !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedSubject('ALL')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              Show All 5 Subjects for Grade {activeGrade}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => setSelectedSubject('ALL')}
            className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
              selectedSubject === 'ALL'
                ? 'border-emerald-500 bg-emerald-500/15 shadow-md'
                : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                All Subjects
              </span>
              <p className="mt-1 text-sm font-bold text-white">
                Grade {activeGrade} Complete
              </p>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              {progress?.totalExamsInGrade ?? 5} Exams · {progress?.totalQuizzesInGrade ?? 5} Quizzes
            </p>
          </button>

          {(progress?.subjectSummaries || []).map((subj) => {
            const isSelected = selectedSubject === subj.subject;
            const meta = SUBJECT_METADATA[subj.subject];
            return (
              <button
                key={subj.subject}
                type="button"
                onClick={() => setSelectedSubject(subj.subject)}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-md'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div>
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                  >
                    Gr {activeGrade}
                  </span>
                  <p className="mt-1.5 text-xs font-bold text-white leading-snug">
                    {subj.label}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {subj.examCount} Exam · {subj.quizCount} Quiz
                  </span>
                  {subj.attemptsCount > 0 && (
                    <span className="font-bold text-emerald-300">
                      {subj.bestPercentage}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SIDE SWITCHER: EXAM SIDE (150 MARKS) vs QUIZ SIDE (100 MARKS)       */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('EXAM')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'EXAM'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          Past Paper Exams Side (150 Marks · 10 Questions)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUIZ')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'QUIZ'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="h-4 w-4" />
          Revision Quiz Side (100 Marks · 10 Questions)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'history'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="h-4 w-4" />
          My Grade {activeGrade} Results & Memorandums (
          {progress?.recentAttempts.length ?? 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Learner Profile
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1 & 2: EXAM SIDE (150 MARKS · 10 Qs) OR QUIZ SIDE (100 MARKS)   */}
      {/* =================================================================== */}
      {(activeTab === 'EXAM' || activeTab === 'QUIZ') && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              activeTab === 'EXAM'
                ? 'border-indigo-500/30 bg-indigo-950/20'
                : 'border-emerald-500/30 bg-emerald-950/20'
            }`}
          >
            <div>
              <h3 className="text-sm font-bold text-white">
                {activeTab === 'EXAM'
                  ? `Grade ${activeGrade} National Past Paper Examinations - 150 Marks · 10 Questions Each`
                  : `Grade ${activeGrade} Topic Mastery Quizzes - 100 Marks · 10 Questions Each`}
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === 'EXAM'
                  ? 'Full 150-mark past paper exams with 10 structured questions (15 marks per question) covering Multiple Choice, Calculations, True/False, and Rubric Explain questions.'
                  : '100-mark interactive quizzes (10 marks per question) designed for rapid topic revision and instant step-by-step explanations.'}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-extrabold ${
                activeTab === 'EXAM'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {activeTab === 'EXAM'
                ? '150 MARKS · 10 QUESTIONS'
                : '100 MARKS · 10 QUESTIONS'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="text-sm">
                Loading Grade {activeGrade}{' '}
                {activeTab === 'EXAM' ? '150-Mark Past Paper Exams' : '100-Mark Quizzes'}...
              </span>
            </div>
          ) : papers.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <p className="text-sm text-slate-400">
                No {activeTab === 'EXAM' ? '150-mark exams' : '100-mark quizzes'} found for
                Grade {activeGrade} in this subject filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {papers.map((paper) => {
                const meta = SUBJECT_METADATA[paper.subject];
                const typeCounts = paper.questions.reduce<Record<string, number>>(
                  (acc, q) => {
                    acc[q.type] = (acc[q.type] || 0) + 1;
                    return acc;
                  },
                  {}
                );

                return (
                  <div
                    key={paper.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-lg transition hover:border-slate-700"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
                            Grade {paper.grade}
                          </span>
                          <span
                            className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span
                            className={`rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${
                              paper.assessmentType === 'EXAM'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {paper.assessmentType === 'EXAM'
                              ? 'EXAM · 150 MARKS'
                              : 'QUIZ · 100 MARKS'}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-300">
                          <Clock className="h-3.5 w-3.5" />
                          {paper.questionCount} Qs · {paper.totalMarks} Marks
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white leading-snug">
                        {paper.title}
                      </h3>

                      {paper.pastPaperSource && (
                        <p className="text-[11px] font-medium text-sky-300">
                          Source: {paper.pastPaperSource}
                        </p>
                      )}

                      <p className="text-xs leading-relaxed text-slate-400">
                        {paper.description}
                      </p>

                      {/* Question Type Variety Badges */}
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                          Question Breakdown ({paper.questionCount} Questions ={' '}
                          {paper.totalMarks} Marks):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(typeCounts).map(([qType, count]) => (
                            <span
                              key={qType}
                              className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                            >
                              {count}×{' '}
                              {QUESTION_TYPE_LABELS[qType as keyof typeof QUESTION_TYPE_LABELS]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/exam/${paper.id}?mode=REVISION`)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Practice & Explain ({paper.totalMarks}m)
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/exam/${paper.id}?mode=EXAM`)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3.5 py-2.5 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/25"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Timed {paper.assessmentType === 'EXAM' ? 'Exam (150m)' : 'Quiz (100m)'}
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
      {/* TAB 3: MY GRADED ATTEMPTS & TEACHER FEEDBACK                        */}
      {/* =================================================================== */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          {!progress || progress.recentAttempts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm text-slate-400">
                You haven&apos;t completed any Grade {activeGrade} exams or quizzes yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('EXAM')}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Browse Grade {activeGrade} 150-Mark Past Paper Exams
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Assessment</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Score & Percentage</th>
                    <th className="px-4 py-3.5">CAPS Achievement</th>
                    <th className="px-4 py-3.5">Teacher Feedback</th>
                    <th className="px-4 py-3.5 text-right">Review Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {progress.recentAttempts.map((att) => {
                    const meta = SUBJECT_METADATA[att.subject];
                    return (
                      <tr key={att.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white">{att.examPaperTitle}</div>
                          <div className="text-[11px] text-slate-400">
                            Grade {att.grade} · {new Date(att.completedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              att.assessmentType === 'EXAM'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {att.assessmentType} ({att.totalMarks}m)
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-emerald-300">
                            {att.scoreEarned} / {att.totalMarks} ({att.percentage}%)
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-amber-300 font-medium">
                          {att.gradeSymbol}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 max-w-xs">
                          {att.teacherFeedback ? (
                            <span className="italic text-indigo-300">
                              &ldquo;{att.teacherFeedback}&rdquo;
                            </span>
                          ) : (
                            <span className="text-slate-500">Auto-graded via Rubric</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectedAttempt(att)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 text-emerald-400" />
                            View Memo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: LEARNER PROFILE & PASSWORD SETTINGS                          */}
      {/* =================================================================== */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <UserIcon className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Learner Profile & Grade</h3>
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
                  Full Name
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
                  Enrolled Grade Level
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
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Profile
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
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
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 6 chars)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
              />
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  Grade {inspectedAttempt.grade} · {inspectedAttempt.assessmentType} ·{' '}
                  {inspectedAttempt.percentage}% ({inspectedAttempt.scoreEarned}/
                  {inspectedAttempt.totalMarks} Marks)
                </span>
                <h3 className="mt-1 text-lg font-bold text-white">
                  {inspectedAttempt.examPaperTitle}
                </h3>
                <p className="text-xs text-amber-300">{inspectedAttempt.gradeSymbol}</p>
              </div>
              <button
                onClick={() => setInspectedAttempt(null)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {inspectedAttempt.teacherFeedback && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-indigo-200">
                <strong>Educator / Admin Feedback:</strong> &ldquo;
                {inspectedAttempt.teacherFeedback}&rdquo;
              </div>
            )}

            <div className="space-y-4">
              {inspectedAttempt.answers.map((ans) => (
                <div
                  key={ans.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs"
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
                    <strong>Explanation:</strong> {ans.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
