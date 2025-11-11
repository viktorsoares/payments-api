import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';
import { Payment } from '../domain/payment.entity';
import { CreatePaymentUseCase } from '../usecases/create-payment.usecase';
import { GetPaymentUseCase } from '../usecases/get-payment.usecase';
import { ListPaymentsUseCase } from '../usecases/list-payments.usecase';
import { UpdatePaymentUseCase } from '../usecases/update-payment.usecase';

@Controller('api/payment')
export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly updatePaymentUseCase: UpdatePaymentUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.createPaymentUseCase.execute(dto);
  }

  @Get()
  async list(
    @Query('cpf') cpf?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ): Promise<Payment[]> {
    return this.listPaymentsUseCase.execute({ cpf, paymentMethod });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Payment | null> {
    return this.listPaymentsUseCase.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
  ): Promise<Payment | null> {
    return this.updatePaymentUseCase.execute(id, dto);
  }
}
