import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { MercadoPagoService } from '../services/mercadopago.service';
import { PaymentStatus } from '../domain/payment.enums';
import { Payment } from '../domain/payment.entity';

@Controller('api/webhooks/mercadopago')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Post('notification')
  async handleNotification(@Body() body: any) {
    this.logger.log(`Webhook recebido JSON: ${JSON.stringify(body)}`);

    if (body.topic === 'payment') {
      const paymentId = body.data?.id ?? body.resource;
      if (!paymentId) {
        this.logger.warn('Webhook sem ID válido; evento ignorado.');
        return;
      }

      const mpPayment = await this.mercadoPagoService.getPaymentById(paymentId);

      let internalPayment: Payment | null = null;

      if (mpPayment.external_reference) {
        internalPayment = await this.paymentRepository.findById(
          mpPayment.external_reference,
        );
      }

      if (!internalPayment && mpPayment.preference_id) {
        internalPayment = await this.paymentRepository.findByPreferenceId(
          mpPayment.preference_id,
        );
        if (internalPayment) {
          this.logger.log(
            `Pagamento localizado via preference_id ${mpPayment.preference_id}`,
          );
        }
      }

      if (!internalPayment) {
        this.logger.warn(
          `Pagamento interno não encontrado para paymentId ${paymentId}`,
        );
        return;
      }

      if (mpPayment.status === 'approved') {
        await this.paymentRepository.updateStatus(
          internalPayment.id,
          PaymentStatus.PAID,
        );
        this.logger.log(`Pagamento ${internalPayment.id} atualizado para PAID`);
      } else if (mpPayment.status === 'rejected') {
        await this.paymentRepository.updateStatus(
          internalPayment.id,
          PaymentStatus.FAIL,
        );
        this.logger.log(`Pagamento ${internalPayment.id} atualizado para FAIL`);
      }
    }

    if (body.topic === 'merchant_order') {
      const resourceUrl = body.resource;
      const orderId = resourceUrl?.split('/').pop();

      if (!orderId) {
        this.logger.warn('Webhook merchant_order sem ID válido.');
        return;
      }

      const merchantOrder =
        await this.mercadoPagoService.getMerchantOrderById(orderId);

      if (!merchantOrder.payments || merchantOrder.payments.length === 0) {
        this.logger.warn(
          `merchant_order ${orderId} sem payments[]; agendando rechecagem curta.`,
        );
        this.paymentRepository.markMerchantOrderPending(orderId, merchantOrder);
        return;
      }

      const approvedPayment = merchantOrder.payments.find(
        (p: any) => p.status === 'approved',
      );

      if (approvedPayment) {
        let internalPayment: Payment | null = null;

        if (approvedPayment.external_reference) {
          internalPayment = await this.paymentRepository.findById(
            approvedPayment.external_reference,
          );
        }

        if (!internalPayment && merchantOrder.preference_id) {
          internalPayment = await this.paymentRepository.findByPreferenceId(
            merchantOrder.preference_id,
          );
          if (internalPayment) {
            this.logger.log(
              `Pagamento localizado via preference_id ${merchantOrder.preference_id}`,
            );
          }
        }

        if (internalPayment) {
          await this.paymentRepository.updateStatus(
            internalPayment.id,
            PaymentStatus.PAID,
          );
          this.logger.log(
            `Pagamento ${internalPayment.id} atualizado para PAID via merchant_order`,
          );
        } else {
          this.logger.warn(
            `Não foi possível localizar pagamento interno para merchant_order ${orderId}`,
          );
        }
      }

      this.paymentRepository.markMerchantOrderProcessed(orderId, merchantOrder);
    }
  }
}
