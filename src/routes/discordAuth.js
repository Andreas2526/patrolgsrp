const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const authenticateSession = require('../middleware/authenticateSession');
const {
  requireOfficerAccess,
  requireSupervisorAccess,
  requireAdminAccess,
} = require('../middleware/requireRoleAccess');

const router = express.Router();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL,
  NEXTJS_FRONTEND_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  JWT_SESSION_SECRET,
} = process.env;

if (
  !DISCORD_CLIENT_ID ||
  !DISCORD_CLIENT_SECRET ||
  !DISCORD_CALLBACK_URL ||
  !NEXTJS_FRONTEND_URL ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !JWT_SESSION_SECRET
) {
  // eslint-disable-next-line no-console
  console.warn('Missing required environment variables for Discord OAuth route.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

const DISCORD_OAUTH_URL = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_ME_URL = 'https://discord.com/api/users/@me';

router.get('/discord/login', (req, res) => {
  const state = crypto.randomUUID();
  res.cookie('discord_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  });

  const authUrl = new URL(DISCORD_OAUTH_URL);
  authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', DISCORD_CALLBACK_URL);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify');
  authUrl.searchParams.set('state', state);

  return res.redirect(authUrl.toString());
});

router.get('/session/me', authenticateSession, (req, res) => {
  return res.json({ user: req.user });
});


router.get('/protected/officer', authenticateSession, requireOfficerAccess, (req, res) => {
  return res.json({
    access: 'granted',
    requiredRole: 'officer',
    authorization: req.authorization,
  });
});

router.get('/protected/supervisor', authenticateSession, requireSupervisorAccess, (req, res) => {
  return res.json({
    access: 'granted',
    requiredRole: 'supervisor',
    authorization: req.authorization,
  });
});

router.get('/protected/admin', authenticateSession, requireAdminAccess, (req, res) => {
  return res.json({
    access: 'granted',
    requiredRole: 'admin',
    authorization: req.authorization,
  });
});

router.get('/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies.discord_oauth_state;

    if (!code || !state || state !== savedState) {
      return res.redirect(`${NEXTJS_FRONTEND_URL}/login?error=oauth_state_mismatch`);
    }

    const tokenBody = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_CALLBACK_URL,
    });

    const tokenRes = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      return res.redirect(`${NEXTJS_FRONTEND_URL}/login?error=discord_token_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const meRes = await fetch(DISCORD_ME_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meRes.ok) {
      return res.redirect(`${NEXTJS_FRONTEND_URL}/login?error=discord_profile_failed`);
    }

    const discordUser = await meRes.json();

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          discord_id: discordUser.id,
          username: discordUser.username,
          avatar: avatarUrl,
        },
        {
          onConflict: 'discord_id',
        },
      )
      .select('id, discord_id, username, avatar, role')
      .single();

    if (error || !user) {
      // eslint-disable-next-line no-console
      console.error('Supabase upsert failed:', error?.message || 'user_not_returned');
      return res.redirect(`${NEXTJS_FRONTEND_URL}/login?error=user_persist_failed`);
    }

    const sessionToken = jwt.sign(
      {
        userId: user.id,
        discordId: user.discord_id,
      },
      JWT_SESSION_SECRET,
      { expiresIn: '7d', subject: user.discord_id },
    );

    res.clearCookie('discord_oauth_state');

    return res.redirect(
      `${NEXTJS_FRONTEND_URL}/auth/callback?provider=discord&discord_id=${encodeURIComponent(
        discordUser.id,
      )}&token=${encodeURIComponent(sessionToken)}`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Discord callback failed:', err);
    return res.redirect(`${NEXTJS_FRONTEND_URL}/login?error=oauth_callback_failed`);
  }
});

module.exports = router;
