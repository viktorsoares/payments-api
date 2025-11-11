import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentStatus, PaymentMethod } from '../domain/payment.enums';
import {
  MercadoPagoService,
  MercadoPagoPreference,
} from '../services/mercadopago.service';
import { Payment } from '../domain/payment.entity';

@Injectable()
export class CreatePaymentUseCase {
  private readonly logger = new Logger(CreatePaymentUseCase.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async execute(dto: CreatePaymentDto): Promise<Payment> {
    const normalizedCpf = dto.cpf.replace(/[^\d]/g, '');
    if (normalizedCpf.length !== 11) {
      throw new BadRequestException(
        'CPF deve conter exatamente 11 dígitos numéricos',
      );
    }

    if (!this.isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('O valor deve ser maior que 0');
    }

    const payment = await this.paymentRepository.create({
      ...dto,
      cpf: normalizedCpf,
      status: PaymentStatus.PENDING,
    });

    payment.externalReference = payment.id;
    await this.paymentRepository.save(payment);

    // Fluxo PIX
    if (dto.paymentMethod === PaymentMethod.PIX) {
      this.logger.log(
        `Pagamento PIX criado com id interno ${payment.id}, status PENDING`,
      );
      return payment;
    }

    // Fluxo Cartão de Crédito
    if (dto.paymentMethod === PaymentMethod.CREDIT_CARD) {
      const preference: MercadoPagoPreference =
        await this.mercadoPagoService.createPreference({
          id: payment.externalReference,
          description: dto.description.trim(),
          amount: dto.amount,
          cpf: normalizedCpf,
          payerEmail: dto.payerEmail,
        });

      payment.mpPreferenceId = preference.id;
      payment.checkoutUrl =
        preference.sandbox_init_point ?? preference.init_point;
      (payment as any).initPoint = preference.init_point;

      await this.paymentRepository.save(payment);

      this.logger.log(
        `Preferência criada para pagamento ${payment.id}: ${payment.mpPreferenceId} (checkout: ${payment.checkoutUrl})`,
      );

      return payment;
    }

    throw new BadRequestException('Método de pagamento inválido.');
  }

  private isValidCpf(cpf: string): boolean {
    if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    const calcCheckDigit = (base: string, factorStart: number) => {
      let sum = 0;
      for (let i = 0; i < base.length; i++) {
        sum += parseInt(base[i], 10) * (factorStart - i);
      }
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };

    const d1 = calcCheckDigit(cpf.slice(0, 9), 10);
    const d2 = calcCheckDigit(cpf.slice(0, 10), 11);

    return d1 === parseInt(cpf[9], 10) && d2 === parseInt(cpf[10], 10);
  }
}
