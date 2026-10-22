/**
 * Devlomatix Mobile RBAC (Role-Based Access Control) Utilities
 * Mirrors web engine from src/lib/rbac-utils.js
 */

/**
 * Normalizes a role, permission, or module slug for case-insensitive and symbol-agnostic comparisons.
 * e.g., "SUPER_ADMIN", "super-admin", "Super Admin" all become "superadmin".
 *
 * @param {string|any} str
 * @returns {string}
 */
export function normalizeIdentifier(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks whether a given user possesses Super Admin privileges.
 * Super Admins bypass all role and permission restrictions across the entire application.
 *
 * @param {object|null} user - User session object from authStorage
 * @returns {boolean}
 */
export function isSuperAdmin(user) {
  if (!user) return false;

  // 1. Direct role string property (e.g. user.role === 'SUPERADMIN' or 'SUPER_ADMIN')
  if (typeof user.role === 'string') {
    const norm = normalizeIdentifier(user.role);
    if (norm === 'superadmin') return true;
  }

  // 2. Roles array check
  const roles = Array.isArray(user.roles) ? user.roles : [];
  for (const r of roles) {
    if (typeof r === 'string' && normalizeIdentifier(r) === 'superadmin') {
      return true;
    }
    if (r && typeof r === 'object') {
      if (
        normalizeIdentifier(r.title) === 'superadmin' ||
        normalizeIdentifier(r.name) === 'superadmin' ||
        normalizeIdentifier(r.slug) === 'superadmin' ||
        normalizeIdentifier(r.role) === 'superadmin'
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks whether a given user possesses Admin privileges (Super Admin or Admin).
 *
 * @param {object|null} user
 * @returns {boolean}
 */
export function isAdmin(user) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  if (typeof user.role === 'string') {
    const norm = normalizeIdentifier(user.role);
    if (norm === 'admin') return true;
  }

  const roles = Array.isArray(user.roles) ? user.roles : [];
  for (const r of roles) {
    if (typeof r === 'string' && normalizeIdentifier(r) === 'admin') {
      return true;
    }
    if (r && typeof r === 'object') {
      if (
        normalizeIdentifier(r.title) === 'admin' ||
        normalizeIdentifier(r.name) === 'admin' ||
        normalizeIdentifier(r.slug) === 'admin' ||
        normalizeIdentifier(r.role) === 'admin'
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Resolves recursive role permissions based on parentId hierarchy.
 *
 * @param {Array<object>} allRoles
 * @param {string} roleId
 * @param {Set<string>} visited
 * @returns {Array<object>}
 */
function resolveInheritedPermissions(allRoles, roleId, visited = new Set()) {
  if (!roleId || visited.has(roleId)) return [];
  visited.add(roleId);

  const role = allRoles.find((r) => r.id === roleId);
  if (!role) return [];

  let perms = Array.isArray(role.permissions) ? [...role.permissions] : [];

  if (role.parentId) {
    const parentPerms = resolveInheritedPermissions(allRoles, role.parentId, visited);
    parentPerms.forEach((pp) => {
      const ppVal = typeof pp === 'string' ? pp : pp.value || pp.slug || pp.id;
      const exists = perms.some((p) => {
        const pVal = typeof p === 'string' ? p : p.value || p.slug || p.id;
        return pVal === ppVal;
      });
      if (!exists) {
        perms.push(pp);
      }
    });
  }

  return perms;
}

/**
 * Extracts a flattened array of unique active permission values from a user object.
 *
 * @param {object|null} user
 * @returns {string[]} Array of unique permission values (e.g. ['create:contact', 'navbar:crm:Parent'])
 */
export function extractUserPermissions(user) {
  if (!user) return [];

  const permsSet = new Set();

  // 1. Direct permissions array if present
  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((p) => {
      if (typeof p === 'string' && p.trim()) permsSet.add(p.trim());
      else if (p && typeof p === 'object') {
        const val = p.value || p.slug || p.title;
        if (val && (p.status === undefined || p.status === true)) {
          permsSet.add(String(val).trim());
        }
      }
    });
  }

  // 2. Permissions inside roles
  const roles = Array.isArray(user.roles) ? user.roles : [];
  for (const role of roles) {
    if (role && typeof role === 'object') {
      let rolePerms = Array.isArray(role.permissions) ? role.permissions : [];

      // Check if role has inherited parent permissions
      if (role.parentId) {
        rolePerms = resolveInheritedPermissions(roles, role.id);
      }

      rolePerms.forEach((p) => {
        if (typeof p === 'string' && p.trim()) permsSet.add(p.trim());
        else if (p && typeof p === 'object') {
          const val = p.value || p.slug || p.title;
          if (val && (p.status === undefined || p.status === true)) {
            permsSet.add(String(val).trim());
          }
        }
      });
    }
  }

  return Array.from(permsSet);
}

/**
 * Extracts a flattened list of active role titles/names from a user session.
 *
 * @param {object|null} user
 * @returns {string[]} Array of role names (e.g. ['Super Admin', 'Sales Rep'])
 */
export function extractUserRoles(user) {
  if (!user) return [];

  const rolesSet = new Set();

  if (typeof user.role === 'string' && user.role.trim()) {
    rolesSet.add(user.role.trim());
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      if (typeof r === 'string' && r.trim()) {
        rolesSet.add(r.trim());
      } else if (r && typeof r === 'object') {
        const title = r.title || r.name || r.slug;
        if (title && (r.status === undefined || r.status === true)) {
          rolesSet.add(String(title).trim());
        }
      }
    });
  }

  return Array.from(rolesSet);
}

/**
 * Determines whether a user's permissions match a target permission.
 * Supports:
 *  - Exact match: 'create:contact' === 'create:contact'
 *  - Wildcard match: 'crm.*' matches 'crm.create' or 'crm:delete', '*' matches all
 *  - Dual syntax parity: 'create:deal' matches 'deal.create' and vice-versa
 *
 * @param {string[]} userPermissions
 * @param {string} targetPermission
 * @returns {boolean}
 */
export function matchPermission(userPermissions, targetPermission) {
  if (!targetPermission) return true;
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false;

  const target = targetPermission.trim().toLowerCase();
  const targetNorm = normalizeIdentifier(target);

  // Check wildcards in user permissions: '*' allows everything
  if (userPermissions.includes('*') || userPermissions.includes('*:*')) {
    return true;
  }

  for (const perm of userPermissions) {
    const p = perm.trim().toLowerCase();

    // 1. Direct exact match
    if (p === target) return true;

    // 2. Normalized match (ignoring colons, dots, underscores, case)
    if (normalizeIdentifier(p) === targetNorm) return true;

    // 3. Wildcard prefix match (e.g. 'crm.*' or 'crm:*' matches 'crm:create' or 'crm.delete')
    if (p.endsWith('.*') || p.endsWith(':*')) {
      const prefix = p.slice(0, -2);
      if (target.startsWith(prefix + '.') || target.startsWith(prefix + ':')) {
        return true;
      }
    }

    // 4. Action:Resource vs Resource:Action parity
    // e.g. 'delete:deal' matches 'deal.delete' or 'deal:delete'
    const pParts = p.split(/[:.]/);
    const targetParts = target.split(/[:.]/);
    if (pParts.length === 2 && targetParts.length === 2) {
      if (
        (pParts[0] === targetParts[1] && pParts[1] === targetParts[0]) ||
        (pParts[0] === targetParts[0] && pParts[1] === targetParts[1])
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates whether a user can access a high-level module (e.g. CRM, KonnectX, Curexa, CrystalAura).
 *
 * @param {string} moduleName
 * @param {object|null} user
 * @returns {boolean}
 */
export function canAccessModule(moduleName, user) {
  if (!moduleName) return true;
  if (isSuperAdmin(user)) return true;

  const userRoles = extractUserRoles(user);
  const userPerms = extractUserPermissions(user);
  const normTarget = normalizeIdentifier(moduleName);

  // 1. Check if user has a role with the module title (e.g. role 'Devx(CRM)' or 'KonnectX')
  if (userRoles.some((r) => normalizeIdentifier(r) === normTarget)) {
    return true;
  }

  // 2. Check standard navigation permission patterns
  // e.g. 'navbar:DevX(CRM):Parent', 'navbar:crm:Parent', 'navbar:crm'
  const navCandidates = [
    `navbar:${moduleName}:Parent`,
    `navbar:${moduleName}`,
    `module:${moduleName}`,
    moduleName,
  ];

  for (const candidate of navCandidates) {
    if (matchPermission(userPerms, candidate)) return true;
  }

  // 3. Fallback: check if user has any permission starting with module name
  return userPerms.some((p) => {
    const normP = normalizeIdentifier(p);
    return normP.includes(normTarget);
  });
}
