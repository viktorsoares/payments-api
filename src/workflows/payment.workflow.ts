import { proxyActivities } from '@temporalio/workflow';

export interface PaymentActivities {
  registerPayment(paymentData: any): Promise<void>;
  callMercadoPago(paymentData: any): Promise<{ id: string; status: string }>;
  waitForConfirmation(transactionId: string): Promise<{ status: string }>;
  updatePaymentStatus(transactionId: string, status: string): Promise<void>;
}

const {
  registerPayment,
  callMercadoPago,
  waitForConfirmation,
  updatePaymentStatus,
} = proxyActivities<PaymentActivities>({
  startToCloseTimeout: '1 minute',
});

export async function paymentWorkflow(paymentData: any) {
  await registerPayment(paymentData);

  const transaction = await callMercadoPago(paymentData);

  const result = await waitForConfirmation(transaction.id);

  await updatePaymentStatus(transaction.id, result.status);

  return result;
}
