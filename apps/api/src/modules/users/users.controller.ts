import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
