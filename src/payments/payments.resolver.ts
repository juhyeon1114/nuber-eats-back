import { Mutation, Resolver } from '@nestjs/graphql';
import { Payment } from './entity/payment.entity';
import { PaymentsService } from './payments.service';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}
}
