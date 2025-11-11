import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../domain/payment.entity';
import { PaymentStatus } from '../domain/payment.enums';

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(
    @InjectRepository(Payment)
    private readonly ormRepo: Repository<Payment>,
  ) {}

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.ormRepo.create(data);
    return this.ormRepo.save(payment);
  }

  async save(payment: Payment): Promise<Payment> {
    return this.ormRepo.save(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.ormRepo.findOne({ where: { id } });
  }

  async findByPreferenceId(preferenceId: string): Promise<Payment | null> {
    return this.ormRepo.findOne({ where: { mpPreferenceId: preferenceId } });
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    await this.ormRepo.update(id, { status });
  }

  async findAll(filters?: {
    cpf?: string;
    paymentMethod?: string;
  }): Promise<Payment[]> {
    let results = await this.ormRepo.find();

    if (filters?.cpf) {
      results = results.filter((p) => p.cpf === filters.cpf);
    }
    if (filters?.paymentMethod) {
      results = results.filter(
        (p) => p.paymentMethod === filters.paymentMethod,
      );
    }

    return results;
  }

  markMerchantOrderPending(orderId: string, payload: any): void {
    this.logger.warn(
      `MerchantOrder ${orderId} marcado como PENDING. Payload: ${JSON.stringify(payload)}`,
    );
  }

  markMerchantOrderProcessed(orderId: string, payload: any): void {
    this.logger.log(
      `MerchantOrder ${orderId} marcado como PROCESSED. Payload: ${JSON.stringify(payload)}`,
    );
  }
}
