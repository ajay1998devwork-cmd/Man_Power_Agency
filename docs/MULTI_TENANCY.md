# Multi-Tenancy Guide

## Overview

This platform is designed as a **multi-tenant SaaS application** where each manpower consultancy operates as an independent tenant with complete data isolation.

## Tenant Model

### Tenant Structure

```
Tenant A (Consultancy A)
├── Users (admins, managers)
├── Clients
│   └── Locations
│       └── Departments
├── Candidates
├── Employees
│   └── Assignments
├── Attendance Records
├── Payroll Data
└── Documents

Tenant B (Consultancy B)
├── Users (admins, managers)
├── Clients
│   └── Locations
│       └── Departments
├── Candidates
├── Employees
│   └── Assignments
├── Attendance Records
├── Payroll Data
└── Documents
```

**Critical Rule:** Tenant A can NEVER access Tenant B's data.

## Database Schema Design

### Tenant-Owned Tables

Every table that contains tenant-specific data includes a `tenant_id` column:

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  -- ... other columns
  UNIQUE(tenant_id, employee_code)
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id);
```

### Global Tables

Some tables are NOT tenant-scoped:
- `tenants` - The tenant registry itself
- `users` (partially) - Super admin users

## Tenant Isolation Implementation

### 1. Repository Layer

Every repository method accepts `tenantId` as a parameter:

```typescript
// ❌ WRONG - No tenant isolation
async findAll() {
  return await db.select().from(employees);
}

// ✅ CORRECT - Tenant-scoped query
async findAll(tenantId: string) {
  return await db
    .select()
    .from(employees)
    .where(eq(employees.tenantId, tenantId));
}
```

### 2. Service Layer

Services receive tenant context from the authenticated request:

```typescript
@Injectable()
export class EmployeesService {
  async findAll(tenantId: string) {
    // tenantId comes from authenticated user context
    return this.employeesRepository.findAll(tenantId);
  }
}
```

### 3. Controller Layer

Controllers extract tenant ID from the authenticated request:

```typescript
@Controller('employees')
export class EmployeesController {
  @Get()
  async findAll(@TenantId() tenantId: string) {
    // @TenantId() decorator extracts from request.user.tenantId
    return this.employeesService.findAll(tenantId);
  }
}
```

### 4. Authentication Middleware

The tenant ID is embedded in the JWT token and attached to the request:

```typescript
interface TokenPayload {
  userId: string;
  tenantId: string;  // ← Tenant context
  role: string;
  email: string;
}

// After JWT validation:
request.user = {
  userId: decodedToken.userId,
  tenantId: decodedToken.tenantId,
  role: decodedToken.role,
  email: decodedToken.email,
};
```

## Tenant Context Flow

```
1. User logs in
   ↓
2. JWT token issued with tenantId
   ↓
3. Frontend includes token in requests
   ↓
4. API validates token
   ↓
5. tenantId extracted from token
   ↓
6. All queries scoped to tenantId
   ↓
7. Response contains only tenant's data
```

## Security Rules

### ❌ Never Trust Frontend

```typescript
// ❌ DANGEROUS - Frontend can send any tenantId
@Post()
async create(@Body() dto: CreateEmployeeDto) {
  return this.service.create(dto.tenantId, dto);
}
```

### ✅ Always Use Authenticated Context

```typescript
// ✅ SAFE - tenantId from authenticated session
@Post()
async create(
  @TenantId() tenantId: string,
  @Body() dto: CreateEmployeeDto
) {
  return this.service.create(tenantId, dto);
}
```

## Tenant Onboarding Flow

### 1. Super Admin Creates Tenant

```typescript
POST /tenants
{
  "name": "ABC Manpower Services",
  "code": "abc-manpower",
  "contactEmail": "admin@abcmanpower.com",
  "contactPhone": "+91-9876543210"
}
```

### 2. Tenant Admin User Created

```typescript
POST /users
{
  "tenantId": "tenant-uuid",
  "email": "admin@abcmanpower.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "tenant_admin",
  "password": "secure-password"
}
```

### 3. Tenant Admin Logs In

```typescript
POST /auth/login
{
  "email": "admin@abcmanpower.com",
  "password": "secure-password"
}

// Response includes JWT with tenantId
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-uuid",
    "tenantId": "tenant-uuid",
    "role": "tenant_admin"
  }
}
```

### 4. All Subsequent Requests Scoped

Every API call automatically scoped to `tenant-uuid`.

## Cross-Tenant Operations

### Allowed

- Super admin viewing tenant list
- Super admin managing tenant status
- Super admin viewing platform-level analytics

### Forbidden

- Tenant A accessing Tenant B's employees
- Tenant A viewing Tenant B's clients
- Tenant A modifying Tenant B's data
- Any cross-tenant data queries

## Database Indexes

Critical indexes for tenant isolation performance:

```sql
-- Every tenant-owned table should have this
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_candidates_tenant ON candidates(tenant_id);
CREATE INDEX idx_attendance_tenant ON attendance(tenant_id);
-- etc.
```

## Testing Tenant Isolation

### Unit Tests

```typescript
describe('EmployeesService', () => {
  it('should only return employees for specified tenant', async () => {
    const tenantAEmployees = await service.findAll('tenant-a-id');
    const tenantBEmployees = await service.findAll('tenant-b-id');
    
    expect(tenantAEmployees).not.toContainEqual(
      expect.objectContaining({ tenantId: 'tenant-b-id' })
    );
  });
});
```

### Integration Tests

```typescript
it('should not allow cross-tenant access', async () => {
  // Login as Tenant A admin
  const tokenA = await loginAs('tenant-a-admin');
  
  // Try to access Tenant B's employee
  const response = await request(app)
    .get('/employees/tenant-b-employee-id')
    .set('Authorization', `Bearer ${tokenA}`);
  
  expect(response.status).toBe(404); // Not found (not unauthorized)
});
```

## Monitoring

Track these metrics:
- Cross-tenant query attempts (should be 0)
- Queries without tenant_id filter (should be 0)
- Tenant data size growth
- Per-tenant API usage

## Future Enhancements

### Tenant-Specific Databases

For very large tenants, consider:
- Separate database per tenant
- Connection pooling per tenant
- Tenant-specific read replicas

### Tenant-Specific Configuration

```typescript
interface TenantSettings {
  features: {
    advancedReporting: boolean;
    mobileApp: boolean;
    apiAccess: boolean;
  };
  limits: {
    maxEmployees: number;
    maxLocations: number;
    storageQuota: number;
  };
}
```

## Compliance

Tenant isolation ensures:
- **GDPR compliance** - Data segregation
- **Data residency** - Per-tenant data location
- **Audit trails** - Per-tenant activity logs
- **Data export** - Tenant-specific data dumps
