import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import schema from './schema'
import { createContext } from './context'

const PORT = 4000

const app = express()
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
const server = new ApolloServer({
  schema,
  context: createContext(),
})
server.applyMiddleware({ app, path: '/graphql' })
app.listen(PORT, () => {
  console.log(
    `\n🚀      GraphQL is now running on http://localhost:${PORT}/graphql`,
  )
})
