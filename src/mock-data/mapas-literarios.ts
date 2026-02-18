export interface MapaLiterario {
  id: string;
  cover: string;
  title: string;
  slug: string;
  pages: number;
  date: string;
  status: "active" | "inactive" | "featured";
}

export const mapasLiterarios: MapaLiterario[] = [
  {
    id: "1",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=140&fit=crop",
    title: "Mapa Literario_CATALOGUS_final.pd",
    slug: "/publicacoes/mapa-literario-catalogus-final-pd",
    pages: 7,
    date: "23/01/2026",
    status: "active",
  },
  {
    id: "2",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=140&fit=crop",
    title: "Mapa Literário 77",
    slug: "/publicacoes/mapa-literario-77",
    pages: 6,
    date: "23/01/2026",
    status: "active",
  },
];

export const mapasStats = {
  total: 2,
  active: 2,
  featured: 0,
  processed: 2,
};
