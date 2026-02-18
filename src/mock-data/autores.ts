export interface Autor {
  id: string;
  name: string;
  photo: string;
  phone: string | null;
  authorType: string | null;
  linkedProfile: string | null;
  wordpressSlug: string;
  featured: boolean;
}

export const autores: Autor[] = [
  {
    id: "1",
    name: "Adelino albano Luís",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
    phone: "848828820",
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "adelino-albano-luis",
    featured: false,
  },
  {
    id: "2",
    name: "Adelino Timóteo",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
    phone: null,
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "adelino-timoteo",
    featured: false,
  },
  {
    id: "3",
    name: "Adérito Guirrugo",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
    phone: null,
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "aderito-guirrugo",
    featured: true,
  },
  {
    id: "4",
    name: "Agnaldo Bata",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&h=50&fit=crop",
    phone: null,
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "agnaldo-bata",
    featured: false,
  },
  {
    id: "5",
    name: "Agostinho Inguane",
    photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=50&h=50&fit=crop",
    phone: null,
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "ganhanguane-masseve",
    featured: false,
  },
  {
    id: "6",
    name: "Albino Fragoso Francisco Magaia",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop",
    phone: null,
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "albino-magaia",
    featured: false,
  },
  {
    id: "7",
    name: "Alerto Augusto Bia",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=50&h=50&fit=crop",
    phone: "258861796624",
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "alerto-bia",
    featured: false,
  },
  {
    id: "8",
    name: "Almeida Cumbane",
    photo: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=50&h=50&fit=crop",
    phone: "844236042",
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "almeida-cumbane",
    featured: false,
  },
  {
    id: "9",
    name: "Álvaro Fausto Taruma",
    photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=50&h=50&fit=crop",
    phone: "847139913",
    authorType: null,
    linkedProfile: null,
    wordpressSlug: "alvaro-fausto-taruma",
    featured: false,
  },
];

export const autoresStats = {
  total: 95,
  featured: 11,
  linkedProfiles: 3,
  pendingClaims: 0,
};
