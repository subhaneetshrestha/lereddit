import {
  Field,
  InputType
} from 'type-graphql';


@InputType()
export class UserdataInput {
  @Field()
  username: string;
  @Field()
  phone?: string;
  @Field()
  email: string;
  @Field()
  password: string;
}
