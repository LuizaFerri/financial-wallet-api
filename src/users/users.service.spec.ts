import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("UsersService", () => {
  let service: UsersService;
  let repository: Repository<User>;

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

  const mockUserRepository = {
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createUserDto: CreateUserDto = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    };

    it("should create a new user successfully", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValueOnce(null);

      const result = await service.create(createUserDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: "hashed_password",
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it("should throw ConflictException when user already exists", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValueOnce(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      const result = await service.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it("should throw NotFoundException when user is not found", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValueOnce(null);
      await expect(service.findOne("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByEmail", () => {
    it("should return a user by email", async () => {
      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it("should throw NotFoundException when user is not found by email", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValueOnce(null);
      await expect(
        service.findByEmail("nonexistent@example.com"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    const updateUserDto: UpdateUserDto = {
      name: "Updated Name",
    };

    it("should update a user", async () => {
      const updatedUser = { 
        ...mockUser, 
        name: "Updated Name",
        sentTransactions: [],
        receivedTransactions: [],
      } as User;
      jest.spyOn(repository, "save").mockResolvedValueOnce(updatedUser);

      const result = await service.update(mockUser.id, updateUserDto);
      expect(result.name).toEqual(updateUserDto.name);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe("updateBalance", () => {
    it("should update user balance", async () => {
      const updatedUser = { 
        ...mockUser, 
        balance: 150,
        sentTransactions: [],
        receivedTransactions: [],
      } as User;
      jest.spyOn(repository, "save").mockResolvedValueOnce(updatedUser);

      const result = await service.updateBalance(mockUser.id, 50);
      expect(result.balance).toEqual(150);
      expect(repository.save).toHaveBeenCalled();
    });

    it("should throw BadRequestException if balance would become negative", async () => {
      const mockUpdateBalance = jest.spyOn(service, "updateBalance");
      mockUpdateBalance.mockImplementationOnce(async (userId, amount) => {
        if (amount === -150) {
          throw new BadRequestException("Saldo insuficiente para esta operação");
        }
        return mockUser;
      });

      await expect(service.updateBalance(mockUser.id, -150)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("remove", () => {
    it("should soft delete a user", async () => {
      const deactivatedUser = { 
        ...mockUser, 
        active: false,
        sentTransactions: [],
        receivedTransactions: []
      } as User;
      jest.spyOn(repository, "save").mockResolvedValueOnce(deactivatedUser);

      await service.remove(mockUser.id);
      expect(repository.save).toHaveBeenCalledWith({
        ...mockUser,
        active: false,
      });
    });
  });
});
