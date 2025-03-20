import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class ReverseTransactionDto {
  @ApiProperty({
    description: "ID da transação a ser revertida",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty({ message: "O ID da transação é obrigatório" })
  @IsUUID("4", { message: "ID de transação inválido" })
  transactionId: string;

  @ApiProperty({
    description: "Motivo da reversão",
    example: "Transação feita por engano",
    required: false,
  })
  @IsString({ message: "O motivo deve ser uma string" })
  @IsOptional()
  reason?: string;
}
