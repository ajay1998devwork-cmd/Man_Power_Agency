import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompaniesService, CreateCompanyInput } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query('search') search?: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.companiesService.findAll(tenantId, search, Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.companiesService.findOne(tenantId, id);
  }

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() input: CreateCompanyInput) {
    return this.companiesService.create(tenantId, input);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() input: Partial<CreateCompanyInput>) {
    return this.companiesService.update(tenantId, id, input);
  }

  @Delete(':id')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.companiesService.softDelete(tenantId, id);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadDocument(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body('documentType') documentType: string, @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.companiesService.uploadDocument(tenantId, id, documentType || 'other', file);
  }
}
