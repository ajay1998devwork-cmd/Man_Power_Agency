import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return {
      message: 'Login endpoint placeholder',
      email: loginDto.email,
    };
  }

  @Post('logout')
  async logout() {
    return {
      message: 'Logout endpoint placeholder',
    };
  }
}
