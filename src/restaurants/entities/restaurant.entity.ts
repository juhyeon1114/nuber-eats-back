import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true }) // 다른 곳에서 InputType으로 Restaurant를 가져다 쓸 수 있고, isAbstract가 true이기 때문에 DB에는 영향을 주진 않는다
@ObjectType() // for nestjs
@Entity() // for typeorm (DB에 아래의 entity를 작성해줌)
export class Restaurant extends CoreEntity {
  @Field(() => String) // for nestjs
  @Column() // for typeorm
  @IsString()
  @Length(3)
  name: string;

  // // @Field(() => Boolean, { nullable: true })
  // @Field(() => Boolean, { nullable: true, defaultValue: true })
  // @Column({ default: true })
  // @IsOptional() // 값이 없으면 validate하지 않음. 즉, 해당 필드를 보내거나 보내지 않을 수 있음을 의미함
  // @IsBoolean()
  // isVegan: boolean;

  @Field(() => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field(() => String)
  @Column()
  @IsString()
  address: string;

  //category : restaurant = 1 : n
  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL', // category가 지워지면 categoryId를 null로 만들기
  })
  category: Category;

  //user : restaurant = 1 : n
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurants, {
    onDelete: 'CASCADE', // user가 지워지면 restaurant도 지우기
  })
  owner: User;

  // ownerId는 owner의 id를 갖는다.
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(() => [Dish])
  @OneToMany(() => Dish, (dish) => dish.restaurant)
  menu: Dish;
}
