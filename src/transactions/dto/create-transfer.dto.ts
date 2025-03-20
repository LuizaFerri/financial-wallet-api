import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateTransferDto {
  @ApiProperty({
    description: "ID do usuário destinatário",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty({ message: "O ID do destinatário é obrigatório" })
  @IsUUID("4", { message: "ID de destinatário inválido" })
  receiverId: string;

  @ApiProperty({
    description: "Valor da transferência",
    example: 50.0,
    minimum: 0.01,
  })
  @IsNotEmpty({ message: "O valor é obrigatório" })
  @IsNumber({}, { message: "O valor deve ser um número" })
  @Min(0.01, { message: "O valor mínimo para transferência é 0.01" })
  amount: number;

  @ApiProperty({
    description: "Descrição da transferência",
    example: "Pagamento de dívida",
    required: false,
  })
  @IsString({ message: "A descrição deve ser uma string" })
  @IsOptional()
  description?: string;
}
