import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: "Autenticar usuário e obter token JWT" })
  @ApiResponse({ status: 200, description: "Login bem-sucedido" })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(@Request() req, @Body() _loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Get("perfil")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obter perfil do usuário autenticado" })
  @ApiResponse({ status: 200, description: "Perfil retornado com sucesso" })
  @ApiResponse({ status: 401, description: "Não autorizado" })
  getProfile(@Request() req) {
    return req.user;
  }
}
