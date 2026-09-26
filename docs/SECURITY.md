# Security Guidelines

## Overview

Security is a first-class requirement for this platform. This document outlines security measures and best practices.

## Authentication

### Password Security

**Hashing Algorithm:** Argon2id

```typescript
import * as argon2 from 'argon2';

// Hash password
const hash = await argon2.hash(password);

// Verify password
const isValid = await argon2.verify(hash, password);
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special characters

### Token-Based Authentication

**Access Tokens:**
- Short-lived (15 minutes)
- JWT format
- Includes user ID, tenant ID, role
- Signed with secret key

**Refresh Tokens:**
- Longer-lived (7 days)
- Stored in HttpOnly cookies
- Rotation on use
- Revocable

### Session Management

```typescript
// Cookie configuration
{
  httpOnly: true,      // Prevents XSS attacks
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

## Authorization

### Role-Based Access Control (RBAC)

**Roles:**
- `super_admin` - Platform administrator
- `tenant_admin` - Tenant administrator
- `manager` - Tenant manager
- `employee` - Regular employee

**Permission Checks:**

```typescript
import { Permission, hasPermission } from '@manpower/permissions';

// In controller
@UseGuards(PermissionGuard(Permission.EMPLOYEE_CREATE))
@Post()
async create(@Body() dto: CreateEmployeeDto) {
  // Only users with EMPLOYEE_CREATE permission can access
}
```

### Tenant Isolation

**Critical Rules:**
1. Never trust `tenantId` from request body
2. Always extract `tenantId` from authenticated token
3. Validate tenant access in every operation
4. Use database-level tenant filtering

```typescript
// ❌ WRONG
async getEmployee(employeeId: string, tenantId: string) {
  return db.query.employees.findFirst({
    where: eq(employees.id, employeeId)
    // Missing tenant check!
  });
}

// ✅ CORRECT
async getEmployee(employeeId: string, tenantId: string) {
  return db.query.employees.findFirst({
    where: and(
      eq(employees.id, employeeId),
      eq(employees.tenantId, tenantId)  // Tenant isolation
    )
  });
}
```

## Input Validation

### Zod Schemas

All inputs validated using Zod:

```typescript
import { z } from 'zod';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
});
```

### SQL Injection Prevention

**Using Drizzle ORM:**
- Parameterized queries by default
- Type-safe query builder
- No raw SQL strings

```typescript
// ✅ SAFE - Parameterized
db.select()
  .from(employees)
  .where(eq(employees.email, userInput));

// ❌ DANGEROUS - Never do this
db.execute(sql`SELECT * FROM employees WHERE email = '${userInput}'`);
```

## HTTPS & Transport Security

### Production Requirements

```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Security Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## CORS Configuration

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Login endpoint rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
});

app.use('/auth/login', loginLimiter);
```

## Document Security

### Private Document Storage

**Architecture:**
1. Documents stored in private S3 bucket
2. Metadata in PostgreSQL
3. Access via signed URLs only
4. Short-lived URLs (5-15 minutes)

```typescript
// Generate signed URL
const signedUrl = await s3.getSignedUrlPromise('getObject', {
  Bucket: 'private-documents',
  Key: documentKey,
  Expires: 900, // 15 minutes
});
```

### Document Access Control

```typescript
async getDocument(documentId: string, userId: string, tenantId: string) {
  // 1. Verify document belongs to tenant
  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.tenantId, tenantId)
    )
  });
  
  if (!document) {
    throw new NotFoundException();
  }
  
  // 2. Verify user has permission
  if (!hasPermission(user.role, Permission.DOCUMENT_READ)) {
    throw new ForbiddenException();
  }
  
  // 3. Generate signed URL
  return generateSignedUrl(document.storageKey);
}
```

## Sensitive Data Handling

### PII Protection

**Sensitive Fields:**
- Aadhaar numbers
- PAN numbers
- Bank account details
- Medical records
- Police verification documents

**Protection Measures:**
1. Encrypt at rest (database encryption)
2. Encrypt in transit (HTTPS)
3. Mask in logs
4. Audit access
5. Limit who can view

```typescript
// Mask sensitive data in logs
function maskAadhaar(aadhaar: string): string {
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

logger.info(`Employee created`, {
  employeeId: employee.id,
  aadhaar: maskAadhaar(employee.aadhaarNumber),
});
```

## Audit Logging

### What to Log

```typescript
interface AuditLog {
  tenantId: string;
  userId: string;
  action: string;        // 'create', 'update', 'delete', 'view'
  resource: string;      // 'employee', 'document', etc.
  resourceId: string;
  changes?: object;      // Before/after for updates
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### Critical Actions to Audit

- User login/logout
- Password changes
- Employee creation/deletion
- Document access
- Sensitive data modifications
- Permission changes
- Tenant configuration changes

## Environment Variables

### Secret Management

```bash
# ❌ NEVER commit these to Git
JWT_ACCESS_SECRET=actual-secret-here
JWT_REFRESH_SECRET=actual-secret-here
DATABASE_PASSWORD=actual-password-here

# ✅ Use .env.example with placeholders
JWT_ACCESS_SECRET=your-access-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
DATABASE_PASSWORD=your-database-password
```

### Production Secrets

Use environment variable management:
- Railway: Built-in secrets
- Render: Environment variables
- Vercel: Environment variables
- AWS: Secrets Manager
- Azure: Key Vault

## Database Security

### Connection Security

```typescript
// Use SSL in production
const connectionString = process.env.DATABASE_URL + '?sslmode=require';
```

### Least Privilege

```sql
-- Application user should NOT have:
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- No DROP, ALTER, or admin privileges
```

### Backup & Recovery

- Automated daily backups
- Point-in-time recovery enabled
- Backup encryption
- Test restore procedures regularly

## Frontend Security

### XSS Prevention

```typescript
// React automatically escapes content
<div>{userInput}</div>  // Safe

// Dangerous - avoid dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Unsafe
```

### CSRF Protection

- SameSite cookies
- CSRF tokens for state-changing operations
- Verify origin header

### Dependency Security

```bash
# Regular security audits
pnpm audit

# Update dependencies
pnpm update
```

## Security Checklist

### Development

- [ ] All passwords hashed with Argon2id
- [ ] Input validation on all endpoints
- [ ] Tenant isolation enforced
- [ ] No secrets in code
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

### Production

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Database backups automated
- [ ] Secrets in environment variables
- [ ] Error messages don't leak info
- [ ] CORS properly configured

### Monitoring

- [ ] Failed login attempts tracked
- [ ] Unusual access patterns detected
- [ ] Cross-tenant access attempts logged
- [ ] API rate limit violations monitored
- [ ] Security audit logs reviewed

## Incident Response

### Security Breach Protocol

1. **Immediate Actions**
   - Identify affected systems
   - Isolate compromised components
   - Revoke compromised credentials
   - Enable additional logging

2. **Investigation**
   - Review audit logs
   - Identify breach scope
   - Document timeline
   - Preserve evidence

3. **Remediation**
   - Patch vulnerabilities
   - Reset affected credentials
   - Notify affected users
   - Update security measures

4. **Post-Incident**
   - Conduct security review
   - Update procedures
   - Implement additional controls
   - Train team on lessons learned

## Compliance

### Data Protection

- GDPR compliance for EU users
- Data minimization
- Right to erasure
- Data portability
- Consent management

### Indian Regulations

- Aadhaar data handling per UIDAI guidelines
- PAN data security
- Labor law compliance
- Data localization requirements
