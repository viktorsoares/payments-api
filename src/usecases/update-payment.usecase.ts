import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';
import { Payment } from '../domain/payment.entity';
import { PaymentStatus } from '../domain/payment.enums';

@Injectable()
export class UpdatePaymentUseCase {
  constructor(private readonly repository: PaymentRepository) {}

  async execute(id: string, dto: UpdatePaymentDto): Promise<Payment | null> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new BadRequestException(`Pagamento com id ${id} não encontrado`);
    }

    if (dto.status) {
      const validStatuses = Object.values(PaymentStatus);
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Status inválido. Valores permitidos: ${validStatuses.join(', ')}`,
        );
      }
      payment.status = dto.status;
    }

    if (dto.description) {
      if (dto.description.trim().length < 3) {
        throw new BadRequestException(
          'Descrição deve ter pelo menos 3 caracteres',
        );
      }
      payment.description = dto.description.trim();
    }

    return this.repository.save(payment);
  }
}
