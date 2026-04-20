export const mockMovies = [
  {
    id: 'yt-example-1',
    title: 'Noches de COSMOS',
    description: 'Un experimento visual de alta resolución usando la tecnología de YouTube integrada en nuestra plataforma.',
    videoUrl: 'https://www.youtube.com/watch?v=9GqOBgasFEA',
    image: 'https://img.youtube.com/vi/9GqOBgasFEA/maxresdefault.jpg',
    category: 'Novedades',
    maturity: '7+',
    duration: '4m 30s',
    isExternal: true
  }
];

export const categories = [
  { id: 1, title: "Originales de COSMOS", items: mockMovies },
  { id: 2, title: "Tu próxima historia", items: mockMovies.slice(0, 7) },
  { id: 3, title: "Atrapantes de principio a fin", items: mockMovies.slice(1, 8) }
];
