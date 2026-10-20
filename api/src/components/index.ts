import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { authTypeDefs } from './auth/schema.graphql';
import { authResolvers } from './auth/resolvers';

import { userTypeDefs } from './user/schema.graphql';
import { userResolvers } from './user/resolvers';

import { examTypeDefs } from './exam/schema.graphql';
import { examResolvers } from './exam/resolvers';

import { adminTypeDefs } from './admin/schema.graphql';
import { adminResolvers } from './admin/resolvers';

export const typeDefs = mergeTypeDefs([
  authTypeDefs,
  userTypeDefs,
  examTypeDefs,
  adminTypeDefs,
]);

export const resolvers = mergeResolvers([
  authResolvers,
  userResolvers,
  examResolvers,
  adminResolvers,
]);

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
