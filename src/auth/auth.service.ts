import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async login(user: User) {
    if (!user.active) {
      throw new UnauthorizedException("Usuário inativo");
    }

    const payload = { email: user.email, sub: user.id };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.active) {
        throw new UnauthorizedException("Usuário inválido ou inativo");
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
  }
}
