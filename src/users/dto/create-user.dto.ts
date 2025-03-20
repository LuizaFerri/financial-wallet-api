import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    description: "O e-mail do usuário, que será usado como identificação única",
    example: "usuario@email.com",
  })
  @IsEmail({}, { message: "Endereço de e-mail inválido" })
  @IsNotEmpty({ message: "O e-mail é obrigatório" })
  email: string;

  @ApiProperty({
    description: "O nome completo do usuário",
    example: "João Silva",
  })
  @IsString({ message: "O nome deve ser uma string" })
  @IsNotEmpty({ message: "O nome é obrigatório" })
  name: string;

  @ApiProperty({
    description: "A senha do usuário, mínimo de 6 caracteres",
    example: "senha123",
  })
  @IsString({ message: "A senha deve ser uma string" })
  @IsNotEmpty({ message: "A senha é obrigatória" })
  @MinLength(6, { message: "A senha deve ter pelo menos 6 caracteres" })
  password: string;
}
