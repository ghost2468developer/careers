export type Role = 'ADMIN' | 'USER';

export type SubjectCode =
  | 'MATHEMATICS'
  | 'MATHEMATICAL_LITERACY'
  | 'PHYSICAL_SCIENCES'
  | 'LIFE_SCIENCES'
  | 'GEOGRAPHY';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'NUMERIC'
  | 'EXPLAIN';

export const SUBJECT_METADATA: Record<
  SubjectCode,
  { label: string; shortLabel: string; color: string; badgeClass: string }
> = {
  MATHEMATICS: {
    label: 'Mathematics',
    shortLabel: 'Maths',
    color: 'indigo',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  MATHEMATICAL_LITERACY: {
    label: 'Mathematical Literacy',
    shortLabel: 'Maths Lit',
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  PHYSICAL_SCIENCES: {
    label: 'Physical Sciences',
    shortLabel: 'Physics & Chem',
    color: 'sky',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  LIFE_SCIENCES: {
    label: 'Life Sciences',
    shortLabel: 'Biology',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  GEOGRAPHY: {
    label: 'Geography',
    shortLabel: 'Geography',
    color: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  TRUE_FALSE: 'True / False',
  NUMERIC: 'Numeric / Calculation',
  EXPLAIN: 'Explain / Structured Rubric',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  grade: number;
  isActive: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface ForgotPasswordPayload {
  success: boolean;
  message: string;
  resetToken?: string | null;
  expiresAt?: string | null;
}

export interface VerifyResetTokenPayload {
  valid: boolean;
  email?: string | null;
  expiresAt?: string | null;
  message?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  details?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  examPaperId: string;
  questionNumber: number;
  topic: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  rubricKeywords: string[];
  explanation: string;
  marks: number;
}

export interface ExamPaper {
  id: string;
  title: string;
  description: string;
  subject: SubjectCode;
  grade: number;
  term: number;
  year: number;
  durationMinutes: number;
  totalMarks: number;
  paperFileUrl?: string | null;
  isPublished: boolean;
  questionCount: number;
  questions: ExamQuestion[];
  createdAt: string;
}

export interface AttemptAnswer {
  id: string;
  questionId: string;
  questionNumber: number;
  questionPrompt: string;
  questionType: QuestionType;
  questionTopic: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  rubricKeywords: string[];
  marksEarned: number;
  maxMarks: number;
  isCorrect: boolean;
  isPartial: boolean;
  matchedKeywords: string[];
  missedKeywords: string[];
  gradingFeedback: string;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userGrade: number;
  examPaperId: string;
  examPaperTitle: string;
  subject: SubjectCode;
  grade: number;
  mode: string;
  scoreEarned: number;
  totalMarks: number;
  percentage: number;
  gradeSymbol: string;
  timeSpentSeconds: number;
  teacherFeedback?: string | null;
  answers: AttemptAnswer[];
  completedAt: string;
}

export interface SubjectSummary {
  subject: SubjectCode;
  label: string;
  grade: number;
  paperCount: number;
  questionCount: number;
  totalMarksAvailable: number;
  attemptsCount: number;
  averagePercentage: number;
  bestPercentage: number;
}

export interface LearnerProgressSummary {
  grade: number;
  totalAttempts: number;
  averagePercentage: number;
  achievementLevel: string;
  papersCompleted: number;
  totalPapersInGrade: number;
  subjectSummaries: SubjectSummary[];
  recentAttempts: ExamAttempt[];
}

export interface InstantCheckResult {
  marksEarned: number;
  maxMarks: number;
  isCorrect: boolean;
  isPartial: boolean;
  matchedKeywords: string[];
  missedKeywords: string[];
  gradingFeedback: string;
  correctAnswer: string;
  explanation: string;
  rubricKeywords: string[];
}

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  activeUsers: number;
  inactiveUsers: number;
  activeResetTokens: number;
  totalAuditEvents: number;
  totalExamPapers: number;
  totalQuestions: number;
  totalExamAttempts: number;
  overallAveragePercentage: number;
  grade10Learners: number;
  grade11Learners: number;
  grade12Learners: number;
}

export interface AdminLearnerProgress {
  user: User;
  attemptsCount: number;
  averagePercentage: number;
  bestPercentage: number;
  achievementLevel: string;
  strongestSubject?: string | null;
  weakestSubject?: string | null;
  lastAttemptAt?: string | null;
  recentAttempts: ExamAttempt[];
}

export interface PasswordResetTokenInfo {
  id: string;
  token: string;
  userId: string;
  userEmail: string;
  userName: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
}

const TOKEN_STORAGE_KEY = 'nexus_rbac_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function graphqlRequest<TData = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message || 'GraphQL Request Error');
  }

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return payload.data as TData;
}

const EXAM_ATTEMPT_FIELDS = `#graphql
  id
  userId
  userName
  userEmail
  userGrade
  examPaperId
  examPaperTitle
  subject
  grade
  mode
  scoreEarned
  totalMarks
  percentage
  gradeSymbol
  timeSpentSeconds
  teacherFeedback
  completedAt
  answers {
    id
    questionId
    questionNumber
    questionPrompt
    questionType
    questionTopic
    studentAnswer
    correctAnswer
    explanation
    rubricKeywords
    marksEarned
    maxMarks
    isCorrect
    isPartial
    matchedKeywords
    missedKeywords
    gradingFeedback
  }
`;

const EXAM_PAPER_FIELDS = `#graphql
  id
  title
  description
  subject
  grade
  term
  year
  durationMinutes
  totalMarks
  paperFileUrl
  isPublished
  questionCount
  createdAt
  questions {
    id
    examPaperId
    questionNumber
    topic
    type
    prompt
    options
    correctAnswer
    rubricKeywords
    explanation
    marks
  }
`;

export const AUTH_OPERATIONS = {
  ME: `#graphql
    query Me {
      me {
        id
        email
        name
        role
        grade
        isActive
        avatarUrl
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  `,
  LOGIN: `#graphql
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        user {
          id
          email
          name
          role
          grade
          isActive
          avatarUrl
          lastLoginAt
          createdAt
          updatedAt
        }
      }
    }
  `,
  REGISTER: `#graphql
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        token
        user {
          id
          email
          name
          role
          grade
          isActive
          avatarUrl
          lastLoginAt
          createdAt
          updatedAt
        }
      }
    }
  `,
  FORGOT_PASSWORD: `#graphql
    mutation ForgotPassword($input: ForgotPasswordInput!) {
      forgotPassword(input: $input) {
        success
        message
        resetToken
        expiresAt
      }
    }
  `,
  VERIFY_RESET_TOKEN: `#graphql
    query VerifyResetToken($token: String!) {
      verifyResetToken(token: $token) {
        valid
        email
        expiresAt
        message
      }
    }
  `,
  RESET_PASSWORD: `#graphql
    mutation ResetPassword($input: ResetPasswordInput!) {
      resetPassword(input: $input) {
        token
        user {
          id
          email
          name
          role
          grade
          isActive
          avatarUrl
          lastLoginAt
          createdAt
          updatedAt
        }
      }
    }
  `,
};

export const USER_OPERATIONS = {
  MY_DASHBOARD: `#graphql
    query MyDashboard {
      myProfile {
        id
        email
        name
        role
        grade
        isActive
        avatarUrl
        lastLoginAt
        createdAt
        updatedAt
      }
      myAuditLogs {
        id
        action
        details
        userId
        userEmail
        userName
        createdAt
      }
    }
  `,
  UPDATE_PROFILE: `#graphql
    mutation UpdateProfile($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        id
        email
        name
        role
        grade
        isActive
        avatarUrl
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  `,
  SET_LEARNER_GRADE: `#graphql
    mutation SetLearnerGrade($grade: Int!) {
      setLearnerGrade(grade: $grade) {
        id
        email
        name
        role
        grade
        isActive
        avatarUrl
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  `,
  CHANGE_PASSWORD: `#graphql
    mutation ChangePassword($input: ChangePasswordInput!) {
      changePassword(input: $input)
    }
  `,
};

export const EXAM_OPERATIONS = {
  LEARNER_GRADE_PORTAL: `#graphql
    query LearnerGradePortal($grade: Int!, $subject: SubjectCode) {
      examPapersForGrade(grade: $grade, subject: $subject) {
        ${EXAM_PAPER_FIELDS}
      }
      myAcademicProgress(grade: $grade) {
        grade
        totalAttempts
        averagePercentage
        achievementLevel
        papersCompleted
        totalPapersInGrade
        subjectSummaries {
          subject
          label
          grade
          paperCount
          questionCount
          totalMarksAvailable
          attemptsCount
          averagePercentage
          bestPercentage
        }
        recentAttempts {
          ${EXAM_ATTEMPT_FIELDS}
        }
      }
    }
  `,
  GET_EXAM_PAPER: `#graphql
    query GetExamPaper($id: ID!) {
      examPaperById(id: $id) {
        ${EXAM_PAPER_FIELDS}
      }
    }
  `,
  CHECK_SINGLE_QUESTION: `#graphql
    mutation CheckSingleQuestion($questionId: ID!, $studentAnswer: String!) {
      checkSingleQuestion(questionId: $questionId, studentAnswer: $studentAnswer) {
        marksEarned
        maxMarks
        isCorrect
        isPartial
        matchedKeywords
        missedKeywords
        gradingFeedback
        correctAnswer
        explanation
        rubricKeywords
      }
    }
  `,
  SUBMIT_EXAM_ATTEMPT: `#graphql
    mutation SubmitExamAttempt($input: SubmitExamAttemptInput!) {
      submitExamAttempt(input: $input) {
        ${EXAM_ATTEMPT_FIELDS}
      }
    }
  `,
};

export const ADMIN_OPERATIONS = {
  ADMIN_DASHBOARD: `#graphql
    query AdminDashboard($search: String, $role: Role, $grade: Int) {
      adminStats {
        totalUsers
        adminCount
        userCount
        activeUsers
        inactiveUsers
        activeResetTokens
        totalAuditEvents
        totalExamPapers
        totalQuestions
        totalExamAttempts
        overallAveragePercentage
        grade10Learners
        grade11Learners
        grade12Learners
      }
      adminLearnerProgressList(grade: $grade, search: $search) {
        user {
          id
          email
          name
          role
          grade
          isActive
          lastLoginAt
          createdAt
        }
        attemptsCount
        averagePercentage
        bestPercentage
        achievementLevel
        strongestSubject
        weakestSubject
        lastAttemptAt
        recentAttempts {
          ${EXAM_ATTEMPT_FIELDS}
        }
      }
      adminAllExamPapers(grade: $grade) {
        ${EXAM_PAPER_FIELDS}
      }
      adminUsers(search: $search, role: $role, grade: $grade) {
        id
        email
        name
        role
        grade
        isActive
        avatarUrl
        lastLoginAt
        createdAt
        updatedAt
      }
      adminResetTokens {
        id
        token
        userId
        userEmail
        userName
        expiresAt
        usedAt
        createdAt
      }
      adminAuditLogs(limit: 40) {
        id
        action
        details
        userId
        userEmail
        userName
        createdAt
      }
    }
  `,
  CREATE_USER: `#graphql
    mutation AdminCreateUser($input: AdminCreateUserInput!) {
      adminCreateUser(input: $input) {
        id
        email
        name
        role
        grade
        isActive
        createdAt
      }
    }
  `,
  UPDATE_USER_ROLE: `#graphql
    mutation AdminUpdateUserRole($userId: ID!, $role: Role!) {
      adminUpdateUserRole(userId: $userId, role: $role) {
        id
        email
        name
        role
        grade
        isActive
      }
    }
  `,
  UPDATE_LEARNER_GRADE: `#graphql
    mutation AdminUpdateLearnerGrade($userId: ID!, $grade: Int!) {
      adminUpdateLearnerGrade(userId: $userId, grade: $grade) {
        id
        email
        name
        role
        grade
        isActive
      }
    }
  `,
  TOGGLE_USER_STATUS: `#graphql
    mutation AdminToggleUserStatus($userId: ID!, $isActive: Boolean!) {
      adminToggleUserStatus(userId: $userId, isActive: $isActive) {
        id
        email
        name
        role
        grade
        isActive
      }
    }
  `,
  TRIGGER_PASSWORD_RESET: `#graphql
    mutation AdminTriggerPasswordReset($userId: ID!) {
      adminTriggerPasswordReset(userId: $userId) {
        success
        message
        resetToken
        expiresAt
      }
    }
  `,
  DELETE_USER: `#graphql
    mutation AdminDeleteUser($userId: ID!) {
      adminDeleteUser(userId: $userId)
    }
  `,
  CREATE_EXAM_PAPER: `#graphql
    mutation AdminCreateExamPaper($input: CreateExamPaperInput!) {
      adminCreateExamPaper(input: $input) {
        ${EXAM_PAPER_FIELDS}
      }
    }
  `,
  DELETE_EXAM_PAPER: `#graphql
    mutation AdminDeleteExamPaper($id: ID!) {
      adminDeleteExamPaper(id: $id)
    }
  `,
  REVIEW_ATTEMPT: `#graphql
    mutation AdminReviewAttempt($attemptId: ID!, $teacherFeedback: String!, $adjustedScore: Float) {
      adminReviewAttempt(attemptId: $attemptId, teacherFeedback: $teacherFeedback, adjustedScore: $adjustedScore) {
        ${EXAM_ATTEMPT_FIELDS}
      }
    }
  `,
};
