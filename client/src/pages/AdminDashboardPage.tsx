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
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ADMIN_OPERATIONS,
  AdminLearnerProgress,
  AdminStats,
  AssessmentType,
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

function generate10DefaultQuestions(
  assessmentType: AssessmentType,
  grade: number,
  subject: SubjectCode
): DraftQuestion[] {
  const subjectLabel = SUBJECT_METADATA[subject].label;
  const marksPerQuestion = assessmentType === 'EXAM' ? 15 : 10;

  const templates: Array<Omit<DraftQuestion, 'questionNumber' | 'marks'>> = [
    {
      topic: `${subjectLabel} - Multiple Choice Concept`,
      type: 'MULTIPLE_CHOICE',
      prompt: `[Past Paper Q1 · Grade ${grade} ${subjectLabel}] Which option represents the correct governing relationship for this topic?`,
      optionsText: `A) Incorrect boundary assumption\nB) Standard Grade ${grade} ${subjectLabel} law and formula\nC) Omitting constant terms\nD) Inverse approximation`,
      correctAnswer: `B) Standard Grade ${grade} ${subjectLabel} law and formula`,
      rubricKeywordsText: 'formula, standard law',
      explanation: `Apply the standard Grade ${grade} ${subjectLabel} definition and verify units before selecting B.`,
    },
    {
      topic: `${subjectLabel} - Quantitative Calculation`,
      type: 'NUMERIC',
      prompt: `[Past Paper Q2 · Grade ${grade} ${subjectLabel}] Solve for x in the past-paper equation: 3x - 9 = 15.`,
      optionsText: '',
      correctAnswer: '8',
      rubricKeywordsText: '8, 3x = 24, 24 / 3',
      explanation: 'Add 9 to both sides: 3x = 24. Divide by 3: x = 8.',
    },
    {
      topic: `${subjectLabel} - True / False Verification`,
      type: 'TRUE_FALSE',
      prompt: `[Past Paper Q3 · Grade ${grade} ${subjectLabel}] Showing formula and substitution steps earns method marks in official CAPS marking memorandums.`,
      optionsText: '',
      correctAnswer: 'True',
      rubricKeywordsText: 'True, method marks',
      explanation: 'True! Official NSC/CAPS memorandums award method marks for formula and substitution.',
    },
    {
      topic: `${subjectLabel} - Structured Explain Question`,
      type: 'EXPLAIN',
      prompt: `[Past Paper Q4 · Grade ${grade} ${subjectLabel}] Explain the underlying principle and step-by-step reasoning required to solve a multi-part problem in this topic.`,
      optionsText: '',
      correctAnswer:
        'State the governing law or definition, write the standard formula, substitute known values with correct SI units, and interpret the final result.',
      rubricKeywordsText: 'governing law, definition, formula, substitute, units',
      explanation:
        'Marking Rubric: ✓ Governing law/definition ✓ Standard formula ✓ Substitution with units ✓ Final interpretation.',
    },
    {
      topic: `${subjectLabel} - Percentage & Rate Calculation`,
      type: 'NUMERIC',
      prompt: `[Past Paper Q5 · Grade ${grade} ${subjectLabel}] A measured value increases from 50 to 65. Calculate the percentage increase.`,
      optionsText: '',
      correctAnswer: '30',
      rubricKeywordsText: '30, 15 / 50 * 100',
      explanation: '((65 - 50) / 50) × 100 = (15 / 50) × 100 = 30%.',
    },
    {
      topic: `${subjectLabel} - Graph & Data Interpretation`,
      type: 'MULTIPLE_CHOICE',
      prompt: `[Past Paper Q6 · Grade ${grade} ${subjectLabel}] On which axis is the independent variable plotted in a standard scientific/mathematical graph?`,
      optionsText:
        'A) Vertical y-axis\nB) Horizontal x-axis\nC) Diagonal axis\nD) Origin only',
      correctAnswer: 'B) Horizontal x-axis',
      rubricKeywordsText: 'Horizontal x-axis',
      explanation: 'The independent variable is always plotted on the horizontal x-axis.',
    },
    {
      topic: `${subjectLabel} - Proportional Reasoning`,
      type: 'NUMERIC',
      prompt: `[Past Paper Q7 · Grade ${grade} ${subjectLabel}] Divide 150 in the ratio 2 : 3 and state the larger share.`,
      optionsText: '',
      correctAnswer: '90',
      rubricKeywordsText: '90, 3/5 * 150',
      explanation: 'Total parts = 5. Larger share = (3 / 5) × 150 = 90.',
    },
    {
      topic: `${subjectLabel} - Principle Verification`,
      type: 'TRUE_FALSE',
      prompt: `[Past Paper Q8 · Grade ${grade} ${subjectLabel}] Keeping unrounded intermediate values until the final step prevents rounding errors.`,
      optionsText: '',
      correctAnswer: 'True',
      rubricKeywordsText: 'True, rounding',
      explanation: 'True! Always round off only at the final answer (usually to 2 decimal places).',
    },
    {
      topic: `${subjectLabel} - Multi-Step Calculation`,
      type: 'NUMERIC',
      prompt: `[Past Paper Q9 · Grade ${grade} ${subjectLabel}] Evaluate 2x² + 5 when x = 3.`,
      optionsText: '',
      correctAnswer: '23',
      rubricKeywordsText: '23, 2(9) + 5',
      explanation: '2(3)² + 5 = 2(9) + 5 = 18 + 5 = 23.',
    },
    {
      topic: `${subjectLabel} - Comprehensive Synthesis & Explain`,
      type: 'EXPLAIN',
      prompt: `[Past Paper Q10 · Grade ${grade} ${subjectLabel}] Explain how two variables in this topic interact when external conditions change, and justify your answer using curriculum terminology.`,
      optionsText: '',
      correctAnswer:
        'When the independent variable increases, the system responds according to the governing law, changing the dependent variable proportionally while conserving total energy/mass.',
      rubricKeywordsText: 'independent variable, governing law, dependent variable, proportionally, conserving',
      explanation:
        'Full marks awarded for linking the independent variable change to the governing law and stating the effect on the dependent variable.',
    },
  ];

  return templates.map((t, idx) => ({
    ...t,
    questionNumber: idx + 1,
    marks: marksPerQuestion,
  }));
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
  const [assessmentFilter, setAssessmentFilter] = useState<'ALL' | AssessmentType>('ALL');
  const [roleFilter] = useState<'ALL' | Role>('ALL');

  // Create User Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('USER');
  const [newGrade, setNewGrade] = useState<number>(10);
  const [creatingUser, setCreatingUser] = useState(false);

  // Create / Add Exam (150 Marks · 10 Qs) or Quiz (100 Marks · 10 Qs) Studio
  const [showPaperBuilder, setShowPaperBuilder] = useState(false);
  const [paperAssessmentType, setPaperAssessmentType] = useState<AssessmentType>('EXAM');
  const [paperTitle, setPaperTitle] = useState(
    'Grade 10 Mathematics Past Paper 2: Trigonometry, Analytical & Euclidean Geometry'
  );
  const [paperDesc, setPaperDesc] = useState(
    'Official 150-Mark Past Paper Examination consisting of 10 structured questions.'
  );
  const [paperSource, setPaperSource] = useState(
    'DBE NSC November Past Paper (150 Marks · 10 Questions)'
  );
  const [paperSubject, setPaperSubject] = useState<SubjectCode>('MATHEMATICS');
  const [paperGrade, setPaperGrade] = useState<number>(10);
  const [paperTerm, setPaperTerm] = useState<number>(4);
  const [paperDuration, setPaperDuration] = useState<number>(150);
  const [paperFileName, setPaperFileName] = useState<string>('');
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>(() =>
    generate10DefaultQuestions('EXAM', 10, 'MATHEMATICS')
  );
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

  const handleSwitchBuilderMode = (nextType: AssessmentType) => {
    setPaperAssessmentType(nextType);
    const targetMarksPerQ = nextType === 'EXAM' ? 15 : 10;
    setPaperDuration(nextType === 'EXAM' ? 150 : 60);
    setPaperSource(
      nextType === 'EXAM'
        ? `DBE NSC Grade ${paperGrade} Past Paper (150 Marks · 10 Questions)`
        : `CAPS Grade ${paperGrade} Revision Quiz (100 Marks · 10 Questions)`
    );
    setPaperTitle(
      nextType === 'EXAM'
        ? `Grade ${paperGrade} ${SUBJECT_METADATA[paperSubject].label} Past Paper Exam (150 Marks)`
        : `Grade ${paperGrade} ${SUBJECT_METADATA[paperSubject].label} Revision Quiz (100 Marks)`
    );

    // Ensure 10 questions and update marks to 15 (Exam = 150) or 10 (Quiz = 100)
    const tenQs =
      draftQuestions.length === 10
        ? draftQuestions.map((q, i) => ({
            ...q,
            questionNumber: i + 1,
            marks: targetMarksPerQ,
          }))
        : generate10DefaultQuestions(nextType, paperGrade, paperSubject);
    setDraftQuestions(tenQs);
  };

  const handleAutoBalanceMarks = () => {
    const targetTotal = paperAssessmentType === 'EXAM' ? 150 : 100;
    const tenQs =
      draftQuestions.length === 10
        ? [...draftQuestions]
        : generate10DefaultQuestions(paperAssessmentType, paperGrade, paperSubject);
    const perQ = targetTotal / 10;
    setDraftQuestions(
      tenQs.map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
        marks: perQ,
      }))
    );
  };

  const handleLoad10PastPaperTemplate = () => {
    setDraftQuestions(
      generate10DefaultQuestions(paperAssessmentType, paperGrade, paperSubject)
    );
    setPaperTitle(
      paperAssessmentType === 'EXAM'
        ? `Grade ${paperGrade} ${SUBJECT_METADATA[paperSubject].label} National Past Paper (150 Marks)`
        : `Grade ${paperGrade} ${SUBJECT_METADATA[paperSubject].label} Mastery Quiz (100 Marks)`
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaperFileName(file.name);

    try {
      const text = await file.text();
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (parsed.title) setPaperTitle(parsed.title);
        if (parsed.description) setPaperDesc(parsed.description);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const defaultMark = paperAssessmentType === 'EXAM' ? 15 : 10;
          setDraftQuestions(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parsed.questions.slice(0, 10).map((q: any, idx: number) => ({
              questionNumber: idx + 1,
              topic: q.topic || 'Past Paper Topic',
              type: q.type || 'EXPLAIN',
              prompt: q.prompt || '',
              optionsText: Array.isArray(q.options) ? q.options.join('\n') : '',
              correctAnswer: q.correctAnswer || '',
              rubricKeywordsText: Array.isArray(q.rubricKeywords)
                ? q.rubricKeywords.join(', ')
                : '',
              explanation: q.explanation || '',
              marks: Number(q.marks) || defaultMark,
            }))
          );
        }
      } else {
        setPaperTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setBanner({
        type: 'success',
        text: `Loaded "${file.name}". Review the 10 questions below and click Publish!`,
      });
    } catch {
      setBanner({
        type: 'error',
        text: 'Could not read uploaded file.',
      });
    }
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
        marks: Number(q.marks) || (paperAssessmentType === 'EXAM' ? 15 : 10),
      }));

      const data = await graphqlRequest<{ adminCreateExamPaper: ExamPaper }>(
        ADMIN_OPERATIONS.CREATE_EXAM_PAPER,
        {
          input: {
            title: paperTitle,
            description: paperDesc,
            subject: paperSubject,
            assessmentType: paperAssessmentType,
            pastPaperSource: paperSource,
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
        } ${data.adminCreateExamPaper.assessmentType}: "${
          data.adminCreateExamPaper.title
        }" (${data.adminCreateExamPaper.questionCount} Questions · ${
          data.adminCreateExamPaper.totalMarks
        } Marks)`,
      });
      setShowPaperBuilder(false);
      await loadAdminData();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to publish assessment',
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
        text: `Deleted ${paper.assessmentType} "${paper.title}"`,
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

  const currentDraftTotalMarks = draftQuestions.reduce(
    (sum, q) => sum + (Number(q.marks) || 0),
    0
  );
  const requiredMarks = paperAssessmentType === 'EXAM' ? 150 : 100;
  const filteredPapers = examPapers.filter((p) =>
    assessmentFilter === 'ALL' ? true : p.assessmentType === assessmentFilter
  );

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
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Grade 10–12 Learner Monitoring, 150-Mark Exams & 100-Mark Quizzes
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Create 150-Mark Past Paper Exams (10 Questions) & 100-Mark Quizzes, and monitor every learner&apos;s progress across Grades 10, 11, and 12.
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
              handleSwitchBuilderMode('EXAM');
              setShowPaperBuilder(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create 150-Mark Exam (10 Qs)
          </button>

          <button
            onClick={() => {
              setActiveTab('papers');
              handleSwitchBuilderMode('QUIZ');
              setShowPaperBuilder(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
          >
            <Zap className="h-4 w-4" />
            Create 100-Mark Quiz
          </button>

          <button
            onClick={() => setShowCreateUserModal(!showCreateUserModal)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700"
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
          <p className="text-[11px] font-medium text-indigo-300">150-Mark Exams</p>
          <p className="mt-1 text-2xl font-extrabold text-indigo-300">
            {stats?.totalExams150 ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">10 Past-Paper Qs each</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[11px] font-medium text-emerald-300">100-Mark Quizzes</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-300">
            {stats?.totalQuizzes100 ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">10 Quiz Qs each</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-[11px] font-medium text-sky-300">Question Bank</p>
          <p className="mt-1 text-2xl font-extrabold text-sky-300">
            {stats?.totalQuestions ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Past Paper & Quiz Qs</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[11px] font-medium text-amber-300">Graded Attempts</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-300">
            {stats?.totalExamAttempts ?? '-'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Completed scripts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[11px] font-medium text-slate-400">Cohort Average</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {stats?.overallAveragePercentage ?? 0}%
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">All grades combined</p>
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
            Exams (150m) & Quizzes (100m) ({examPapers.length})
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
                    Submitted Exam (150m) & Quiz (100m) Scripts:
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
                                Gr {att.grade} · {meta.shortLabel} · {att.assessmentType}
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
      {/* TAB 2: EXAMS (150 MARKS · 10 Qs) & QUIZZES (100 MARKS · 10 Qs)      */}
      {/* =================================================================== */}
      {activeTab === 'papers' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(['ALL', 'EXAM', 'QUIZ'] as const).map((typeFilter) => (
                <button
                  key={typeFilter}
                  type="button"
                  onClick={() => setAssessmentFilter(typeFilter)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    assessmentFilter === typeFilter
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {typeFilter === 'ALL'
                    ? `All Assessments (${examPapers.length})`
                    : typeFilter === 'EXAM'
                    ? 'Past Paper Exams (150 Marks · 10 Qs)'
                    : 'Revision Quizzes (100 Marks · 10 Qs)'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPaperBuilder(!showPaperBuilder)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <FilePlus2 className="h-4 w-4" />
              {showPaperBuilder
                ? 'Close Creator Studio'
                : 'Add / Create New Exam (150m) or Quiz (100m)'}
            </button>
          </div>

          {/* Exam (150 Marks, 10 Qs) & Quiz (100 Marks, 10 Qs) Creator Studio */}
          {showPaperBuilder && (
            <form
              onSubmit={handleCreateExamPaper}
              className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FilePlus2 className="h-5 w-5 text-emerald-400" />
                    Create {paperAssessmentType === 'EXAM' ? '150-Mark Past Paper Exam (10 Questions)' : '100-Mark Revision Quiz (10 Questions)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {paperAssessmentType === 'EXAM'
                      ? 'Exam Mode: Strictly 10 Past-Paper Questions totaling 150 Marks (15 marks each by default).'
                      : 'Quiz Mode: 10 Revision Quiz Questions totaling 100 Marks (10 marks each by default).'}
                  </p>
                </div>

                {/* Switch between EXAM (150m) and QUIZ (100m) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                    <button
                      type="button"
                      onClick={() => handleSwitchBuilderMode('EXAM')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        paperAssessmentType === 'EXAM'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      EXAM (150 Marks · 10 Qs)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchBuilderMode('QUIZ')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        paperAssessmentType === 'QUIZ'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      QUIZ (100 Marks · 10 Qs)
                    </button>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".json,.txt,.md,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {paperAssessmentType === 'EXAM' ? 'Past Paper Exam Title' : 'Quiz Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
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
                    Past Paper Source / Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={paperSource}
                    onChange={(e) => setPaperSource(e.target.value)}
                    placeholder="e.g. DBE NSC November Past Paper 1"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-sky-300"
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
                    min={15}
                    max={240}
                    value={paperDuration}
                    onChange={(e) => setPaperDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {/* Live Marks & 10-Question Validator Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span
                    className={`rounded-lg px-3 py-1 font-extrabold ${
                      draftQuestions.length === 10
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    Questions: {draftQuestions.length} / 10
                  </span>

                  <span
                    className={`rounded-lg px-3 py-1 font-extrabold ${
                      currentDraftTotalMarks === requiredMarks
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    Total Marks: {currentDraftTotalMarks} / {requiredMarks} Marks Required
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoad10PastPaperTemplate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-Fill 10 Past-Paper Questions ({requiredMarks} Marks)
                  </button>

                  {currentDraftTotalMarks !== requiredMarks && (
                    <button
                      type="button"
                      onClick={handleAutoBalanceMarks}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                    >
                      Auto-Balance to {requiredMarks} Marks ({requiredMarks / 10}m each)
                    </button>
                  )}
                </div>
              </div>

              {/* 10 Questions Builder List */}
              <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                {draftQuestions.map((dq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-emerald-400">
                        Question {idx + 1} of {draftQuestions.length} ({dq.marks} Marks)
                      </span>
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
                          max={50}
                          value={dq.marks}
                          onChange={(e) =>
                            handleUpdateDraftQuestion(
                              idx,
                              'marks',
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Past Paper Question Prompt
                      </label>
                      <input
                        type="text"
                        required
                        value={dq.prompt}
                        onChange={(e) =>
                          handleUpdateDraftQuestion(idx, 'prompt', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {dq.type === 'MULTIPLE_CHOICE' && (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Options (One per line: A) ..., B) ..., C) ..., D) ...)
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
                          Rubric Keywords (comma-separated for Explain & Method Grading)
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
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-amber-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Step-by-Step Worked Explanation
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
                  disabled={creatingPaper || currentDraftTotalMarks !== requiredMarks}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {creatingPaper && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Publish {paperAssessmentType} ({draftQuestions.length} Qs ·{' '}
                  {currentDraftTotalMarks} Marks) to Grade {paperGrade}
                </button>
              </div>
            </form>
          )}

          {/* Published Exam & Quiz Papers Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Grade</th>
                    <th className="px-4 py-3.5">Side / Type</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Title & Past Paper Source</th>
                    <th className="px-4 py-3.5">Structure</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredPapers.map((p) => {
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
                            className={`rounded-md px-2.5 py-0.5 text-[11px] font-extrabold ${
                              p.assessmentType === 'EXAM'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {p.assessmentType === 'EXAM'
                              ? 'EXAM · 150m'
                              : 'QUIZ · 100m'}
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
                          <div className="text-[11px] text-sky-300">
                            {p.pastPaperSource || p.description}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          <strong>{p.questionCount} Questions</strong> ·{' '}
                          <strong className="text-amber-300">{p.totalMarks} Marks</strong>
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
                  Learner: {inspectedAttempt.userName} (Grade {inspectedAttempt.grade} ·{' '}
                  {inspectedAttempt.assessmentType})
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
