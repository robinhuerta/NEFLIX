import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

export default function ChatBot({ movies = [], watchHistory = [], myList = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de COSMOS. ¿Qué quieres ver hoy? Puedes pedirme algo de acción, comedia, terror... ¡lo que quieras!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Solo mandamos los mensajes sin el saludo inicial del assistant
    const apiMessages = newMessages
      .slice(1)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, movies, watchHistory, myList }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Lo siento, no pude responder.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. ¿Está corriendo el servidor?' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Burbuja flotante */}
      <button className="chatbot-bubble" onClick={() => setOpen(o => !o)} title="Recomendaciones">
        {open ? (
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        )}
        {!open && <span className="chatbot-bubble__dot" />}
      </button>

      {/* Ventana de chat */}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header__info">
              <div className="chatbot-header__avatar">C</div>
              <div>
                <div className="chatbot-header__name">COSMOS Assistant</div>
                <div className="chatbot-header__status">Recomendador de películas</div>
              </div>
            </div>
            <button className="chatbot-header__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                {msg.content}
              </div>
            ))}
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
              placeholder="¿Qué quieres ver hoy?"
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
