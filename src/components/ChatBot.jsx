import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const CHIPS_DEFAULT = [
  { label: '🎬 Recomiéndame algo',     text: '¿Qué me recomiendas ver hoy?' },
  { label: '🎵 Música latina',         text: '¿Qué videos musicales tienen de música latina?' },
  { label: '🎧 ¿Cómo funciona el DJ?', text: '¿Cómo funciona el Modo DJ?' },
  { label: '📋 Mi lista',              text: '¿Qué tengo en mi lista y qué he visto?' },
  { label: '⚙️ ¿Qué puede COSMOS?',   text: '¿Qué funciones tiene COSMOS?' },
];

const CHIPS_PLAYING = [
  { label: '🎵 ¿Qué suena?',    text: '¿Qué canción está sonando ahora?' },
  { label: '🎯 Más como esta',  text: 'Recomiéndame algo similar a lo que está sonando ahora' },
  { label: '🔀 Sorpréndeme',    text: 'Sorpréndeme con algo diferente' },
  { label: '🎬 Algo para ver',  text: '¿Qué película me recomiendas?' },
];

const GREETING = '¡Hola! Soy COSMOS Assistant 🚀\n\nPuedo ayudarte con:\n🎬 Recomendar y reproducir contenido\n🎵 Encontrar música o artistas\n🎧 Explicarte el Modo DJ\n⚙️ Cualquier función de COSMOS\n\n¿Qué necesitas?';

// Extrae marcadores de contenido: [[PLAY:id]], [[WATCH:id]], [[QUEUE:id]]
const parseActions = (content, allMovies) => {
  const actions = [];
  const regex = /\[\[(PLAY|WATCH|QUEUE):([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const type = match[1].toLowerCase();
    const id = match[2].trim();
    const track = allMovies.find(m => m.id === id);
    if (track) actions.push({ type, track });
  }
  const cleanText = content.replace(/\[\[(PLAY|WATCH|QUEUE):[^\]]+\]\]/g, '').trim();
  return { text: cleanText, actions };
};

// Extrae marcadores de control: [[PAUSE]], [[RESUME]], [[NEXT]], [[PREV]], [[VOLUME:N]], [[GOTO:section]]
const parseControls = (content) => {
  const controls = [];
  if (/\[\[PAUSE\]\]/.test(content))  controls.push({ type: 'pause' });
  if (/\[\[RESUME\]\]/.test(content)) controls.push({ type: 'resume' });
  if (/\[\[NEXT\]\]/.test(content))   controls.push({ type: 'next' });
  if (/\[\[PREV\]\]/.test(content))   controls.push({ type: 'prev' });
  const volMatch = content.match(/\[\[VOLUME:(\d+)\]\]/);
  if (volMatch) controls.push({ type: 'volume', value: parseInt(volMatch[1]) });
  const gotoMatch = content.match(/\[\[GOTO:(\w+)\]\]/);
  if (gotoMatch) controls.push({ type: 'goto', section: gotoMatch[1] });
  const clean = content
    .replace(/\[\[PAUSE\]\]|\[\[RESUME\]\]|\[\[NEXT\]\]|\[\[PREV\]\]/g, '')
    .replace(/\[\[VOLUME:\d+\]\]/g, '')
    .replace(/\[\[GOTO:\w+\]\]/g, '')
    .trim();
  return { clean, controls };
};

export default function ChatBot({
  movies = [],
  watchHistory = [],
  myList = [],
  currentTrack = null,
  isPlaying = false,
  volume = 0.8,
  onPlay,
  onWatch,
  onAddToQueue,
  onPause,
  onResume,
  onNext,
  onPrev,
  onVolume,
  onNavigate,
}) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING, actions: [] }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const searchAndQueue = async (query) => {
    const key = import.meta.env.VITE_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(query)}&key=${key}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.items?.length) return null;
    const item = data.items[0];
    const track = {
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      category: 'Videos Musicales',
    };
    onAddToQueue?.(track);
    return track;
  };

  const sendText = async (text) => {
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text, actions: [] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    const apiMessages = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, movies, watchHistory, myList, currentTrack, volume, isPlaying }),
      });
      const data = await res.json();
      const raw = data.reply || 'Sin respuesta.';

      // 1. Strip YTSEARCH markers
      const ytRegex = /\[\[YTSEARCH:([^\]]+)\]\]/g;
      const ytMatches = [...raw.matchAll(ytRegex)];
      const afterYt = raw.replace(ytRegex, '').trim();

      // 2. Strip control markers and collect them
      const { clean: afterControls, controls } = parseControls(afterYt);

      // 3. Strip content action markers
      const { text: cleanText, actions } = parseActions(afterControls, movies);
      setMessages(prev => [...prev, { role: 'assistant', content: cleanText, actions }]);

      // 4. Execute controls immediately
      for (const ctrl of controls) {
        if (ctrl.type === 'pause')   onPause?.();
        if (ctrl.type === 'resume')  onResume?.();
        if (ctrl.type === 'next')    onNext?.();
        if (ctrl.type === 'prev')    onPrev?.();
        if (ctrl.type === 'volume')  onVolume?.(ctrl.value);
        if (ctrl.type === 'goto')    onNavigate?.(ctrl.section);
      }

      // Execute YouTube searches sequentially and confirm each
      for (const match of ytMatches) {
        const query = match[1].trim();
        const track = await searchAndQueue(query);
        const confirm = track
          ? `🎵 Agregué "${track.title}" a la cola.`
          : `No encontré "${query}" en YouTube.`;
        setMessages(prev => [...prev, { role: 'assistant', content: confirm, actions: [] }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión.', actions: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => sendText(input.trim());

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recognitionRef.current?.stop(); return; }
    const recog = new SR();
    recog.lang = 'es-ES';
    recog.continuous = false;
    recog.interimResults = false;
    recog.onstart = () => setListening(true);
    recog.onend   = () => setListening(false);
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognitionRef.current = recog;
    recog.start();
  };

  const handleAction = (action) => {
    const { type, track } = action;
    if (type === 'play')  onPlay?.(track, []);
    if (type === 'watch') onWatch?.(track);
    if (type === 'queue') onAddToQueue?.(track);
  };

  const actionLabel = (type) => {
    if (type === 'play')  return '▶ Reproducir';
    if (type === 'watch') return '🎬 Ver ahora';
    if (type === 'queue') return '+ Agregar a cola';
    return '';
  };

  const showChips = messages.length <= 1;
  const chips = isPlaying ? CHIPS_PLAYING : CHIPS_DEFAULT;
  const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      <button className="chatbot-bubble" onClick={() => setOpen(o => !o)} title="Asistente COSMOS">
        {open
          ? <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          : <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        }
        {!open && <span className="chatbot-bubble__dot" />}
      </button>

      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header__info">
              <div className="chatbot-header__avatar">C</div>
              <div>
                <div className="chatbot-header__name">COSMOS Assistant</div>
                <div className="chatbot-header__status">
                  {isPlaying && currentTrack
                    ? `🎵 ${currentTrack.title}`
                    : 'IA · Siempre disponible'}
                </div>
              </div>
            </div>
            <button className="chatbot-header__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                <div className="chatbot-msg__text">
                  {msg.content.split('\n').map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}
                </div>
                {msg.actions?.length > 0 && (
                  <div className="chatbot-actions">
                    {msg.actions.map((action, ai) => (
                      <button
                        key={ai}
                        className={`chatbot-action chatbot-action--${action.type}`}
                        onClick={() => handleAction(action)}
                        title={action.track.title}
                      >
                        {actionLabel(action.type)}
                        <span className="chatbot-action__title">{action.track.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {showChips && (
              <div className="chatbot-chips">
                {chips.map((chip, i) => (
                  <button key={i} className="chatbot-chip" onClick={() => sendText(chip.text)}>
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="chatbot-msg chatbot-msg--assistant chatbot-msg--loading">
                <span /><span /><span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Pregunta algo..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            {hasSpeech && (
              <button
                className={`chatbot-mic${listening ? ' chatbot-mic--on' : ''}`}
                onClick={startVoice}
                title={listening ? 'Escuchando...' : 'Hablar'}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
