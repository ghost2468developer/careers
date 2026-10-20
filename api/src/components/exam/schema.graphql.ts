export const examTypeDefs = `#graphql
  enum SubjectCode {
    MATHEMATICS
    MATHEMATICAL_LITERACY
    PHYSICAL_SCIENCES
    LIFE_SCIENCES
    GEOGRAPHY
  }

  enum AssessmentType {
    EXAM
    QUIZ
  }

  enum QuestionType {
    MULTIPLE_CHOICE
    TRUE_FALSE
    NUMERIC
    EXPLAIN
  }

  type ExamQuestion {
    id: ID!
    examPaperId: ID!
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

  type ExamPaper {
    id: ID!
    title: String!
    description: String!
    subject: SubjectCode!
    assessmentType: AssessmentType!
    pastPaperSource: String
    grade: Int!
    term: Int!
    year: Int!
    durationMinutes: Int!
    totalMarks: Int!
    paperFileUrl: String
    isPublished: Boolean!
    questionCount: Int!
    questions: [ExamQuestion!]!
    createdAt: String!
  }

  type AttemptAnswer {
    id: ID!
    questionId: ID!
    questionNumber: Int!
    questionPrompt: String!
    questionType: QuestionType!
    questionTopic: String!
    studentAnswer: String!
    correctAnswer: String!
    explanation: String!
    rubricKeywords: [String!]!
    marksEarned: Float!
    maxMarks: Int!
    isCorrect: Boolean!
    isPartial: Boolean!
    matchedKeywords: [String!]!
    missedKeywords: [String!]!
    gradingFeedback: String!
  }

  type ExamAttempt {
    id: ID!
    userId: ID!
    userName: String!
    userEmail: String!
    userGrade: Int!
    examPaperId: ID!
    examPaperTitle: String!
    subject: SubjectCode!
    assessmentType: AssessmentType!
    grade: Int!
    mode: String!
    scoreEarned: Float!
    totalMarks: Int!
    percentage: Float!
    gradeSymbol: String!
    timeSpentSeconds: Int!
    teacherFeedback: String
    answers: [AttemptAnswer!]!
    completedAt: String!
  }

  type SubjectSummary {
    subject: SubjectCode!
    label: String!
    grade: Int!
    examCount: Int!
    quizCount: Int!
    paperCount: Int!
    questionCount: Int!
    totalMarksAvailable: Int!
    attemptsCount: Int!
    averagePercentage: Float!
    bestPercentage: Float!
  }

  type LearnerProgressSummary {
    grade: Int!
    totalAttempts: Int!
    averagePercentage: Float!
    achievementLevel: String!
    papersCompleted: Int!
    totalPapersInGrade: Int!
    totalExamsInGrade: Int!
    totalQuizzesInGrade: Int!
    subjectSummaries: [SubjectSummary!]!
    recentAttempts: [ExamAttempt!]!
  }

  type InstantCheckResult {
    marksEarned: Float!
    maxMarks: Int!
    isCorrect: Boolean!
    isPartial: Boolean!
    matchedKeywords: [String!]!
    missedKeywords: [String!]!
    gradingFeedback: String!
    correctAnswer: String!
    explanation: String!
    rubricKeywords: [String!]!
  }

  input AnswerSubmissionInput {
    questionId: ID!
    studentAnswer: String!
  }

  input SubmitExamAttemptInput {
    examPaperId: ID!
    mode: String!
    timeSpentSeconds: Int!
    answers: [AnswerSubmissionInput!]!
  }

  extend type Query {
    examPapersForGrade(
      grade: Int!
      subject: SubjectCode
      assessmentType: AssessmentType
    ): [ExamPaper!]!
    examPaperById(id: ID!): ExamPaper
    myExamAttempts(
      grade: Int
      subject: SubjectCode
      assessmentType: AssessmentType
    ): [ExamAttempt!]!
    examAttemptById(id: ID!): ExamAttempt
    myAcademicProgress(grade: Int!): LearnerProgressSummary!
  }

  extend type Mutation {
    submitExamAttempt(input: SubmitExamAttemptInput!): ExamAttempt!
    checkSingleQuestion(questionId: ID!, studentAnswer: String!): InstantCheckResult!
  }
`;

export default examTypeDefs;
