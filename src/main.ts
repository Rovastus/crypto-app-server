import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { schemaBuilder } from './schema/schema';
import { Decimal } from '@prisma/client/runtime/library';

const startServer = async () => {
	Decimal.set({ precision: 65, defaults: true });

	const server = new ApolloServer({ schema: schemaBuilder.toSchema() });

	const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });

	console.log(`🚀 Server listening at: ${url}`);
};

startServer();
