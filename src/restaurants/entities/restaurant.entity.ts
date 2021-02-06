import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// @InputType({ isAbstract: true }) // 다른 곳에서 InputType으로 Restaurant를 가져다 쓸 수 있고, isAbstract가 true이기 때문에 DB에는 영향을 주진 않는다
@ObjectType() // for nestjs
@Entity() // for typeorm (DB에 아래의 entity를 작성해줌)
export class Restaurant {
  @Field(() => Number) // for nestjs
  @PrimaryGeneratedColumn() // for typeorm
  id: number;

  @Field(() => String)
  @Column()
  @IsString()
  @Length(5, 20)
  name: string;

  // @Field(() => Boolean, { nullable: true })
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @Column({ default: true })
  @IsOptional() // 값이 없으면 validate하지 않음. 즉, 해당 필드를 보내거나 보내지 않을 수 있음을 의미함
  @IsBoolean()
  isVegan: boolean;

  @Field(() => String)
  @Column()
  @IsString()
  address: string;

  @Field(() => String)
  @Column()
  @IsString()
  ownerName: string;
}
