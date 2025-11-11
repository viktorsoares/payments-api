import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaymentStatus } from '../domain/payment.enums';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
