import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/AppError';
import { RateLimiter } from '@/lib/rateLimiter';
import { logger } from '@/lib/serverLogger';
import { getUserRolesAndPermissions } from '@/lib/auth/roleService';
import { PermissionCheck } from '@/types/roles';

// Create a rate limiter instance with default values
const authRateLimiter = new RateLimiter();

type RouteParams = {
  params?: { [key: string]: string };
  searchParams?: { [key: string]: string };
};

export async function verifyAuth(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Rate limit check
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    await authRateLimiter.check(clientIp);

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    const { payload } = await jwtVerify(token, secretKey);

    // Verify user exists and is active
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: {
        twoFactorConfirmation: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AuthenticationError('Email not verified');
    }

    // Check if 2FA is required but not confirmed
    if (user.isTwoFactorEnabled && !user.twoFactorConfirmation) {
      throw new AuthenticationError('Two-factor authentication required');
    }

    // Get user roles and permissions
    try {
      const userRolesAndPermissions = await getUserRolesAndPermissions(user.id);

      return {
        ...payload,
        user,
        // ⚠️ SECURITY: Do NOT include user.role - it doesn't exist in the database
        // Roles are stored in UserRole join table and returned in userRolesAndPermissions
        roles: userRolesAndPermissions.roles,
        permissions: userRolesAndPermissions.permissions,
        applications: userRolesAndPermissions.applications
      };
    } catch (error) {
      logger.error('Error getting user roles and permissions', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // ⚠️ SECURITY: Return empty roles/permissions on error, not a fallback role
      // This ensures users don't get unintended access if role lookup fails
      return {
        ...payload,
        user,
        roles: [],
        permissions: [],
        applications: []
      };
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AuthenticationError('Invalid token');
  }
}

type RequestHandler = (
  request: NextRequest,
  routeParams: RouteParams
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: RequestHandler, options?: {
  roles?: string[];
  permissions?: PermissionCheck;
  applicationPath?: string;
}) {
  return async (request: NextRequest, routeParams: RouteParams) => {
    try {
      const authResult = await verifyAuth(request);

      // For backward compatibility - check legacy roles
      if (options?.roles) {
        const userRoles = authResult.roles.map(r => r.name);
        const hasRole = options.roles.some(role => userRoles.includes(role) || authResult.role === role);
        
        if (!hasRole) {
          logger.warn('Unauthorized role access attempt', {
            userId: authResult.user.id,
            requiredRoles: options.roles,
            userRoles: userRoles,
            legacyRole: authResult.role
          });
          throw new AuthorizationError('Insufficient permissions');
        }
      }
      
      // Check permissions if required
      if (options?.permissions) {
        const userPermissions = authResult.permissions.map(p => p.name);
        let hasPermission = false;
        
        if (typeof options.permissions === 'string') {
          hasPermission = userPermissions.includes(options.permissions);
        } else if (Array.isArray(options.permissions)) {
          hasPermission = options.permissions.some(perm => userPermissions.includes(perm));
        } else if (typeof options.permissions === 'function') {
          hasPermission = options.permissions(userPermissions);
        }
        
        if (!hasPermission) {
          logger.warn('Unauthorized permission access attempt', {
            userId: authResult.user.id,
            requiredPermissions: typeof options.permissions === 'function' 
              ? 'custom-function' 
              : options.permissions,
            userPermissions: userPermissions
          });
          throw new AuthorizationError('Insufficient permissions');
        }
      }
      
      // Check application access if required
      if (options?.applicationPath) {
        const userApplications = authResult.applications || [];
        const hasAccess = userApplications.some(app => 
          app.path === options.applicationPath && app.isActive
        );
        
        if (!hasAccess) {
          logger.warn('Unauthorized application access attempt', {
            userId: authResult.user.id,
            requiredApplication: options.applicationPath,
            userApplications: userApplications.map(a => a.path)
          });
          throw new AuthorizationError('Application access denied');
        }
      }

      // Add user to request for downstream handlers
      request.user = authResult.user;
      request.roles = authResult.roles;
      request.permissions = authResult.permissions;
      request.applications = authResult.applications;

      return handler(request, routeParams);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new NextResponse(
          JSON.stringify({
            status: 'error',
            message: error.message,
          }),
          {
            status: error instanceof AuthenticationError ? 401 : 403,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
            },
          }
        );
      }

      return new NextResponse(
        JSON.stringify({
          status: 'error',
          message: 'Internal server error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }
  };
}

export function withRole(role: string) {
  return (handler: RequestHandler) => withAuth(handler, { roles: [role] });
}

export function withRoles(roles: string[]) {
  return (handler: RequestHandler) => withAuth(handler, { roles });
}

export function withPermission(permission: string | string[]) {
  return (handler: RequestHandler) => withAuth(handler, { permissions: permission });
}

export function withCustomPermission(permissionCheck: (permissions: string[]) => boolean) {
  return (handler: RequestHandler) => withAuth(handler, { permissions: permissionCheck });
}

export function withApplicationAccess(applicationPath: string) {
  return (handler: RequestHandler) => withAuth(handler, { applicationPath });
}

// Combine checks for more complex authorization
export function withRoleAndPermission(role: string, permission: string) {
  return (handler: RequestHandler) => withAuth(handler, { 
    roles: [role],
    permissions: permission
  });
}

export function withRoleAndApplication(role: string, applicationPath: string) {
  return (handler: RequestHandler) => withAuth(handler, { 
    roles: [role],
    applicationPath
  });
}
