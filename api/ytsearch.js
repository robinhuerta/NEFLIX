export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, max = '12' } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: 'q requerido' });

  const keys = [
    process.env.VITE_YOUTUBE_API_KEY,
    process.env.VITE_YOUTUBE_API_KEY_2,
  ].filter(Boolean);

  if (!keys.length) return res.status(500).json({ error: 'API key no configurada' });

  const url = (key) =>
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${max}&q=${encodeURIComponent(q)}&key=${key}`;

  for (const key of keys) {
    try {
      const resp = await fetch(url(key));
      const data = await resp.json();
      // Si esta clave tiene cuota agotada, intenta la siguiente
      if (data.error?.errors?.[0]?.reason === 'quotaExceeded' || data.error?.errors?.[0]?.reason === 'dailyLimitExceeded') continue;
      return res.status(resp.status).json(data);
    } catch {
      continue;
    }
  }

  res.status(429).json({ error: 'Cuota de YouTube agotada en todas las claves. Intenta mañana.' });
}
