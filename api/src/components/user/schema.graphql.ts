export const userTypeDefs = `#graphql
  type AuditLog {
    id: ID!
    action: String!
    details: String
    userId: ID
    userEmail: String
    userName: String
    createdAt: String!
  }

  input UpdateProfileInput {
    name: String!
    avatarUrl: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  extend type Query {
    myProfile: User!
    myAuditLogs: [AuditLog!]!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
  }
`;

export default userTypeDefs;
