import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "./entities/transaction.entity";
import { UsersService } from "../users/users.service";
import { CreateDepositDto } from "./dto/create-deposit.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ReverseTransactionDto } from "./dto/reverse-transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async createDeposit(
    userId: string,
    createDepositDto: CreateDepositDto,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const deposit = this.transactionsRepository.create({
        type: TransactionType.DEPOSIT,
        amount: createDepositDto.amount,
        description: createDepositDto.description,
        receiverId: userId,
      });

      const savedDeposit = await this.transactionsRepository.save(deposit);

      await this.usersService.updateBalance(userId, createDepositDto.amount);

      savedDeposit.status = TransactionStatus.COMPLETED;
      await this.transactionsRepository.save(savedDeposit);

      await queryRunner.commitTransaction();

      return savedDeposit;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException("Não foi possível processar o depósito");
    } finally {
      await queryRunner.release();
    }
  }

  async createTransfer(
    senderId: string,
    createTransferDto: CreateTransferDto,
  ): Promise<Transaction> {
    if (senderId === createTransferDto.receiverId) {
      throw new BadRequestException("Não é possível transferir para si mesmo");
    }

    const receiver = await this.usersService.findOne(
      createTransferDto.receiverId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sender = await this.usersService.findOne(senderId);
      if (sender.balance < createTransferDto.amount) {
        throw new BadRequestException(
          "Saldo insuficiente para esta transferência",
        );
      }

      const transfer = this.transactionsRepository.create({
        type: TransactionType.TRANSFER,
        amount: createTransferDto.amount,
        description: createTransferDto.description,
        senderId,
        receiverId: createTransferDto.receiverId,
      });

      const savedTransfer = await this.transactionsRepository.save(transfer);

      await this.usersService.updateBalance(
        senderId,
        -createTransferDto.amount,
      );

      await this.usersService.updateBalance(
        createTransferDto.receiverId,
        createTransferDto.amount,
      );

      savedTransfer.status = TransactionStatus.COMPLETED;
      await this.transactionsRepository.save(savedTransfer);

      await queryRunner.commitTransaction();

      return savedTransfer;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        "Não foi possível processar a transferência",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async reverseTransaction(
    userId: string,
    reverseTransactionDto: ReverseTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: reverseTransactionDto.transactionId },
      relations: ["sender", "receiver"],
    });

    if (!transaction) {
      throw new NotFoundException("Transação não encontrada");
    }

    if (transaction.status === TransactionStatus.REVERSED) {
      throw new ConflictException("Transação já foi revertida");
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        "Apenas transações concluídas podem ser revertidas",
      );
    }

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new BadRequestException(
        "Você não tem permissão para reverter esta transação",
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reversal = this.transactionsRepository.create({
        type: TransactionType.REVERSAL,
        amount: transaction.amount,
        description:
          reverseTransactionDto.reason ||
          `Reversão da transação ${transaction.id}`,
        senderId: transaction.receiverId,
        receiverId: transaction.senderId,
        relatedTransactionId: transaction.id,
      });

      const savedReversal = await this.transactionsRepository.save(reversal);

      if (transaction.type === TransactionType.TRANSFER) {
        if (transaction.senderId) {
          await this.usersService.updateBalance(
            transaction.senderId,
            transaction.amount,
          );
        }

        if (transaction.receiverId) {
          await this.usersService.updateBalance(
            transaction.receiverId,
            -transaction.amount,
          );
        }
      }
      else if (transaction.type === TransactionType.DEPOSIT) {
        await this.usersService.updateBalance(
          transaction.receiverId,
          -transaction.amount,
        );
      }

      transaction.status = TransactionStatus.REVERSED;
      await this.transactionsRepository.save(transaction);

      savedReversal.status = TransactionStatus.COMPLETED;
      await this.transactionsRepository.save(savedReversal);

      await queryRunner.commitTransaction();

      return savedReversal;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        "Não foi possível processar a reversão da transação",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ["sender", "receiver"],
    });

    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada`);
    }

    return transaction;
  }
}
