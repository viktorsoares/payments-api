import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';
import { PaymentMethod } from '../domain/payment.enums';

export class CreatePaymentDto {
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'CPF deve conter exatamente 11 dígitos numéricos',
  })
  cpf: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor inválido' })
  @IsPositive({ message: 'O valor deve ser positivo' })
  amount: number;

  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail do pagador inválido' })
  payerEmail?: string;
}
