import { Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Mutation(() => CreateOrderOutput)
  createOrder(
    @AuthUser() customer: User,
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }
}
