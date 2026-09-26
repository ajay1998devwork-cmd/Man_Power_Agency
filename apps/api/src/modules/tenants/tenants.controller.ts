import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    return {
      message: 'List tenants placeholder',
      data: [],
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      message: 'Get tenant placeholder',
      id,
    };
  }

  @Post()
  create(@Body() createTenantDto: any) {
    return {
      message: 'Create tenant placeholder',
      data: createTenantDto,
    };
  }
}
