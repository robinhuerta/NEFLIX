export const mockMovies = [
  {
    id: 1,
    title: "One Piece",
    image: "https://image.tmdb.org/t/p/original/fc97m32vYvS7D6Yis6YvS3C9MWv.jpg",
    badge: "Nueva temporada",
    genre: "Animación • Acción • Aventura",
    match: "98% para ti",
    maturity: "10+",
    duration: "1 temporada",
    quality: "HD"
  },
  {
    id: 2,
    title: "Sabuesos",
    image: "https://image.tmdb.org/t/p/original/9vG9XF6t7Z5K7A0uD0n9Xy8L9.jpg",
    badge: "Recién agregado",
    genre: "Violento • Acción • Boxeo",
    match: "95% para ti",
    maturity: "16+",
    duration: "1 temporada",
    quality: "HD"
  },
  {
    id: 3,
    title: "El Mentalista",
    image: "https://image.tmdb.org/t/p/original/5mS16U7PjZtE2n1Y8Xf8N1D0M.jpg",
    badge: "Recién agregado",
    genre: "Crimen • Drama • Misterio",
    match: "92% para ti",
    maturity: "13+",
    duration: "7 temporadas",
    quality: "HD"
  },
  {
    id: 4,
    title: "Vigilados",
    image: "https://image.tmdb.org/t/p/original/qZqO5eT1d1X2N3Y4Z5A6B7C8D.jpg",
    genre: "Thriller • Suspenso",
    match: "89% para ti",
    maturity: "16+",
    duration: "1 temporada",
    quality: "HD"
  },
  {
    id: 5,
    title: "One Piece (Top 10)",
    image: "https://image.tmdb.org/t/p/original/fc97m32vYvS7D6Yis6YvS3C9MWv.jpg",
    isTop10: true,
    rank: 1
  },
  {
    id: 6,
    title: "BTS",
    image: "https://image.tmdb.org/t/p/original/fc97m32vYvS7D6Yis6YvS3C9MWv.jpg",
    isTop10: true,
    rank: 3
  }
];

export const categories = [
  { id: 1, title: "Tu próxima historia", items: mockMovies.slice(0, 4) },
  { id: 2, title: "Atrapantes de principio a fin", items: mockMovies.slice(1, 5) },
  { id: 3, title: "Las 10 series más populares en Perú hoy", items: mockMovies.filter(m => m.isTop10), isTop10Row: true }
];
