const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticateSession = require('../middleware/authenticateSession');
const { requireSupervisorAccess } = require('../middleware/requireRoleAccess');

const router = express.Router();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Missing required environment variables for zones routes.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

router.get('/zones', async (req, res) => {
  const { data: zones, error } = await supabase
    .from('zones')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch zones:', error.message);
    return res.status(500).json({ error: 'zones_fetch_failed' });
  }

  return res.json({ zones: zones || [] });
});

router.post('/zones', authenticateSession, requireSupervisorAccess, async (req, res) => {
  const { name } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'invalid_zone_name' });
  }

  const { data: zone, error } = await supabase
    .from('zones')
    .insert({ name: name.trim() })
    .select('*')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create zone:', error.message);
    return res.status(500).json({ error: 'zone_create_failed' });
  }

  return res.status(201).json({ zone });
});

router.delete('/zones/:id', authenticateSession, requireSupervisorAccess, async (req, res) => {
  const zoneId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(zoneId) || zoneId <= 0) {
    return res.status(400).json({ error: 'invalid_zone_id' });
  }

  const { data: deletedZone, error } = await supabase
    .from('zones')
    .delete()
    .eq('id', zoneId)
    .select('*')
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to delete zone:', error.message);
    return res.status(500).json({ error: 'zone_delete_failed' });
  }

  if (!deletedZone) {
    return res.status(404).json({ error: 'zone_not_found' });
  }

  return res.json({ deleted: true, zone: deletedZone });
});

module.exports = router;
