export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
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

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  activeUsers: number;
  inactiveUsers: number;
  activeResetTokens: number;
  totalAuditEvents: number;
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

// ==========================================
// GraphQL Queries & Mutations by Component
// ==========================================

export const AUTH_OPERATIONS = {
  ME: `#graphql
    query Me {
      me {
        id
        email
        name
        role
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

export const ADMIN_OPERATIONS = {
  ADMIN_DASHBOARD: `#graphql
    query AdminDashboard($search: String, $role: Role, $isActive: Boolean) {
      adminStats {
        totalUsers
        adminCount
        userCount
        activeUsers
        inactiveUsers
        activeResetTokens
        totalAuditEvents
      }
      adminUsers(search: $search, role: $role, isActive: $isActive) {
        id
        email
        name
        role
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
};
