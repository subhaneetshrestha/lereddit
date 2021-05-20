import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';

// Field => exposes the schema to graphql

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  _id!: number;

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt: Date = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field()
  @Property({ type: 'text', unique: true })
  username!: string;

  @Field(() => Boolean)
  @Property({ type: 'boolean', default: true })
  isActive!: boolean;

  @Property({ type: 'text' })
  password!: string;

  @Field()
  @Property({ type: 'text' })
  phone!: string;

  @Field()
  @Property({ type: 'text', default: true, unique: true })
  email!: string;
}
