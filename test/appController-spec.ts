import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { CreatePaymentUseCase } from '../src/usecases/create-payment.usecase';
import { PaymentRepository } from '../src/repositories/payment.repository';
import { MercadoPagoService } from '../src/services/mercadopago.service';
import { PaymentMethod, PaymentStatus } from '../src/domain/payment.enums';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let useCase: CreatePaymentUseCase;
  let repository: PaymentRepository;
  let mercadoPagoService: MercadoPagoService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        CreatePaymentUseCase,
        {
          provide: PaymentRepository,
          useValue: {
            create: jest
              .fn()
              .mockImplementation((data) => ({ ...data, id: 'uuid-123' })),
            save: jest.fn().mockImplementation((payment) => payment),
          },
        },
        {
          provide: MercadoPagoService,
          useValue: {
            createPreference: jest.fn().mockResolvedValue({
              id: 'pref-123',
              init_point: 'https://mercadopago.com/init',
              sandbox_init_point: 'https://sandbox.mercadopago.com/init',
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    useCase = moduleFixture.get<CreatePaymentUseCase>(CreatePaymentUseCase);
    repository = moduleFixture.get<PaymentRepository>(PaymentRepository);
    mercadoPagoService =
      moduleFixture.get<MercadoPagoService>(MercadoPagoService);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('deve criar pagamento PIX com status PENDING e CPF normalizado', async () => {
    const spyCreate = jest.spyOn(repository, 'create');
    const spySave = jest.spyOn(repository, 'save');

    const dto = {
      cpf: '529.982.247-25',
      description: 'Assinatura Premium',
      amount: 100,
      paymentMethod: PaymentMethod.PIX,
    };

    const result = await useCase.execute(dto);

    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(result.cpf).toBe('52998224725');
    expect(spyCreate).toHaveBeenCalled();
    expect(spySave).toHaveBeenCalled();
  });

  it('deve criar pagamento CREDIT_CARD e gerar preferência Mercado Pago', async () => {
    const spyPreference = jest.spyOn(mercadoPagoService, 'createPreference');

    const dto = {
      cpf: '52998224725',
      description: 'Assinatura Premium',
      amount: 200,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      payerEmail: 'teste@teste.com',
    };

    const result = await useCase.execute(dto);

    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(result.mpPreferenceId).toBe('pref-123');
    expect(result.checkoutUrl).toContain('sandbox.mercadopago.com/init');
    expect(spyPreference).toHaveBeenCalled();
  });

  it('deve lançar erro se CPF for inválido', async () => {
    const dto = {
      cpf: '11111111111',
      description: 'Teste',
      amount: 50,
      paymentMethod: PaymentMethod.PIX,
    };

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('deve lançar erro se amount <= 0', async () => {
    const dto = {
      cpf: '52998224725',
      description: 'Teste',
      amount: 0,
      paymentMethod: PaymentMethod.PIX,
    };

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('deve lançar erro se método de pagamento for inválido', async () => {
    const dto = {
      cpf: '52998224725',
      description: 'Teste',
      amount: 100,
      paymentMethod: 'INVALID' as any,
    };

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
  });

  // ---- Testes e2e dos endpoints REST ----

  it('POST /api/payment deve criar pagamento PIX', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/payment')
      .send({
        cpf: '52998224725',
        description: 'Teste PIX',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe(PaymentStatus.PENDING);
    expect(response.body.cpf).toBe('52998224725');
  });

  it('POST /api/payment deve criar pagamento CREDIT_CARD e retornar checkoutUrl', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/payment')
      .send({
        cpf: '52998224725',
        description: 'Teste Cartão',
        amount: 200,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        payerEmail: 'teste@teste.com',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe(PaymentStatus.PENDING);
    expect(response.body.mpPreferenceId).toBeDefined();
    expect(response.body.checkoutUrl).toContain('mercadopago');
  });

  it('GET /api/payment/:id deve retornar pagamento existente', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/payment')
      .send({
        cpf: '52998224725',
        description: 'Teste GET',
        amount: 150,
        paymentMethod: PaymentMethod.PIX,
      });

    const id = createRes.body.id;

    const getRes = await request(app.getHttpServer())
      .get(`/api/payment/${id}`)
      .expect(200);

    expect(getRes.body.id).toBe(id);
    expect(getRes.body.description).toBe('Teste GET');
  });

  it('GET /api/payment deve listar pagamentos filtrando por CPF', async () => {
    await request(app.getHttpServer()).post('/api/payment').send({
      cpf: '52998224725',
      description: 'Teste Listagem',
      amount: 120,
      paymentMethod: PaymentMethod.PIX,
    });

    const listRes = await request(app.getHttpServer())
      .get('/api/payment?cpf=52998224725')
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
    expect(listRes.body[0].cpf).toBe('52998224725');
  });

  it('PUT /api/payment/:id deve atualizar status para PAID', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/payment')
      .send({
        cpf: '52998224725',
        description: 'Teste Update',
        amount: 180,
        paymentMethod: PaymentMethod.PIX,
      });

    const id = createRes.body.id;

    const updateRes = await request(app.getHttpServer())
      .put(`/api/payment/${id}`)
      .send({ status: PaymentStatus.PAID })
      .expect(200);

    expect(updateRes.body.id).toBe(id);
    expect(updateRes.body.status).toBe(PaymentStatus.PAID);
  });
});
