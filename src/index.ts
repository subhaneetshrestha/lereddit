import { MikroORM } from '@mikro-orm/core';
import { Post } from './entities/Post';
import microConfig from './mikro-orm.config'
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolvers } from './resolvers/hello';
import { PostResolvers } from './resolvers/post';
import 'reflect-metadata';

const main = async () => {
  const orm = await MikroORM.init( microConfig );
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer( {
    schema: await buildSchema( {
      resolvers: [HelloResolvers, PostResolvers],
      validate: false,
    } ),
    // context = is a object that is accessible by all resolvers
    context: () => ({ em: orm.em })
  } );
  
  apolloServer.applyMiddleware( { app } );

  app.listen( 8080, () => {
    console.log( 'server running on localhost: 4000' );
  })
};

main().catch( ( err ) => {
  console.error(err);
})
