import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ActivityAttendance } from '~/entity/ActivityAttendance';
import { Currency } from '~/entity/Currency';
import { OrderProductFile } from '~/entity/OrderProductFile';
import { Product } from '~/entity/Product';

import { OrderLog } from './order_log.entity';

@Index('order_product_ended_at_desc', ['endedAt'], {})
@Index('order_product_pkey', ['id'], { unique: true })
@Index('order_product_order_id_name_product_id_key', ['name', 'orderId', 'productId'], { unique: true })
@Index('order_product_started_at_desc_nulls_first_index', ['startedAt'], {})
@Entity('order_product', { schema: 'public' })
export class OrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'order_id' })
  orderId: string;

  @Column('text', { name: 'product_id', unique: true })
  productId: string;

  @Column('text', { name: 'name', unique: true })
  name: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('numeric', { name: 'price' })
  price: number;

  @Column('timestamp with time zone', { name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column('timestamp with time zone', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('boolean', { name: 'auto_renewed', default: () => false })
  autoRenewed: boolean;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('integer', {
    name: 'accumulated_errors',
    nullable: true,
    default: () => 0,
  })
  accumulatedErrors: number | null;

  @Column('jsonb', { name: 'deliverables', nullable: true })
  deliverables: object | null;

  @Column('jsonb', { name: 'options', nullable: true })
  options: any | null;

  @Column('timestamp with time zone', {
    name: 'updated_at',
    nullable: true,
    default: () => 'now()',
  })
  updatedAt: Date | null;

  @Column('timestamp without time zone', {
    name: 'delivered_at',
    nullable: true,
  })
  deliveredAt: Date | null;

  @OneToMany(() => ActivityAttendance, (activityAttendance) => activityAttendance.orderProduct)
  activityAttendances: ActivityAttendance[];

  @ManyToOne(() => Currency, (currency) => currency.orderProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'currency_id', referencedColumnName: 'id' }])
  currency: Currency;

  @ManyToOne(() => OrderLog, (orderLog) => orderLog.orderProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'order_id', referencedColumnName: 'id' }])
  order: OrderLog;

  @ManyToOne(() => Product, (product) => product.orderProducts, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'product_id', referencedColumnName: 'id' }])
  product: Product;

  @OneToMany(() => OrderProductFile, (orderProductFile) => orderProductFile.orderProduct)
  orderProductFiles: OrderProductFile[];
}
