import { GraphQLError } from 'graphql';
import { Prisma, Role, User } from '@prisma/client';
import { GraphQLContext } from '../../types/context';
import {
  generateResetTokenString,
  hashPassword,
  requireAdmin,
} from '../../lib/auth';

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
      ]);

      return {
        totalUsers,
        adminCount,
        userCount,
        activeUsers,
        inactiveUsers,
        activeResetTokens,
        totalAuditEvents,
      };
    },

    adminUsers: async (
      _parent: unknown,
      args: { search?: string | null; role?: Role | null; isActive?: boolean | null },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const where: Prisma.UserWhereInput = {};

      if (args.role) {
        where.role = args.role;
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
        orderBy: { createdAt: 'desc' },
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
        };
      },
      context: GraphQLContext
    ) => {
      const adminUser = requireAdmin(context);

      const name = args.input.name.trim();
      const email = args.input.email.trim().toLowerCase();
      const password = args.input.password;
      const role = args.input.role;

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
          isActive: true,
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'ADMIN_USER_CREATED',
          details: `Admin ${adminUser.email} created user ${newUser.email} with role ${newUser.role}`,
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
  },
};

export default adminResolvers;
