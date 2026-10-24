import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateInterviewInput, InterviewsService } from './interviews.service';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}
  @Get() findAll(@Headers('x-tenant-id') tenantId: string) { return this.interviewsService.findAll(tenantId); }
  @Get(':id') findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) { return this.interviewsService.findOne(tenantId, id); }
  @Post() create(@Headers('x-tenant-id') tenantId: string, @Body() input: CreateInterviewInput) { return this.interviewsService.create(tenantId, input); }
  @Patch(':id/result') updateResult(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() input: { status: string; result?: string; feedback?: string }) { return this.interviewsService.updateResult(tenantId, id, input); }
}
