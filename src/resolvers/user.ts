import { User } from '../entities/User';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
  Query,
} from 'type-graphql';
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME } from '../constants';

@InputType()
class UserdataInput {
  @Field()
  username: string;
  @Field()
  phone?: string;
  @Field()
  email?: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

// Object type we can retyrn from mutations and we use inputtype for arguments
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolvers {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    // not logged in
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { _id: req.session.userId });

    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UserdataInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 3) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Length must be greater than 3',
          },
        ],
      };
    }

    if (options.password.length <= 8) {
      return {
        errors: [
          {
            field: 'password',
            message: 'Length must be greater than 8',
          },
        ],
      };
    }
    // hashing password
    const hashedPassword = await argon2.hash(options.password);
    // const user = em.create(User, {
    //   username: options.username.toLowerCase(),
    //   password: hashedPassword,
    //   email: options.email,
    //   phone: options.phone,
    // });  UNCOMMENT WHEN USING MIKROORM persistAndFlush();

    let user;
    try {
      // using query builder
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username.toLowerCase(),
          password: hashedPassword,
          email: options.email,
          phone: options.phone,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      user = result[0];
      // await em.persistAndFlush(user); // causes issues
    } catch (error) {
      if (error.code === '23505' || error.detail.includes('already exists')) {
        // duplicate username error'
        return {
          errors: [
            {
              field: 'username',
              message: 'Username already exists',
            },
          ],
        };
      }
      console.log(error.message, 'err');
    }

    // store user _id session
    // this will set a cookie on the user and keep them locked in
    req.session.userId = user._id;

    return {
      user: {
        ...user,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {
      username: username.toLowerCase(),
    });

    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'Username does not exist',
          },
        ],
      };
    }
    // hashing password
    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    req.session.userId = user._id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout( @Ctx() { req, res }: MyContext ) {
    return new Promise((resolve) =>
      req.session.destroy( ( err ) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        } else {
          resolve(true);
        }
      })
    );
  }
}
