import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const token = this.signToken(user.id, user.email, user.role);
    return { user, access_token: token };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...safeUser } = user;
    const token = this.signToken(user.id, user.email, user.role);

    return {
      user: safeUser,
      access_token: token,
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      return user;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}
