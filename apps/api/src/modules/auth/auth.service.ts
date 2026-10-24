import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { db } from '@manpower/database';
import { agencyTenants, tenantAccounts } from './auth-tables';

@Injectable()
export class AuthService {
  async login(identifier: string, password: string) {
    const [record] = await db
      .select({ account: tenantAccounts, tenant: agencyTenants })
      .from(tenantAccounts)
      .innerJoin(agencyTenants, eq(tenantAccounts.tenantId, agencyTenants.id))
      .where(and(or(eq(tenantAccounts.username, identifier), eq(agencyTenants.email, identifier)), eq(tenantAccounts.status, 'ACTIVE'), eq(agencyTenants.status, 'ACTIVE')))
      .limit(1);

    if (!record || !(await argon2.verify(record.account.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: 'placeholder-token',
      user: {
        id: record.account.id,
        name: record.tenant.contactPersonName,
        email: record.tenant.email,
        role: 'Agency Admin',
        tenantId: record.tenant.id,
        tenant: { name: record.tenant.name },
      },
    };
  }
}
