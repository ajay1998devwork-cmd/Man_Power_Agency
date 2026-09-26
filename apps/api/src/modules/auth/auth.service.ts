import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateUser(email: string, password: string): Promise<any> {
    return null;
  }

  async login(user: any) {
    return {
      accessToken: 'placeholder-token',
    };
  }
}
