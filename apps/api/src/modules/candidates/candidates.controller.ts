import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { resolve } from 'node:path';
import { BankDetailsInput, CandidatesService, CreateCandidateInput, UpdateCandidateInput } from './candidates.service';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query('search') search?: string) { return this.candidatesService.findAll(tenantId, search); }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) { return this.candidatesService.findOne(tenantId, id); }

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() input: CreateCandidateInput) { return this.candidatesService.create(tenantId, input); }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() input: UpdateCandidateInput) { return this.candidatesService.update(tenantId, id, input); }

  @Patch(':id/bank-details')
  updateBankDetails(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() input: BankDetailsInput) { return this.candidatesService.updateBankDetails(tenantId, id, input); }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadDocument(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body('documentType') documentType: string, @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.candidatesService.uploadDocument(tenantId, id, documentType || 'aadhaar', file);
  }

  @Patch(':id/status')
  updateStatus(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: { status: string }) {
    return this.candidatesService.updateStatus(tenantId, id, body.status);
  }

  @Patch(':id/documents/:documentId')
  updateDocumentStatus(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Param('documentId') documentId: string, @Body() body: { status: string; remarks?: string }) {
    return this.candidatesService.updateDocumentStatus(tenantId, id, documentId, body.status, body.remarks);
  }

  @Get(':id/documents/:documentId/file')
  async viewDocument(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Param('documentId') documentId: string, @Res() response: Response) {
    const document = await this.candidatesService.getDocument(tenantId, id, documentId);
    return response.sendFile(resolve(process.cwd(), document.storageKey));
  }
}
