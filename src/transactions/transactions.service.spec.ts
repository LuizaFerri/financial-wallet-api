import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource, QueryRunner } from "typeorm";
import { TransactionsService } from "./transactions.service";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "./entities/transaction.entity";
import { UsersService } from "../users/users.service";
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { CreateDepositDto } from "./dto/create-deposit.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ReverseTransactionDto } from "./dto/reverse-transaction.dto";
import { User } from "../users/entities/user.entity";

describe("TransactionsService", () => {
  let service: TransactionsService;
  let transactionRepository: Repository<Transaction>;
  let usersService: UsersService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockUser = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    name: "Test User",
    password: "hashed_password",
    balance: 100,
    active: true,
    sentTransactions: [],
    receivedTransactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockReceiverUser = {
    id: "223e4567-e89b-12d3-a456-426614174000",
    email: "receiver@example.com",
    name: "Receiver User",
    password: "hashed_password",
    balance: 50,
    active: true,
    sentTransactions: [],
    receivedTransactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTransaction = {
    id: "123e4567-e89b-12d3-a456-426614174001",
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.COMPLETED,
    amount: 50,
    description: "Test deposit",
    senderId: null,
    receiverId: mockUser.id,
    relatedTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    sender: null,
    receiver: mockUser,
  } as unknown as Transaction;

  const mockTransactionsRepository = {
    create: jest.fn().mockReturnValue(mockTransaction),
    save: jest.fn().mockResolvedValue(mockTransaction),
    find: jest.fn().mockResolvedValue([mockTransaction]),
    findOne: jest.fn().mockResolvedValue(mockTransaction),
  };

  const mockUsersService = {
    findOne: jest.fn().mockImplementation((id) => {
      if (id === mockUser.id) return Promise.resolve(mockUser);
      if (id === mockReceiverUser.id) return Promise.resolve(mockReceiverUser);
      return Promise.reject(
        new NotFoundException(`Usuário com ID ${id} não encontrado`),
      );
    }),
    updateBalance: jest.fn().mockImplementation((id, amount) => {
      if (id === mockUser.id) {
        const newBalance = mockUser.balance + amount;
        if (newBalance < 0) {
          return Promise.reject(
            new BadRequestException("Saldo insuficiente para esta operação"),
          );
        }
        return Promise.resolve({ ...mockUser, balance: newBalance });
      }
      if (id === mockReceiverUser.id) {
        const newBalance = mockReceiverUser.balance + amount;
        if (newBalance < 0) {
          return Promise.reject(
            new BadRequestException("Saldo insuficiente para esta operação"),
          );
        }
        return Promise.resolve({ ...mockReceiverUser, balance: newBalance });
      }
      return Promise.reject(
        new NotFoundException(`Usuário com ID ${id} não encontrado`),
      );
    }),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    usersService = module.get<UsersService>(UsersService);
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createDeposit", () => {
    const createDepositDto: CreateDepositDto = {
      amount: 50,
      description: "Test deposit",
    };

    it("should create a deposit successfully", async () => {
      const result = await service.createDeposit(mockUser.id, createDepositDto);

      expect(transactionRepository.create).toHaveBeenCalledWith({
        type: TransactionType.DEPOSIT,
        amount: createDepositDto.amount,
        description: createDepositDto.description,
        receiverId: mockUser.id,
      });
      expect(usersService.updateBalance).toHaveBeenCalledWith(
        mockUser.id,
        createDepositDto.amount,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it("should rollback transaction if updateBalance fails", async () => {
      jest
        .spyOn(usersService, "updateBalance")
        .mockRejectedValueOnce(new BadRequestException("Erro no depósito"));

      await expect(
        service.createDeposit(mockUser.id, createDepositDto),
      ).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe("createTransfer", () => {
    const createTransferDto: CreateTransferDto = {
      receiverId: mockReceiverUser.id,
      amount: 50,
      description: "Test transfer",
    };

    it("should create a transfer successfully", async () => {
      const result = await service.createTransfer(
        mockUser.id,
        createTransferDto,
      );

      expect(transactionRepository.create).toHaveBeenCalledWith({
        type: TransactionType.TRANSFER,
        amount: createTransferDto.amount,
        description: createTransferDto.description,
        senderId: mockUser.id,
        receiverId: mockReceiverUser.id,
      });
      expect(usersService.updateBalance).toHaveBeenCalledWith(
        mockUser.id,
        -createTransferDto.amount,
      );
      expect(usersService.updateBalance).toHaveBeenCalledWith(
        mockReceiverUser.id,
        createTransferDto.amount,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it("should not allow transfer to self", async () => {
      await expect(
        service.createTransfer(mockUser.id, {
          ...createTransferDto,
          receiverId: mockUser.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should rollback if sender has insufficient balance", async () => {
      jest
        .spyOn(usersService, "updateBalance")
        .mockRejectedValueOnce(
          new BadRequestException("Saldo insuficiente para esta operação")
        );

      await expect(
        service.createTransfer(mockUser.id, {
          ...createTransferDto,
          amount: 50,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe("reverseTransaction", () => {
    const reverseTransactionDto: ReverseTransactionDto = {
      transactionId: mockTransaction.id,
      reason: "Test reversal",
    };

    it("should reverse a deposit successfully", async () => {
      const mockDepositTransaction = {
        ...mockTransaction,
        type: TransactionType.DEPOSIT,
        relatedTransactionId: null,
      } as unknown as Transaction;

      jest
        .spyOn(transactionRepository, "findOne")
        .mockResolvedValueOnce(mockDepositTransaction);

      const mockReversalTransaction = {
        ...mockTransaction,
        id: "323e4567-e89b-12d3-a456-426614174001",
        type: TransactionType.REVERSAL,
        description: "Test reversal",
        relatedTransactionId: mockTransaction.id,
        sender: mockUser,
        receiver: mockUser,
      } as unknown as Transaction;

      jest
        .spyOn(transactionRepository, "create")
        .mockReturnValueOnce(mockReversalTransaction);
      jest
        .spyOn(transactionRepository, "save")
        .mockResolvedValueOnce(mockReversalTransaction);

      const result = await service.reverseTransaction(
        mockUser.id,
        reverseTransactionDto,
      );

      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.REVERSAL,
          amount: mockTransaction.amount,
          description: reverseTransactionDto.reason,
          relatedTransactionId: mockTransaction.id,
        }),
      );
      expect(usersService.updateBalance).toHaveBeenCalledWith(
        mockUser.id,
        -mockTransaction.amount,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockReversalTransaction);
    });

    it("should not allow reversing a transaction that is not COMPLETED", async () => {
      const mockPendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
        relatedTransactionId: null,
      } as unknown as Transaction;

      jest
        .spyOn(transactionRepository, "findOne")
        .mockResolvedValueOnce(mockPendingTransaction);

      await expect(
        service.reverseTransaction(mockUser.id, reverseTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should not allow reversing a transaction that is already reversed", async () => {
      const mockReversedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.REVERSED,
        relatedTransactionId: null,
      } as unknown as Transaction;

      jest
        .spyOn(transactionRepository, "findOne")
        .mockResolvedValueOnce(mockReversedTransaction);

      await expect(
        service.reverseTransaction(mockUser.id, reverseTransactionDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findUserTransactions", () => {
    it("should return user transactions", async () => {
      const result = await service.findUserTransactions(mockUser.id);
      expect(result).toEqual([mockTransaction]);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: [{ senderId: mockUser.id }, { receiverId: mockUser.id }],
        order: { createdAt: "DESC" },
      });
    });
  });

  describe("findOne", () => {
    it("should return a transaction by id", async () => {
      const result = await service.findOne(mockTransaction.id);
      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        relations: ["sender", "receiver"],
      });
    });

    it("should throw NotFoundException when transaction is not found", async () => {
      jest.spyOn(transactionRepository, "findOne").mockResolvedValueOnce(null);
      await expect(service.findOne("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
