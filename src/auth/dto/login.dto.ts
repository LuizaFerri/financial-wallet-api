import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "E-mail do usuário",
    example: "usuario@email.com",
  })
  @IsEmail({}, { message: "Endereço de e-mail inválido" })
  @IsNotEmpty({ message: "O e-mail é obrigatório" })
  email: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
  })
  @IsString({ message: "A senha deve ser uma string" })
  @IsNotEmpty({ message: "A senha é obrigatória" })
  @MinLength(6, { message: "A senha deve ter pelo menos 6 caracteres" })
  password: string;
}
