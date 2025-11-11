export interface MercadoPagoWebhookBody {
  topic: 'payment' | 'merchant_order';
  resource?: string;
  data?: { id?: string };
}

export interface MercadoPagoPaymentResponse {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
  external_reference?: string;
  preference_id?: string;
}

export interface MercadoPagoMerchantOrderResponse {
  id: string;
  preference_id?: string;
  payments: {
    id: string;
    status: 'approved' | 'rejected' | 'pending';
    external_reference?: string;
  }[];
}
