import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dto/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dto/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dto/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB)
    private readonly pubsub: PubSub,
  ) {}

  canSeeOrder(user: User, order: Order): boolean {
    if (
      (user.role === UserRole.Client && order.customerId !== user.id) ||
      (user.role === UserRole.Delivery && order.driverId !== user.id) ||
      (user.role === UserRole.Owner && order.restaurant?.ownerId !== user.id)
    ) {
      return false;
    }
    return true;
  }

  canEdit(user: User, status: OrderStatus): boolean {
    if (
      user.role === UserRole.Client ||
      (user.role === UserRole.Owner &&
        status !== OrderStatus.Cooking &&
        status !== OrderStatus.Cooked) ||
      (user.role === UserRole.Delivery &&
        status !== OrderStatus.PickedUp &&
        status !== OrderStatus.Delivered)
    ) {
      return false;
    }
    return true;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) {
        return { ok: false, error: 'Order Not Found' };
      }
      if (!this.canSeeOrder(user, order)) {
        return { ok: false, error: 'You can not see that' };
      }
      return { ok: true, order };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: { customer: user, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: { driver: user, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: { owner: user },
          relations: ['orders'],
        });
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }

      return { ok: true, orders };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return { ok: false, error: 'Dish Not Found' };
        }

        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice =
                dishOption.choices &&
                dishOption.choices.find(
                  (optionChoice) => optionChoice.name === itemOption.choice,
                );
              if (dishOptionChoice && dishOptionChoice.extra) {
                dishFinalPrice += dishOptionChoice.extra;
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      await this.pubsub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return { ok: true, order };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) {
        return { ok: false, error: 'Order Not Found' };
      }
      if (!this.canSeeOrder(user, order)) {
        return { ok: false, error: 'You can not see that' };
      }
      if (!this.canEdit(user, status)) {
        return { ok: false, error: 'You can not edit this' };
      }
      const updatedOrder = await this.orders.save({ ...order, status });
      return { ok: true, order: updatedOrder };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }
}
