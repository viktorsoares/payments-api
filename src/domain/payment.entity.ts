import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from './payment.enums';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 14 })
  cpf: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // Campo legado (se quiser manter), mas recomendo substituir por externalReference/mpPaymentId
  @Column({ nullable: true })
  externalId?: string;

  // Preferência (checkout) do Mercado Pago
  @Column({ nullable: true })
  mpPreferenceId?: string;

  // ID do pagamento no Mercado Pago (preenchido via webhook)
  @Column({ nullable: true })
  mpPaymentId?: string;

  // Referência externa enviada ao Mercado Pago (igual ao id interno)
  @Column({ nullable: true })
  externalReference?: string;

  // URL de checkout (sandbox_init_point ou init_point)
  @Column({ nullable: true })
  checkoutUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  payerEmail?: string;

  constructor(props?: Partial<Payment>) {
    if (props) Object.assign(this, props);
    // Garanta o vínculo se o id existir
    if (!this.externalReference && this.id) {
      this.externalReference = this.id;
    }
  }
}
