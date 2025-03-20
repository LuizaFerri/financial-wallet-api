import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("users")
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Criar um novo usuário" })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiResponse({ status: 409, description: "E-mail já em uso" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Listar todos os usuários" })
  @ApiResponse({
    status: 200,
    description: "Lista de usuários retornada com sucesso",
  })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buscar um usuário por ID" })
  @ApiResponse({ status: 200, description: "Usuário encontrado" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar um usuário" })
  @ApiResponse({ status: 200, description: "Usuário atualizado com sucesso" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remover um usuário (soft delete)" })
  @ApiResponse({ status: 200, description: "Usuário removido com sucesso" })
  @ApiResponse({ status: 404, description: "Usuário não encontrado" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
