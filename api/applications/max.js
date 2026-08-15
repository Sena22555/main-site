const VPS_RELAY_URL = process.env.SMARTLINE_RELAY_URL || 'https://45-138-157-79.sslip.io/applications/max';
const RELAY_SECRET = process.env.SMARTLINE_RELAY_SECRET;
const ALLOWED_ORIGIN = process.env.SMARTLINE_ALLOWED_ORIGIN || 'https://new-site-kappa-eight.vercel.app';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    if (req.headers.origin !== ALLOWED_ORIGIN) return res.status(403).json({ ok: false, error: 'Forbidden' });
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Idempotency-Key');
    return res.status(204).end();
  }
  if (req.method !== 'POST' || req.headers.origin !== ALLOWED_ORIGIN) return res.status(403).json({ ok: false, error: 'Forbidden' });
  if (!RELAY_SECRET) return res.status(503).json({ ok: false, error: 'Service unavailable' });
  try {
    const idempotencyKey = String(req.headers['x-idempotency-key'] || '').trim();
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(idempotencyKey)) return res.status(400).json({ ok: false, error: 'Missing idempotency key' });
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ ok: false, error: 'Invalid application' });
    const response = await fetch(VPS_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ALLOWED_ORIGIN,
        'X-Application-Relay-Secret': RELAY_SECRET,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(req.body)
    });
    const body = await response.text();
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.status(response.status).send(body);
  } catch {
    res.status(502).json({ ok: false, error: 'Application delivery failed' });
  }
}
