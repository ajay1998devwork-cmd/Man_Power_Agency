export enum Permission {
  TENANT_CREATE = 'tenant:create',
  TENANT_READ = 'tenant:read',
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',

  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  CANDIDATE_CREATE = 'candidate:create',
  CANDIDATE_READ = 'candidate:read',
  CANDIDATE_UPDATE = 'candidate:update',
  CANDIDATE_DELETE = 'candidate:delete',

  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',

  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  LOCATION_CREATE = 'location:create',
  LOCATION_READ = 'location:read',
  LOCATION_UPDATE = 'location:update',
  LOCATION_DELETE = 'location:delete',

  DEPARTMENT_CREATE = 'department:create',
  DEPARTMENT_READ = 'department:read',
  DEPARTMENT_UPDATE = 'department:update',
  DEPARTMENT_DELETE = 'department:delete',

  ATTENDANCE_CREATE = 'attendance:create',
  ATTENDANCE_READ = 'attendance:read',
  ATTENDANCE_UPDATE = 'attendance:update',

  PAYROLL_CREATE = 'payroll:create',
  PAYROLL_READ = 'payroll:read',
  PAYROLL_UPDATE = 'payroll:update',

  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',

  AUDIT_VIEW = 'audit:view',
}

export const RolePermissions: Record<string, Permission[]> = {
  super_admin: [
    Permission.TENANT_CREATE,
    Permission.TENANT_READ,
    Permission.TENANT_UPDATE,
    Permission.TENANT_DELETE,
    Permission.AUDIT_VIEW,
  ],
  tenant_admin: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.CANDIDATE_CREATE,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_UPDATE,
    Permission.CANDIDATE_DELETE,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,
    Permission.LOCATION_CREATE,
    Permission.LOCATION_READ,
    Permission.LOCATION_UPDATE,
    Permission.LOCATION_DELETE,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
    Permission.PAYROLL_CREATE,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_UPDATE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.AUDIT_VIEW,
  ],
  manager: [
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_UPDATE,
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_UPDATE,
    Permission.CLIENT_READ,
    Permission.LOCATION_READ,
    Permission.DEPARTMENT_READ,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_UPDATE,
    Permission.REPORT_VIEW,
  ],
  employee: [Permission.EMPLOYEE_READ, Permission.ATTENDANCE_READ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
