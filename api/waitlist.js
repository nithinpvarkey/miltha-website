export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const { email, honeypot } = req.body;

    // Honeypot check — bots fill this
    if (honeypot) {
      return res.status(200).json({ success: true });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email'
      });
    }

    // Save to Vercel KV
    const { kv } = await import('@vercel/kv');

    const timestamp = new Date().toISOString();
    const key = `waitlist:${email}`;

    // Check if already exists
    const existing = await kv.get(key);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already on waitlist'
      });
    }

    // Save email with timestamp
    await kv.set(key, {
      email,
      timestamp,
      source: 'website'
    });

    // Add to list for easy retrieval
    await kv.lpush('waitlist:all', email);

    return res.status(200).json({
      success: true,
      message: 'Added to waitlist'
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return res.status(500).json({
      error: 'Something went wrong'
    });
  }
}
