import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dto/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { OrderUpdatesInput } from './dto/order-update.dto';
import { TakeOrderInput, TakeOrderOutput } from './dto/take-order.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(PUB_SUB)
    private readonly pubsub: PubSub,
  ) {}

  @Mutation(() => CreateOrderOutput)
  @Role(['Any'])
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(() => GetOrdersOutput)
  @Role(['Any'])
  getOrders(
    @AuthUser() authUser: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(authUser, getOrdersInput);
  }

  @Query(() => GetOrderOutput)
  @Role(['Any'])
  getOrder(
    @AuthUser() authUser: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(authUser, getOrderInput);
  }

  @Mutation(() => EditOrderOutput)
  @Role(['Any'])
  editOrder(
    @AuthUser() authUser: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(authUser, editOrderInput);
  }

  // 주문이 들어왔을 때, 주인한테 알림
  @Subscription(() => Order, {
    filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
      return ownerId === user.id; // 레스토랑 주인 === 현재 로그인한 사람
    },
    resolve: ({ pendingOrders: { order } }) => order,
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubsub.asyncIterator(NEW_PENDING_ORDER);
  }

  // 음식이 만들어졌을 때, 배달원에게 알림
  @Subscription(() => Order)
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubsub.asyncIterator(NEW_COOKED_ORDER);
  }

  // 유저가 원하는 주문에 대한 listening
  @Subscription(() => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (
        order.driverId !== user.id &&
        order.customerId !== user.id &&
        order.restaurant.ownerId !== user.id
      ) {
        return false;
      }
      return order.id === input.id;
    },
  })
  @Role(['Any'])
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    return this.pubsub.asyncIterator(NEW_ORDER_UPDATE);
  }

  @Mutation(() => TakeOrderOutput)
  @Role(['Delivery'])
  takeOrder(
    @AuthUser() driver: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    return this.ordersService.takeOrder(driver, takeOrderInput);
  }

  // @Mutation(() => Boolean)
  // async potatoReady(@Args('potatoId') potatoId: number) {
  //   await this.pubsub.publish('hot potato', {
  //     readyPotato: potatoId,
  //   });
  //   return true;
  // }

  /**
   * filter : 입력 값에 따라서 다르게 동작시킬 수 있다. (return Boolean)
   * resolve : 사용자가 받는 update알림의 형태를 바꿔줌
   */
  // @Subscription(() => String, {
  //   filter: ({ readyPotato }, { potatoId }, context) => {
  //     return readyPotato === potatoId;
  //   },
  //   resolve: ({ readyPotato }) => `potato ${readyPotato}`,
  // })
  // @Role(['Any'])
  // readyPotato(@Args('potatoId') potatoId: number) {
  //   return this.pubsub.asyncIterator('hot potato');
  // }
}
