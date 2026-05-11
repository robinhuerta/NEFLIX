import React, { useState, useEffect, useMemo, useRef } from 'react';
import './DJView.css';

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const searchYouTube = async (query) => {
  if (!query.trim() || !YT_API_KEY) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${YT_API_KEY}&maxResults=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(item => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumb: item.snippet.thumbnails?.default?.url,
  }));
};

const GENRE_BPM = {
  reggaeton: [85, 100], merengue: [120, 145], salsa: [160, 220],
  cumbia: [90, 115], chicha: [110, 130], huayno: [120, 140],
  bachata: [100, 115], balada: [70, 90], bolero: [60, 80],
  rock: [120, 160], pop: [100, 130],
};
const GENRE_ENERGY = {
  reggaeton: 5, merengue: 5, salsa: 4, cumbia: 4, chicha: 4,
  huayno: 3, bachata: 2, balada: 1, bolero: 1, rock: 5, pop: 3,
};
const getEnergy = (t) => {
  const text = `${t.category} ${t.genre} ${t.title}`.toLowerCase();
  for (const [k, v] of Object.entries(GENRE_ENERGY)) if (text.includes(k)) return v;
  return 3;
};
const getBPM = (t) => {
  if (!t) return 120;
  const text = `${t.category} ${t.genre} ${t.title}`.toLowerCase();
  for (const [k, [mn, mx]] of Object.entries(GENRE_BPM))
    if (text.includes(k)) return Math.floor(Math.random() * (mx - mn + 1)) + mn;
  return Math.floor(Math.random() * 40) + 100;
};
const LASERS = [
  { color: '#6c63ff', from: '-45deg', to: '-15deg', dur: '3.2s' },
  { color: '#ff4da6', from: '-30deg', to: '10deg',  dur: '2.8s' },
  { color: '#00d4ff', from: '15deg',  to: '45deg',  dur: '3.6s' },
  { color: '#a78bfa', from: '30deg',  to: '-5deg',  dur: '4.0s' },
  { color: '#ff4da6', from: '-60deg', to: '-25deg', dur: '2.5s' },
  { color: '#6c63ff', from: '20deg',  to: '55deg',  dur: '3.8s' },
  { color: '#00d4ff', from: '-10deg', to: '30deg',  dur: '3.0s' },
  { color: '#ffd700', from: '40deg',  to: '65deg',  dur: '4.2s' },
];
const HOT_COLORS = ['#ff4da6', '#00d4ff', '#ffd700', '#6c63ff'];
const SPEED_STEPS = [0.75, 0.85, 1.0, 1.15, 1.25];
const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
const getYtId = (url) => {
  if (!url?.trim()) return null;
  const m = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return m ? m[1] : null;
};
const cfVolA = (cf) => cf <= 50 ? 100 : Math.round((100 - cf) * 2);
const cfVolB = (cf) => cf >= 50 ? 100 : Math.round(cf * 2);
const finalVol = (deckVol, cfVol) => Math.round(deckVol * cfVol / 100);

export default function DJView({ tracks = [], currentTrack, isPlaying, onPlay, onAddToQueue, queue = [] }) {
  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('cabina'); // 'cabina' | 'youtube'

  // ── COSMOS setlist state ──────────────────────────────────────────────────
  const [mixMode, setMixMode]         = useState('shuffle');
  const [isMixActive, setIsMixActive] = useState(false);
  const [bpm, setBpm]                 = useState(120);
  const [search, setSearch]           = useState('');
  const [activeGenre, setActiveGenre] = useState('Todos');

  // ── Deck identifiers & status ─────────────────────────────────────────────
  const [deckAId, setDeckAId]           = useState(null);
  const [deckBId, setDeckBId]           = useState(null);
  const [deckATitle, setDeckATitle]     = useState('');
  const [deckBTitle, setDeckBTitle]     = useState('');
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [showVideoA, setShowVideoA]     = useState(true);
  const [showVideoB, setShowVideoB]     = useState(true);
  const [ytReady, setYtReady]           = useState(false);

  // ── Mixer ─────────────────────────────────────────────────────────────────
  const [crossfader, setCrossfader]   = useState(50);
  const [volA, setVolA]               = useState(100);
  const [volB, setVolB]               = useState(100);
  const [autoFading, setAutoFading]   = useState(false);

  // ── Speed / pitch ─────────────────────────────────────────────────────────
  const [speedA, setSpeedA] = useState(1.0);
  const [speedB, setSpeedB] = useState(1.0);

  // ── Position / timer ──────────────────────────────────────────────────────
  const [posA, setPosA] = useState({ cur: 0, dur: 0 });
  const [posB, setPosB] = useState({ cur: 0, dur: 0 });

  // ── Hot cues ──────────────────────────────────────────────────────────────
  const [hotA, setHotA] = useState([null, null, null, null]);
  const [hotB, setHotB] = useState([null, null, null, null]);

  // ── Loop ──────────────────────────────────────────────────────────────────
  const [loopA, setLoopA] = useState({ active: false, start: 0 });
  const [loopB, setLoopB] = useState({ active: false, start: 0 });

  // ── EQ (visual knobs, degrees -150 to +150) ───────────────────────────────
  const [eqA, setEqA] = useState({ hi: 0, mid: 0, lo: 0 });
  const [eqB, setEqB] = useState({ hi: 0, mid: 0, lo: 0 });

  // ── Search ────────────────────────────────────────────────────────────────
  const [queryA, setQueryA]     = useState('');
  const [queryB, setQueryB]     = useState('');
  const [resultsA, setResultsA] = useState([]);
  const [resultsB, setResultsB] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [showResA, setShowResA] = useState(false);
  const [showResB, setShowResB] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const ytContainerA  = useRef(null);
  const ytContainerB  = useRef(null);
  const ytPlayerA     = useRef(null);
  const ytPlayerB     = useRef(null);
  const cfRef         = useRef(crossfader);
  const volARef       = useRef(volA);
  const volBRef       = useRef(volB);
  const searchTimerA  = useRef(null);
  const searchTimerB  = useRef(null);
  const posTimerA     = useRef(null);
  const posTimerB     = useRef(null);
  const autoFadeTimer = useRef(null);
  const loopTimerA    = useRef(null);
  const loopTimerB    = useRef(null);
  const scratchDeck   = useRef(null);
  const scratchStartX = useRef(0);
  const loopARef      = useRef(loopA);
  const loopBRef      = useRef(loopB);
  const deckAIdRef    = useRef(null);
  const deckBIdRef    = useRef(null);

  // ── Keep refs in sync ────────────────────────────────────────────────────
  useEffect(() => { cfRef.current      = crossfader; }, [crossfader]);
  useEffect(() => { volARef.current    = volA; },        [volA]);
  useEffect(() => { volBRef.current    = volB; },        [volB]);
  useEffect(() => { loopARef.current   = loopA; },       [loopA]);
  useEffect(() => { loopBRef.current   = loopB; },       [loopB]);
  useEffect(() => { deckAIdRef.current = deckAId; },     [deckAId]);
  useEffect(() => { deckBIdRef.current = deckBId; },     [deckBId]);

  // ── Volume update helper ──────────────────────────────────────────────────
  const applyVolumes = (cf, vA, vB) => {
    ytPlayerA.current?.setVolume?.(finalVol(vA, cfVolA(cf)));
    ytPlayerB.current?.setVolume?.(finalVol(vB, cfVolB(cf)));
  };
  useEffect(() => { applyVolumes(crossfader, volA, volB); }, [crossfader, volA, volB]);

  // ── Load YT API ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.YT?.Player) { setYtReady(true); return; }
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api'; tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); setYtReady(true); };
  }, []);

  // ── Create player helper ──────────────────────────────────────────────────
  const createDeckPlayer = (deck, videoId, container) => {
    const playerRef = deck === 'A' ? ytPlayerA : ytPlayerB;
    const getVol = deck === 'A'
      ? () => finalVol(volARef.current, cfVolA(cfRef.current))
      : () => finalVol(volBRef.current, cfVolB(cfRef.current));
    const setPlaying = deck === 'A' ? setDeckAPlaying : setDeckBPlaying;
    const startPoller = deck === 'A' ? startPosPollerA : startPosPollerB;

    playerRef.current?.destroy?.();
    container.innerHTML = '';
    const mount = document.createElement('div');
    container.appendChild(mount);
    playerRef.current = new window.YT.Player(mount, {
      videoId,
      playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
      events: {
        onReady: (e) => { e.target.setVolume(getVol()); },
        onStateChange: (e) => {
          const playing = e.data === window.YT.PlayerState.PLAYING;
          setPlaying(playing);
          if (playing) startPoller();

          // Auto-transition al otro deck cuando termina la pista
          if (e.data === window.YT.PlayerState.ENDED) {
            const otherHasTrack = deck === 'A' ? deckBIdRef.current : deckAIdRef.current;
            const otherPlayer   = deck === 'A' ? ytPlayerB.current  : ytPlayerA.current;
            if (!otherHasTrack || !otherPlayer) return;

            // Arrancar el otro deck
            otherPlayer.playVideo?.();

            // Crossfade suave hacia el otro deck (3 segundos)
            const targetCf = deck === 'A' ? 100 : 0;
            clearInterval(autoFadeTimer.current);
            setAutoFading(true);
            const from = cfRef.current;
            const steps = 30;
            let step = 0;
            autoFadeTimer.current = setInterval(() => {
              step++;
              const newCf = Math.round(from + (targetCf - from) * (step / steps));
              setCrossfader(newCf);
              cfRef.current = newCf;
              ytPlayerA.current?.setVolume?.(finalVol(volARef.current, cfVolA(newCf)));
              ytPlayerB.current?.setVolume?.(finalVol(volBRef.current, cfVolB(newCf)));
              if (step >= steps) { clearInterval(autoFadeTimer.current); setAutoFading(false); }
            }, 100);
          }
        },
      },
    });
  };

  // ── Position pollers ──────────────────────────────────────────────────────
  const startPosPollerA = () => {
    clearInterval(posTimerA.current);
    posTimerA.current = setInterval(() => {
      if (!ytPlayerA.current) return;
      try {
        const cur = ytPlayerA.current.getCurrentTime?.() || 0;
        const dur = ytPlayerA.current.getDuration?.() || 0;
        setPosA({ cur, dur });
        if (loopARef.current.active && dur > 0) {
          const loopEnd = loopARef.current.start + 8;
          if (cur >= loopEnd) ytPlayerA.current.seekTo?.(loopARef.current.start, true);
        }
      } catch {}
    }, 250);
  };
  const startPosPollerB = () => {
    clearInterval(posTimerB.current);
    posTimerB.current = setInterval(() => {
      if (!ytPlayerB.current) return;
      try {
        const cur = ytPlayerB.current.getCurrentTime?.() || 0;
        const dur = ytPlayerB.current.getDuration?.() || 0;
        setPosB({ cur, dur });
        if (loopBRef.current.active && dur > 0) {
          const loopEnd = loopBRef.current.start + 8;
          if (cur >= loopEnd) ytPlayerB.current.seekTo?.(loopBRef.current.start, true);
        }
      } catch {}
    }, 250);
  };

  // ── Deck A player lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (!ytReady || !deckAId || !ytContainerA.current) {
      ytPlayerA.current?.destroy?.(); ytPlayerA.current = null;
      clearInterval(posTimerA.current);
      setPosA({ cur: 0, dur: 0 }); setDeckAPlaying(false);
      return;
    }
    createDeckPlayer('A', deckAId, ytContainerA.current);
    return () => { ytPlayerA.current?.destroy?.(); ytPlayerA.current = null; clearInterval(posTimerA.current); };
  }, [deckAId, ytReady]);

  // ── Deck B player lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (!ytReady || !deckBId || !ytContainerB.current) {
      ytPlayerB.current?.destroy?.(); ytPlayerB.current = null;
      clearInterval(posTimerB.current);
      setPosB({ cur: 0, dur: 0 }); setDeckBPlaying(false);
      return;
    }
    createDeckPlayer('B', deckBId, ytContainerB.current);
    return () => { ytPlayerB.current?.destroy?.(); ytPlayerB.current = null; clearInterval(posTimerB.current); };
  }, [deckBId, ytReady]);

  // ── Speed sync ───────────────────────────────────────────────────────────
  useEffect(() => { ytPlayerA.current?.setPlaybackRate?.(speedA); }, [speedA]);
  useEffect(() => { ytPlayerB.current?.setPlaybackRate?.(speedB); }, [speedB]);

  // ── COSMOS setlist effects ────────────────────────────────────────────────
  useEffect(() => { if (currentTrack) setBpm(getBPM(currentTrack)); }, [currentTrack?.id]);
  useEffect(() => { if (!isPlaying) setIsMixActive(false); }, [isPlaying]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(posTimerA.current); clearInterval(posTimerB.current);
    clearInterval(autoFadeTimer.current);
  }, []);

  // ── Functions ─────────────────────────────────────────────────────────────
  const toggleDeck = (deck) => {
    const player  = deck === 'A' ? ytPlayerA.current : ytPlayerB.current;
    const playing = deck === 'A' ? deckAPlaying : deckBPlaying;
    const setPl   = deck === 'A' ? setDeckAPlaying : setDeckBPlaying;
    if (!player) return;
    if (playing) { player.pauseVideo?.(); setPl(false); }
    else         { player.playVideo?.();  setPl(true);  }
  };

  const clearDeck = (deck) => {
    if (deck === 'A') {
      setDeckAId(null); setDeckATitle(''); setDeckAPlaying(false);
      setPosA({ cur: 0, dur: 0 }); setHotA([null,null,null,null]);
      setLoopA({ active: false, start: 0 }); setSpeedA(1.0);
    } else {
      setDeckBId(null); setDeckBTitle(''); setDeckBPlaying(false);
      setPosB({ cur: 0, dur: 0 }); setHotB([null,null,null,null]);
      setLoopB({ active: false, start: 0 }); setSpeedB(1.0);
    }
  };

  const swapDecks = () => {
    const tmpId = deckAId; setDeckAId(deckBId); setDeckBId(tmpId);
    const tmpT  = deckATitle; setDeckATitle(deckBTitle); setDeckBTitle(tmpT);
    setDeckAPlaying(false); setDeckBPlaying(false); setCrossfader(50);
  };

  const changeSpeed = (deck, dir) => {
    const setSpeed = deck === 'A' ? setSpeedA : setSpeedB;
    const cur      = deck === 'A' ? speedA    : speedB;
    const idx      = SPEED_STEPS.indexOf(cur);
    const next     = SPEED_STEPS[Math.min(Math.max(idx + dir, 0), SPEED_STEPS.length - 1)];
    setSpeed(next);
  };

  const handleHotCue = (deck, idx, e) => {
    e.preventDefault();
    const player = deck === 'A' ? ytPlayerA.current : ytPlayerB.current;
    const cues   = deck === 'A' ? hotA : hotB;
    const setCues = deck === 'A' ? setHotA : setHotB;
    if (e.type === 'contextmenu') {
      const t = player?.getCurrentTime?.() || 0;
      setCues(prev => { const n = [...prev]; n[idx] = t; return n; });
    } else {
      if (cues[idx] !== null) player?.seekTo?.(cues[idx], true);
    }
  };

  const toggleLoop = (deck) => {
    const player  = deck === 'A' ? ytPlayerA.current : ytPlayerB.current;
    const loop    = deck === 'A' ? loopA : loopB;
    const setLoop = deck === 'A' ? setLoopA : setLoopB;
    if (loop.active) {
      setLoop({ active: false, start: 0 });
    } else {
      const start = player?.getCurrentTime?.() || 0;
      setLoop({ active: true, start });
    }
  };

  const autoFade = () => {
    if (autoFading) { clearInterval(autoFadeTimer.current); setAutoFading(false); return; }
    setAutoFading(true);
    const from   = crossfader;
    const target = from < 50 ? 100 : 0;
    const steps  = 40;
    let step = 0;
    autoFadeTimer.current = setInterval(() => {
      step++;
      const progress = step / steps;
      setCrossfader(Math.round(from + (target - from) * progress));
      if (step >= steps) { clearInterval(autoFadeTimer.current); setAutoFading(false); }
    }, 100);
  };

  const handleEqDrag = (deck, band, e) => {
    e.preventDefault();
    const startY   = e.clientY;
    const setEq    = deck === 'A' ? setEqA : setEqB;
    const eq       = deck === 'A' ? eqA : eqB;
    const startVal = eq[band];
    const onMove   = (me) => {
      const delta = Math.round((startY - me.clientY) * 1.5);
      const clamped = Math.max(-150, Math.min(150, startVal + delta));
      setEq(prev => ({ ...prev, [band]: clamped }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handlePlatterDown = (deck, e) => {
    scratchDeck.current  = deck;
    scratchStartX.current = e.clientX;
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!scratchDeck.current) return;
      const delta  = (e.clientX - scratchStartX.current) / 80;
      const rate   = Math.max(0.25, Math.min(2, 1 + delta));
      const player = scratchDeck.current === 'A' ? ytPlayerA.current : ytPlayerB.current;
      player?.setPlaybackRate?.(rate);
    };
    const onUp = () => {
      if (!scratchDeck.current) return;
      const rate   = scratchDeck.current === 'A' ? speedA : speedB;
      const player = scratchDeck.current === 'A' ? ytPlayerA.current : ytPlayerB.current;
      player?.setPlaybackRate?.(rate);
      scratchDeck.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [speedA, speedB]);

  const handleSearch = (deck, value) => {
    if (deck === 'A') { setQueryA(value); setShowResA(true); }
    else              { setQueryB(value); setShowResB(true); }
    const timer      = deck === 'A' ? searchTimerA : searchTimerB;
    const setLoading = deck === 'A' ? setLoadingA : setLoadingB;
    const setResults = deck === 'A' ? setResultsA : setResultsB;
    clearTimeout(timer.current);
    if (!value.trim()) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      setResults(await searchYouTube(value));
      setLoading(false);
    }, 500);
  };

  const pickResult = (deck, result) => {
    if (deck === 'A') { setDeckAId(result.id); setDeckATitle(result.title); setQueryA(''); setResultsA([]); setShowResA(false); }
    else              { setDeckBId(result.id); setDeckBTitle(result.title); setQueryB(''); setResultsB([]); setShowResB(false); }
  };

  const loadDeckUrl = (deck) => {
    const query = deck === 'A' ? queryA : queryB;
    const id = getYtId(query);
    if (!id) return;
    if (deck === 'A') { setDeckAId(id); setDeckATitle(query); setQueryA(''); setShowResA(false); }
    else              { setDeckBId(id); setDeckBTitle(query); setQueryB(''); setShowResB(false); }
  };

  const handleActivateMix = () => {
    if (!filteredTracks.length) return;
    let list = [...filteredTracks];
    if (mixMode === 'shuffle') list.sort(() => Math.random() - 0.5);
    else if (mixMode === 'energy') list.sort((a, b) => getEnergy(b) - getEnergy(a));
    const [first, ...rest] = list;
    onPlay(first, rest); setIsMixActive(true);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const genres = useMemo(() => ['Todos', ...[...new Set(tracks.map(t => t.category || t.genre).filter(Boolean))]], [tracks]);
  const filteredTracks = useMemo(() => {
    let list = activeGenre === 'Todos' ? tracks : tracks.filter(t => t.category === activeGenre || t.genre === activeGenre);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(t => t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q)); }
    return list;
  }, [tracks, activeGenre, search]);

  const nextTrack = queue[0] || null;
  const beatMs    = Math.round(60000 / bpm);

  // ── Deck panel renderer ───────────────────────────────────────────────────
  const renderDeck = (deck) => {
    const isA      = deck === 'A';
    const id       = isA ? deckAId    : deckBId;
    const title    = isA ? deckATitle : deckBTitle;
    const playing  = isA ? deckAPlaying : deckBPlaying;
    const showVid  = isA ? showVideoA  : showVideoB;
    const setVid   = isA ? setShowVideoA : setShowVideoB;
    const speed    = isA ? speedA     : speedB;
    const pos      = isA ? posA       : posB;
    const hot      = isA ? hotA       : hotB;
    const loop     = isA ? loopA      : loopB;
    const eq       = isA ? eqA        : eqB;
    const vol      = isA ? volA       : volB;
    const setVol   = isA ? setVolA    : setVolB;
    const query    = isA ? queryA     : queryB;
    const results  = isA ? resultsA   : resultsB;
    const loading  = isA ? loadingA   : loadingB;
    const showRes  = isA ? showResA   : showResB;
    const container = isA ? ytContainerA : ytContainerB;

    const pct = pos.dur > 0 ? (pos.cur / pos.dur) * 100 : 0;

    return (
      <div className={`dj-view__yt-deck${isA ? '' : ' dj-view__yt-deck--b'}`}>

        {/* Tag */}
        <div className="dj-view__yt-deck-tag">
          <span className={`dj-view__yt-deck-letter${isA ? '' : ' dj-view__yt-deck-letter--b'}`}>{deck}</span>
          {playing && <span className={`dj-view__yt-live-dot${isA ? '' : ' dj-view__yt-live-dot--b'}`} />}
          {title && <span className="dj-view__yt-deck-now" title={title}>{title.slice(0, 38)}</span>}
          {id && <button className="dj-view__yt-clear" onClick={() => clearDeck(deck)} title="Limpiar deck">✕</button>}
        </div>

        {/* Video / empty */}
        <div ref={container} className="dj-view__yt-preview" style={{ display: showVid && id ? 'block' : 'none' }} />
        {!id && (
          <div className="dj-view__yt-empty">
            <span>🎧</span>
            <p>Busca una canción de YouTube<br />para cargar el Deck {deck}</p>
          </div>
        )}

        {/* Position bar */}
        {id && (
          <div className="dj-view__yt-pos">
            <span className="dj-view__yt-time">{fmt(pos.cur)}</span>
            <div className="dj-view__yt-bar" onClick={(e) => {
              if (!ytPlayerA.current && !ytPlayerB.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const player = isA ? ytPlayerA.current : ytPlayerB.current;
              player?.seekTo?.(ratio * pos.dur, true);
            }}>
              <div className="dj-view__yt-bar-fill" style={{ width: `${pct}%` }} />
              <div className="dj-view__yt-bar-handle" style={{ left: `${pct}%` }} />
            </div>
            <span className="dj-view__yt-time dj-view__yt-time--rem">-{fmt(pos.dur - pos.cur)}</span>
          </div>
        )}

        {/* Speed + Loop row */}
        {id && (
          <div className="dj-view__yt-speed-row">
            <button className="dj-view__yt-speed-btn" onClick={() => changeSpeed(deck, -1)} disabled={speed === SPEED_STEPS[0]}>−</button>
            <span className={`dj-view__yt-speed-val ${speed !== 1 ? 'dj-view__yt-speed-val--off' : ''}`}>{speed.toFixed(2)}x</span>
            <button className="dj-view__yt-speed-btn" onClick={() => changeSpeed(deck, +1)} disabled={speed === SPEED_STEPS[SPEED_STEPS.length-1]}>+</button>
            <button
              className={`dj-view__yt-loop ${loop.active ? 'dj-view__yt-loop--on' : ''}`}
              onClick={() => toggleLoop(deck)}
              title="Loop 8s"
            >⟳ 8s</button>
          </div>
        )}

        {/* Hot cues */}
        {id && (
          <div className="dj-view__yt-cues">
            {hot.map((cue, i) => (
              <button
                key={i}
                className={`dj-view__yt-cue ${cue !== null ? 'dj-view__yt-cue--set' : ''}`}
                style={{ '--cue-color': HOT_COLORS[i] }}
                onClick={(e) => handleHotCue(deck, i, e)}
                onContextMenu={(e) => handleHotCue(deck, i, e)}
                title={cue !== null ? `Cue ${i+1}: ${fmt(cue)} — clic derecho para reemplazar` : `Clic derecho para marcar cue ${i+1}`}
              >
                {cue !== null ? fmt(cue) : `C${i+1}`}
              </button>
            ))}
          </div>
        )}

        {/* EQ knobs */}
        {id && (
          <div className="dj-view__yt-eq">
            {['hi', 'mid', 'lo'].map(band => (
              <div key={band} className="dj-view__yt-knob-wrap">
                <div
                  className="dj-view__yt-knob"
                  style={{ '--rot': `${eq[band]}deg` }}
                  onMouseDown={(e) => handleEqDrag(deck, band, e)}
                  title={`EQ ${band.toUpperCase()} — arrastrar`}
                >
                  <div className="dj-view__yt-knob-dot" />
                </div>
                <span className="dj-view__yt-knob-label">{band.toUpperCase()}</span>
              </div>
            ))}
            <div className="dj-view__yt-fader-wrap">
              <input
                type="range" className="dj-view__yt-fader"
                min="0" max="100" value={vol}
                onChange={e => setVol(Number(e.target.value))}
                title={`Volumen deck ${deck}: ${vol}%`}
              />
              <span className="dj-view__yt-knob-label">{vol}%</span>
            </div>
          </div>
        )}

        {/* Play controls */}
        {id && (
          <div className="dj-view__yt-controls">
            <button className={`dj-view__yt-play ${playing ? 'dj-view__yt-play--on' : ''}`} onClick={() => toggleDeck(deck)}>
              {playing ? '⏸' : '▶'}
            </button>
            <button className={`dj-view__yt-vidtoggle ${showVid ? 'dj-view__yt-vidtoggle--on' : ''}`}
              onClick={() => setVid(v => !v)} title={showVid ? 'Solo audio' : 'Mostrar video'}>
              {showVid ? '🎬' : '🎵'}
            </button>
          </div>
        )}

        {/* Search */}
        <div className="dj-view__yt-search-wrap">
          <input
            className="dj-view__yt-input"
            placeholder="Buscar en YouTube..."
            value={query}
            onChange={e => handleSearch(deck, e.target.value)}
            onFocus={() => deck === 'A' ? setShowResA(true) : setShowResB(true)}
            onBlur={() => setTimeout(() => deck === 'A' ? setShowResA(false) : setShowResB(false), 200)}
            onKeyDown={e => e.key === 'Enter' && loadDeckUrl(deck)}
          />
          {loading && <span className="dj-view__yt-spinner" />}
          {showRes && results.length > 0 && (
            <div className="dj-view__yt-results">
              {results.map(r => (
                <div key={r.id} className="dj-view__yt-result" onMouseDown={() => pickResult(deck, r)}>
                  <img src={r.thumb} alt="" className="dj-view__yt-result-thumb" />
                  <div className="dj-view__yt-result-info">
                    <span className="dj-view__yt-result-title">{r.title}</span>
                    <span className="dj-view__yt-result-ch">{r.channel}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="dj-view">
      <div className="dj-view__lasers" aria-hidden="true">
        {LASERS.map((l, i) => <div key={i} className="dj-view__laser" style={{ '--color': l.color, '--from': l.from, '--to': l.to, '--dur': l.dur }} />)}
      </div>
      <div className="dj-view__particles" aria-hidden="true">
        {[...Array(24)].map((_, i) => <div key={i} className="dj-view__particle" style={{ '--i': i }} />)}
      </div>

      <header className="dj-view__header">
        <div className="dj-view__live"><span className="dj-view__live-dot" />EN VIVO</div>
        <h1 className="dj-view__title"><span className="dj-view__title-accent">DJ</span> COSMOS</h1>
        <p className="dj-view__subtitle">{tracks.length} tracks en la cabina &nbsp;·&nbsp; Modo Fiesta</p>
      </header>

      {/* ── Tabs ── */}
      <div className="dj-view__tabs">
        <button
          className={`dj-view__tab ${activeTab === 'cabina' ? 'dj-view__tab--on' : ''}`}
          onClick={() => setActiveTab('cabina')}
        >
          🎧 CABINA
        </button>
        <button
          className={`dj-view__tab ${activeTab === 'youtube' ? 'dj-view__tab--on' : ''}`}
          onClick={() => setActiveTab('youtube')}
        >
          🎬 YOUTUBE DJ
        </button>
      </div>

      {/* ── YouTube DJ Panel ── */}
      {activeTab === 'youtube' && <section className="dj-view__yt-section">
        {renderDeck('A')}

        {/* Crossfader center */}
        <div className="dj-view__yt-cf">
          <div className="dj-view__yt-cf-labels">
            <span style={{ opacity: cfVolA(crossfader) / 100 }}>A</span>
            <span className="dj-view__yt-cf-title">CROSSFADER</span>
            <span style={{ opacity: cfVolB(crossfader) / 100 }}>B</span>
          </div>
          <input type="range" className="dj-view__yt-cf-slider"
            min="0" max="100" value={crossfader}
            onChange={e => setCrossfader(Number(e.target.value))} />
          <div className="dj-view__yt-cf-vols">
            <span>{cfVolA(crossfader)}%</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <button className={`dj-view__yt-autofade ${autoFading ? 'dj-view__yt-autofade--on' : ''}`}
                onClick={autoFade} title="Auto-crossfade">
                {autoFading ? '⏹' : '⇄'} AUTO
              </button>
              <button className="dj-view__yt-swap" onClick={swapDecks}
                disabled={!deckAId && !deckBId} title="Intercambiar decks">↕ SWAP</button>
            </div>
            <span>{cfVolB(crossfader)}%</span>
          </div>
        </div>

        {renderDeck('B')}
      </section>}

      {/* ── Vinyl stage + setlist (tab CABINA) ── */}
      {activeTab === 'cabina' && <section className="dj-view__stage">
        <div className="dj-view__deck">
          <div className="dj-view__deck-tag">DECK A</div>
          <div
            className={`dj-view__platter ${(isPlaying || deckAPlaying) ? 'dj-view__platter--spin' : ''} dj-view__platter--scratch`}
            onMouseDown={(e) => handlePlatterDown('A', e)}
          >
            <div className="dj-view__grooves" />
            <div className="dj-view__label">
              {currentTrack?.image
                ? <img src={currentTrack.image} alt="" className="dj-view__label-art" />
                : <span className="dj-view__label-icon">♪</span>}
            </div>
            <div className="dj-view__spindle" />
          </div>
          <div className="dj-view__arm" />
          <div className="dj-view__deck-meta">
            <p className="dj-view__deck-name">{currentTrack?.title || (deckAId ? deckATitle.slice(0,28) : '— Sin pista —')}</p>
            <p className="dj-view__deck-artist">{currentTrack?.artist || currentTrack?.category || (deckAId ? `${speedA.toFixed(2)}x` : '')}</p>
          </div>
        </div>

        <div className="dj-view__mixer">
          <div className="dj-view__bpm" style={{ '--beat': `${beatMs}ms` }}>
            <span className="dj-view__bpm-num">{bpm}</span>
            <span className="dj-view__bpm-unit">BPM</span>
            <div className={`dj-view__beat ${(isPlaying || deckAPlaying || deckBPlaying) ? 'dj-view__beat--on' : ''}`} />
          </div>
          <div className="dj-view__equalizer" aria-hidden="true">
            {[...Array(18)].map((_, i) => (
              <div key={i}
                className={`dj-view__bar ${(isPlaying || deckAPlaying || deckBPlaying) ? 'dj-view__bar--on' : ''}`}
                style={{ '--delay': `${(i * 0.055).toFixed(3)}s`, '--peak': `${25 + ((i * 37 + 13) % 65)}%` }} />
            ))}
          </div>
          <div className="dj-view__modes">
            {[{ id:'sequential', icon:'▤', label:'Orden' }, { id:'shuffle', icon:'⇄', label:'Aleatorio' }, { id:'energy', icon:'⚡', label:'Energía' }]
              .map(m => (
                <button key={m.id} className={`dj-view__mode ${mixMode === m.id ? 'dj-view__mode--on' : ''}`} onClick={() => setMixMode(m.id)}>
                  {m.icon} {m.label}
                </button>
              ))}
          </div>
          <button className={`dj-view__go ${isMixActive && isPlaying ? 'dj-view__go--active' : ''}`} onClick={handleActivateMix}>
            {isMixActive && isPlaying ? <><span className="dj-view__go-dot" /> MIX ACTIVO</> : '▶  ACTIVAR MIX'}
          </button>
        </div>

        <div className="dj-view__deck dj-view__deck--b">
          <div className="dj-view__deck-tag">DECK B</div>
          <div
            className={`dj-view__platter ${deckBPlaying ? 'dj-view__platter--spin' : ''} dj-view__platter--scratch`}
            onMouseDown={(e) => handlePlatterDown('B', e)}
          >
            <div className="dj-view__grooves" />
            <div className="dj-view__label dj-view__label--idle">
              {nextTrack?.image
                ? <img src={nextTrack.image} alt="" className="dj-view__label-art" />
                : <span className="dj-view__label-icon" style={{ opacity: 0.3 }}>↑</span>}
            </div>
            <div className="dj-view__spindle" />
          </div>
          <div className="dj-view__arm dj-view__arm--parked" />
          <div className="dj-view__deck-meta">
            <p className="dj-view__deck-name">{nextTrack?.title || (deckBId ? deckBTitle.slice(0,28) : '— Fin del set —')}</p>
            <p className="dj-view__deck-artist">{nextTrack?.artist || nextTrack?.category || (deckBId ? `${speedB.toFixed(2)}x` : '')}</p>
          </div>
        </div>
      </section>}

      {activeTab === 'cabina' && <section className="dj-view__setlist">
        <div className="dj-view__setlist-bar">
          <h2 className="dj-view__setlist-title">Setlist <span className="dj-view__setlist-count">{filteredTracks.length}</span></h2>
          <input className="dj-view__search" placeholder="Buscar track..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="dj-view__chips">
          {genres.map(g => <button key={g} className={`dj-view__chip ${activeGenre === g ? 'dj-view__chip--on' : ''}`} onClick={() => setActiveGenre(g)}>{g}</button>)}
        </div>
        <div className="dj-view__tracks">
          {filteredTracks.length === 0 ? <p className="dj-view__empty">No hay tracks</p>
            : filteredTracks.map((track, idx) => {
              const active = currentTrack?.id === track.id;
              return (
                <div key={track.id} className={`dj-view__row ${active ? 'dj-view__row--active' : ''}`}
                  onClick={() => onPlay(track, filteredTracks.slice(idx + 1))}>
                  <span className="dj-view__row-num">
                    {active && isPlaying
                      ? <span className="dj-view__mini-eq">{[0,1,2].map(i => <span key={i} style={{ '--di': `${i*0.12}s` }} />)}</span>
                      : idx + 1}
                  </span>
                  <img src={track.image || ''} alt="" className="dj-view__row-art" onError={e => { e.target.style.visibility='hidden'; }} />
                  <div className="dj-view__row-info">
                    <span className="dj-view__row-title">{track.title}</span>
                    <span className="dj-view__row-sub">{track.artist || track.category || 'COSMOS'}</span>
                  </div>
                  <span className="dj-view__row-cat">{track.category || ''}</span>
                  <button className="dj-view__row-add" title="Agregar a cola"
                    onClick={e => { e.stopPropagation(); onAddToQueue(track); }}>+</button>
                </div>
              );
            })}
        </div>
      </section>}

    </div>
  );
}
