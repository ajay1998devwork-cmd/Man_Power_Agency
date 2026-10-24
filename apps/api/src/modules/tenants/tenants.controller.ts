import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('tenants')
export class TenantsController {
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
