import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
  ) {}

  async createOrder(
    customer: User,
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }
}
