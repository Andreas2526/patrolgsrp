const ROLE_ORDER = {
  officer: 1,
  supervisor: 2,
  admin: 3,
};

const ROLE_ID_ENV_KEYS = {
  admin: 'DISCORD_ADMIN_ROLE_ID',
  supervisor: 'DISCORD_SUPERVISOR_ROLE_ID',
  officer: 'DISCORD_OFFICER_ROLE_ID',
};

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : '';
}

function parseDiscordRoleIds(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getConfiguredDiscordRoleIds() {
  return {
    admin: parseDiscordRoleIds(process.env[ROLE_ID_ENV_KEYS.admin]),
    supervisor: parseDiscordRoleIds(process.env[ROLE_ID_ENV_KEYS.supervisor]),
    officer: parseDiscordRoleIds(process.env[ROLE_ID_ENV_KEYS.officer]),
  };
}

function rolesAtOrAbove(requiredRole) {
  const required = normalizeRole(requiredRole);
  const requiredRank = ROLE_ORDER[required];

  if (!requiredRank) {
    throw new Error(`Unknown required role: ${requiredRole}`);
  }

  return Object.keys(ROLE_ORDER).filter((role) => ROLE_ORDER[role] >= requiredRank);
}

function hasMinimumDatabaseRole(userRole, requiredRole) {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedRequiredRole = normalizeRole(requiredRole);

  return (
    Boolean(ROLE_ORDER[normalizedUserRole])
    && Boolean(ROLE_ORDER[normalizedRequiredRole])
    && ROLE_ORDER[normalizedUserRole] >= ROLE_ORDER[normalizedRequiredRole]
  );
}

function hasMinimumDiscordRole(discordRoleIds, requiredRole, configuredRoleIds = getConfiguredDiscordRoleIds()) {
  const memberRoleIds = new Set(parseDiscordRoleIds(discordRoleIds));

  if (!memberRoleIds.size) {
    return false;
  }

  const eligibleRoles = rolesAtOrAbove(requiredRole);

  return eligibleRoles.some((role) => {
    const configuredIds = configuredRoleIds[role] || [];
    return configuredIds.some((roleId) => memberRoleIds.has(roleId));
  });
}

function evaluateAccess({ userRole, discordRoleIds, requiredRole }) {
  const normalizedRequiredRole = normalizeRole(requiredRole);
  const fromDatabase = hasMinimumDatabaseRole(userRole, normalizedRequiredRole);
  const fromDiscord = hasMinimumDiscordRole(discordRoleIds, normalizedRequiredRole);

  return {
    allowed: fromDatabase || fromDiscord,
    reason: fromDatabase
      ? 'granted_by_database_role'
      : fromDiscord
        ? 'granted_by_discord_role'
        : 'insufficient_role',
    fromDatabase,
    fromDiscord,
    requiredRole: normalizedRequiredRole,
  };
}

module.exports = {
  ROLE_ORDER,
  normalizeRole,
  parseDiscordRoleIds,
  getConfiguredDiscordRoleIds,
  hasMinimumDatabaseRole,
  hasMinimumDiscordRole,
  evaluateAccess,
};
