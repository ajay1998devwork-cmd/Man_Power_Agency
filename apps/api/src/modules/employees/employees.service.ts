import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import {
  db,
  candidates,
  candidateBankDetails,
  candidateSequences,
  companies,
  employees,
  employmentHistory,
  interviews,
} from '@manpower/database';
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { decrypt } from '../candidates/candidates.service';

// Re-use the same agencyCode lookup table definition used in candidates module
const agencyTenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  agencyCode: varchar('agency_code', { length: 32 }).notNull(),
});

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface ConvertToEmployeeInput {
  /** The interview that the candidate passed */
  interviewId: string;
  joiningDate: string;       // ISO date string
  salary?: string;           // monthly CTC as string e.g. "15000"
  salaryBreakdown?: string;  // free text e.g. "Basic 10k + HRA 3k + Misc 2k"
  designation?: string;
  department?: string;
  workLocation?: string;
  companyEmployeeCode?: string; // if company already issued an internal code
  exitCurrentPlacement?: {
    exitDate: string;
    exitReason: 'resigned' | 'terminated' | 'absconded' | 'contract_ended' | 'transfer' | 'other';
    exitRemarks?: string;
  };
}

export interface UpdateEmploymentInput {
  companyEmployeeCode?: string;
  salary?: string;
  salaryBreakdown?: string;
  designation?: string;
  department?: string;
  workLocation?: string;
}

export interface ExitEmployeeInput {
  exitDate: string;          // ISO date
  exitReason: 'resigned' | 'terminated' | 'absconded' | 'contract_ended' | 'transfer' | 'other';
  exitRemarks?: string;
}

export interface AssignPlacementInput {
  companyId: string;
  joiningDate: string;
  salary?: string;
  salaryBreakdown?: string;
  designation?: string;
  department?: string;
  workLocation?: string;
  companyEmployeeCode?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class EmployeesService {
  // ── Search & list ────────────────────────────────────────────────────────

  async findAll(tenantId: string, search?: string) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');

    const rows = await db
      .select({
        id:                 employees.id,
        agencyEmployeeCode: employees.agencyEmployeeCode,
        status:             employees.status,
        firstJoiningDate:   employees.firstJoiningDate,
        // Candidate personal info
        candidateId:        candidates.id,
        fullName:           candidates.fullName,
        fatherName:         candidates.fatherName,
        mobile:             candidates.mobile,
        designation:        candidates.designation,
        // Current company
        currentCompanyId:   employees.currentCompanyId,
        companyName:        companies.name,
        companyCode:        companies.code,
      })
      .from(employees)
      .innerJoin(candidates, eq(employees.candidateId, candidates.id))
      .leftJoin(companies, eq(employees.currentCompanyId, companies.id))
      .where(
        and(
          eq(employees.tenantId, tenantId),
          search?.trim()
            ? or(
                ilike(candidates.fullName, `%${search.trim()}%`),
                ilike(employees.agencyEmployeeCode, `%${search.trim()}%`),
                ilike(candidates.mobile, `%${search.trim()}%`),
                ilike(candidates.candidateCode, `%${search.trim()}%`),
                ilike(companies.name, `%${search.trim()}%`),
                ilike(companies.code, `%${search.trim()}%`),
              )
            : undefined,
        ),
      )
      .orderBy(desc(employees.createdAt));

    return rows;
  }

  // ── Get one employee with full history ───────────────────────────────────

  async findOne(tenantId: string, employeeId: string) {
    const [emp] = await db
      .select({
        id:                 employees.id,
        candidateId:        employees.candidateId,
        agencyEmployeeCode: employees.agencyEmployeeCode,
        status:             employees.status,
        firstJoiningDate:   employees.firstJoiningDate,
        currentCompanyId:   employees.currentCompanyId,
      })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)))
      .limit(1);

    if (!emp) throw new NotFoundException('Employee not found');

    // Candidate personal data
    const [candidate] = emp.candidateId
      ? await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, emp.candidateId))
          .limit(1)
      : [null];

    // Bank details from candidate
    const [bank] = await db
      .select()
      .from(candidateBankDetails)
      .where(and(
        eq(candidateBankDetails.candidateId, candidate?.id ?? ''),
        eq(candidateBankDetails.tenantId, tenantId),
      ))
      .limit(1);

    // Full employment history, newest first
    const history = await db
      .select({
        id:                  employmentHistory.id,
        companyId:           employmentHistory.companyId,
        companyName:         companies.name,
        companyCode:         companies.code,
        companyEmployeeCode: employmentHistory.companyEmployeeCode,
        designation:         employmentHistory.designation,
        department:          employmentHistory.department,
        workLocation:        employmentHistory.workLocation,
        joiningDate:         employmentHistory.joiningDate,
        exitDate:            employmentHistory.exitDate,
        salary:              employmentHistory.salary,
        salaryBreakdown:     employmentHistory.salaryBreakdown,
        status:              employmentHistory.status,
        exitReason:          employmentHistory.exitReason,
        exitRemarks:         employmentHistory.exitRemarks,
        createdAt:           employmentHistory.createdAt,
      })
      .from(employmentHistory)
      .leftJoin(companies, eq(employmentHistory.companyId, companies.id))
      .where(and(
        eq(employmentHistory.employeeId, employeeId),
        eq(employmentHistory.tenantId, tenantId),
      ))
      .orderBy(desc(employmentHistory.joiningDate));

    return {
      ...emp,
      candidate: candidate
        ? {
            id:               candidate.id,
            candidateCode:    candidate.candidateCode,
            fullName:         candidate.fullName,
            fatherName:       candidate.fatherName,
            mobile:           candidate.mobile,
            alternateMobile:  candidate.alternateMobile,
            email:            candidate.email,
            dateOfBirth:      candidate.dateOfBirth,
            gender:           candidate.gender,
            designation:      candidate.designation,
            experience:       candidate.experience,
            currentAddress:   candidate.currentAddress,
            permanentAddress: candidate.permanentAddress,
            aadhaarLast4:     candidate.aadhaarLast4,
          }
        : null,
      bankDetails: bank
        ? {
            accountHolderName: bank.accountHolderName,
            accountNumber:     bank.accountNumberEncrypted ? decrypt(bank.accountNumberEncrypted) : '',
            ifscCode:          bank.ifscCode,
            bankName:          bank.bankName,
            panNumber:         bank.panEncrypted ? decrypt(bank.panEncrypted) : '',
          }
        : null,
      employmentHistory: history,
    };
  }

  // ── Check if candidate is already an employee and if currently actively placed ──

  async getCandidateEmploymentStatus(tenantId: string, candidateId: string) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');

    const [emp] = await db
      .select({
        id: employees.id,
        agencyEmployeeCode: employees.agencyEmployeeCode,
        status: employees.status,
        currentCompanyId: employees.currentCompanyId,
      })
      .from(employees)
      .where(and(eq(employees.candidateId, candidateId), eq(employees.tenantId, tenantId)))
      .limit(1);

    if (!emp) {
      return {
        isEmployed: false,
        employee: null,
        activePlacement: null,
      };
    }

    const [activePlacement] = await db
      .select({
        id: employmentHistory.id,
        companyId: employmentHistory.companyId,
        companyName: companies.name,
        companyCode: companies.code,
        designation: employmentHistory.designation,
        department: employmentHistory.department,
        workLocation: employmentHistory.workLocation,
        joiningDate: employmentHistory.joiningDate,
        companyEmployeeCode: employmentHistory.companyEmployeeCode,
        salary: employmentHistory.salary,
      })
      .from(employmentHistory)
      .innerJoin(companies, eq(employmentHistory.companyId, companies.id))
      .where(
        and(
          eq(employmentHistory.employeeId, emp.id),
          eq(employmentHistory.tenantId, tenantId),
          eq(employmentHistory.status, 'active'),
        ),
      )
      .limit(1);

    return {
      isEmployed: true,
      employee: emp,
      activePlacement: activePlacement || null,
    };
  }

  // ── Convert a passed candidate into an employee ──────────────────────────

  async convertToEmployee(tenantId: string, candidateId: string, input: ConvertToEmployeeInput) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');

    // Validate the interview exists + belongs to this candidate + is passed
    const [interview] = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.id, input.interviewId),
          eq(interviews.candidateId, candidateId),
          eq(interviews.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!interview) throw new NotFoundException('Interview not found for this candidate');
    if (interview.result !== 'passed')
      throw new BadRequestException('Only a candidate who passed the interview can be converted to employee');

    // Check candidate exists
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(and(eq(candidates.id, candidateId), eq(candidates.tenantId, tenantId)))
      .limit(1);
    if (!candidate) throw new NotFoundException('Candidate not found');

    // Check if employee record already exists (re-activation / transfer scenario)
    const [existing] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.candidateId, candidateId), eq(employees.tenantId, tenantId)))
      .limit(1);

    // If candidate is already an employee, check if they are currently working at another company
    let currentActivePlacement: {
      id: string;
      companyId: string;
      companyName: string;
      designation?: string | null;
      joiningDate: string;
    } | null = null;

    if (existing) {
      const [curr] = await db
        .select({
          id: employmentHistory.id,
          companyId: employmentHistory.companyId,
          companyName: companies.name,
          designation: employmentHistory.designation,
          joiningDate: employmentHistory.joiningDate,
        })
        .from(employmentHistory)
        .innerJoin(companies, eq(employmentHistory.companyId, companies.id))
        .where(
          and(
            eq(employmentHistory.employeeId, existing.id),
            eq(employmentHistory.tenantId, tenantId),
            eq(employmentHistory.status, 'active'),
          ),
        )
        .limit(1);

      currentActivePlacement = curr || null;
    }

    // If currently active at another company, exit details are strictly required!
    if (currentActivePlacement && currentActivePlacement.companyId !== interview.companyId) {
      if (!input.exitCurrentPlacement || !input.exitCurrentPlacement.exitDate) {
        throw new BadRequestException(
          `Candidate is currently working at "${currentActivePlacement.companyName}". Please record their exit details (exit date and reason) before placing at the new company.`,
        );
      }
    }

    return db.transaction(async (tx) => {
      // Fetch tenant agencyCode for generating the employee code
      const [tenant] = await tx.select().from(agencyTenants).where(eq(agencyTenants.id, tenantId)).limit(1);
      if (!tenant) throw new NotFoundException('Tenant not found');

      // 1. If candidate was actively placed at another company, formally close/exit that placement
      if (currentActivePlacement && currentActivePlacement.companyId !== interview.companyId && input.exitCurrentPlacement) {
        await tx
          .update(employmentHistory)
          .set({
            status: 'exited',
            exitDate: input.exitCurrentPlacement.exitDate,
            exitReason: input.exitCurrentPlacement.exitReason || 'transfer',
            exitRemarks: input.exitCurrentPlacement.exitRemarks,
            updatedAt: new Date(),
          })
          .where(eq(employmentHistory.id, currentActivePlacement.id));
      }

      let employee = existing;

      if (!existing) {
        // Generate agency employee code using same sequence counter
        const [seq] = await tx
          .insert(candidateSequences)
          .values({ tenantId, nextNumber: 2 })
          .onConflictDoUpdate({
            target: candidateSequences.tenantId,
            set: { nextNumber: sql`${candidateSequences.nextNumber} + 1`, updatedAt: new Date() },
          })
          .returning({ nextNumber: candidateSequences.nextNumber });

        const number = (seq?.nextNumber || 2) - 1;
        const agencyEmployeeCode = `EMP-${tenant.agencyCode}-${String(number).padStart(4, '0')}`;

        const [created] = await tx
          .insert(employees)
          .values({
            tenantId,
            candidateId,
            agencyEmployeeCode,
            currentCompanyId: interview.companyId,
            status: 'active',
            firstJoiningDate: input.joiningDate,
          })
          .returning();
        employee = created;
      } else {
        // Employee already exists — update current company + set active
        const [updated] = await tx
          .update(employees)
          .set({ currentCompanyId: interview.companyId, status: 'active', updatedAt: new Date() })
          .where(eq(employees.id, existing.id))
          .returning();
        employee = updated;
      }

      // Create employment history entry for new placement
      const [historyEntry] = await tx
        .insert(employmentHistory)
        .values({
          tenantId,
          employeeId:          employee.id,
          companyId:           interview.companyId,
          companyEmployeeCode: input.companyEmployeeCode,
          designation:         input.designation ?? candidate.designation,
          department:          input.department,
          workLocation:        input.workLocation,
          joiningDate:         input.joiningDate,
          salary:              input.salary,
          salaryBreakdown:     input.salaryBreakdown,
          status:              'active',
          interviewId:         interview.id,
        })
        .returning();

      // Update candidate status to "employed"
      await tx
        .update(candidates)
        .set({ status: 'employed', updatedAt: new Date() })
        .where(eq(candidates.id, candidateId));

      // Ensure interview is marked completed and passed
      await tx
        .update(interviews)
        .set({ status: 'completed', result: 'passed', updatedAt: new Date() })
        .where(eq(interviews.id, interview.id));

      return { employee, historyEntry };
    });
  }

  // ── Update current employment details (salary, company code, etc.) ────────

  async updateCurrentEmployment(tenantId: string, employeeId: string, input: UpdateEmploymentInput) {
    // Find the active history entry
    const [active] = await db
      .select()
      .from(employmentHistory)
      .where(and(
        eq(employmentHistory.employeeId, employeeId),
        eq(employmentHistory.tenantId, tenantId),
        eq(employmentHistory.status, 'active'),
      ))
      .limit(1);

    if (!active) throw new NotFoundException('No active employment found for this employee');

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (input.companyEmployeeCode !== undefined) updateValues.companyEmployeeCode = input.companyEmployeeCode;
    if (input.salary !== undefined) updateValues.salary = input.salary;
    if (input.salaryBreakdown !== undefined) updateValues.salaryBreakdown = input.salaryBreakdown;
    if (input.designation !== undefined) updateValues.designation = input.designation;
    if (input.department !== undefined) updateValues.department = input.department;
    if (input.workLocation !== undefined) updateValues.workLocation = input.workLocation;

    const [updated] = await db
      .update(employmentHistory)
      .set(updateValues)
      .where(eq(employmentHistory.id, active.id))
      .returning();

    return updated;
  }

  // ── Exit / relieve an employee from their current company ─────────────────

  async exitEmployee(tenantId: string, employeeId: string, input: ExitEmployeeInput) {
    const [emp] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)))
      .limit(1);

    if (!emp) throw new NotFoundException('Employee not found');
    if (emp.status !== 'active')
      throw new BadRequestException('Employee is not currently active — cannot exit');

    return db.transaction(async (tx) => {
      // Close the active employment history entry
      const [closedHistory] = await tx
        .update(employmentHistory)
        .set({
          exitDate:    input.exitDate,
          exitReason:  input.exitReason,
          exitRemarks: input.exitRemarks,
          status:      'exited',
          updatedAt:   new Date(),
        })
        .where(and(
          eq(employmentHistory.employeeId, employeeId),
          eq(employmentHistory.tenantId, tenantId),
          eq(employmentHistory.status, 'active'),
        ))
        .returning();

      // Set employee to benched (available for re-deployment)
      const [updated] = await tx
        .update(employees)
        .set({ status: 'benched', currentCompanyId: null, updatedAt: new Date() })
        .where(eq(employees.id, employeeId))
        .returning();

      // Update candidate status back to available
      if (emp.candidateId) {
        await tx
          .update(candidates)
          .set({ status: 'verified', updatedAt: new Date() })
          .where(eq(candidates.id, emp.candidateId));
      }

      return { employee: updated, closedHistory };
    });
  }

  // ── Assign a new company placement (re-deploy benched worker) ─────────────

  async assignNewPlacement(tenantId: string, employeeId: string, input: AssignPlacementInput) {
    if (!tenantId) throw new BadRequestException('x-tenant-id header is required');
    if (!input.companyId) throw new BadRequestException('companyId is required');

    const [emp] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)))
      .limit(1);

    if (!emp) throw new NotFoundException('Employee not found');

    const [candidate] = emp.candidateId
      ? await db
          .select()
          .from(candidates)
          .where(and(eq(candidates.id, emp.candidateId), eq(candidates.tenantId, tenantId)))
          .limit(1)
      : [null];

    return db.transaction(async (tx) => {
      // If there was an active placement, mark it exited
      await tx
        .update(employmentHistory)
        .set({
          status: 'exited',
          exitDate: input.joiningDate,
          exitReason: 'transfer',
          exitRemarks: 'Transferred to new company placement',
          updatedAt: new Date(),
        })
        .where(and(
          eq(employmentHistory.employeeId, employeeId),
          eq(employmentHistory.tenantId, tenantId),
          eq(employmentHistory.status, 'active'),
        ));

      // Update employee current company & activate
      const [updatedEmp] = await tx
        .update(employees)
        .set({
          currentCompanyId: input.companyId,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(employees.id, employeeId))
        .returning();

      // Insert new placement into employmentHistory
      const [historyEntry] = await tx
        .insert(employmentHistory)
        .values({
          tenantId,
          employeeId,
          companyId: input.companyId,
          companyEmployeeCode: input.companyEmployeeCode,
          designation: input.designation || candidate?.designation || '',
          department: input.department,
          workLocation: input.workLocation,
          joiningDate: input.joiningDate,
          salary: input.salary,
          salaryBreakdown: input.salaryBreakdown,
          status: 'active',
        })
        .returning();

      if (candidate) {
        await tx
          .update(candidates)
          .set({ status: 'employed', updatedAt: new Date() })
          .where(eq(candidates.id, candidate.id));
      }

      return { employee: updatedEmp, historyEntry };
    });
  }

  // ── Update top-level employee status (active/benched/inactive) ────────────

  async updateStatus(tenantId: string, employeeId: string, status: string) {
    const [emp] = await db
      .update(employees)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)))
      .returning();
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }
}
