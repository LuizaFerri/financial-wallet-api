import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { TransactionsService } from "./transactions.service";
import { CreateDepositDto } from "./dto/create-deposit.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ReverseTransactionDto } from "./dto/reverse-transaction.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("transactions")
@Controller("transactions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post("deposit")
  @ApiOperation({ summary: "Depositar dinheiro na carteira do usuário logado" })
  @ApiResponse({ status: 201, description: "Depósito realizado com sucesso" })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou problema ao processar depósito",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  createDeposit(@Request() req, @Body() createDepositDto: CreateDepositDto) {
    return this.transactionsService.createDeposit(
      req.user.id,
      createDepositDto,
    );
  }

  @Post("transfer")
  @ApiOperation({ summary: "Transferir dinheiro para outro usuário" })
  @ApiResponse({
    status: 201,
    description: "Transferência realizada com sucesso",
  })
  @ApiResponse({
    status: 400,
    description:
      "Dados inválidos, saldo insuficiente ou problema ao processar transferência",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Destinatário não encontrado" })
  createTransfer(@Request() req, @Body() createTransferDto: CreateTransferDto) {
    return this.transactionsService.createTransfer(
      req.user.id,
      createTransferDto,
    );
  }

  @Post("reverse")
  @ApiOperation({ summary: "Reverter uma transação" })
  @ApiResponse({ status: 201, description: "Transação revertida com sucesso" })
  @ApiResponse({
    status: 400,
    description: "Dados inválidos ou problema ao processar reversão",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Transação não encontrada" })
  @ApiResponse({ status: 409, description: "Transação já revertida" })
  reverseTransaction(
    @Request() req,
    @Body() reverseTransactionDto: ReverseTransactionDto,
  ) {
    return this.transactionsService.reverseTransaction(
      req.user.id,
      reverseTransactionDto,
    );
  }

  @Get()
  @ApiOperation({ summary: "Listar todas as transações do usuário logado" })
  @ApiResponse({
    status: 200,
    description: "Lista de transações retornada com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  findAllUserTransactions(@Request() req) {
    return this.transactionsService.findUserTransactions(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar detalhes de uma transação específica" })
  @ApiResponse({ status: 200, description: "Transação encontrada" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  @ApiResponse({ status: 404, description: "Transação não encontrada" })
  findOne(@Param("id") id: string) {
    return this.transactionsService.findOne(id);
  }
}
