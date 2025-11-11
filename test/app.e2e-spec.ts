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
});
