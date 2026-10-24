import { BadRequestException, Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { companies, companyDocuments, db } from '@manpower/database';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface CreateCompanyInput {
  name: string;
  code: string;
  registrationNumber?: string;
  industry?: string;
  primaryContactName: string;
  primaryContactEmail?: string;
  primaryContactPhone: string;
  hrContactName?: string;
  hrContactPhone?: string;
  hrContactEmail?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

@Injectable()
export class CompaniesService {
  async findAll(tenantId: string, search?: string, page = 1, limit = 10) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    const filters = [eq(companies.tenantId, tenantId)];
    if (search?.trim()) {
      const value = `%${search.trim()}%`;
      const searchFilter = or(ilike(companies.name, value), ilike(companies.code, value));
      if (searchFilter) filters.push(searchFilter);
    }
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const where = and(...filters);
    const [data, totalResult] = await Promise.all([
      db.select({ id: companies.id, name: companies.name, code: companies.code, industry: companies.industry, addressLine1: companies.addressLine1, city: companies.city, state: companies.state, primaryContactName: companies.primaryContactName, primaryContactPhone: companies.primaryContactPhone, hrContactName: companies.hrContactName, hrContactPhone: companies.hrContactPhone, status: companies.status, createdAt: companies.createdAt }).from(companies).where(where).orderBy(desc(companies.createdAt)).limit(safeLimit).offset((safePage - 1) * safeLimit),
      db.select({ value: count(companies.id) }).from(companies).where(where),
    ]);
    const total = Number(totalResult[0]?.value || 0);
    return { data, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  async findOne(tenantId: string, id: string) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    const [company] = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.tenantId, tenantId))).limit(1);
    return company || null;
  }

  async create(tenantId: string, input: CreateCompanyInput) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    const [company] = await db.insert(companies).values({ ...input, tenantId }).returning();
    return company;
  }

  async update(tenantId: string, id: string, input: Partial<CreateCompanyInput>) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    const [company] = await db.update(companies).set({ ...input, updatedAt: new Date() }).where(and(eq(companies.id, id), eq(companies.tenantId, tenantId))).returning();
    return company || null;
  }

  async softDelete(tenantId: string, id: string) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    const [company] = await db.update(companies).set({ status: 'inactive', updatedAt: new Date() }).where(and(eq(companies.id, id), eq(companies.tenantId, tenantId))).returning();
    return company || null;
  }

  async uploadDocument(tenantId: string, companyId: string, documentType: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    if (!file) throw new BadRequestException('Document file is required');
    const allowedTypes = ['gst_certificate', 'registration_certificate', 'labour_license', 'contract_document', 'other'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(documentType)) throw new BadRequestException('Unsupported document type');
    if (!allowedMimeTypes.includes(file.mimetype)) throw new BadRequestException('Only PDF, JPG, PNG and Word documents are allowed');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('Document size must be less than 10 MB');
    const company = await this.findOne(tenantId, companyId);
    if (!company) return null;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativeDirectory = join('uploads', 'tenants', tenantId, 'companies', companyId);
    await mkdir(join(process.cwd(), relativeDirectory), { recursive: true });
    const storageKey = join(relativeDirectory, `${Date.now()}-${safeName}`).replace(/\\/g, '/');
    await writeFile(join(process.cwd(), storageKey), file.buffer);
    const [document] = await db.insert(companyDocuments).values({ tenantId, companyId, documentType, originalName: file.originalname, storageKey, mimeType: file.mimetype, fileSize: file.size }).returning();
    return document;
  }
}
