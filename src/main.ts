console.log('Hello World');
import {
    ApolloGateway, IntrospectAndCompose,
    LocalGraphQLDataSource,
    RemoteGraphQLDataSource
  } from '@apollo/gateway';
  import { ApolloServer } from '@apollo/server';
  import { expressMiddleware } from '@apollo/server/express4';
  import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
  import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
  import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
  import { buildSubgraphSchema } from '@apollo/subgraph';
  import pkg from 'body-parser';
  import cors from 'cors';
  import express from 'express';
  import { GraphQLFormattedError } from 'graphql';
  import { applyMiddleware } from 'graphql-middleware';
import { gql } from 'graphql-modules';
  import http from 'http';
  import "reflect-metadata";
  const { json } = pkg;
  import { AppModule } from './modules/app.module';
  import { buildFederatedSchema } from '@apollo/federation';
  
  // const typeDefs = require('./modules/about/schema/schema.graphql');
  
  const ENVIRONMENT = process.env.ENVIRONMENT || 'development';
  const SERVICE_LIST = {
    MM: "Local"
  };
  const port: string | number = 5444;
  
  console.log(``);
  console.log(
    `**********************************************************************************************`
  );
  console.log(
    `Starting Gateway API Server for '${ENVIRONMENT}' environment`
  );
  console.log(
    `**********************************************************************************************`
  );
  console.log(``);
  
  class AuthenticatedDataSource extends RemoteGraphQLDataSource {
    willSendRequest(_data) {
      // Check auth
      return;
    }
  }
  
  const app = express();
  
  const httpServer = http.createServer(app);
  
  // console.log("AppModule.typeDefs", typeDefs);
  // console.log("AppModule.resolvers", resolvers);
  const typeDefs = gql`
    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])
  
    type Query {
      me: User
    }
  
    type User
      @key(fields: "id") {
      id: ID!
      username: String
    }
  `;
  const resolvers = {
    Query: {
      me() {
        return { id: '1', username: '@ava' };
      },
    },
  };
//   const schema = AppModule.createSchemaForApollo();
  const subgraphSchema = buildSubgraphSchema(
    [ {
      typeDefs,
      resolvers,
    } ]
  );
//   console.log("schema", schema);
//   console.log("subgraphSchema", subgraphSchema);
//   console.log("resolvers 1", resolvers);
  const gateway = new ApolloGateway({
    // serviceList: [
  
    // ],
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        //MENTOR METHOD
        { name: 'mm', url: SERVICE_LIST.MM },
      ],
    }),
    buildService({ name, url }) {
      console.log(`implementing service: | ${name}: ${url}`);
  
      if (url === SERVICE_LIST.MM) {
        return new LocalGraphQLDataSource(
          applyMiddleware(
            buildFederatedSchema(
              {
                typeDefs: AppModule.typeDefs,
                resolvers: AppModule.resolvers,
              }
            )
            // subgraphSchema
          )
        );
      }
  
      return new AuthenticatedDataSource({ url });
    },
  
  });
  const server = new ApolloServer({
    // gateway,
    schema: AppModule.createSchemaForApollo(),
    // schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: [
      ApolloServerPluginCacheControl({
        defaultMaxAge: 0,
      }),
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageProductionDefault({
          graphRef: 'my-graph-id@my-graph-variant',
          footer: false,
        })
        : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
      ApolloServerPluginDrainHttpServer({ httpServer })
    ],
    cache: 'bounded',
    introspection: true,
    csrfPrevention: true,
    formatError: (formattedError: GraphQLFormattedError, error: any) => {
      console.log('FORMATTED ERROR -----> ', formattedError);
      console.log('ERROR -----> ', error);
      return formattedError;
    }
  });
  
  async function startServer() {
  
    await server.start();
    app.use(
      '/graphql',
      cors<cors.CorsRequest>(),
      json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          console.log("req", req.baseUrl, req.body);
          return {};
        }
      }),
    );
    await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
    console.log(``);
    console.log(``);
    console.log(`Gateway API Server ready`);
    console.log(`PORT: ${port}`);
    console.log(`ENVIRONMENT: ${ENVIRONMENT}`);
    console.log(
      `Try your health check at: /.well-known/apollo/server-health`
    );
    console.log(``);
    console.log(``);
    console.log('v12.13');
  }
  
  startServer();
  