# Payments API

API desenvolvida em NestJS para gerenciamento de pagamentos integrada ao Mercado Pago e ao Temporal para orquestração de workflows assíncronos.  
O projeto segue uma arquitetura organizada com controllers, use cases, repositories e services, garantindo escalabilidade e separação de responsabilidades.

---

## Tecnologias utilizadas
- NestJS — framework Node.js
- TypeORM — ORM para banco de dados
- PostgreSQL — banco relacional
- Axios — requisições HTTP
- Mercado Pago API — integração de pagamentos
- Temporal — orquestração de workflows e atividades assíncronas
- Jest — testes unitários e de integração
- Ngrok — exposição de endpoints locais para testes de webhooks
- Docker Compose — gerenciamento de containers (Postgres, Temporal, Worker)

---

## Estrutura do projeto
```
payments-api/
├── src/
│   ├── activities/
│   │   └── paymentActivities.ts
│   ├── controllers/
│   │   ├── payment.controller.ts
│   │   ├── webhook.controller.ts
│   │   └── mercadopago-return.controller.ts
│   ├── domain/
│   │   ├── payment.entity.ts
│   │   └── payment.enums.ts
│   ├── dtos/
│   │   ├── create-payment.dto.ts
│   │   ├── update-payment.dto.ts
│   │   └── list-payment.dto.ts
│   ├── interfaces/
│   │   ├── mercadopago-webhook.interface.ts
│   │   ├── mercadopago.types.ts
│   │   └── preference-responsive.interface.ts
│   ├── lib/
│   │   └── temporalClient.ts
│   ├── repositories/
│   │   └── payment.repository.ts
│   ├── services/
│   │   └── mercadopago.service.ts
│   ├── usecases/
│   │   ├── create-payment.usecase.ts
│   │   ├── get-payment.usecase.ts
│   │   ├── list-payments.usecase.ts
│   │   └── update-payment.usecase.ts
│   ├── workflows/
│   │   └── payment.workflow.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── infra/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── Dockerfile.worker
├── tests/
│   ├── app.e2e-spec.ts
│   ├── appController-spec.ts
│   └── create-payment.usecase-spec.ts
├── worker/
│   └── index.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

---

## Configuração

Crie um arquivo `.env` com as variáveis necessárias:

```env
DATABASE_URL=postgres://user:password@localhost:5432/payments
MERCADO_PAGO_ACCESS_TOKEN=seu_token
MERCADO_PAGO_SUCCESS_URL=http://localhost:3000/api/webhooks/mercadopago/success
MERCADO_PAGO_FAILURE_URL=http://localhost:3000/api/webhooks/mercadopago/failure
MERCADO_PAGO_PENDING_URL=http://localhost:3000/api/webhooks/mercadopago/pending
MERCADO_PAGO_NOTIFICATION_URL=https://SEU-ENDERECO-NGROK/api/webhooks/mercadopago/notification
```

> Observação: o ngrok é utilizado para expor o servidor local e permitir que o Mercado Pago envie notificações de webhook.  
> Substitua **SEU-ENDERECO-NGROK** pelo endereço gerado pelo ngrok.

---

## Endpoints principais

### PaymentController (`/api/payment`)
- `POST /api/payment` — cria pagamento
- `GET /api/payment` — lista pagamentos (filtros: cpf, paymentMethod)
- `GET /api/payment/:id` — busca pagamento por ID
- `PUT /api/payment/:id` — atualiza pagamento

### WebhookController (`/api/webhooks/mercadopago`)
- `POST /notification` — recebe notificações do Mercado Pago (pagamentos e merchant_order)

---

## Fluxo de pagamento

1. O cliente cria um pagamento via `POST /api/payment`.  
2. Se for **PIX**, o status inicial é `PENDING`.  
3. Se for **cartão de crédito**, é criada uma **preference** no Mercado Pago e retornada a `checkoutUrl`.  
4. O Mercado Pago envia notificações para `/api/webhooks/mercadopago/notification` (via **ngrok**).  
5. A API atualiza o status interno (`PAID`, `FAIL`, `PENDING`) conforme o retorno.  
6. O **Temporal Worker** processa workflows de pagamento, garantindo resiliência e reprocessamento automático em caso de falhas.  
7. Logs e execução podem ser acompanhados via **Temporal Web UI** (`http://localhost:8233`).  

---
