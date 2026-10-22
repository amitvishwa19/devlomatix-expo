import React from 'react';
import { usePermissions } from '~/hooks/usePermissions';

/**
 * Declarative component for guarding UI elements based on roles and permissions.
 *
 * Examples:
 *  <PermissionGate action="delete" resource="deal">
 *    <DeleteDealButton />
 *  </PermissionGate>
 *
 *  <PermissionGate role={['Super Admin', 'Admin']} fallback={<LockedBadge />}>
 *    <AdminSettings />
 *  </PermissionGate>
 *
 *  <PermissionGate permission="crm.export">
 *    <ExportCsvButton />
 *  </PermissionGate>
 */
export function PermissionGate({
  action,
  resource,
  permission,
  permissions,
  matchAll = false,
  role,
  roles,
  requireSuperAdmin = false,
  requireAdmin = false,
  inverse = false,
  fallback = null,
  children,
}) {
  const {
    isSuperAdmin,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  } = usePermissions();

  // Super Admin bypasses all checks unless inverse is requested
  if (isSuperAdmin && !inverse) {
    return <>{children}</>;
  }

  let isAllowed = true;

  // 1. Super Admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    isAllowed = false;
  }

  // 2. Admin requirement
  if (isAllowed && requireAdmin && !isAdmin) {
    isAllowed = false;
  }

  // 3. Action + Resource check (e.g. action="delete" resource="deal")
  if (isAllowed && action && resource) {
    switch (action.toLowerCase()) {
      case 'create':
        isAllowed = canCreate(resource);
        break;
      case 'read':
        isAllowed = canRead(resource);
        break;
      case 'update':
      case 'edit':
        isAllowed = canUpdate(resource);
        break;
      case 'delete':
        isAllowed = canDelete(resource);
        break;
      default:
        isAllowed = hasPermission(`${action}:${resource}`);
        break;
    }
  }

  // 4. Single permission check
  if (isAllowed && permission) {
    isAllowed = hasPermission(permission);
  }

  // 5. Multiple permissions check
  if (isAllowed && Array.isArray(permissions) && permissions.length > 0) {
    isAllowed = matchAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  // 6. Single role check
  if (isAllowed && role) {
    isAllowed = hasRole(role);
  }

  // 7. Multiple roles check
  if (isAllowed && Array.isArray(roles) && roles.length > 0) {
    isAllowed = hasAnyRole(roles);
  }

  // Handle inverse gating (e.g. show "Locked" view when permission is MISSING)
  const shouldRender = inverse ? !isAllowed : isAllowed;

  if (!shouldRender) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Convenient alias
export const Can = PermissionGate;

export default PermissionGate;
