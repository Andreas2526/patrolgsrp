const DISCORD_API_BASE_URL = 'https://discord.com/api';

/**
 * Validate that a Discord user belongs to a guild and has at least one allowed role.
 *
 * @param {Object} params
 * @param {string} params.accessToken - Discord OAuth access token for the user.
 * @param {string} params.userId - Discord user ID expected for this token.
 * @param {string} params.guildId - Guild ID to validate membership against.
 * @param {string[]} params.allowedRoleIds - Role IDs that grant access.
 * @param {string} params.botToken - Discord bot token used for member lookup endpoint.
 * @returns {Promise<{isMember: boolean, hasAllowedRole: boolean, memberRoles: string[]}>}
 */
async function verifyGuildMembershipAndRoles({
  accessToken,
  userId,
  guildId,
  allowedRoleIds,
  botToken,
}) {
  if (!accessToken || !userId || !guildId || !Array.isArray(allowedRoleIds) || !botToken) {
    throw new Error('Missing required arguments for Discord guild and role verification.');
  }

  const guildsResponse = await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!guildsResponse.ok) {
    throw new Error(`Failed to fetch user guilds: ${guildsResponse.status}`);
  }

  const guilds = await guildsResponse.json();
  const isMember = guilds.some((guild) => guild.id === guildId);

  if (!isMember) {
    return {
      isMember: false,
      hasAllowedRole: false,
      memberRoles: [],
    };
  }

  const memberResponse = await fetch(
    `${DISCORD_API_BASE_URL}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  );

  if (!memberResponse.ok) {
    throw new Error(`Failed to fetch guild member: ${memberResponse.status}`);
  }

  const member = await memberResponse.json();

  if (!member.user || member.user.id !== userId) {
    throw new Error('Discord member lookup returned a different user.');
  }

  const memberRoles = Array.isArray(member.roles) ? member.roles : [];
  const allowedRoleSet = new Set(allowedRoleIds);
  const hasAllowedRole = memberRoles.some((roleId) => allowedRoleSet.has(roleId));

  return {
    isMember: true,
    hasAllowedRole,
    memberRoles,
  };
}

module.exports = {
  verifyGuildMembershipAndRoles,
};
