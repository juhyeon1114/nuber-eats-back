import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish, DishChoice } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  choice?: string;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  // reverseSide를 명시하지 않음 : Dish에서 OrderItem에 접근할 필요가 없기 때문
  @ManyToOne(() => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field(() => [DishChoice], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishChoice[];
}
