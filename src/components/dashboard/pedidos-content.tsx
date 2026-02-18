import { useState } from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pedidos, pedidosStats } from "@/mock-data/pedidos";

export function PedidosContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">pago</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20">processando</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/20">falhou</Badge>;
      case "cancelled":
        return <Badge variant="secondary">cancelado</Badge>;
      default:
        return null;
    }
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    if (selectedStatus !== "all" && pedido.status !== selectedStatus) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        pedido.customerName.toLowerCase().includes(searchLower) ||
        pedido.customerEmail.toLowerCase().includes(searchLower) ||
        pedido.orderNumber.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Comércio
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Pedidos
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            M-Pesa status aparecerá aqui
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Pedidos</p>
            <p className="text-3xl font-bold mt-1">{pedidosStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pedidos Pagos</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600">{pedidosStats.paid}</p>
            <p className="text-xs text-muted-foreground mt-1">Pagamentos completados</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pendente/Processando</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{pedidosStats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Em progresso</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Falhou/Cancelado</p>
            <p className="text-3xl font-bold mt-1 text-red-600">{pedidosStats.failed}</p>
            <p className="text-xs text-muted-foreground mt-1">Precisa de atenção</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou número do pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Pedido</TableHead>
                <TableHead className="w-[250px]">Cliente</TableHead>
                <TableHead className="w-[120px]">Total</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[120px]">Criado</TableHead>
                <TableHead className="w-[150px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">{pedido.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{pedido.customerName}</span>
                      <span className="text-xs text-muted-foreground">{pedido.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>{pedido.total} MTn</TableCell>
                  <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{pedido.createdDate}</TableCell>
                  <TableCell>
                    <Select defaultValue={pedido.status}>
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processing">Processando</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
