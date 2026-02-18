export type UserRole = "admin" | "author" | "user";
export type UserStatus = "approved" | "pending" | "rejected" | null;

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  date: string;
}

export const usuarios: Usuario[] = [
  {
    id: "1",
    name: "Fujitora",
    email: "fujitorarn@gmail.com",
    role: "author",
    status: "approved",
    date: "1/10/2026",
  },
  {
    id: "2",
    name: "Olimpio Adelino",
    email: "olymangue@gmail.com",
    role: "author",
    status: "approved",
    date: "1/4/2026",
  },
  {
    id: "3",
    name: "Admin",
    email: "admin@catalogus.co.mz",
    role: "admin",
    status: null,
    date: "1/4/2026",
  },
];

export const usuariosStats = {
  total: 3,
  admins: 1,
  authors: 2,
  pending: 0,
};

export const userRoles = [
  { value: "all", label: "Todos" },
  { value: "admin", label: "Admin" },
  { value: "author", label: "Autor" },
  { value: "user", label: "Utilizador" },
];

export const userStatuses = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Aprovado" },
  { value: "pending", label: "Pendente" },
  { value: "rejected", label: "Rejeitado" },
];
