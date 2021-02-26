import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { OrderItemOption } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';

@InputType()
class CreateOrderIteminput {
  @Field(() => Int)
  dishId: number;

  @Field(() => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field(() => Int)
  restaurantId: number;

  @Field(() => [CreateOrderIteminput])
  items: CreateOrderIteminput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {
  @Field(() => Order)
  order?: Order;
}
