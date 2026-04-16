export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const { email, honeypot } = req.body;

    // Honeypot check
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

    // Save to Upstash Redis
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    const timestamp = new Date().toISOString();

    // Check if already exists
    const checkRes = await fetch(
      `${url}/get/waitlist:${email}`,
      { headers: { Authorization: `Bearer ${token}` }}
    );
    const checkData = await checkRes.json();

    if (checkData.result) {
      return res.status(200).json({
        success: true,
        message: 'Already on waitlist'
      });
    }

    // Save email
    await fetch(`${url}/set/waitlist:${email}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        result: JSON.stringify({ email, timestamp })
      })
    });

    // Add to list
    await fetch(`${url}/lpush/waitlist:all/${email}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

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
