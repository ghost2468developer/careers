import { GraphQLError } from 'graphql';
import { User } from '@prisma/client';
import { GraphQLContext } from '../../types/context';
import { hashPassword, requireAuth, verifyPassword } from '../../lib/auth';

function serializeUser(user: User) {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const userResolvers = {
  Query: {
    myProfile: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return serializeUser(user);
    },

    myAuditLogs: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      const logs = await context.prisma.auditLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { user: true },
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        userId: log.userId,
        userEmail: log.user?.email || user.email,
        userName: log.user?.name || user.name,
        createdAt: log.createdAt.toISOString(),
      }));
    },
  },

  Mutation: {
    updateProfile: async (
      _parent: unknown,
      args: { input: { name: string; avatarUrl?: string | null } },
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);
      const name = args.input.name.trim();

      if (!name || name.length < 2) {
        throw new GraphQLError('Name must be at least 2 characters long.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updated = await context.prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name,
          avatarUrl: args.input.avatarUrl?.trim() || null,
        },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'PROFILE_UPDATED',
          details: `User updated profile name to "${updated.name}"`,
          userId: currentUser.id,
        },
      });

      return serializeUser(updated);
    },

    changePassword: async (
      _parent: unknown,
      args: { input: { currentPassword: string; newPassword: string } },
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);

      const isCurrentValid = await verifyPassword(
        args.input.currentPassword,
        currentUser.passwordHash
      );

      if (!isCurrentValid) {
        throw new GraphQLError('Your current password is incorrect.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!args.input.newPassword || args.input.newPassword.length < 6) {
        throw new GraphQLError('New password must be at least 6 characters long.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await hashPassword(args.input.newPassword);

      await context.prisma.user.update({
        where: { id: currentUser.id },
        data: { passwordHash },
      });

      await context.prisma.auditLog.create({
        data: {
          action: 'PASSWORD_CHANGED',
          details: `User ${currentUser.email} changed their password`,
          userId: currentUser.id,
        },
      });

      return true;
    },
  },
};

export default userResolvers;
