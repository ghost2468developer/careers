import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { authTypeDefs } from './auth/schema.graphql';
import { authResolvers } from './auth/resolvers';

import { userTypeDefs } from './user/schema.graphql';
import { userResolvers } from './user/resolvers';

import { adminTypeDefs } from './admin/schema.graphql';
import { adminResolvers } from './admin/resolvers';

export const typeDefs = mergeTypeDefs([
  authTypeDefs,
  userTypeDefs,
  adminTypeDefs,
]);

export const resolvers = mergeResolvers([
  authResolvers,
  userResolvers,
  adminResolvers,
]);

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
