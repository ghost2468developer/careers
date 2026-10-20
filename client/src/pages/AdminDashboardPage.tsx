import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  UserPlus,
  KeyRound,
  Activity,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  ArrowUpDown,
  ExternalLink,
  BookOpen,
  FilePlus2,
  Upload,
  Eye,
  X,
  Plus,
  GraduationCap,
} from 'lucide-react';
import {
  ADMIN_OPERATIONS,
  AdminLearnerProgress,
  AdminStats,
  AuditLog,
  ExamAttempt,
  ExamPaper,
  ForgotPasswordPayload,
  graphqlRequest,
  PasswordResetTokenInfo,
  QUESTION_TYPE_LABELS,
  QuestionType,
  Role,
  SUBJECT_METADATA,
  SubjectCode,
  User,
} from '../lib/graphql';
import { useAuth } from '../context/AuthContext';

interface DraftQuestion {
  questionNumber: number;
  topic: string;
  type: QuestionType;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  rubricKeywordsText: string;
  explanation: string;
  marks: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'learners' | 'papers' | 'users' | 'audit'>(
    'learners'
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [learnerProgress, setLearnerProgress] = useState<AdminLearnerProgress[]>([]);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [resetTokens, setResetTokens] = useState<PasswordResetTokenInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | number>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  // Create User Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('USER');
  const [newGrade, setNewGrade] = useState<number>(10);
  const [creatingUser, setCreatingUser] = useState(false);

  // Create / Upload Exam Paper Studio
  const [showPaperBuilder, setShowPaperBuilder] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperDesc, setPaperDesc] = useState('');
  const [paperSubject, setPaperSubject] = useState<SubjectCode>('MATHEMATICS');
  const [paperGrade, setPaperGrade] = useState<number>(10);
  const [paperTerm, setPaperTerm] = useState<number>(2);
  const [paperDuration, setPaperDuration] = useState<number>(45);
  const [paperFileName, setPaperFileName] = useState<string>('');
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      questionNumber: 1,
      topic: 'Quadratic Equations',
      type: 'MULTIPLE_CHOICE',
      prompt: 'Solve for x if (x - 4)(x + 2) = 0',
      optionsText: 'A) x = -4 or x = 2\nB) x = 4 or x = -2\nC) x = 4 or x = 2\nD) x = -4 or x = -2',
      correctAnswer: 'B) x = 4 or x = -2',
      rubricKeywordsText: 'x = 4, x = -2',
      explanation:
        'Using the zero-product property: either x - 4 = 0 (so x = 4) or x + 2 = 0 (so x = -2).',
      marks: 2,
    },
    {
      questionNumber: 2,
      topic: 'Conceptual Explanation',
      type: 'EXPLAIN',
      prompt:
        'Explain why dividing any real number by zero is undefined in Mathematics.',
      optionsText: '',
      correctAnswer:
        'Division is the inverse of multiplication. If a / 0 = k, then k × 0 = a, which has no unique solution when a ≠ 0 because any number multiplied by 0 equals 0.',
      rubricKeywordsText: 'inverse of multiplication, multiplied by 0, no unique solution',
      explanation:
        'Marking Rubric (3 marks): ✓ 1 mark: Division is inverse of multiplication. ✓ 1 mark: Any number multiplied by 0 is 0. ✓ 1 mark: Therefore no real value can satisfy k × 0 = a.',
      marks: 3,
    },
  ]);
  const [creatingPaper, setCreatingPaper] = useState(false);

  // Script Inspector & Teacher Feedback Modal
  const [inspectedAttempt, setInspectedAttempt] = useState<ExamAttempt | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [adjustedScore, setAdjustedScore] = useState<string>('');
  const [savingReview, setSavingReview] = useState(false);

  // Feedback Banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
    resetToken?: string | null;
  } | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await graphqlRequest<{
        adminStats: AdminStats;
        adminLearnerProgressList: AdminLearnerProgress[];
        adminAllExamPapers: ExamPaper[];
        adminUsers: User[];
        adminResetTokens: PasswordResetTokenInfo[];
        adminAuditLogs: AuditLog[];
      }>(ADMIN_OPERATIONS.ADMIN_DASHBOARD, {
        search: search.trim() || null,
        role: roleFilter === 'ALL' ? null : roleFilter,
        grade: gradeFilter === 'ALL' ? null : gradeFilter,
      });

      setStats(data.adminStats);
      setLearnerProgress(data.adminLearnerProgressList);
      setExamPapers(data.adminAllExamPapers);
      setUsers(data.adminUsers);
      setResetTokens(data.adminResetTokens);
      setAuditLogs(data.adminAuditLogs);
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load admin console data',
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, gradeFilter]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaperFileName(file.name);

    try {
      const text = await file.text();
      // If JSON file with questions array, parse directly
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (parsed.title) setPaperTitle(parsed.title);
        if (parsed.description) setPaperDesc(parsed.description);
        if (Array.isArray(parsed.questions)) {
          setDraftQuestions(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parsed.questions.map((q: any, idx: number) => ({
              questionNumber: idx + 1,
              topic: q.topic || 'Uploaded Topic',
              type: q.type || 'EXPLAIN',
              prompt: q.prompt || '',
              optionsText: Array.isArray(q.options) ? q.options.join('\n') : '',
              correctAnswer: q.correctAnswer || '',
              rubricKeywordsText: Array.isArray(q.rubricKeywords)
                ? q.rubricKeywords.join(', ')
                : '',
              explanation: q.explanation || '',
              marks: Number(q.marks) || 3,
            }))
          );
        }
      } else {
        // Parse text blocks separated by double newlines or Q1/Q2
        if (!paperTitle) {
          setPaperTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        setPaperDesc(`Uploaded exam paper from ${file.name}`);
      }
      setBanner({
        type: 'success',
        text: `Loaded exam paper file "${file.name}". Review the extracted questions below and click Publish!`,
      });
    } catch {
      setBanner({
        type: 'error',
        text: 'Could not read uploaded file.',
      });
    }
  };

  const handleAddDraftQuestion = () => {
    setDraftQuestions((prev) => [
      ...prev,
      {
        questionNumber: prev.length + 1,
        topic: 'Core Topic',
        type: 'EXPLAIN',
        prompt: '',
        optionsText: '',
        correctAnswer: '',
        rubricKeywordsText: '',
        explanation: '',
        marks: 3,
      },
    ]);
  };

  const handleUpdateDraftQuestion = (
    idx: number,
    field: keyof DraftQuestion,
    value: string | number
  ) => {
    setDraftQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleRemoveDraftQuestion = (idx: number) => {
    if (draftQuestions.length <= 1) return;
    setDraftQuestions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, questionNumber: i + 1 }))
    );
  };

  const handleCreateExamPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setCreatingPaper(true);

    try {
      const formattedQuestions = draftQuestions.map((q, idx) => ({
        questionNumber: idx + 1,
        topic: q.topic.trim() || 'General',
        type: q.type,
        prompt: q.prompt.trim(),
        options:
          q.type === 'MULTIPLE_CHOICE'
            ? q.optionsText
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            : q.type === 'TRUE_FALSE'
            ? ['True', 'False']
            : [],
        correctAnswer: q.correctAnswer.trim(),
        rubricKeywords: q.rubricKeywordsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        explanation: q.explanation.trim(),
        marks: Number(q.marks) || 2,
      }));

      const data = await graphqlRequest<{ adminCreateExamPaper: ExamPaper }>(
        ADMIN_OPERATIONS.CREATE_EXAM_PAPER,
        {
          input: {
            title: paperTitle,
            description: paperDesc || `Grade ${paperGrade} Exam Preparation Paper`,
            subject: paperSubject,
            grade: paperGrade,
            term: paperTerm,
            year: 2026,
            durationMinutes: paperDuration,
            paperFileUrl: paperFileName || null,
            questions: formattedQuestions,
          },
        }
      );

      setBanner({
        type: 'success',
        text: `Published Grade ${data.adminCreateExamPaper.grade} ${
          SUBJECT_METADATA[data.adminCreateExamPaper.subject].label
        } paper: "${data.adminCreateExamPaper.title}" (${
          data.adminCreateExamPaper.questionCount
        } questions, ${data.adminCreateExamPaper.totalMarks} marks)`,
      });
      setShowPaperBuilder(false);
      setPaperTitle('');
      setPaperDesc('');
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to publish exam paper',
      });
    } finally {
      setCreatingPaper(false);
    }
  };

  const handleDeletePaper = async (paper: ExamPaper) => {
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.DELETE_EXAM_PAPER, { id: paper.id });
      setBanner({
        type: 'success',
        text: `Deleted exam paper "${paper.title}"`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete exam paper',
      });
    }
  };

  const handleOpenAttemptInspector = (att: ExamAttempt) => {
    setInspectedAttempt(att);
    setFeedbackText(att.teacherFeedback || '');
    setAdjustedScore(String(att.scoreEarned));
  };

  const handleSaveAttemptReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedAttempt) return;
    setSavingReview(true);
    try {
      const data = await graphqlRequest<{ adminReviewAttempt: ExamAttempt }>(
        ADMIN_OPERATIONS.REVIEW_ATTEMPT,
        {
          attemptId: inspectedAttempt.id,
          teacherFeedback: feedbackText,
          adjustedScore: adjustedScore ? Number(adjustedScore) : null,
        }
      );
      setInspectedAttempt(data.adminReviewAttempt);
      setBanner({
        type: 'success',
        text: `Saved teacher feedback & grading review for ${inspectedAttempt.userName}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save review',
      });
    } finally {
      setSavingReview(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setCreatingUser(true);

    try {
      const data = await graphqlRequest<{ adminCreateUser: User }>(
        ADMIN_OPERATIONS.CREATE_USER,
        {
          input: {
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
            grade: newGrade,
          },
        }
      );

      setBanner({
        type: 'success',
        text: `Created ${data.adminCreateUser.role} account for ${data.adminCreateUser.email} (Grade ${data.adminCreateUser.grade})`,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setShowCreateUserModal(false);
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create user',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangeLearnerGrade = async (targetUser: User, nextGrade: number) => {
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.UPDATE_LEARNER_GRADE, {
        userId: targetUser.id,
        grade: nextGrade,
      });
      setBanner({
        type: 'success',
        text: `Updated ${targetUser.name} to Grade ${nextGrade}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update learner grade',
      });
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    const nextRole: Role = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.UPDATE_USER_ROLE, {
        userId: targetUser.id,
        role: nextRole,
      });
      setBanner({
        type: 'success',
        text: `Updated ${targetUser.email} role to ${nextRole}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role',
      });
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.TOGGLE_USER_STATUS, {
        userId: targetUser.id,
        isActive: !targetUser.isActive,
      });
      setBanner({
        type: 'success',
        text: `${!targetUser.isActive ? 'Activated' : 'Deactivated'} account ${targetUser.email}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update status',
      });
    }
  };

  const handleTriggerReset = async (targetUser: User) => {
    setBanner(null);
    try {
      const data = await graphqlRequest<{
        adminTriggerPasswordReset: ForgotPasswordPayload;
      }>(ADMIN_OPERATIONS.TRIGGER_PASSWORD_RESET, {
        userId: targetUser.id,
      });

      setBanner({
        type: 'success',
        text: data.adminTriggerPasswordReset.message,
        resetToken: data.adminTriggerPasswordReset.resetToken,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to generate reset token',
      });
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    setBanner(null);
    try {
      await graphqlRequest(ADMIN_OPERATIONS.DELETE_USER, {
        userId: targetUser.id,
      });
      setBanner({
        type: 'success',
        text: `Deleted user ${targetUser.email}`,
      });
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete user',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-0.5 text-xs font-bold text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              ADMIN ACADEMIC COMMAND CENTER
            </span>
            <code className="rounded bg-slate-950/90 px-2 py-0.5 text-[11px] text-sky-300 border border-slate-800">
              src/components/admin/&#123;schema.graphql.ts, resolvers.ts&#125;
            </code>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Grade 10–12 Learner Progress, Exam Papers & Grading Monitor
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Monitor learner performance across Grade 10, 11, and 12, inspect exam scripts, and upload/build new exam papers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadAdminData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setActiveTab('papers');
              setShowPaperBuilder(!showPaperBuilder);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
          >
            <Upload className="h-4 w-4" />
            Upload / Create Exam Paper
          </button>

          <button
            onClick={() => setShowCreateUserModal(!showCreateUserModal)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
          >
            <UserPlus className="h-4 w-4" />
            Add Learner
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 text-xs ${
            banner.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {banner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{banner.text}</span>
          </div>

          {banner.resetToken && (
            <div className="flex items-center gap-2">
              <code className="rounded bg-slate-950 px-2 py-1 font-mono text-[11px] text-amber-300">
                {banner.resetToken.slice(0, 18)}...
              </code>
              <button
                onClick={() =>
                  navigate(`/reset-password?token=${encodeURIComponent(banner.resetToken || '')}`)
                }
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Open Reset Link
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Learner/User Drawer */}
      {showCreateUserModal && (
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-400" />
              Enroll New Learner or Administrator
            </h2>
            <button
              onClick={() => setShowCreateUserModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="grid gap-3 sm:grid-cols-6">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Learner Full Name"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Initial Password"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
            <select
              value={newGrade}
              onChange={(e) => setNewGrade(Number(e.target.value))}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
            >
              <option value={10}>Grade 10</option>
              <option value={11}>Grade 11</option>
              <option value={12}>Grade 12 (Matric)</option>
            </select>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
            >
              <option value="USER">Role: LEARNER (USER)</option>
              <option value="ADMIN">Role: ADMIN</option>
            </select>
            <button
              type="submit"
              disabled={creatingUser}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* Academic KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[11px] font-medium text-emerald-300">Total Learners</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats?.userCount ?? '-'}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Gr10: {stats?.grade10Learners ?? 0} · Gr11: {stats?.grade11Learners ?? 0} · Gr12:{' '}
            {stats?.grade12Learners ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="text-[11px] font-medium text-indigo-300">Exam Prep Papers</p>
          <p className="mt-1 text-2xl font-extrabold text-indigo-300">
            {stats?.totalExamPapers ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Grades 10, 11 & 12</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-[11px] font-medium text-sky-300">Question Bank</p>
          <p className="mt-1 text-2xl font-extrabold text-sky-300">
            {stats?.totalQuestions ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">MCQ, Numeric, T/F & Explain</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[11px] font-medium text-amber-300">Graded Attempts</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-300">
            {stats?.totalExamAttempts ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Completed exam scripts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] font-medium text-slate-400">Cohort Average</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {stats?.overallAveragePercentage ?? 0}%
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">All grades combined</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] font-medium text-slate-400">Educators (ADMIN)</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{stats?.adminCount ?? '-'}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {stats?.totalAuditEvents ?? 0} audit logs
          </p>
        </div>
      </div>

      {/* Navigation Tabs + Global Grade Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('learners')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'learners'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Learner Progress Monitor ({learnerProgress.length})
          </button>

          <button
            onClick={() => setActiveTab('papers')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'papers'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Exam Prep Papers & Upload ({examPapers.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Accounts & Grade Assignment ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            Tokens & Audit Trail
          </button>
        </div>

        {/* Grade & Search Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            {(['ALL', 10, 11, 12] as const).map((g) => (
              <button
                key={String(g)}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  gradeFilter === g
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'ALL' ? 'All Grades' : `Grade ${g}`}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learner..."
              className="rounded-xl border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: LEARNER PROGRESS & SCRIPT MONITOR                            */}
      {/* =================================================================== */}
      {activeTab === 'learners' && (
        <div className="space-y-6">
          {learnerProgress.map((lp) => (
            <div
              key={lp.user.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 space-y-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
                      GRADE {lp.user.grade}
                    </span>
                    <h3 className="text-lg font-bold text-white">{lp.user.name}</h3>
                    <span className="text-xs text-slate-400">({lp.user.email})</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-300 font-semibold">
                    {lp.achievementLevel}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2">
                    <span className="text-slate-400">Attempts: </span>
                    <strong className="text-white">{lp.attemptsCount}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2">
                    <span className="text-slate-400">Avg Score: </span>
                    <strong className="text-emerald-300">{lp.averagePercentage}%</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2">
                    <span className="text-slate-400">Best Score: </span>
                    <strong className="text-indigo-300">{lp.bestPercentage}%</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="text-slate-400">Strongest Subject: </span>
                  <strong className="text-emerald-300">
                    {lp.strongestSubject || 'N/A'}
                  </strong>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="text-slate-400">Focus / Weakest Subject: </span>
                  <strong className="text-amber-300">{lp.weakestSubject || 'N/A'}</strong>
                </div>
              </div>

              {/* Recent Exam Scripts for this Learner */}
              {lp.recentAttempts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Submitted Exam Prep Scripts (Click to inspect answers & add teacher feedback):
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {lp.recentAttempts.map((att) => {
                      const meta = SUBJECT_METADATA[att.subject];
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                              >
                                Gr {att.grade} · {meta.shortLabel}
                              </span>
                              <span className="font-bold text-emerald-300">
                                {att.scoreEarned}/{att.totalMarks} ({att.percentage}%)
                              </span>
                            </div>
                            <p className="font-semibold text-white line-clamp-1">
                              {att.examPaperTitle}
                            </p>
                            {att.teacherFeedback && (
                              <p className="text-[11px] italic text-indigo-300">
                                Feedback: &ldquo;{att.teacherFeedback}&rdquo;
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenAttemptInspector(att)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect Script
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: EXAM PAPERS & UPLOAD / BUILDER STUDIO                        */}
      {/* =================================================================== */}
      {activeTab === 'papers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Published Exam Prep Papers ({examPapers.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowPaperBuilder(!showPaperBuilder)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <FilePlus2 className="h-4 w-4" />
              {showPaperBuilder ? 'Close Paper Builder' : 'Upload / Build New Exam Paper'}
            </button>
          </div>

          {/* Exam Paper Upload & Builder Studio */}
          {showPaperBuilder && (
            <form
              onSubmit={handleCreateExamPaper}
              className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-emerald-400" />
                    Upload or Build New Grade 10–12 Exam Prep Paper
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload an exam paper file or configure questions with Multiple Choice, Numeric, True/False, and Rubric-Graded Explain questions.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25">
                  <Upload className="h-4 w-4" />
                  <span>Upload Exam File (.json / .txt / .pdf)</span>
                  <input
                    type="file"
                    accept=".json,.txt,.md,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Exam Paper Title
                  </label>
                  <input
                    type="text"
                    required
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    placeholder="e.g. Grade 11 Physical Sciences: Electric Circuits & Ohm's Law"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Grade (Strict Filter)
                  </label>
                  <select
                    value={paperGrade}
                    onChange={(e) => setPaperGrade(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  >
                    <option value={10}>Grade 10 Only</option>
                    <option value={11}>Grade 11 Only</option>
                    <option value={12}>Grade 12 (Matric) Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={paperSubject}
                    onChange={(e) => setPaperSubject(e.target.value as SubjectCode)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  >
                    <option value="MATHEMATICS">Mathematics</option>
                    <option value="MATHEMATICAL_LITERACY">Mathematical Literacy</option>
                    <option value="PHYSICAL_SCIENCES">Physical Sciences</option>
                    <option value="LIFE_SCIENCES">Life Sciences</option>
                    <option value="GEOGRAPHY">Geography</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Curriculum Description & Topics Covered
                  </label>
                  <input
                    type="text"
                    required
                    value={paperDesc}
                    onChange={(e) => setPaperDesc(e.target.value)}
                    placeholder="Topics covered in this revision paper..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Term (1–4)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={paperTerm}
                    onChange={(e) => setPaperTerm(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={paperDuration}
                    onChange={(e) => setPaperDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {/* Questions Builder List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    Exam Questions & Grading Rubrics ({draftQuestions.length} Questions)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDraftQuestion}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </button>
                </div>

                {draftQuestions.map((dq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-400">
                        Question {idx + 1}
                      </span>
                      {draftQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftQuestion(idx)}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Remove Question
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Question Type
                        </label>
                        <select
                          value={dq.type}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(
                              idx,
                              'type',
                              e.target.value as QuestionType
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                        >
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="NUMERIC">Numeric / Calculation</option>
                          <option value="TRUE_FALSE">True / False</option>
                          <option value="EXPLAIN">Explain / Structured Rubric</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Topic Name
                        </label>
                        <input
                          type="text"
                          required
                          value={dq.topic}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(idx, 'topic', e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Marks Allocation
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={dq.marks}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(
                              idx,
                              'marks',
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Question Prompt
                      </label>
                      <input
                        type="text"
                        required
                        value={dq.prompt}
                        onChange={(e) =>
                          handleUpdateDraftQuestion(idx, 'prompt', e.target.value)
                        }
                        placeholder="Enter the exam question..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {dq.type === 'MULTIPLE_CHOICE' && (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Options (One per line, e.g. A) ..., B) ..., C) ..., D) ...)
                        </label>
                        <textarea
                          rows={3}
                          value={dq.optionsText}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(idx, 'optionsText', e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono"
                        />
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Correct / Model Memorandum Answer
                        </label>
                        <input
                          type="text"
                          required
                          value={dq.correctAnswer}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(
                              idx,
                              'correctAnswer',
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-emerald-300"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Rubric Keywords (comma-separated concepts for Explain/Method grading)
                        </label>
                        <input
                          type="text"
                          value={dq.rubricKeywordsText}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(
                              idx,
                              'rubricKeywordsText',
                              e.target.value
                            )
                          }
                          placeholder="e.g. osmosis, water potential, semi-permeable"
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-amber-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Step-by-Step Worked Explanation (Shown to learners after grading)
                      </label>
                      <input
                        type="text"
                        required
                        value={dq.explanation}
                        onChange={(e) =>
                          handleUpdateDraftQuestion(idx, 'explanation', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-sky-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaperBuilder(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPaper}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {creatingPaper && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Publish Exam Paper to Grade {paperGrade}
                </button>
              </div>
            </form>
          )}

          {/* Published Exam Papers Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Grade</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Exam Paper Title</th>
                    <th className="px-4 py-3.5">Questions & Marks</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {examPapers.map((p) => {
                    const meta = SUBJECT_METADATA[p.subject];
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                            Grade {p.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white">{p.title}</div>
                          <div className="text-slate-400 line-clamp-1">{p.description}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {p.questionCount} Qs ·{' '}
                          <strong className="text-amber-300">{p.totalMarks} Marks</strong> ·{' '}
                          {p.durationMinutes}m
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/exam/${p.id}?mode=REVISION`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700"
                            >
                              <Eye className="h-3 w-3 text-emerald-400" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePaper(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] text-rose-300 hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ACCOUNTS, ROLES & GRADE ASSIGNMENT                           */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Learner / User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Assigned Grade</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-normal text-slate-400">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.role === 'ADMIN' ? 'ADMIN' : 'LEARNER (USER)'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={u.grade}
                          onChange={(e) =>
                            handleChangeLearnerGrade(u, Number(e.target.value))
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                        >
                          <option value={10}>Grade 10</option>
                          <option value={11}>Grade 11</option>
                          <option value={12}>Grade 12</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                          >
                            <ArrowUpDown className="h-3 w-3" />
                            Make {u.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                          </button>

                          <button
                            onClick={() => handleTriggerReset(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20"
                          >
                            <KeyRound className="h-3 w-3" />
                            Reset Token
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                          >
                            <Power className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: RESET TOKENS & AUDIT TRAIL                                   */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div className="border-b border-slate-800 px-4 py-3 font-bold text-xs text-white">
              Password Reset Tokens ({resetTokens.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">User</th>
                    <th className="px-4 py-2.5">Token</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {resetTokens.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        No reset tokens issued yet.
                      </td>
                    </tr>
                  ) : (
                    resetTokens.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5 text-white">{t.userEmail}</td>
                        <td className="px-4 py-2.5 font-mono text-amber-300">
                          {t.token.slice(0, 14)}...
                        </td>
                        <td className="px-4 py-2.5">
                          {t.usedAt ? 'Used' : 'Active'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div className="border-b border-slate-800 px-4 py-3 font-bold text-xs text-white">
              Recent System Audit Trail ({auditLogs.length})
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/70">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADMIN LEARNER SCRIPT INSPECTOR & TEACHER FEEDBACK            */}
      {/* =================================================================== */}
      {inspectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-300">
                  Learner: {inspectedAttempt.userName} (Grade {inspectedAttempt.grade})
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-white">
                  {inspectedAttempt.examPaperTitle} - {inspectedAttempt.scoreEarned}/
                  {inspectedAttempt.totalMarks} ({inspectedAttempt.percentage}%)
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

            {/* Admin Teacher Review Form */}
            <form
              onSubmit={handleSaveAttemptReview}
              className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3"
            >
              <p className="text-xs font-bold text-indigo-300">
                Educator / Admin Review & Score Override
              </p>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Teacher Feedback for {inspectedAttempt.userName}
                  </label>
                  <input
                    type="text"
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Write constructive revision advice for this learner..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Total Score (/{inspectedAttempt.totalMarks})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={inspectedAttempt.totalMarks}
                    value={adjustedScore}
                    onChange={(e) => setAdjustedScore(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-emerald-300 font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingReview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {savingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Teacher Feedback & Marks
              </button>
            </form>

            {/* Learner Answers List */}
            <div className="space-y-3">
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
                  <p className="text-slate-200">{ans.questionPrompt}</p>
                  <p className="text-amber-200">
                    <strong>Learner&apos;s Answer:</strong> {ans.studentAnswer || '(Blank)'}
                  </p>
                  <p className="text-emerald-300">
                    <strong>Model Answer:</strong> {ans.correctAnswer}
                  </p>
                  <p className="text-slate-400">
                    <strong>Grading Engine Notes:</strong> {ans.gradingFeedback}
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
