import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Decimal } from '@prisma/client/runtime/library';
import { schemaBuilder } from './schema/schema';

const startServer = async () => {
  Decimal.set({ precision: 65, defaults: true });

  const server = new ApolloServer({ schema: schemaBuilder.toSchema() });

  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });

  console.log(`🚀 Server listening at: ${url}`);
};

startServer();
