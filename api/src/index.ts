import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { schema } from './components';
import { prisma } from './lib/prisma';
import { getUserFromAuthHeader } from './lib/auth';
import { GraphQLContext } from './types/context';

async function bootstrap() {
  const app = express();
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '127.0.0.1';

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        database: 'postgresql_connected',
        modules: [
          'src/components/auth/{schema.graphql.ts,resolvers.ts}',
          'src/components/user/{schema.graphql.ts,resolvers.ts}',
          'src/components/exam/{schema.graphql.ts,resolvers.ts}',
          'src/components/admin/{schema.graphql.ts,resolvers.ts}',
        ],
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        database: 'disconnected',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: true,
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const authHeader = req.headers.authorization;
        const user = await getUserFromAuthHeader(authHeader);
        return {
          prisma,
          user,
        };
      },
    })
  );

  app.listen(port, host, () => {
    console.log(`🚀 GraphQL API ready at http://${host}:${port}/graphql`);
    console.log(`🩺 Health check at http://${host}:${port}/api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});
