export default async function handler(req, res) {
  // Simple auth check
  const { secret } = req.query;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { kv } = await import('@vercel/kv');
  const emails = await kv.lrange('waitlist:all', 0, -1);

  return res.status(200).json({
    count: emails.length,
    emails
  });
}
