import { useContext } from 'react';
import { RbacContext } from '~/contexts/RbacContext';

/**
 * Mobile RBAC hook with exact parity to Web usePermissions hook.
 *
 * Exposes:
 *  - permissions: string[]
 *  - roles: string[]
 *  - isSuperAdmin: boolean
 *  - isAdmin: boolean
 *  - hasPermission: (perm: string) => boolean
 *  - hasAnyPermission: (perms: string[]) => boolean
 *  - hasAllPermissions: (perms: string[]) => boolean
 *  - hasRole: (role: string) => boolean
 *  - hasAnyRole: (roles: string[]) => boolean
 *  - canCreate: (resource: string) => boolean
 *  - canRead: (resource: string) => boolean
 *  - canUpdate: (resource: string) => boolean
 *  - canDelete: (resource: string) => boolean
 *  - canAccessModule: (moduleName: string) => boolean
 *  - refreshPermissions: () => Promise<void>
 */
export function usePermissions() {
  const context = useContext(RbacContext);

  if (!context) {
    // Graceful fallback if context isn't mounted yet
    return {
      user: null,
      loading: false,
      permissions: [],
      roles: [],
      isSuperAdmin: false,
      isAdmin: false,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      canCreate: () => false,
      canRead: () => false,
      canUpdate: () => false,
      canDelete: () => false,
      canAccessModule: () => false,
      refreshPermissions: async () => {},
    };
  }

  return context;
}

export default usePermissions;
