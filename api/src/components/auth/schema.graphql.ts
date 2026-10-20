export const authTypeDefs = `#graphql
  enum Role {
    ADMIN
    USER
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    isActive: Boolean!
    avatarUrl: String
    lastLoginAt: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type ForgotPasswordPayload {
    success: Boolean!
    message: String!
    resetToken: String
    expiresAt: String
  }

  type VerifyResetTokenPayload {
    valid: Boolean!
    email: String
    expiresAt: String
    message: String
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: Role
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  type Query {
    me: User
    verifyResetToken(token: String!): VerifyResetTokenPayload!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    forgotPassword(input: ForgotPasswordInput!): ForgotPasswordPayload!
    resetPassword(input: ResetPasswordInput!): AuthPayload!
  }
`;

export default authTypeDefs;
