export function registerPayment(paymentData: any) {
  console.log('Registrando pagamento como PENDING', paymentData);
}

export function callMercadoPago(paymentData: any) {
  console.log('Chamando Mercado Pago para', paymentData.userId);
  return { id: '123', status: 'in_process' };
}

export function waitForConfirmation(transactionId: string) {
  console.log(`Aguardando confirmação da transação ${transactionId}`);
  return { status: 'PAID' };
}

export function updatePaymentStatus(transactionId: string, status: string) {
  console.log(`Atualizando pagamento ${transactionId} para ${status}`);
}
