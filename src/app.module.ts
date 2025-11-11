import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Payment } from './domain/payment.entity';

import { PaymentRepository } from './repositories/payment.repository';
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './controllers/webhook.controller';
import { CreatePaymentUseCase } from './usecases/create-payment.usecase';
import { GetPaymentUseCase } from './usecases/get-payment.usecase';
import { ListPaymentsUseCase } from './usecases/list-payments.usecase';
import { UpdatePaymentUseCase } from './usecases/update-payment.usecase';

import { MercadoPagoService } from './services/mercadopago.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Payment],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Payment]),
    HttpModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentRepository,
    CreatePaymentUseCase,
    GetPaymentUseCase,
    ListPaymentsUseCase,
    UpdatePaymentUseCase,
    MercadoPagoService,
  ],
})
export class AppModule {}
