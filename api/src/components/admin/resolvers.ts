import { GraphQLError } from 'graphql';
import {
  AssessmentType,
  Prisma,
  QuestionType,
  Role,
  SubjectCode,
  User,
} from '@prisma/client';
import { GraphQLContext } from '../../types/context';
import {
  generateResetTokenString,
  hashPassword,
  requireAdmin,
} from '../../lib/auth';
import { calculateAchievementLevel } from '../../lib/grading';
import {
  serializeExamAttempt,
  serializeExamPaper,
  SUBJECT_LABELS,
} from '../exam/resolvers';

function serializeUser(user: User) {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const adminResolvers = {
  Query: {
    adminStats: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      requireAdmin(context);

      const [
        totalUsers,
        adminCount,
        userCount,
        activeUsers,
        inactiveUsers,
        activeResetTokens,
        totalAuditEvents,
        totalExamPapers,
        totalExams150,
        totalQuizzes100,
        totalQuestions,
        attempts,
        grade10Learners,
        grade11Learners,
        grade12Learners,
      ] = await Promise.all([
        context.prisma.user.count(),
        context.prisma.user.count({ where: { role: Role.ADMIN } }),
        context.prisma.user.count({ where: { role: Role.USER } }),
        context.prisma.user.count({ where: { isActive: true } }),
        context.prisma.user.count({ where: { isActive: false } }),
        context.prisma.passwordResetToken.count({
          where: {
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
        }),
        context.prisma.auditLog.count(),
        context.prisma.examPaper.count(),
        context.prisma.examPaper.count({
          where: { assessmentType: AssessmentType.EXAM },
        }),
        context.prisma.examPaper.count({
          where: { assessmentType: AssessmentType.QUIZ },
        }),
        context.prisma.examQuestion.count(),
        context.prisma.examAttempt.findMany({ select: { percentage: true } }),
        context.prisma.user.count({ where: { role: Role.USER, grade: 10 } }),
        context.prisma.user.count({ where: { role: Role.USER, grade: 11 } }),
        context.prisma.user.count({ where: { role: Role.USER, grade: 12 } }),
      ]);

      const totalExamAttempts = attempts.length;
      const overallAveragePercentage =
        totalExamAttempts > 0
          ? Math.round(
              (attempts.reduce((sum, a) => sum + a.percentage, 0) / totalExamAttempts) *
                10
            ) / 10
          : 0;

      return {
        totalUsers,
        adminCount,
        userCount,
        activeUsers,
        inactiveUsers,
        activeResetTokens,
        totalAuditEvents,
        totalExamPapers,
        totalExams150,
        totalQuizzes100,
        totalQuestions,
        totalExamAttempts,
        overallAveragePercentage,
        grade10Learners,
        grade11Learners,
        grade12Learners,
      };
    },

    adminUsers: async (
      _parent: unknown,
      args: {
        search?: string | null;
        role?: Role | null;
        grade?: number | null;
        isActive?: boolean | null;
      },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const where: Prisma.UserWhereInput = {};

      if (args.role) {
        where.role = args.role;
      }

      if (args.grade && [10, 11, 12].includes(args.grade)) {
        where.grade = args.grade;
      }

      if (typeof args.isActive === 'boolean') {
        where.isActive = args.isActive;
      }

      if (args.search && args.search.trim()) {
        const q = args.search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }

      const users = await context.prisma.user.findMany({
        where,
        orderBy: [{ role: 'asc' }, { grade: 'asc' }, { createdAt: 'desc' }],
      });

      return users.map(serializeUser);
    },

    adminUser: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const user = await context.prisma.user.findUnique({
        where: { id: args.id },
      });

      return user ? serializeUser(user) : null;
    },

    adminLearnerProgressList: async (
      _parent: unknown,
      args: { grade?: number | null; search?: string | null },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const where: Prisma.UserWhereInput = {
        role: Role.USER,
      };

      if (args.grade && [10, 11, 12].includes(args.grade)) {
        where.grade = args.grade;
      }

      if (args.search && args.search.trim()) {
        const q = args.search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }

      const learners = await context.prisma.user.findMany({
        where,
        include: {
          examAttempts: {
            include: {
              user: true,
              examPaper: true,
              answers: { include: { question: true } },
            },
            orderBy: { completedAt: 'desc' },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      });

      return learners.map((learner) => {
        const attempts = learner.examAttempts;
        const attemptsCount = attempts.length;
        const averagePercentage =
          attemptsCount > 0
            ? Math.round(
                (attempts.reduce((sum, a) => sum + a.percentage, 0) / attemptsCount) * 10
              ) / 10
            : 0;
        const bestPercentage =
          attemptsCount > 0
            ? Math.round(Math.max(...attempts.map((a) => a.percentage)) * 10) / 10
            : 0;

        const bySubject = new Map<SubjectCode, number[]>();
        for (const att of attempts) {
          const subj = att.examPaper.subject;
          const list = bySubject.get(subj) || [];
          list.push(att.percentage);
          bySubject.set(subj, list);
        }

        let strongestSubject: string | null = null;
        let weakestSubject: string | null = null;
        let maxAvg = -1;
        let minAvg = 101;

        for (const [subj, scores] of bySubject.entries()) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg > maxAvg) {
            maxAvg = avg;
            strongestSubject = `${SUBJECT_LABELS[subj]} (${Math.round(avg)}%)`;
          }
          if (avg < minAvg) {
            minAvg = avg;
            weakestSubject = `${SUBJECT_LABELS[subj]} (${Math.round(avg)}%)`;
          }
        }

        return {
          user: serializeUser(learner),
          attemptsCount,
          averagePercentage,
          bestPercentage,
          achievementLevel:
            attemptsCount > 0
              ? calculateAchievementLevel(averagePercentage)
              : 'No Exam Preps Attempted Yet',
          strongestSubject,
          weakestSubject,
          lastAttemptAt:
            attemptsCount > 0 ? attempts[0].completedAt.toISOString() : null,
          recentAttempts: attempts.slice(0, 6).map(serializeExamAttempt),
        };
      });
    },

    adminAllExamPapers: async (
      _parent: unknown,
      args: {
        grade?: number | null;
        subject?: SubjectCode | null;
        assessmentType?: AssessmentType | null;
      },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const papers = await context.prisma.examPaper.findMany({
        where: {
          ...(args.grade ? { grade: args.grade } : {}),
          ...(args.subject ? { subject: args.subject } : {}),
          ...(args.assessmentType ? { assessmentType: args.assessmentType } : {}),
        },
        include: {
          questions: true,
        },
        orderBy: [
          { grade: 'asc' },
          { assessmentType: 'asc' },
          { subject: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return papers.map(serializeExamPaper);
    },

    adminAllExamAttempts: async (
      _parent: unknown,
      args: { grade?: number | null; subject?: SubjectCode | null; userId?: string | null },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const attempts = await context.prisma.examAttempt.findMany({
        where: {
          ...(args.userId ? { userId: args.userId } : {}),
          examPaper: {
            ...(args.grade ? { grade: args.grade } : {}),
            ...(args.subject ? { subject: args.subject } : {}),
          },
        },
        include: {
          user: true,
          examPaper: true,
          answers: { include: { question: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 100,
      });

      return attempts.map(serializeExamAttempt);
    },

    adminResetTokens: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const tokens = await context.prisma.passwordResetToken.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { user: true },
      });

      return tokens.map((t) => ({
        id: t.id,
        token: t.token,
        userId: t.userId,
        userEmail: t.user.email,
        userName: t.user.name,
        expiresAt: t.expiresAt.toISOString(),
        usedAt: t.usedAt ? t.usedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      }));
    },

    adminAuditLogs: async (
      _parent: unknown,
      args: { limit?: number | null },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const logs = await context.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: args.limit || 50,
        include: { user: true },
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        userId: log.userId,
        userEmail: log.user?.email || 'System',
        userName: log.user?.name || 'System',
        createdAt: log.createdAt.toISOString(),
      }));
    },
  },

  Mutation: {
    adminCreateUser: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          email: string;
          password: string;
          role: Role;
          grade?: number | null;
        };
      },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      const name = args.input.name.trim();
      const email = args.input.email.trim().toLowerCase();
      const password = args.input.password;
      const role = args.input.role;
      const grade =
        args.input.grade && [10, 11, 12].includes(args.input.grade)
          ? args.input.grade
          : 10;

      if (!name || name.length < 2) {
        throw new GraphQLError('Name must be at least 2 characters long.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!email || !email.includes('@')) {
        throw new GraphQLError('Please provide a valid email address.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!password || password.length < 6) {
        throw new GraphQLError('Password must be at least 6 characters long.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const existing = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw new GraphQLError('A user with this email already exists.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await hashPassword(password);

      const newUser = await context.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          grade,
          isActive: true,
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ADMIN_USER_CREATED',
          details: `Admin ${adminUser.email} created ${newUser.role} account ${newUser.email} (Grade ${newUser.grade})`,
          userId: adminUser.id,
        },
      });

      return serializeUser(newUser);
    },

    adminUpdateUserRole: async (
      _parent: unknown,
      args: { userId: string; role: Role },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      if (args.userId === adminUser.id && args.role !== Role.ADMIN) {
        throw new GraphQLError('You cannot remove your own ADMIN role.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const target = await context.prisma.user.findUnique({
        where: { id: args.userId },
      });

      if (!target) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const updated = await context.prisma.user.update({
        where: { id: args.userId },
        data: { role: args.role },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ROLE_UPDATED',
          details: `Admin ${adminUser.email} changed role of ${updated.email} from ${target.role} to ${updated.role}`,
          userId: adminUser.id,
        },
      });

      return serializeUser(updated);
    },

    adminUpdateLearnerGrade: async (
      _parent: unknown,
      args: { userId: string; grade: number },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      if (![10, 11, 12].includes(args.grade)) {
        throw new GraphQLError('Grade must be 10, 11, or 12.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updated = await context.prisma.user.update({
        where: { id: args.userId },
        data: { grade: args.grade },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'LEARNER_GRADE_UPDATED',
          details: `Admin ${adminUser.email} updated ${updated.email} to Grade ${args.grade}`,
          userId: adminUser.id,
        },
      });

      return serializeUser(updated);
    },

    adminToggleUserStatus: async (
      _parent: unknown,
      args: { userId: string; isActive: boolean },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      if (args.userId === adminUser.id && !args.isActive) {
        throw new GraphQLError('You cannot deactivate your own admin account.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updated = await context.prisma.user.update({
        where: { id: args.userId },
        data: { isActive: args.isActive },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ACCOUNT_STATUS_CHANGED',
          details: `Admin ${adminUser.email} ${
            args.isActive ? 'activated' : 'deactivated'
          } account ${updated.email}`,
          userId: adminUser.id,
        },
      });

      return serializeUser(updated);
    },

    adminTriggerPasswordReset: async (
      _parent: unknown,
      args: { userId: string },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      const target = await context.prisma.user.findUnique({
        where: { id: args.userId },
      });

      if (!target) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.passwordResetToken.updateMany({
        where: { userId: target.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const tokenString = generateResetTokenString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await context.prisma.passwordResetToken.create({
        data: {
          token: tokenString,
          userId: target.id,
          expiresAt,
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ADMIN_RESET_TOKEN_GENERATED',
          details: `Admin ${adminUser.email} generated password reset token for ${target.email}`,
          userId: adminUser.id,
        },
      });

      return {
        success: true,
        message: `Generated password reset token for ${target.email}`,
        resetToken: tokenString,
        expiresAt: expiresAt.toISOString(),
      };
    },

    adminDeleteUser: async (
      _parent: unknown,
      args: { userId: string },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      if (args.userId === adminUser.id) {
        throw new GraphQLError('You cannot delete your own admin account.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const target = await context.prisma.user.findUnique({
        where: { id: args.userId },
      });

      if (!target) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.user.delete({
        where: { id: args.userId },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ADMIN_USER_DELETED',
          details: `Admin ${adminUser.email} deleted user ${target.email}`,
          userId: adminUser.id,
        },
      });

      return true;
    },

    adminCreateExamPaper: async (
      _parent: unknown,
      args: {
        input: {
          title: string;
          description: string;
          subject: SubjectCode;
          assessmentType?: AssessmentType | null;
          pastPaperSource?: string | null;
          grade: number;
          term: number;
          year: number;
          durationMinutes: number;
          paperFileUrl?: string | null;
          questions: Array<{
            questionNumber: number;
            topic: string;
            type: QuestionType;
            prompt: string;
            options: string[];
            correctAnswer: string;
            rubricKeywords: string[];
            explanation: string;
            marks: number;
          }>;
        };
      },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      if (![10, 11, 12].includes(args.input.grade)) {
        throw new GraphQLError('Exam paper grade must be 10, 11, or 12.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const assessmentType = args.input.assessmentType || AssessmentType.EXAM;

      if (!args.input.questions || args.input.questions.length === 0) {
        throw new GraphQLError('An assessment must contain questions.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const totalMarks = args.input.questions.reduce(
        (sum, q) => sum + (q.marks || 1),
        0
      );

      if (assessmentType === AssessmentType.EXAM) {
        if (args.input.questions.length !== 10) {
          throw new GraphQLError(
            `An Exam must have exactly 10 questions (currently ${args.input.questions.length}).`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
        if (totalMarks !== 150) {
          throw new GraphQLError(
            `An Exam must total exactly 150 marks across its 10 questions (currently ${totalMarks} marks).`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      } else if (assessmentType === AssessmentType.QUIZ) {
        if (totalMarks !== 100) {
          throw new GraphQLError(
            `A Quiz must total exactly 100 marks (currently ${totalMarks} marks).`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      }

      const createdPaper = await context.prisma.examPaper.create({
        data: {
          title: args.input.title.trim(),
          description: args.input.description.trim(),
          subject: args.input.subject,
          assessmentType,
          pastPaperSource:
            args.input.pastPaperSource?.trim() ||
            (assessmentType === AssessmentType.EXAM
              ? `DBE NSC Grade ${args.input.grade} Past Paper`
              : `Grade ${args.input.grade} Topic Revision Quiz`),
          grade: args.input.grade,
          term: args.input.term || 1,
          year: args.input.year || 2026,
          durationMinutes:
            args.input.durationMinutes ||
            (assessmentType === AssessmentType.EXAM ? 150 : 60),
          totalMarks,
          paperFileUrl: args.input.paperFileUrl || null,
          isPublished: true,
          createdById: adminUser.id,
          questions: {
            create: args.input.questions.map((q, idx) => ({
              questionNumber: q.questionNumber || idx + 1,
              topic: q.topic.trim() || 'General',
              type: q.type,
              prompt: q.prompt.trim(),
              options: q.options || [],
              correctAnswer: q.correctAnswer.trim(),
              rubricKeywords: q.rubricKeywords || [],
              explanation: q.explanation.trim(),
              marks: q.marks || (assessmentType === AssessmentType.EXAM ? 15 : 10),
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action:
            assessmentType === AssessmentType.EXAM
              ? 'EXAM_150_CREATED'
              : 'QUIZ_100_CREATED',
          details: `Admin ${adminUser.email} published Grade ${createdPaper.grade} ${
            SUBJECT_LABELS[createdPaper.subject]
          } ${assessmentType}: "${createdPaper.title}" (${createdPaper.questions.length} questions, ${totalMarks} marks)`,
          userId: adminUser.id,
        },
      });

      return serializeExamPaper(createdPaper);
    },

    adminDeleteExamPaper: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      const existing = await context.prisma.examPaper.findUnique({
        where: { id: args.id },
      });

      if (!existing) {
        throw new GraphQLError('Exam paper not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.examPaper.delete({
        where: { id: args.id },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'EXAM_PAPER_DELETED',
          details: `Admin ${adminUser.email} deleted Grade ${existing.grade} ${existing.assessmentType} "${existing.title}"`,
          userId: adminUser.id,
        },
      });

      return true;
    },

    adminReviewAttempt: async (
      _parent: unknown,
      args: {
        attemptId: string;
        teacherFeedback: string;
        adjustedScore?: number | null;
      },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      const attempt = await context.prisma.examAttempt.findUnique({
        where: { id: args.attemptId },
        include: { user: true, examPaper: true },
      });

      if (!attempt) {
        throw new GraphQLError('Exam attempt not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      let scoreEarned = attempt.scoreEarned;
      let percentage = attempt.percentage;
      let gradeSymbol = attempt.gradeSymbol;

      if (typeof args.adjustedScore === 'number' && args.adjustedScore >= 0) {
        scoreEarned = Math.min(attempt.totalMarks, args.adjustedScore);
        percentage =
          attempt.totalMarks > 0
            ? Math.round((scoreEarned / attempt.totalMarks) * 1000) / 10
            : 0;
        gradeSymbol = calculateAchievementLevel(percentage);
      }

      const updatedAttempt = await context.prisma.examAttempt.update({
        where: { id: args.attemptId },
        data: {
          teacherFeedback: args.teacherFeedback.trim(),
          scoreEarned,
          percentage,
          gradeSymbol,
        },
        include: {
          user: true,
          examPaper: true,
          answers: { include: { question: true } },
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ADMIN_ATTEMPT_REVIEWED',
          details: `Admin ${adminUser.email} reviewed ${attempt.user.name}'s attempt on "${attempt.examPaper.title}" (${percentage}%)`,
          userId: adminUser.id,
        },
      });

      return serializeExamAttempt(updatedAttempt);
    },
  },
};

export default adminResolvers;
