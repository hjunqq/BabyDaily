import { SetMetadata } from '@nestjs/common';
import { FamilyRole } from '../../modules/family/entities/family-member.entity';

export const REQUIRE_ROLE_KEY = 'requireRole';

/**
 * Decorator: minimum role required to access an endpoint.
 * Used with RoleGuard which resolves the user's role in the target family.
 */
export const RequireRole = (role: FamilyRole) =>
  SetMetadata(REQUIRE_ROLE_KEY, role);
