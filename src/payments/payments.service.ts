import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
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
    private readonly schedulerRegistry: SchedulerRegistry,
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

      // 결제가 이루어지면 7일동안 프로모션 해줌
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.isPromoted = true;
      restaurant.promotedUntil = date;
      this.restaurants.save(restaurant);

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

  @Interval(1000 * 60)
  async checkPromotedRestaurants() {
    console.log('check promotion');
    // promotedUntil이 오늘보다 과거인 레스토랑들
    const restaurants = await this.restaurants.find({
      isPromoted: true,
      promotedUntil: LessThan(new Date()),
    });

    restaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurants.save(restaurant);
    });
  }

  // @Cron('30 * * * * *', { name: 'cronDate' }) // 매분 30초마다 실행
  // async cronDate() {
  //   const d = new Date();
  //   console.log(d);
  // }
  // @Interval(5 * 5000) // 5초마다 실행
  // async intervalDate() {
  //   const d = new Date();
  //   console.log(d);
  // }
  // @Timeout(5 * 1000) // 서버실행 5초 후에 1번 실행
  // async timeoutDate() {
  //   const d = new Date();
  //   console.log(d);
  // }
}
