export interface Livro {
  id: string;
  title: string;
  authors: string[];
  category: string;
  language: string;
  price: number;
  stock: number;
  status: "active" | "inactive" | "featured";
}

export const livros: Livro[] = [
  {
    id: "1",
    title: "Sobre Toda Escridão",
    authors: [],
    category: "",
    language: "PT",
    price: 700,
    stock: 485,
    status: "active",
  },
  {
    id: "2",
    title: "Observador de sonhos",
    authors: [],
    category: "",
    language: "PT",
    price: 500,
    stock: 100,
    status: "active",
  },
  {
    id: "3",
    title: "Mutiladas (II edição)",
    authors: [],
    category: "",
    language: "PT",
    price: 800,
    stock: 500,
    status: "active",
  },
  {
    id: "4",
    title: "Mutiladas (I edição)",
    authors: [],
    category: "",
    language: "PT",
    price: 750,
    stock: 0,
    status: "active",
  },
  {
    id: "5",
    title: "Sobreviver ao Fogo",
    authors: [],
    category: "",
    language: "PT",
    price: 850,
    stock: 498,
    status: "active",
  },
  {
    id: "6",
    title: "O Medo é um GPS",
    authors: [],
    category: "",
    language: "PT",
    price: 1500,
    stock: 500,
    status: "featured",
  },
  {
    id: "7",
    title: "Camões Revisitado e Reiventado",
    authors: [],
    category: "",
    language: "PT",
    price: 0,
    stock: 0,
    status: "active",
  },
  {
    id: "8",
    title: "Nas margens da lua",
    authors: [],
    category: "",
    language: "PT",
    price: 850,
    stock: 500,
    status: "active",
  },
  {
    id: "9",
    title: "Amores e outras cores",
    authors: [],
    category: "",
    language: "PT",
    price: 1000,
    stock: 0,
    status: "active",
  },
  {
    id: "10",
    title: "Cântico voraz do Precipício",
    authors: [],
    category: "",
    language: "PT",
    price: 500,
    stock: 500,
    status: "active",
  },
  {
    id: "11",
    title: "Rosalina",
    authors: [],
    category: "",
    language: "PT",
    price: 800,
    stock: 500,
    status: "active",
  },
  {
    id: "12",
    title: "Todas as coisas visíveis",
    authors: [],
    category: "",
    language: "PT",
    price: 650,
    stock: 0,
    status: "active",
  },
];

export const livrosStats = {
  total: 24,
  active: 24,
  featured: 4,
  digital: 0,
  lowStock: 7,
};
