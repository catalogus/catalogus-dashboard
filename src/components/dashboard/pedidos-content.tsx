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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useOrders, useOrderStats, useUpdateOrder } from "@/hooks/use-supabase";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export function PedidosContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { data: ordersData, isLoading, error } = useOrders(selectedStatus, page, PAGE_SIZE, debouncedSearch);
  const { data: stats } = useOrderStats();
  const updateMutation = useUpdateOrder();

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.totalPages || 1;
  const totalCount = ordersData?.totalCount || 0;

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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const promise = updateMutation.mutateAsync({ id: orderId, status: newStatus as any });
    toast.promise(promise, {
      loading: "A actualizar estado do pedido...",
      success: "Estado do pedido actualizado com sucesso",
      error: "Não foi possível actualizar o estado do pedido",
    });
    await promise;
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Erro ao carregar pedidos: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Pedidos</p>
            <p className="text-3xl font-bold mt-1">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Desde sempre</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pedidos Pagos</p>
            <p className="text-3xl font-bold mt-1 text-emerald-600">{stats?.paid || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Pagamentos completados</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pendente/Processando</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Em progresso</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase">Falhou/Cancelado</p>
            <p className="text-3xl font-bold mt-1 text-red-600">{stats?.failed || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Precisa de atenção</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou número do pedido..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
              setPage(1);
            }}
          >
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customer_name}</span>
                      <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{order.total} MTn</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
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
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-start gap-8">
          <p className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
            A mostrar {orders.length} de {totalCount} pedido(s)
          </p>
          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    isActive={pageNum === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pageNum);
                    }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
