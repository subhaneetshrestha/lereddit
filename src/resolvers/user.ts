import { User } from '../entities/User';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';

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
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UserdataInput,
    @Ctx() { em }: MyContext
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
    const user = em.create(User, {
      username: options.username.toLowerCase(),
      password: hashedPassword,
      email: options.email,
      phone: options.phone,
    });
    try {
      await em.persistAndFlush(user);
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
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('username') username: string,
    @Arg('password') password: string,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {
      username: username.toLowerCase(),
    });

    if (!user) {
      console.log('here');
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
    return {
      user,
    };
  }
}
