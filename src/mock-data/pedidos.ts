export type OrderStatus = "processing" | "paid" | "failed" | "cancelled" | "pending";

export interface Pedido {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  createdDate: string;
}

export const pedidos: Pedido[] = [
  {
    id: "1",
    orderNumber: "ORD-00000032",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 850,
    status: "processing",
    createdDate: "2/7/2026",
  },
  {
    id: "2",
    orderNumber: "ORD-00000031",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 10,
    status: "paid",
    createdDate: "2/4/2026",
  },
  {
    id: "3",
    orderNumber: "ORD-00000030",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 10,
    status: "paid",
    createdDate: "2/4/2026",
  },
  {
    id: "4",
    orderNumber: "ORD-00000029",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 700,
    status: "failed",
    createdDate: "2/4/2026",
  },
  {
    id: "5",
    orderNumber: "ORD-00000028",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 700,
    status: "failed",
    createdDate: "2/4/2026",
  },
  {
    id: "6",
    orderNumber: "ORD-00000027",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 700,
    status: "failed",
    createdDate: "2/4/2026",
  },
  {
    id: "7",
    orderNumber: "ORD-00000026",
    customerName: "Admin",
    customerEmail: "admin@catalogus.co.mz",
    total: 700,
    status: "failed",
    createdDate: "2/4/2026",
  },
  {
    id: "8",
    orderNumber: "ORD-00000025",
    customerName: "Olimpio",
    customerEmail: "olymangue@gmail.com",
    total: 700,
    status: "failed",
    createdDate: "2/4/2026",
  },
  {
    id: "9",
    orderNumber: "ORD-00000024",
    customerName: "Olimpio",
    customerEmail: "olymangue@gmail.com",
    total: 700,
    status: "failed",
    createdDate: "2/4/2026",
  },
];

export const pedidosStats = {
  total: 25,
  paid: 2,
  pending: 16,
  failed: 7,
};
