import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return {
      message: 'List users placeholder',
      data: [],
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      message: 'Get user placeholder',
      id,
    };
  }
}
