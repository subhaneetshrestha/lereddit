import { MikroORM } from '@mikro-orm/core';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolvers } from './resolvers/hello';
import { PostResolvers } from './resolvers/post';
import 'reflect-metadata';
import { UserResolvers } from './resolvers/user';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { COOKIE_NAME, __prop__ } from './constants';
import { MyContext } from './types';
import cors from 'cors';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  // runs migration when server starts
  await orm.getMigrator().up();

  const app = express();

  // redis should be above apollo since we will be using it
  // in apollo and in express the middlewares are executed in the order

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );  

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true }), // disable touch to remove TTL
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prop__, // cookie only works in https
        sameSite: 'lax', // csrf NEED TO DO RESEARCH
      },
      saveUninitialized: false,
      secret: 'sdqeocxjoiqweopasd',
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolvers, PostResolvers, UserResolvers],
      validate: false,
    }),
    // context = is a object that is accessible by all resolvers
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(8080, () => {
    console.log('server running on localhost: 4000');
  });
};

main().catch((err) => {
  console.error(err);
});
