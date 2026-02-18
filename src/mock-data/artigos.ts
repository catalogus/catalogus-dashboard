export type ArticleStatus = "published" | "draft" | "trash";
export type TranslationStatus = "review" | "completed" | "pending" | null;

export interface Article {
  id: string;
  title: string;
  author: string;
  categories: string[];
  status: ArticleStatus;
  translationStatus: TranslationStatus;
  date: string;
  hasTranslation: boolean;
}

export const articles: Article[] = [
  {
    id: "1",
    title: "As Sementes do Céu: Mia Couto aborda crise ambiental em literatura para crianças *",
    author: "Admin",
    categories: ["Lançamentos", "Outros"],
    status: "published",
    translationStatus: "review",
    date: "12/11/2025",
    hasTranslation: true,
  },
  {
    id: "2",
    title: "Sebastião Alba: o planeta, o amor e a solidão *",
    author: "Admin",
    categories: ["Opinião"],
    status: "published",
    translationStatus: "review",
    date: "12/10/2025",
    hasTranslation: true,
  },
  {
    id: "3",
    title: "Ualalapi, de Ungulani Ba Ka Khosa, lançado em banda desenhada e em tradução inglesa",
    author: "Admin",
    categories: ["Lançamentos"],
    status: "published",
    translationStatus: "review",
    date: "12/10/2025",
    hasTranslation: true,
  },
  {
    id: "4",
    title: "Literatura moçambicana na 44ª Feira Internacional do Livro de Sharjah",
    author: "Admin",
    categories: ["Outros"],
    status: "published",
    translationStatus: null,
    date: "11/7/2025",
    hasTranslation: false,
  },
  {
    id: "5",
    title: "Severino Ngoenha fala sobre Atravessar o mar alto na Livraria Fundza",
    author: "Admin",
    categories: ["Eventos"],
    status: "published",
    translationStatus: "review",
    date: "11/6/2025",
    hasTranslation: true,
  },
  {
    id: "6",
    title: "Carmen Saranga lança O Medo é um GPS",
    author: "Admin",
    categories: ["Lançamentos"],
    status: "published",
    translationStatus: null,
    date: "11/6/2025",
    hasTranslation: false,
  },
  {
    id: "7",
    title: "Adelino Timóteo Luís lança Maratona para o Precipício na Universidade Pedagógica de Maputo",
    author: "Admin",
    categories: ["Lançamentos"],
    status: "published",
    translationStatus: null,
    date: "11/6/2025",
    hasTranslation: false,
  },
  {
    id: "8",
    title: "A Decadência do Homem Moderno em Eduardo Quive",
    author: "Admin",
    categories: ["Escritura"],
    status: "published",
    translationStatus: null,
    date: "11/5/2025",
    hasTranslation: false,
  },
  {
    id: "9",
    title: "Fundza lança o livro Escadaria de cadáveres, de Albert Dalela, em Maputo",
    author: "Admin",
    categories: ["Lançamentos"],
    status: "published",
    translationStatus: null,
    date: "10/31/2025",
    hasTranslation: false,
  },
  {
    id: "10",
    title: "Catalogus encerra Festival Cidade nas Mãos com sarau cultural que destaca a invocação da memória",
    author: "Admin",
    categories: ["Outros"],
    status: "published",
    translationStatus: null,
    date: "10/25/2025",
    hasTranslation: false,
  },
];

export const articleStats = {
  published: 427,
  drafts: 0,
  trash: 6,
};

export const categories = [
  "Todos",
  "Lançamentos",
  "Outros",
  "Opinião",
  "Eventos",
  "Escritura",
];

export const languages = ["Português", "English"];

export const sortOptions = [
  { value: "newest", label: "Mais Recentes" },
  { value: "oldest", label: "Mais Antigos" },
  { value: "title-asc", label: "Título (A-Z)" },
  { value: "title-desc", label: "Título (Z-A)" },
];
