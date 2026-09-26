import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantsService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return null;
  }

  async create(createTenantDto: any) {
    return null;
  }
}
