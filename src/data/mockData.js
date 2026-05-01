export const mockMovies = [];

export const categories = [
  { id: 1, title: "Originales de COSMOS", items: mockMovies },
  { id: 2, title: "Tu próxima historia", items: mockMovies.slice(0, 7) },
  { id: 3, title: "Atrapantes de principio a fin", items: mockMovies.slice(1, 8) }
];
