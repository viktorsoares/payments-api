import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { Payment } from '../domain/payment.entity';

@Injectable()
export class ListPaymentsUseCase {
  constructor(private readonly repository: PaymentRepository) {}

  async execute(filters?: {
    cpf?: string;
    paymentMethod?: string;
  }): Promise<Payment[]> {
    return this.repository.findAll(filters);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.repository.findById(id);
  }
}
