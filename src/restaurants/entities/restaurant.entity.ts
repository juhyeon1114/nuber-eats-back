import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType() // for nestjs
@Entity() // for typeorm (DB에 아래의 entity를 작성해줌)
export class Restaurant {
  @Field(() => Number) // for nestjs
  @PrimaryGeneratedColumn() // for typeorm
  id: number;

  @Field(() => String)
  @Column()
  name: string;

  // @Field(() => Boolean, { nullable: true })
  @Field(() => Boolean)
  @Column()
  isVegan?: boolean;

  @Field(() => String)
  @Column()
  address?: string;

  @Field(() => String)
  @Column()
  ownerName?: string;
}
