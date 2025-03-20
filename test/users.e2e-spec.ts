import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../src/users/entities/user.entity";
import { CreateUserDto } from "../src/users/dto/create-user.dto";
import { Repository } from "typeorm";

describe("UsersController (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();

    await userRepository.query("DELETE FROM users");
  });

  afterAll(async () => {
    await userRepository.query("DELETE FROM users");
    await app.close();
  });

  it("/users (POST) - deve criar um novo usuário", async () => {
    const createUserDto: CreateUserDto = {
      email: "teste@teste.com",
      name: "Usuário de Teste",
      password: "senha123",
    };

    const response = await request(app.getHttpServer())
      .post("/users")
      .send(createUserDto)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe(createUserDto.email);
    expect(response.body.name).toBe(createUserDto.name);
    expect(response.body).not.toHaveProperty("password");

    userId = response.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: createUserDto.email,
        password: createUserDto.password,
      })
      .expect(201);

    jwtToken = loginResponse.body.access_token;
    expect(jwtToken).toBeDefined();
  });

  it("/users (GET) - deve listar todos os usuários quando autenticado", async () => {
    const response = await request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("email");
  });

  it("/users/:id (GET) - deve obter um usuário por ID quando autenticado", async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body).toHaveProperty("id", userId);
    expect(response.body).toHaveProperty("email");
    expect(response.body).toHaveProperty("name");
    expect(response.body).not.toHaveProperty("password");
  });

  it("/users/:id (PATCH) - deve atualizar um usuário quando autenticado", async () => {
    const updateUserDto = {
      name: "Nome Atualizado",
    };

    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(updateUserDto)
      .expect(200);

    expect(response.body).toHaveProperty("id", userId);
    expect(response.body).toHaveProperty("name", updateUserDto.name);
  });

  it("/users/:id (DELETE) - deve desativar um usuário quando autenticado", async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(200);

    const user = await userRepository.findOne({ where: { id: userId } });
    expect(user?.active).toBe(false);
  });
});
