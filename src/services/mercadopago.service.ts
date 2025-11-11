// src/services/mercadopago.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  external_reference?: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = 'https://api.mercadopago.com';
  private readonly accessToken =
    process.env.MERCADO_PAGO_ACCESS_TOKEN_SANDBOX ??
    process.env.MERCADO_PAGO_ACCESS_TOKEN ??
    process.env.MERCADOPAGO_ACCESS_TOKEN;

  private get authHeader() {
    if (!this.accessToken) {
      throw new Error('Configure MERCADO_PAGO_ACCESS_TOKEN no .env');
    }
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  async createPreference(payment: {
    id: string;
    description: string;
    amount: number;
    cpf: string;
    payerEmail?: string;
  }): Promise<MercadoPagoPreference> {
    const body = {
      items: [
        {
          id: payment.id,
          title: payment.description,
          quantity: 1,
          unit_price: payment.amount,
          currency_id: 'BRL',
        },
      ],
      external_reference: payment.id,
      payer: {
        email: payment.payerEmail,
        identification: { type: 'CPF', number: payment.cpf },
      },
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }],
        installments: 12,
      },
      back_urls: {
        success: process.env.MERCADO_PAGO_SUCCESS_URL,
        failure: process.env.MERCADO_PAGO_FAILURE_URL,
        pending: process.env.MERCADO_PAGO_PENDING_URL,
      },
      auto_return: 'approved',
      notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL,
    };

    const { data } = await axios.post<MercadoPagoPreference>(
      `${this.baseUrl}/checkout/preferences`,
      body,
      { headers: { ...this.authHeader } },
    );
    this.logger.log(`Preferência criada: ${data.id}`);
    return data;
  }

  async getPaymentById(paymentId: string): Promise<any> {
    const { data } = await axios.get(
      `${this.baseUrl}/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { ...this.authHeader } },
    );
    return data;
  }

  async getMerchantOrderById(orderId: string): Promise<any> {
    const { data } = await axios.get(
      `${this.baseUrl}/merchant_orders/${encodeURIComponent(orderId)}`,
      { headers: { ...this.authHeader } },
    );
    return data;
  }
}
