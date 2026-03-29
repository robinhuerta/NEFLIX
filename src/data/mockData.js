export const mockMovies = [
  {
    id: 1,
    title: "El Último Guerrero",
    image: "/posters/el-ultimo-guerrero-square.png",
    badge: "Tendencia",
    genre: "Acción • Aventura • Épico",
    match: "98% para ti",
    maturity: "16+",
    duration: "2h 15m",
    quality: "4K",
    fileName: "el ultimo guerrero.mp4"
  },
  {
    id: 2,
    title: "American Sicario",
    image: "/posters/american-sicario-square.png",
    badge: "Recién agregado",
    genre: "Crimen • Drama • Thriller",
    match: "95% para ti",
    maturity: "18+",
    duration: "1h 45m",
    quality: "HD",
    fileName: "AMERICAN SICARIO MEJOR PELICULAS DE ACCION Pelicula_ Completa en Espanol Latino HD(720P_HD).mp4"
  },
  {
    id: 4,
    title: "Vigilados",
    image: "/posters/vigilados-square.png",
    genre: "Thriller • Suspenso",
    match: "89% para ti",
    maturity: "16+",
    duration: "1 temporada",
    quality: "HD"
  },
  {
    id: 5,
    title: "El Último Guerrero (Top 10)",
    image: "/posters/el-ultimo-guerrero-square.png",
    isTop10: true,
    rank: 1,
    fileName: "el ultimo guerrero.mp4"
  },
  {
    id: 6,
    title: "Sicario (Top 10)",
    image: "/posters/american-sicario-square.png",
    isTop10: true,
    rank: 2,
    fileName: "AMERICAN SICARIO MEJOR PELICULAS DE ACCION Pelicula_ Completa en Espanol Latino HD(720P_HD).mp4"
  }
];

export const categories = [
  { id: 1, title: "Tu próxima historia", items: mockMovies.slice(0, 4) },
  { id: 2, title: "Atrapantes de principio a fin", items: mockMovies.slice(1, 5) },
  { id: 3, title: "Las 10 series más populares en Perú hoy", items: mockMovies.filter(m => m.isTop10), isTop10Row: true }
];
