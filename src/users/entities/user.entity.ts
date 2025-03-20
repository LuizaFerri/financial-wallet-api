import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Transaction } from "../../transactions/entities/transaction.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.sender)
  sentTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.receiver)
  receivedTransactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
