import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantsService {
  async findAll() {
    return [];
  }

  async findOne(_id: string) {
    return null;
  }

  async create(_createTenantDto: any) {
    return null;
  }
}
