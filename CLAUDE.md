# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Descripción del proyecto

**COSMOS** es una PWA estilo Netflix construida con React 19 + Vite. El contenido se almacena en Firebase (Firestore + Storage). La plataforma soporta películas, series, videos musicales (YouTube + locales), un reproductor de música persistente, un chatbot con IA y una vista de DJ virtual.

## Comandos

```bash
npm run dev       # Inicia el servidor de desarrollo Vite (HMR, proxy /api → localhost:3001)
npm run build     # Build de producción → dist/
npm run preview   # Vista previa del build de producción
npm run lint      # Verificación ESLint
```

Para ejecutar el backend del ChatBot localmente (necesario para `/api/chat` en dev):
```bash
cd server && node index.js   # Inicia Express en localhost:3001
```

No hay suite de pruebas.

## Arquitectura

### Navegación

No hay React Router. La navegación es completamente basada en estado en `App.jsx` mediante flags booleanos: `showIntro`, `showMusic`, `showDJ`, `showSeries`, `showAdmin`, `showPlayer`. Cambiar de vista significa alternar estos flags.

### Estado global

**Todo el estado global vive en `App.jsx`** (~940 líneas). Sin Redux ni Context API — todo se eleva y se pasa como props. Grupos de estado principales:

- **Contenido**: `firebaseVideos`, `featuredMovie`, `selectedVideo`, `selectedSeries`
- **Reproductor de música**: `currentTrack`, `musicQueue`, `isMusicPlaying`, `musicVolume`, `musicShuffle`, `musicRepeat` (`'none'|'all'|'one'`), `audioRef`
- **Datos de usuario**: `myList`, `watchHistory`, `likes` — todos persistidos en `localStorage`
- **UI**: toggles de modales, query de búsqueda, flags de navegación

### Flujo de datos

1. Al montar, `App.jsx` llama a `fetchAllVideos()` desde `FirebaseService.js`
2. La colección `movies` de Firestore es la fuente de verdad; Firebase Storage es el fallback
3. `AdminDashboard` dispara un callback de refresco después de subidas/eliminaciones
4. El progreso de reproducción se guarda en localStorage (`cosmos_history`) — solo si se vieron >30s y se completó <95%

### Clasificación de contenido (auto-detectada en `FirebaseService.js`)

- **YouTube**: URL contiene `youtu.be` o `youtube.com` → usa reproductor iframe
- **Google Drive**: URL contiene `drive.google.com`
- **Local**: URL de Firebase Storage → usa elemento nativo `<video>`
- El campo `category` (`music`, `series`, `movie`) determina en qué filas/vistas aparece el contenido

### Reproducción de video

`VideoPlayer.jsx` maneja las tres fuentes (local, YouTube, Drive). `MusicPlayer.jsx` es una barra inferior persistente con cola, shuffle, repeat y seek — también soporta iframes de YouTube para videos musicales.

### ChatBot

- Frontend: `ChatBot.jsx` (entrada de voz, chips de acción)
- Backend: `server/index.js` (Express, Claude Haiku) proxiado via Vite en dev; `api/chat.js` (función Vercel) en producción
- El system prompt incluye la lista completa de películas, historial, pista actual y myList
- Las respuestas del chatbot pueden contener marcadores de acción como `[[PLAY:id]]`, `[[WATCH:id]]`, `[[QUEUE:id]]`, `[[YTSEARCH:query]]` que `App.jsx` parsea y ejecuta

### Búsqueda en YouTube

- El frontend llama a `/api/ytsearch?q=...&max=12`
- En producción: `api/ytsearch.js` (función serverless de Vercel) con rotación automática de API keys si se agota la cuota
- Las keys se guardan en `.env` como `VITE_YOUTUBE_API_KEY`

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `src/App.jsx` | Componente raíz; todo el estado global y la lógica de navegación |
| `src/firebaseConfig.js` | Inicialización de Firebase (Auth, Firestore, Storage) |
| `src/services/FirebaseService.js` | Todas las operaciones de lectura/escritura en Firestore/Storage |
| `src/components/VideoPlayer.jsx` | Reproductor a pantalla completa para contenido local/YouTube/Drive |
| `src/components/MusicPlayer.jsx` | Barra de música persistente en la parte inferior |
| `src/components/AdminDashboard.jsx` | UI de gestión y subida de contenido |
| `src/components/DJView.jsx` | Interfaz de tornamesas DJ virtual |
| `src/components/ChatBot.jsx` | UI del chatbot con entrada de voz |
| `server/index.js` | Backend Express del ChatBot (dev) |
| `api/chat.js` | Función Vercel del ChatBot (producción) |
| `api/ytsearch.js` | Proxy de búsqueda YouTube con rotación de API keys |

## Variables de entorno

- `.env` (raíz): `VITE_YOUTUBE_API_KEY` — key de YouTube Data API v3
- `server/.env`: `ANTHROPIC_API_KEY` — key de la API de Claude para el servidor local

## Despliegue

Desplegado en **Vercel**. `vercel.json` configura las funciones serverless bajo `api/`. El proxy de Vite (`/api → localhost:3001`) solo aplica en local — en producción todas las llamadas a `/api` van a las funciones de Vercel.

## Claves de localStorage

```
cosmos_mylist     Array JSON de películas guardadas
cosmos_history    Array JSON de videos con seguimiento de progreso
cosmos_likes      Objeto JSON { movieId: true/false }
cosmos_autoplay   boolean
```
