import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @ApiProperty({
    description: "O e-mail do usuário",
    example: "novoemail@email.com",
    required: false,
  })
  @IsEmail({}, { message: "Endereço de e-mail inválido" })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "O nome completo do usuário",
    example: "João Silva Atualizado",
    required: false,
  })
  @IsString({ message: "O nome deve ser uma string" })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "A senha do usuário, mínimo de 6 caracteres",
    example: "novasenha123",
    required: false,
  })
  @IsString({ message: "A senha deve ser uma string" })
  @IsOptional()
  @MinLength(6, { message: "A senha deve ter pelo menos 6 caracteres" })
  password?: string;
}
