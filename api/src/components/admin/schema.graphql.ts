export const adminTypeDefs = `#graphql
  type AdminStats {
    totalUsers: Int!
    adminCount: Int!
    userCount: Int!
    activeUsers: Int!
    inactiveUsers: Int!
    activeResetTokens: Int!
    totalAuditEvents: Int!
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
  }

  extend type Query {
    adminStats: AdminStats!
    adminUsers(search: String, role: Role, isActive: Boolean): [User!]!
    adminUser(id: ID!): User
    adminResetTokens: [PasswordResetTokenInfo!]!
    adminAuditLogs(limit: Int): [AuditLog!]!
  }

  extend type Mutation {
    adminCreateUser(input: AdminCreateUserInput!): User!
    adminUpdateUserRole(userId: ID!, role: Role!): User!
    adminToggleUserStatus(userId: ID!, isActive: Boolean!): User!
    adminTriggerPasswordReset(userId: ID!): ForgotPasswordPayload!
    adminDeleteUser(userId: ID!): Boolean!
  }
`;

export default adminTypeDefs;
