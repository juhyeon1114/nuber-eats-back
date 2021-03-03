import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dto/create-payment.dto';
import { GetPaymentsOutput } from './dto/get-payments.dto';
import { Payment } from './entity/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }
      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'You are not allowed to do this' };
      }

      const payment = await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      return { ok: true, payment };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: owner });
      return { ok: true, payments };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
