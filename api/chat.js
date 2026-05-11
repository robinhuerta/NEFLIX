import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(movies, watchHistory, myList, currentTrack) {
  const musicVideos = movies.filter(m => {
    const cat = (m.category || '').toLowerCase();
    return cat === 'videos musicales' || cat === 'musica' || cat === 'música';
  });
  const seriesVideos = movies.filter(m => {
    const cat = (m.category || '').toLowerCase();
    return cat === 'series' || cat === 'serie';
  });
  const peliculas = movies.filter(m => {
    const cat = (m.category || '').toLowerCase();
    return cat !== 'videos musicales' && cat !== 'musica' && cat !== 'música' && cat !== 'series' && cat !== 'serie';
  });

  // Include IDs so Claude can embed action markers
  const fmtMusic = (list) => list.length
    ? list.map(m => `  • [ID:${m.id}] "${m.title}"${m.artist ? ' — ' + m.artist : ''} | ${m.genre || m.category || 'General'}`).join('\n')
    : '  (sin contenido todavía)';

  const fmtVideo = (list) => list.length
    ? list.map(m => `  • [ID:${m.id}] "${m.title}" | ${m.genre || m.category || 'General'}${m.description ? ' | ' + m.description.slice(0, 60) : ''}`).join('\n')
    : '  (sin contenido todavía)';

  const watched = watchHistory.length > 0
    ? watchHistory.map(m => `  • "${m.title}" — ${Math.round((m.progress || 0) * 100)}% visto`).join('\n')
    : '  Ninguna todavía.';

  const favorites = myList.length > 0
    ? myList.map(m => `  • "${m.title}"`).join('\n')
    : '  Lista vacía.';

  const nowPlaying = currentTrack
    ? `\n🎵 REPRODUCIENDO AHORA: "${currentTrack.title}"${currentTrack.artist ? ' — ' + currentTrack.artist : ''}${currentTrack.genre ? ' | ' + currentTrack.genre : ''}`
    : '';

  return `Eres COSMOS Assistant, el asistente oficial de COSMOS — una plataforma de streaming latinoamericana tipo Netflix, de acceso libre (sin registro, solo con el link).
${nowPlaying}

════════════════════════════════
  FUNCIONALIDADES DE COSMOS
════════════════════════════════

📺 SECCIONES PRINCIPALES:
  • Inicio — Hero con película destacada, filas de tendencias y categorías
  • Series — Catálogo agrupado por serie, con temporadas y episodios
  • Películas — Agrupadas por género, con reproductor integrado
  • Música — Videos musicales con filtros por género y buscador de YouTube integrado
  • 🎧 DJ — Cabina virtual con dos tornamesas, BPM, ecualizador, lasers. Pestaña YOUTUBE DJ con búsqueda y mezcla en vivo

🎬 REPRODUCTOR DE VIDEO: play/pausa, ±10s, volumen, velocidad, pantalla completa, autoplay al terminar
🎵 MUSIC PLAYER (barra inferior): cola, shuffle, repetir, seek, volumen — soporta YouTube y audio local
📣 MARQUESINA: barra animada con saludos personalizados cuando hay música activa
🔍 BÚSQUEDA en tiempo real en toda la biblioteca
📋 MI LISTA: guardar títulos con "+"

════════════════════════════════
  CATÁLOGO DISPONIBLE
════════════════════════════════

🎬 PELÍCULAS (${peliculas.length}):
${fmtVideo(peliculas)}

📺 SERIES (${seriesVideos.length}):
${fmtVideo(seriesVideos)}

🎵 VIDEOS MUSICALES (${musicVideos.length}):
${fmtMusic(musicVideos)}

════════════════════════════════
  DATOS DEL USUARIO
════════════════════════════════

Historial:
${watched}

Mi Lista:
${favorites}

════════════════════════════════
  INSTRUCCIONES DE COMPORTAMIENTO
════════════════════════════════
- Responde en español, amigable y breve.
- Para recomendaciones: máximo 3 sugerencias, solo del catálogo real.
- Para funciones: explica claramente cómo usarlas.
- Si no tenemos algo en catálogo, dilo y sugiere lo más parecido.
- No inventes títulos ni funciones que no existan.

════════════════════════════════
  MARCADORES DE ACCIÓN (MUY IMPORTANTE)
════════════════════════════════
Cuando recomiendes o menciones contenido del catálogo, SIEMPRE incluye al final de tu respuesta los marcadores de acción correspondientes usando el ID exacto del catálogo:

  [[PLAY:id]]         → reproducir video musical del catálogo en el MusicPlayer
  [[WATCH:id]]        → abrir película/serie del catálogo en pantalla completa
  [[QUEUE:id]]        → agregar video musical del catálogo a la cola
  [[YTSEARCH:query]]  → buscar en YouTube y agregar automáticamente a la cola

Ejemplos:
  "Te recomiendo esta cumbia 🎵 [[PLAY:abc123]]"
  "¡Esa película está buenísima! [[WATCH:xyz789]]"
  "Ya la agregué a tu cola [[YTSEARCH:Bad Bunny Tití Me Preguntó]]"
  "Poniendo esa canción [[YTSEARCH:Carlos Vives La Bicicleta]]"

Reglas para marcadores:
- Para contenido del catálogo: usa [[PLAY:id]], [[WATCH:id]] o [[QUEUE:id]] con el ID exacto.
- Para búsquedas en YouTube (cuando el usuario pide algo que NO está en el catálogo, o pide buscar en YouTube): usa [[YTSEARCH:nombre artista + canción]].
- Cuando el usuario diga "ponlo en la cola", "búscalo en YouTube", "agrega X a la cola": usa [[YTSEARCH:query]].
- Puedes incluir hasta 3 marcadores por respuesta.
- Si el usuario pregunta qué suena ahora, responde sobre la canción en "REPRODUCIENDO AHORA".`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, movies = [], watchHistory = [], myList = [], currentTrack = null } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages requerido' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: buildSystemPrompt(movies, watchHistory, myList, currentTrack),
      messages,
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Error Claude API:', err.message);
    res.status(500).json({ error: 'Error al contactar con Claude' });
  }
}
