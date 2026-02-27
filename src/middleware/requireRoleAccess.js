const {
  evaluateAccess,
  parseDiscordRoleIds,
  normalizeRole,
} = require('../utils/rbac');

function getDiscordRoleIdsFromRequest(req) {
  const headerRoleIds = parseDiscordRoleIds(req.headers['x-discord-role-ids']);
  const userRoleIds = parseDiscordRoleIds(req.user?.discord_role_ids);
  const sessionRoleIds = parseDiscordRoleIds(req.session?.discordRoleIds);

  return [...new Set([...headerRoleIds, ...userRoleIds, ...sessionRoleIds])];
}

function requireRoleAccess(requiredRole) {
  const normalizedRequiredRole = normalizeRole(requiredRole);

  return (req, res, next) => {
    const access = evaluateAccess({
      userRole: req.user?.role,
      discordRoleIds: getDiscordRoleIdsFromRequest(req),
      requiredRole: normalizedRequiredRole,
    });

    if (!access.allowed) {
      return res.status(403).json({
        error: 'forbidden',
        requiredRole: access.requiredRole,
      });
    }

    req.authorization = access;
    return next();
  };
}

const requireOfficerAccess = requireRoleAccess('officer');
const requireSupervisorAccess = requireRoleAccess('supervisor');
const requireAdminAccess = requireRoleAccess('admin');

module.exports = {
  requireRoleAccess,
  requireOfficerAccess,
  requireSupervisorAccess,
  requireAdminAccess,
};
