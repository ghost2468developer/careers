import { GraphQLError } from 'graphql';
import { SubjectCode } from '@prisma/client';
import { GraphQLContext } from '../../types/context';
import { requireAuth } from '../../lib/auth';
import { calculateAchievementLevel, gradeStudentAnswer } from '../../lib/grading';

export const SUBJECT_LABELS: Record<SubjectCode, string> = {
  MATHEMATICS: 'Mathematics',
  MATHEMATICAL_LITERACY: 'Mathematical Literacy',
  PHYSICAL_SCIENCES: 'Physical Sciences',
  LIFE_SCIENCES: 'Life Sciences',
  GEOGRAPHY: 'Geography',
};

const ALL_SUBJECTS: SubjectCode[] = [
  SubjectCode.MATHEMATICS,
  SubjectCode.MATHEMATICAL_LITERACY,
  SubjectCode.PHYSICAL_SCIENCES,
  SubjectCode.LIFE_SCIENCES,
  SubjectCode.GEOGRAPHY,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeExamPaper(paper: any) {
  const questions = (paper.questions || []).sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => a.questionNumber - b.questionNumber
  );
  return {
    ...paper,
    questionCount: questions.length,
    questions,
    createdAt:
      paper.createdAt instanceof Date
        ? paper.createdAt.toISOString()
        : String(paper.createdAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeExamAttempt(attempt: any) {
  const answers = (attempt.answers || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ans: any) => ({
      id: ans.id,
      questionId: ans.questionId,
      questionNumber: ans.question?.questionNumber ?? 1,
      questionPrompt: ans.question?.prompt ?? '',
      questionType: ans.question?.type ?? 'MULTIPLE_CHOICE',
      questionTopic: ans.question?.topic ?? 'General',
      studentAnswer: ans.studentAnswer,
      correctAnswer: ans.question?.correctAnswer ?? '',
      explanation: ans.question?.explanation ?? '',
      rubricKeywords: ans.question?.rubricKeywords ?? [],
      marksEarned: ans.marksEarned,
      maxMarks: ans.maxMarks,
      isCorrect: ans.isCorrect,
      isPartial: ans.isPartial,
      matchedKeywords: ans.matchedKeywords ?? [],
      missedKeywords: ans.missedKeywords ?? [],
      gradingFeedback: ans.gradingFeedback,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.questionNumber - b.questionNumber);

  return {
    id: attempt.id,
    userId: attempt.userId,
    userName: attempt.user?.name ?? 'Learner',
    userEmail: attempt.user?.email ?? '',
    userGrade: attempt.user?.grade ?? attempt.examPaper?.grade ?? 10,
    examPaperId: attempt.examPaperId,
    examPaperTitle: attempt.examPaper?.title ?? 'Exam Paper',
    subject: attempt.examPaper?.subject ?? SubjectCode.MATHEMATICS,
    grade: attempt.examPaper?.grade ?? 10,
    mode: attempt.mode,
    scoreEarned: attempt.scoreEarned,
    totalMarks: attempt.totalMarks,
    percentage: Math.round(attempt.percentage * 10) / 10,
    gradeSymbol: attempt.gradeSymbol,
    timeSpentSeconds: attempt.timeSpentSeconds,
    teacherFeedback: attempt.teacherFeedback,
    answers,
    completedAt:
      attempt.completedAt instanceof Date
        ? attempt.completedAt.toISOString()
        : String(attempt.completedAt),
  };
}

export const examResolvers = {
  Query: {
    examPapersForGrade: async (
      _parent: unknown,
      args: { grade: number; subject?: SubjectCode | null },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if (![10, 11, 12].includes(args.grade)) {
        throw new GraphQLError('Grade must be 10, 11, or 12.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const papers = await context.prisma.examPaper.findMany({
        where: {
          grade: args.grade,
          isPublished: true,
          ...(args.subject ? { subject: args.subject } : {}),
        },
        include: {
          questions: true,
        },
        orderBy: [{ subject: 'asc' }, { term: 'asc' }, { createdAt: 'desc' }],
      });

      return papers.map(serializeExamPaper);
    },

    examPaperById: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      const paper = await context.prisma.examPaper.findUnique({
        where: { id: args.id },
        include: { questions: true },
      });

      if (!paper) return null;
      return serializeExamPaper(paper);
    },

    myExamAttempts: async (
      _parent: unknown,
      args: { grade?: number | null; subject?: SubjectCode | null },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      const attempts = await context.prisma.examAttempt.findMany({
        where: {
          userId: user.id,
          examPaper: {
            ...(args.grade ? { grade: args.grade } : {}),
            ...(args.subject ? { subject: args.subject } : {}),
          },
        },
        include: {
          user: true,
          examPaper: true,
          answers: {
            include: { question: true },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      return attempts.map(serializeExamAttempt);
    },

    examAttemptById: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      const attempt = await context.prisma.examAttempt.findUnique({
        where: { id: args.id },
        include: {
          user: true,
          examPaper: true,
          answers: {
            include: { question: true },
          },
        },
      });

      if (!attempt) return null;

      if (user.role !== 'ADMIN' && attempt.userId !== user.id) {
        throw new GraphQLError('Not authorized to view this exam attempt.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return serializeExamAttempt(attempt);
    },

    myAcademicProgress: async (
      _parent: unknown,
      args: { grade: number },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);
      const targetGrade = [10, 11, 12].includes(args.grade) ? args.grade : user.grade;

      const [papersInGrade, attemptsInGrade] = await Promise.all([
        context.prisma.examPaper.findMany({
          where: { grade: targetGrade, isPublished: true },
          include: { questions: true },
        }),
        context.prisma.examAttempt.findMany({
          where: {
            userId: user.id,
            examPaper: { grade: targetGrade },
          },
          include: {
            user: true,
            examPaper: true,
            answers: { include: { question: true } },
          },
          orderBy: { completedAt: 'desc' },
        }),
      ]);

      const totalAttempts = attemptsInGrade.length;
      const averagePercentage =
        totalAttempts > 0
          ? Math.round(
              (attemptsInGrade.reduce((acc, a) => acc + a.percentage, 0) /
                totalAttempts) *
                10
            ) / 10
          : 0;

      const distinctPaperIds = new Set(attemptsInGrade.map((a) => a.examPaperId));

      const subjectSummaries = ALL_SUBJECTS.map((subj) => {
        const subjPapers = papersInGrade.filter((p) => p.subject === subj);
        const subjAttempts = attemptsInGrade.filter(
          (a) => a.examPaper.subject === subj
        );

        const questionCount = subjPapers.reduce(
          (sum, p) => sum + p.questions.length,
          0
        );
        const totalMarksAvailable = subjPapers.reduce(
          (sum, p) => sum + p.totalMarks,
          0
        );

        const avgPct =
          subjAttempts.length > 0
            ? Math.round(
                (subjAttempts.reduce((s, a) => s + a.percentage, 0) /
                  subjAttempts.length) *
                  10
              ) / 10
            : 0;

        const bestPct =
          subjAttempts.length > 0
            ? Math.round(Math.max(...subjAttempts.map((a) => a.percentage)) * 10) / 10
            : 0;

        return {
          subject: subj,
          label: SUBJECT_LABELS[subj],
          grade: targetGrade,
          paperCount: subjPapers.length,
          questionCount,
          totalMarksAvailable,
          attemptsCount: subjAttempts.length,
          averagePercentage: avgPct,
          bestPercentage: bestPct,
        };
      });

      return {
        grade: targetGrade,
        totalAttempts,
        averagePercentage,
        achievementLevel:
          totalAttempts > 0
            ? calculateAchievementLevel(averagePercentage)
            : 'No attempts yet - Start an Exam Prep below!',
        papersCompleted: distinctPaperIds.size,
        totalPapersInGrade: papersInGrade.length,
        subjectSummaries,
        recentAttempts: attemptsInGrade.slice(0, 10).map(serializeExamAttempt),
      };
    },
  },

  Mutation: {
    checkSingleQuestion: async (
      _parent: unknown,
      args: { questionId: string; studentAnswer: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      const question = await context.prisma.examQuestion.findUnique({
        where: { id: args.questionId },
      });

      if (!question) {
        throw new GraphQLError('Question not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const graded = gradeStudentAnswer(question, args.studentAnswer);

      return {
        ...graded,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        rubricKeywords: question.rubricKeywords,
      };
    },

    submitExamAttempt: async (
      _parent: unknown,
      args: {
        input: {
          examPaperId: string;
          mode: string;
          timeSpentSeconds: number;
          answers: Array<{ questionId: string; studentAnswer: string }>;
        };
      },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      const paper = await context.prisma.examPaper.findUnique({
        where: { id: args.input.examPaperId },
        include: { questions: true },
      });

      if (!paper) {
        throw new GraphQLError('Exam paper not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const answerMap = new Map<string, string>();
      for (const a of args.input.answers) {
        answerMap.set(a.questionId, a.studentAnswer);
      }

      let scoreEarned = 0;
      let totalMarks = 0;

      const gradedAnswersData = paper.questions.map((question) => {
        const studentAnswer = answerMap.get(question.id) || '';
        const graded = gradeStudentAnswer(question, studentAnswer);

        scoreEarned += graded.marksEarned;
        totalMarks += graded.maxMarks;

        return {
          questionId: question.id,
          studentAnswer,
          marksEarned: graded.marksEarned,
          maxMarks: graded.maxMarks,
          isCorrect: graded.isCorrect,
          isPartial: graded.isPartial,
          matchedKeywords: graded.matchedKeywords,
          missedKeywords: graded.missedKeywords,
          gradingFeedback: graded.gradingFeedback,
        };
      });

      const percentage =
        totalMarks > 0 ? Math.round((scoreEarned / totalMarks) * 1000) / 10 : 0;
      const gradeSymbol = calculateAchievementLevel(percentage);

      const createdAttempt = await context.prisma.examAttempt.create({
        data: {
          userId: user.id,
          examPaperId: paper.id,
          mode: args.input.mode || 'REVISION',
          scoreEarned,
          totalMarks,
          percentage,
          gradeSymbol,
          timeSpentSeconds: Math.max(0, args.input.timeSpentSeconds || 0),
          answers: {
            create: gradedAnswersData,
          },
        },
        include: {
          user: true,
          examPaper: true,
          answers: {
            include: { question: true },
          },
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'EXAM_ATTEMPT_SUBMITTED',
          details: `Learner ${user.name} (Grade ${paper.grade}) completed "${paper.title}" - Score: ${scoreEarned}/${totalMarks} (${percentage}%) [${gradeSymbol}]`,
          userId: user.id,
        },
      });

      return serializeExamAttempt(createdAttempt);
    },
  },
};

export default examResolvers;
