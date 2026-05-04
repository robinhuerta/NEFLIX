import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(movies) {
  const catalog = movies
    .map(m => `- "${m.title}" | Género: ${m.genre || m.category || 'General'} | ${m.description ? m.description.slice(0, 80) : ''}`)
    .join('\n');

  return `Eres COSMOS Assistant, el recomendador de películas y series de la plataforma COSMOS (similar a Netflix).

Tu trabajo es ayudar a los usuarios a encontrar qué ver según su estado de ánimo, género favorito, o lo que describan.

Catálogo actual disponible en COSMOS:
${catalog || 'Catálogo cargando...'}

Reglas:
- Recomienda SOLO títulos que estén en el catálogo anterior.
- Si el usuario pide algo que no tenemos, dilo amablemente y sugiere algo similar que sí tengamos.
- Sé breve, amigable y entusiasta. Máximo 3 recomendaciones por respuesta.
- Responde siempre en español.
- No inventes películas ni series que no estén en el catálogo.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, movies = [] } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: buildSystemPrompt(movies),
      messages,
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Error Claude API:', err.message);
    res.status(500).json({ error: 'Error al contactar con Claude' });
  }
}
