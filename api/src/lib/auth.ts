import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { GraphQLError } from 'graphql';
import { Role, User } from '@prisma/client';
import { GraphQLContext } from '../types/context';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'arena-fullstack-rbac-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateResetTokenString(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function getUserFromAuthHeader(authHeader?: string): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const decoded = verifyJwtToken(token);
  if (!decoded?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export function requireAuth(context: GraphQLContext): User {
  if (!context.user) {
    throw new GraphQLError('Authentication required. Please log in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (!context.user.isActive) {
    throw new GraphQLError('Your account has been deactivated. Please contact an administrator.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return context.user;
}

export function requireAdmin(context: GraphQLContext): User {
  const user = requireAuth(context);
  if (user.role !== Role.ADMIN) {
    throw new GraphQLError('Access denied. Administrator role required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}
