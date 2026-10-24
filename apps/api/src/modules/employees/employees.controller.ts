import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AssignPlacementInput,
  ConvertToEmployeeInput,
  EmployeesService,
  ExitEmployeeInput,
  UpdateEmploymentInput,
} from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /** GET /employees?search=... — list all employees with optional search */
  @Get()
  findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.employeesService.findAll(tenantId, search);
  }

  /** GET /employees/candidate-status/:candidateId — check if candidate is currently employed/placed */
  @Get('candidate-status/:candidateId')
  getCandidateStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('candidateId') candidateId: string,
  ) {
    return this.employeesService.getCandidateEmploymentStatus(tenantId, candidateId);
  }

  /** GET /employees/:id — full employee detail + employment history */
  @Get(':id')
  findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.employeesService.findOne(tenantId, id);
  }

  /**
   * POST /candidates/:candidateId/convert-to-employee
   * Called when interview is passed and agency is ready to officially onboard.
   */
  @Post('/from-candidate/:candidateId')
  convertToEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Param('candidateId') candidateId: string,
    @Body() input: ConvertToEmployeeInput,
  ) {
    return this.employeesService.convertToEmployee(tenantId, candidateId, input);
  }

  /**
   * PATCH /employees/:id/employment
   * Update current active placement details (salary, company code, designation…)
   */
  @Patch(':id/employment')
  updateCurrentEmployment(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() input: UpdateEmploymentInput,
  ) {
    return this.employeesService.updateCurrentEmployment(tenantId, id, input);
  }

  /**
   * POST /employees/:id/placement
   * Deploy/re-deploy an employee to a new company (e.g. after being benched).
   */
  @Post(':id/placement')
  assignPlacement(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() input: AssignPlacementInput,
  ) {
    return this.employeesService.assignNewPlacement(tenantId, id, input);
  }

  /**
   * POST /employees/:id/exit
   * Mark the employee as exited from their current company.
   * Sets status to "benched" — ready for re-deployment.
   */
  @Post(':id/exit')
  exitEmployee(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() input: ExitEmployeeInput,
  ) {
    return this.employeesService.exitEmployee(tenantId, id, input);
  }

  /** PATCH /employees/:id/status — update top-level status */
  @Patch(':id/status')
  updateStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.employeesService.updateStatus(tenantId, id, body.status);
  }
}
