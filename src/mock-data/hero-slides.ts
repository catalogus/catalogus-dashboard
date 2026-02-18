export interface HeroSlide {
  id: string;
  thumbnail: string;
  title: string;
  contentType: "Artigo" | "Livro" | "Evento" | "External";
  linkedContent: string;
  order: number;
  isActive: boolean;
}

export const heroSlides: HeroSlide[] = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&h=60&fit=crop",
    title: "Sebastião Alba: o planeta, o amor e a solidão",
    contentType: "Artigo",
    linkedContent: "Sebastião Alba: o planeta, o amor e a solidão",
    order: 0,
    isActive: true,
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=60&fit=crop",
    title: "As sementes do céu",
    contentType: "Artigo",
    linkedContent: "\"As Sementes do Céu\": Mia Couto aborda crise ambiental em literatura para crianças",
    order: 1,
    isActive: true,
  },
  {
    id: "3",
    thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=60&fit=crop",
    title: "Literatura moçambicana contemporânea",
    contentType: "Livro",
    linkedContent: "Antologia da Literatura Moçambicana",
    order: 2,
    isActive: false,
  },
];
