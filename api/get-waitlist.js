export default async function handler(req, res) {
  const { secret } = req.query;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const response = await fetch(
    `${url}/lrange/waitlist:all/0/-1`,
    { headers: { Authorization: `Bearer ${token}` }}
  );
  const data = await response.json();
  const emails = data.result || [];

  return res.status(200).json({
    count: emails.length,
    emails
  });
}
