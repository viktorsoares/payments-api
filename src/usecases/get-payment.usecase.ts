import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';

@Injectable()
export class GetPaymentUseCase {
  constructor(private readonly repository: PaymentRepository) {}
  execute(id: string) {
    return this.repository.findById(id);
  }
}
