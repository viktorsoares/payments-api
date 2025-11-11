// src/controllers/mercadopago-return.controller.ts
import { Controller, Get, Query, Logger } from '@nestjs/common';

@Controller('api/webhooks/mercadopago')
export class MercadoPagoReturnController {
  private readonly logger = new Logger(MercadoPagoReturnController.name);

  @Get('success')
  success(@Query() query: any) {
    this.logger.log('Pagamento aprovado! Query: ' + JSON.stringify(query));
    return { ok: true, message: 'Pagamento aprovado com sucesso', query };
  }

  @Get('failure')
  failure(@Query() query: any) {
    this.logger.warn('Pagamento falhou. Query: ' + JSON.stringify(query));
    return { ok: false, message: 'Pagamento falhou', query };
  }

  @Get('pending')
  pending(@Query() query: any) {
    this.logger.log('Pagamento pendente. Query: ' + JSON.stringify(query));
    return { ok: true, message: 'Pagamento pendente', query };
  }
}
