import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { candidateBankDetails, db, candidateDocuments, candidateSequences, candidates, companies, employees, interviews } from '@manpower/database';
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

const agencyTenants = pgTable('tenants', { id: uuid('id').primaryKey(), agencyCode: varchar('agency_code', { length: 32 }).notNull() });

export interface CreateCandidateInput {
  fullName: string;
  fatherName: string;
  aadhaarNumber: string;
  mobile: string;
  alternateMobile: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  designation: string;
  experience?: string;
  currentAddress: string;
  permanentAddress: string;
}

export interface UpdateCandidateInput extends Partial<Omit<CreateCandidateInput, 'aadhaarNumber'>> {
  aadhaarNumber?: string;
}

export interface BankDetailsInput {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  panNumber?: string;
}

const encryptionKey = () => createHash('sha256').update(process.env.DATA_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'change-this-local-encryption-secret').digest();
function encrypt(value: string) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`; }
export function decrypt(value: string) { const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64')); const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'); }

@Injectable()
export class CandidatesService {
  async findAll(tenantId: string, search?: string) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    const filters = [eq(candidates.tenantId, tenantId)];
    if (search?.trim()) { const value = `%${search.trim()}%`; const searchFilter = or(ilike(candidates.fullName, value), ilike(candidates.candidateCode, value), ilike(candidates.mobile, value)); if (searchFilter) filters.push(searchFilter); }
    return db.select({ id: candidates.id, candidateCode: candidates.candidateCode, fullName: candidates.fullName, fatherName: candidates.fatherName, mobile: candidates.mobile, alternateMobile: candidates.alternateMobile, designation: candidates.designation, experience: candidates.experience, status: candidates.status, createdAt: candidates.createdAt }).from(candidates).where(and(...filters)).orderBy(desc(candidates.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [candidate] = await db.select().from(candidates).where(and(eq(candidates.id, id), eq(candidates.tenantId, tenantId))).limit(1);
    if (!candidate) throw new NotFoundException('Candidate not found');
    const documents = await db.select().from(candidateDocuments).where(and(eq(candidateDocuments.candidateId, id), eq(candidateDocuments.tenantId, tenantId)));
    const [bank] = await db.select().from(candidateBankDetails).where(and(eq(candidateBankDetails.candidateId, id), eq(candidateBankDetails.tenantId, tenantId))).limit(1);
    const interviewHistory = await db
      .select({
        id: interviews.id,
        companyId: interviews.companyId,
        companyName: companies.name,
        companyCode: companies.code,
        interviewerName: interviews.interviewerName,
        scheduledAt: interviews.scheduledAt,
        mode: interviews.mode,
        location: interviews.location,
        status: interviews.status,
        result: interviews.result,
        feedback: interviews.feedback,
      })
      .from(interviews)
      .leftJoin(companies, eq(interviews.companyId, companies.id))
      .where(and(eq(interviews.candidateId, id), eq(interviews.tenantId, tenantId)))
      .orderBy(desc(interviews.scheduledAt));

    const [employee] = await db
      .select({
        id: employees.id,
        agencyEmployeeCode: employees.agencyEmployeeCode,
        status: employees.status,
      })
      .from(employees)
      .where(and(eq(employees.candidateId, id), eq(employees.tenantId, tenantId)))
      .limit(1);

    return {
      ...candidate,
      aadhaarNumber: decrypt(candidate.aadhaarEncrypted),
      documents,
      bankDetails: bank ? {
        accountHolderName: bank.accountHolderName,
        accountNumber: bank.accountNumberEncrypted ? decrypt(bank.accountNumberEncrypted) : '',
        ifscCode: bank.ifscCode,
        bankName: bank.bankName,
        panNumber: bank.panEncrypted ? decrypt(bank.panEncrypted) : '',
      } : null,
      interviewHistory,
      employee: employee || null,
    };
  }

  async create(tenantId: string, input: CreateCandidateInput) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    if (!/^\d{12}$/.test(input.aadhaarNumber)) throw new BadRequestException('Aadhaar number must contain exactly 12 digits');
    if (input.mobile === input.alternateMobile) throw new BadRequestException('Alternate mobile must be different from mobile');
    const candidate = await db.transaction(async (tx) => {
      const [tenant] = await tx.select().from(agencyTenants).where(eq(agencyTenants.id, tenantId)).limit(1);
      if (!tenant) throw new NotFoundException('Agency tenant not found');
      const [sequence] = await tx.insert(candidateSequences).values({ tenantId, nextNumber: 2 }).onConflictDoUpdate({ target: candidateSequences.tenantId, set: { nextNumber: sql`${candidateSequences.nextNumber} + 1`, updatedAt: new Date() } }).returning({ nextNumber: candidateSequences.nextNumber });
      const number = (sequence?.nextNumber || 2) - 1;
      const { aadhaarNumber, ...candidateFields } = input;
      const [created] = await tx.insert(candidates).values({ ...candidateFields, tenantId, candidateCode: `${tenant.agencyCode}-${number}`, aadhaarEncrypted: encrypt(aadhaarNumber), aadhaarLast4: aadhaarNumber.slice(-4), status: 'onboarding', source: 'agency_manual' }).returning();
      return created;
    });
    return { ...candidate, aadhaarNumber: undefined };
  }

  async uploadDocument(tenantId: string, candidateId: string, documentType: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    if (!file) throw new BadRequestException('Document file is required');
    const allowedTypes = ['aadhaar', 'photo', 'pan', 'police_verification', 'medical_certificate', 'bank_proof', 'address_proof', 'experience_certificate', 'other'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(documentType)) throw new BadRequestException('Unsupported document type');
    if (!allowedMimeTypes.includes(file.mimetype)) throw new BadRequestException('Only PDF, JPG, PNG and Word documents are allowed');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('Document size must be less than 10 MB');
    const candidate = await this.findOne(tenantId, candidateId);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativeDirectory = join('uploads', 'tenants', tenantId, 'candidates', candidate.id);
    const absoluteDirectory = join(process.cwd(), relativeDirectory);
    await mkdir(absoluteDirectory, { recursive: true });
    const storageKey = join(relativeDirectory, `${Date.now()}-${safeName}`).replace(/\\/g, '/');
    await writeFile(join(process.cwd(), storageKey), file.buffer);
    const [document] = await db.insert(candidateDocuments).values({ tenantId, candidateId, documentType, originalName: file.originalname, storageKey, mimeType: file.mimetype, fileSize: file.size }).returning();
    return document;
  }

  async updateDocumentStatus(tenantId: string, candidateId: string, documentId: string, status: string, remarks?: string) {
    const [document] = await db.update(candidateDocuments).set({ verificationStatus: status, remarks }).where(and(eq(candidateDocuments.id, documentId), eq(candidateDocuments.candidateId, candidateId), eq(candidateDocuments.tenantId, tenantId))).returning();
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async updateStatus(tenantId: string, candidateId: string, status: string) {
    const [candidate] = await db.update(candidates).set({ status, updatedAt: new Date() }).where(and(eq(candidates.id, candidateId), eq(candidates.tenantId, tenantId))).returning();
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async update(tenantId: string, candidateId: string, input: UpdateCandidateInput) {
    const allowedKeys = ['fullName', 'fatherName', 'mobile', 'alternateMobile', 'email', 'dateOfBirth', 'gender', 'designation', 'experience', 'currentAddress', 'permanentAddress', 'aadhaarNumber'] as const;
    const values: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowedKeys) if (input[key] !== undefined) values[key] = input[key];
    if (input.aadhaarNumber) { if (!/^\d{12}$/.test(input.aadhaarNumber)) throw new BadRequestException('Aadhaar number must contain exactly 12 digits'); values.aadhaarEncrypted = encrypt(input.aadhaarNumber); values.aadhaarLast4 = input.aadhaarNumber.slice(-4); delete values.aadhaarNumber; }
    const [candidate] = await db.update(candidates).set(values).where(and(eq(candidates.id, candidateId), eq(candidates.tenantId, tenantId))).returning();
    if (!candidate) throw new NotFoundException('Candidate not found');
    return { ...candidate, aadhaarNumber: decrypt(candidate.aadhaarEncrypted) };
  }

  async updateBankDetails(tenantId: string, candidateId: string, input: BankDetailsInput) {
    await this.findOne(tenantId, candidateId);
    const values = { tenantId, candidateId, accountHolderName: input.accountHolderName, accountNumberEncrypted: input.accountNumber ? encrypt(input.accountNumber) : null, accountNumberLast4: input.accountNumber?.slice(-4), ifscCode: input.ifscCode, bankName: input.bankName, panEncrypted: input.panNumber ? encrypt(input.panNumber) : null, panLast4: input.panNumber?.slice(-4), updatedAt: new Date() };
    const [bank] = await db.insert(candidateBankDetails).values(values).onConflictDoUpdate({ target: candidateBankDetails.candidateId, set: values }).returning();
    return { accountHolderName: bank.accountHolderName, accountNumber: bank.accountNumberEncrypted ? decrypt(bank.accountNumberEncrypted) : '', ifscCode: bank.ifscCode, bankName: bank.bankName, panNumber: bank.panEncrypted ? decrypt(bank.panEncrypted) : '' };
  }

  async getDocument(tenantId: string, candidateId: string, documentId: string) {
    const [document] = await db.select().from(candidateDocuments).where(and(eq(candidateDocuments.id, documentId), eq(candidateDocuments.candidateId, candidateId), eq(candidateDocuments.tenantId, tenantId))).limit(1);
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }
}
