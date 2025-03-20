import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateDepositDto {
  @ApiProperty({
    description: "Valor do depósito",
    example: 100.0,
    minimum: 0.01,
  })
  @IsNotEmpty({ message: "O valor é obrigatório" })
  @IsNumber({}, { message: "O valor deve ser um número" })
  @Min(0.01, { message: "O valor mínimo para depósito é 0.01" })
  amount: number;

  @ApiProperty({
    description: "Descrição do depósito",
    example: "Depósito inicial",
    required: false,
  })
  @IsString({ message: "A descrição deve ser uma string" })
  @IsOptional()
  description?: string;
}
