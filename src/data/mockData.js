export const mockMovies = [];

export const categories = [
  { id: 1, title: "Tu próxima historia", items: mockMovies.slice(0, 7) },
  { id: 2, title: "Atrapantes de principio a fin", items: mockMovies.slice(1, 8) },
  { id: 3, title: "Las 10 series más populares en Perú hoy", items: mockMovies.filter(m => m.isTop10), isTop10Row: true }
];
