import { useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useOrders,
  useOrderStats,
  useUpdateOrder,
  useMpesaTransactionStatus,
  useRefreshMpesaStatus,
  useReverseMpesaTransaction,
} from "@/hooks/supabase/orders";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLongLoading } from "@/hooks/use-long-loading";
import { toast } from "sonner";
import type { Order } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const PAGE_SIZE = 10;

export function PedidosContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data: ordersData, isLoading, isFetching, error, refetch } = useOrders(selectedStatus, page, PAGE_SIZE, debouncedSearch);
  const { data: stats } = useOrderStats();
  const updateMutation = useUpdateOrder();
  const refreshMpesaMutation = useRefreshMpesaStatus();
  const reverseMpesaMutation = useReverseMpesaTransaction();

  const mpesaStatusQuery = useMpesaTransactionStatus(selectedOrder?.id);

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.totalPages || 1;
  const totalCount = ordersData?.totalCount || 0;
  const isLongLoading = useLongLoading(isLoading, 7000);

  const isMpesaOrder = (order: Order) =>
    Boolean(
      order.mpesa_transaction_id ||
      order.mpesa_reference ||
      order.mpesa_last_response ||
      order.payment_method?.toLowerCase().includes("mpesa"),
    );

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

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const promise = updateMutation.mutateAsync({ id: orderId, status: newStatus });
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
  };

  const handleRefreshMpesaStatus = async (order: Order) => {
    const promise = refreshMpesaMutation.mutateAsync(order.id);
    toast.promise(promise, {
      loading: "A actualizar estado M-Pesa...",
      success: "Estado M-Pesa actualizado",
      error: "Falha ao actualizar estado M-Pesa",
    });
    await promise;
  };

  const handleReverseMpesa = async (order: Order) => {
    const confirmed = confirm("Tem certeza que deseja solicitar reversão para este pedido?");
    if (!confirmed) return;

    const promise = reverseMpesaMutation.mutateAsync({
      orderId: order.id,
      amount: Number(order.total),
    });

    toast.promise(promise, {
      loading: "A enviar pedido de reversão M-Pesa...",
      success: "Pedido de reversão enviado",
      error: "Falha ao enviar reversão M-Pesa",
    });

    await promise;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Carregando pedidos...</p>
          {isLongLoading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Isto está a demorar mais do que o esperado.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-red-500">Erro ao carregar pedidos: {(error as Error).message}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </div>
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
            Controlo M-Pesa activo (estado e reversão)
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
                <TableHead className="w-[190px]">M-Pesa</TableHead>
                <TableHead className="w-[120px]">Criado</TableHead>
                <TableHead className="w-[120px]">Acções</TableHead>
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
                  <TableCell>
                    {isMpesaOrder(order) ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{order.mpesa_transaction_id || "Sem transacção"}</p>
                        <p className="text-xs text-muted-foreground">{order.mpesa_reference || "Sem referência"}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem dados M-Pesa</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Atualizar estado</DropdownMenuLabel>
                        <DropdownMenuItem
                          disabled={isMpesaOrder(order) || updateMutation.isPending}
                          onClick={() => handleStatusChange(order.id, "processing")}
                        >
                          Marcar como Processando
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isMpesaOrder(order) || updateMutation.isPending}
                          onClick={() => handleStatusChange(order.id, "paid")}
                        >
                          Marcar como Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isMpesaOrder(order) || updateMutation.isPending}
                          onClick={() => handleStatusChange(order.id, "failed")}
                        >
                          Marcar como Falhou
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isMpesaOrder(order) || updateMutation.isPending}
                          onClick={() => handleStatusChange(order.id, "cancelled")}
                        >
                          Marcar como Cancelado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!isMpesaOrder(order) || refreshMpesaMutation.isPending}
                          onClick={() => handleRefreshMpesaStatus(order)}
                        >
                          Atualizar estado M-Pesa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!isMpesaOrder(order) || reverseMpesaMutation.isPending}
                          onClick={() => handleReverseMpesa(order)}
                        >
                          Reverter
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                          Detalhes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes M-Pesa</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Pedido ${selectedOrder.order_number}`
                : "Detalhes da transacção"}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Transacção</p>
                  <p className="font-medium break-all">{selectedOrder.mpesa_transaction_id || "-"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Referência</p>
                  <p className="font-medium break-all">{selectedOrder.mpesa_reference || "-"}</p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground mb-2">Histórico de estados (RPC)</p>
                {mpesaStatusQuery.isLoading ? (
                  <p className="text-muted-foreground">A carregar histórico...</p>
                ) : mpesaStatusQuery.isError ? (
                  <p className="text-red-500">Falha ao carregar histórico M-Pesa.</p>
                ) : (mpesaStatusQuery.data?.length || 0) === 0 ? (
                  <p className="text-muted-foreground">Sem eventos registados.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-auto pr-1">
                    {mpesaStatusQuery.data?.map((event) => (
                      <div key={`${event.transaction_id}-${event.created_at}`} className="rounded border p-2">
                        <p className="font-medium">{event.status}</p>
                        <p className="text-xs text-muted-foreground">{event.result_desc}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString('pt-MZ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground mb-2">Última resposta do gateway</p>
                <pre className="max-h-52 overflow-auto text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap break-all">
                  {selectedOrder.mpesa_last_response
                    ? JSON.stringify(selectedOrder.mpesa_last_response, null, 2)
                    : "Sem resposta armazenada."}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
