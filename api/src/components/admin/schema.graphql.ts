export const adminTypeDefs = `#graphql
  type AdminStats {
    totalUsers: Int!
    adminCount: Int!
    userCount: Int!
    activeUsers: Int!
    inactiveUsers: Int!
    activeResetTokens: Int!
    totalAuditEvents: Int!
    totalExamPapers: Int!
    totalQuestions: Int!
    totalExamAttempts: Int!
    overallAveragePercentage: Float!
    grade10Learners: Int!
    grade11Learners: Int!
    grade12Learners: Int!
  }

  type AdminLearnerProgress {
    user: User!
    attemptsCount: Int!
    averagePercentage: Float!
    bestPercentage: Float!
    achievementLevel: String!
    strongestSubject: String
    weakestSubject: String
    lastAttemptAt: String
    recentAttempts: [ExamAttempt!]!
  }

  type PasswordResetTokenInfo {
    id: ID!
    token: String!
    userId: ID!
    userEmail: String!
    userName: String!
    expiresAt: String!
    usedAt: String
    createdAt: String!
  }

  input AdminCreateUserInput {
    name: String!
    email: String!
    password: String!
    role: Role!
    grade: Int
  }

  input CreateExamQuestionInput {
    questionNumber: Int!
    topic: String!
    type: QuestionType!
    prompt: String!
    options: [String!]!
    correctAnswer: String!
    rubricKeywords: [String!]!
    explanation: String!
    marks: Int!
  }

  input CreateExamPaperInput {
    title: String!
    description: String!
    subject: SubjectCode!
    grade: Int!
    term: Int!
    year: Int!
    durationMinutes: Int!
    paperFileUrl: String
    questions: [CreateExamQuestionInput!]!
  }

  extend type Query {
    adminStats: AdminStats!
    adminUsers(search: String, role: Role, grade: Int, isActive: Boolean): [User!]!
    adminUser(id: ID!): User
    adminLearnerProgressList(grade: Int, search: String): [AdminLearnerProgress!]!
    adminAllExamPapers(grade: Int, subject: SubjectCode): [ExamPaper!]!
    adminAllExamAttempts(grade: Int, subject: SubjectCode, userId: ID): [ExamAttempt!]!
    adminResetTokens: [PasswordResetTokenInfo!]!
    adminAuditLogs(limit: Int): [AuditLog!]!
  }

  extend type Mutation {
    adminCreateUser(input: AdminCreateUserInput!): User!
    adminUpdateUserRole(userId: ID!, role: Role!): User!
    adminUpdateLearnerGrade(userId: ID!, grade: Int!): User!
    adminToggleUserStatus(userId: ID!, isActive: Boolean!): User!
    adminTriggerPasswordReset(userId: ID!): ForgotPasswordPayload!
    adminDeleteUser(userId: ID!): Boolean!
    adminCreateExamPaper(input: CreateExamPaperInput!): ExamPaper!
    adminDeleteExamPaper(id: ID!): Boolean!
    adminReviewAttempt(attemptId: ID!, teacherFeedback: String!, adjustedScore: Float): ExamAttempt!
  }
`;

export default adminTypeDefs;
