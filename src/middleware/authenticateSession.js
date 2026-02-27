const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  JWT_SESSION_SECRET,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !JWT_SESSION_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('Missing required environment variables for session authentication middleware.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

function getSessionToken(req) {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  return req.cookies.session_token || bearerToken || null;
}

async function authenticateSession(req, res, next) {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({ error: 'missing_session_token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SESSION_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'invalid_session_token' });
  }

  const userId = payload.userId || payload.id || null;
  const discordId = payload.discordId || payload.sub || null;

  if (!userId && !discordId) {
    return res.status(401).json({ error: 'invalid_session_payload' });
  }

  const query = supabase
    .from('users')
    .select('id, discord_id, username, avatar, role, created_at, last_login')
    .limit(1)
    .maybeSingle();

  if (userId) {
    query.eq('id', userId);
  } else {
    query.eq('discord_id', discordId);
  }

  const { data: user, error } = await query;

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Session auth user lookup failed:', error.message);
    return res.status(500).json({ error: 'user_lookup_failed' });
  }

  if (!user) {
    return res.status(401).json({ error: 'session_user_not_found' });
  }

  req.user = user;
  req.session = payload;
  return next();
}

module.exports = authenticateSession;
