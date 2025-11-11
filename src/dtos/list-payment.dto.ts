import { IsEnum, IsOptional, Matches } from 'class-validator';
import { PaymentMethod } from '../domain/payment.enums';

export class ListPaymentDto {
  @IsOptional()
  @Matches(/^\d{11}$/, {
    message: 'CPF inválido. Deve conter exatamente 11 dígitos numéricos.',
  })
  cpf?: string;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message:
      'Método de pagamento inválido. Valores permitidos: PIX ou CREDIT_CARD.',
  })
  paymentMethod?: PaymentMethod;
}
