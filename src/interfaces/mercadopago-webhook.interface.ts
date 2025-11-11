export interface MercadoPagoWebhook {
  id?: string;

  type?: string;

  action?: string;

  data?: {
    id?: string;
  };
}
