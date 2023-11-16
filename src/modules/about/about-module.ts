import { createModule, gql } from 'graphql-modules';
import resolvers from './resolvers/resolvers';

const typeDefs = require('./schema/schema.graphql');
console.log("typeDefs", typeDefs)
export const AboutModule = createModule({
  id: 'About',
  typeDefs,
  resolvers,
});
