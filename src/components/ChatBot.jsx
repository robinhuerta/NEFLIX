import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const QUICK_CHIPS = [
  { label: '🎬 Recomiéndame algo',        text: '¿Qué me recomiendas ver hoy?' },
  { label: '🎵 Música latina',            text: '¿Qué videos musicales tienen de música latina?' },
  { label: '🎧 ¿Cómo funciona el DJ?',    text: '¿Cómo funciona el Modo DJ?' },
  { label: '📋 Mi historial y favoritos', text: '¿Qué tengo en mi lista y qué he visto?' },
  { label: '⚙️ ¿Qué puede hacer COSMOS?', text: '¿Qué funciones tiene COSMOS?' },
];

const GREETING = '¡Hola! Soy COSMOS Assistant 🚀\n\nPuedo ayudarte con:\n🎬 Recomendar películas o series\n🎵 Encontrar música o artistas\n🎧 Explicarte el Modo DJ\n⚙️ Cualquier función de COSMOS\n\n¿Qué necesitas?';

export default function ChatBot({ movies = [], watchHistory = [], myList = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendText = async (text) => {
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    const apiMessages = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, movies, watchHistory, myList }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sin respuesta.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => sendText(input.trim());

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const showChips = messages.length <= 1;

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
                <div className="chatbot-header__status">IA · Siempre disponible</div>
              </div>
            </div>
            <button className="chatbot-header__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            ))}
            {showChips && (
              <div className="chatbot-chips">
                {QUICK_CHIPS.map((chip, i) => (
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
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
