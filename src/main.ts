import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("API de Carteira Financeira")
    .setDescription("API para gerenciar depósitos e transferências financeiras")
    .setVersion("1.0")
    .addTag("auth", "Operações de autenticação")
    .addTag("users", "Operações de usuários")
    .addTag("transactions", "Operações de transações")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Aplicação rodando na porta ${process.env.PORT ?? 3000}`);
}
bootstrap();
