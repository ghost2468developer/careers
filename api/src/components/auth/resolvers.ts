import { GraphQLError } from 'graphql';
import { Role, User } from '@prisma/client';
import { GraphQLContext } from '../../types/context';
import {
  generateResetTokenString,
  hashPassword,
  signJwtToken,
  verifyPassword,
} from '../../lib/auth';

function serializeUser(user: User) {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) return null;
      return serializeUser(context.user);
    },

    verifyResetToken: async (
      _parent: unknown,
      args: { token: string },
      context: GraphQLContext
    ) => {
      const record = await context.prisma.passwordResetToken.findUnique({
        where: { token: args.token.trim() },
        include: { user: true },
      });

      if (!record) {
        return {
          valid: false,
          email: null,
          expiresAt: null,
          message: 'Invalid password reset token.',
        };
      }

      if (record.usedAt) {
        return {
          valid: false,
          email: record.user.email,
          expiresAt: record.expiresAt.toISOString(),
          message: 'This password reset token has already been used.',
        };
      }

      if (record.expiresAt.getTime() < Date.now()) {
        return {
          valid: false,
          email: record.user.email,
          expiresAt: record.expiresAt.toISOString(),
          message: 'This password reset token has expired.',
        };
      }

      return {
        valid: true,
        email: record.user.email,
        expiresAt: record.expiresAt.toISOString(),
        message: 'Token is valid.',
      };
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          email: string;
          password: string;
          role?: Role;
          grade?: number;
        };
      },
      context: GraphQLContext
    ) => {
      const name = args.input.name.trim();
      const email = args.input.email.trim().toLowerCase();
      const password = args.input.password;
      const role = args.input.role || Role.USER;
      const grade = [10, 11, 12].includes(Number(args.input.grade))
        ? Number(args.input.grade)
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
        throw new GraphQLError('An account with this email already exists.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await hashPassword(password);

      const user = await context.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          grade,
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'USER_REGISTERED',
          details: `Learner/User registered: ${user.email} (Role: ${user.role}, Grade ${user.grade})`,
          userId: user.id,
        },
      });

      const token = signJwtToken(user);

      return {
        token,
        user: serializeUser(user),
      };
    },

    login: async (
      _parent: unknown,
      args: { input: { email: string; password: string } },
      context: GraphQLContext
    ) => {
      const email = args.input.email.trim().toLowerCase();
      const password = args.input.password;

      const user = await context.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new GraphQLError('Invalid email or password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!user.isActive) {
        throw new GraphQLError(
          'Your account has been deactivated by an administrator.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        throw new GraphQLError('Invalid email or password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const updatedUser = await context.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'USER_LOGIN',
          details: `User ${updatedUser.email} (${updatedUser.role}, Grade ${updatedUser.grade}) signed in`,
          userId: updatedUser.id,
        },
      });

      const token = signJwtToken(updatedUser);

      return {
        token,
        user: serializeUser(updatedUser),
      };
    },

    forgotPassword: async (
      _parent: unknown,
      args: { input: { email: string } },
      context: GraphQLContext
    ) => {
      const email = args.input.email.trim().toLowerCase();

      const user = await context.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new GraphQLError('No account found with that email address.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      const tokenString = generateResetTokenString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await context.prisma.passwordResetToken.create({
        data: {
          token: tokenString,
          userId: user.id,
          expiresAt,
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_REQUESTED',
          details: `Password reset token generated for ${user.email}`,
          userId: user.id,
        },
      });

      return {
        success: true,
        message: `Password reset token generated for ${user.email}. Token expires in 60 minutes.`,
        resetToken: tokenString,
        expiresAt: expiresAt.toISOString(),
      };
    },

    resetPassword: async (
      _parent: unknown,
      args: { input: { token: string; newPassword: string } },
      context: GraphQLContext
    ) => {
      const tokenString = args.input.token.trim();
      const newPassword = args.input.newPassword;

      if (!newPassword || newPassword.length < 6) {
        throw new GraphQLError('New password must be at least 6 characters long.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const tokenRecord = await context.prisma.passwordResetToken.findUnique({
        where: { token: tokenString },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new GraphQLError('Invalid password reset token.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (tokenRecord.usedAt) {
        throw new GraphQLError('This password reset token has already been used.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (tokenRecord.expiresAt.getTime() < Date.now()) {
        throw new GraphQLError('This password reset token has expired.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await hashPassword(newPassword);

      const [updatedUser] = await context.prisma.$transaction([
        context.prisma.user.update({
          where: { id: tokenRecord.userId },
          data: {
            passwordHash,
            lastLoginAt: new Date(),
          },
        }),
        context.prisma.passwordResetToken.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        }),
        context.prisma.auditLog.create({
          data: {
            action: 'PASSWORD_RESET_COMPLETED',
            details: `Password successfully reset for ${tokenRecord.user.email}`,
            userId: tokenRecord.userId,
          },
        }),
      ]);

      const jwtToken = signJwtToken(updatedUser);

      return {
        token: jwtToken,
        user: serializeUser(updatedUser),
      };
    },
  },
};

export default authResolvers;
