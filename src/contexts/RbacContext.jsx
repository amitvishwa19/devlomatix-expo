import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getSession } from '~/utils/authStorage';
import {
  isSuperAdmin as checkSuperAdmin,
  isAdmin as checkAdmin,
  extractUserPermissions,
  extractUserRoles,
  matchPermission,
  canAccessModule as checkCanAccessModule,
  normalizeIdentifier,
} from '~/utils/rbac';

export const RbacContext = createContext(null);

export function RbacProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session from authStorage
  const loadSession = useCallback(async () => {
    try {
      const session = await getSession();
      setUser(session?.user ?? null);
    } catch (err) {
      console.warn('[RBAC] Error loading session:', err?.message || err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Derived properties
  const isSuperAdmin = useMemo(() => checkSuperAdmin(user), [user]);
  const isAdmin = useMemo(() => checkAdmin(user), [user]);
  const permissions = useMemo(() => extractUserPermissions(user), [user]);
  const roles = useMemo(() => extractUserRoles(user), [user]);

  /**
   * Evaluates if user has a permission.
   * SuperAdmin bypasses and returns true unconditionally.
   */
  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return true;
      if (isSuperAdmin) return true;
      return matchPermission(permissions, permission);
    },
    [isSuperAdmin, permissions]
  );

  /**
   * Evaluates if user has ANY of the permissions in the list.
   */
  const hasAnyPermission = useCallback(
    (permissionsList) => {
      if (!Array.isArray(permissionsList) || permissionsList.length === 0) return true;
      if (isSuperAdmin) return true;
      return permissionsList.some((p) => hasPermission(p));
    },
    [isSuperAdmin, hasPermission]
  );

  /**
   * Evaluates if user has ALL of the permissions in the list.
   */
  const hasAllPermissions = useCallback(
    (permissionsList) => {
      if (!Array.isArray(permissionsList) || permissionsList.length === 0) return true;
      if (isSuperAdmin) return true;
      return permissionsList.every((p) => hasPermission(p));
    },
    [isSuperAdmin, hasPermission]
  );

  /**
   * Evaluates if user has a role (case-insensitive).
   * SuperAdmin bypasses and returns true unconditionally.
   */
  const hasRole = useCallback(
    (roleName) => {
      if (!roleName) return true;
      if (isSuperAdmin) return true;
      const targetNorm = normalizeIdentifier(roleName);
      return roles.some((r) => normalizeIdentifier(r) === targetNorm);
    },
    [isSuperAdmin, roles]
  );

  /**
   * Evaluates if user has ANY role in the list.
   */
  const hasAnyRole = useCallback(
    (rolesList) => {
      if (!Array.isArray(rolesList) || rolesList.length === 0) return true;
      if (isSuperAdmin) return true;
      return rolesList.some((r) => hasRole(r));
    },
    [isSuperAdmin, hasRole]
  );

  /**
   * CRUD Action helper methods matching web usePermissions API:
   * canCreate('deal') checks create:deal or deal.create
   */
  const canCreate = useCallback(
    (resource) => {
      if (!resource) return true;
      if (isSuperAdmin) return true;
      return hasPermission(`create:${resource}`) || hasPermission(`${resource}.create`);
    },
    [isSuperAdmin, hasPermission]
  );

  const canRead = useCallback(
    (resource) => {
      if (!resource) return true;
      if (isSuperAdmin) return true;
      return hasPermission(`read:${resource}`) || hasPermission(`${resource}.read`);
    },
    [isSuperAdmin, hasPermission]
  );

  const canUpdate = useCallback(
    (resource) => {
      if (!resource) return true;
      if (isSuperAdmin) return true;
      return hasPermission(`update:${resource}`) || hasPermission(`${resource}.update`);
    },
    [isSuperAdmin, hasPermission]
  );

  const canDelete = useCallback(
    (resource) => {
      if (!resource) return true;
      if (isSuperAdmin) return true;
      return hasPermission(`delete:${resource}`) || hasPermission(`${resource}.delete`);
    },
    [isSuperAdmin, hasPermission]
  );

  /**
   * Module access check (e.g. CRM, KonnectX, Curexa)
   */
  const canAccessModule = useCallback(
    (moduleName) => {
      return checkCanAccessModule(moduleName, user);
    },
    [user]
  );

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      roles,
      permissions,
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
      canAccessModule,
      refreshPermissions: loadSession,
    }),
    [
      user,
      loading,
      roles,
      permissions,
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
      canAccessModule,
      loadSession,
    ]
  );

  return <RbacContext.Provider value={contextValue}>{children}</RbacContext.Provider>;
}

export function useRbac() {
  const context = useContext(RbacContext);
  if (!context) {
    throw new Error('useRbac must be used within an RbacProvider');
  }
  return context;
}
