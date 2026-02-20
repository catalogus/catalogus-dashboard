import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardMetrics } from "@/hooks/supabase/dashboard";

type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";

type DashboardMetrics = {
  last_updated?: string;
  summary?: {
    revenue?: number;
    paid_orders?: number;
    total_orders?: number;
    avg_order_value?: number;
    paid_rate?: number;
    new_customers?: number;
    newsletter_signups?: number;
    newsletter_verified?: number;
    active_books?: number;
    low_stock?: number;
    digital_books?: number;
    physical_books?: number;
  };
  summary_compare?: Record<string, number | null>;
  trend?: Array<{ date: string; revenue: number; total_orders: number }>;
  status_breakdown?: Array<{ status: string; count: number }>;
  top_books?: Array<{ book_id: string; title: string; units_sold: number; revenue: number; stock: number | null; is_digital: boolean }>;
  inventory?: {
    low_stock_books?: Array<{ id: string; title: string; stock: number | null }>;
    out_of_stock_books?: Array<{ id: string; title: string }>;
  };
  recent_orders?: Array<{ id: string; order_number: string; customer_name: string; status: string; total: number; created_at: string }>;
};

const currency = new Intl.NumberFormat("pt-MZ", {
  style: "currency",
  currency: "MZN",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("pt-MZ", { maximumFractionDigits: 0 });

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function fmtCurrency(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return currency.format(value);
}

function fmtNumber(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return number.format(value);
}

function fmtPercent(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function calcDelta(current?: number | null, previous?: number | null) {
  if (current === null || current === undefined || previous === null || previous === undefined) return "";
  if (previous === 0) return current === 0 ? "0%" : "Novo";
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

function TrendChart({ data }: { data: Array<{ date: string; revenue: number; total_orders: number }> }) {
  if (!data.length) {
    return (
      <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem actividade neste intervalo.</p>
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  const maxOrders = Math.max(...data.map((d) => d.total_orders), 0);
  const points = data.map((point, idx) => {
    const ratio = data.length === 1 ? 0 : idx / (data.length - 1);
    const x = ratio * width;
    const revenueY = height - (maxRevenue ? (point.revenue / maxRevenue) * height : 0);
    const ordersY = height - (maxOrders ? (point.total_orders / maxOrders) * height : 0);
    return { x, revenueY, ordersY };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" role="img" aria-label="Tendencia de receita e pedidos">
      <polyline points={points.map((p) => `${p.x},${p.revenueY}`).join(" ")} fill="none" stroke="#10B981" strokeWidth="2" />
      <polyline points={points.map((p) => `${p.x},${p.ordersY}`).join(" ")} fill="none" stroke="#3B82F6" strokeWidth="2" />
    </svg>
  );
}

export function DashboardContent() {
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [compareEnabled, setCompareEnabled] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const range = useMemo(() => {
    if (rangePreset === "today") return { start: today, end: today };
    if (rangePreset === "7d") return { start: addDays(today, -6), end: today };
    if (rangePreset === "30d") return { start: addDays(today, -29), end: today };
    if (rangePreset === "90d") return { start: addDays(today, -89), end: today };
    const start = customStart || today;
    const end = customEnd || today;
    return end < start ? { start: end, end: start } : { start, end };
  }, [rangePreset, customStart, customEnd, today]);

  const { data, isLoading, isError, isFetching, refetch } = useDashboardMetrics(range.start, range.end);
  const metrics = (data || {}) as DashboardMetrics;
  const summary = metrics.summary || {};
  const compare = metrics.summary_compare || {};

  const kpis = [
    { label: "Receita", value: fmtCurrency(summary.revenue), delta: calcDelta(summary.revenue, compare.revenue as number | null), helper: "vs período anterior" },
    { label: "Pedidos pagos", value: fmtNumber(summary.paid_orders), delta: calcDelta(summary.paid_orders, compare.paid_orders as number | null), helper: "vs período anterior" },
    { label: "Total pedidos", value: fmtNumber(summary.total_orders), delta: calcDelta(summary.total_orders, compare.total_orders as number | null), helper: "vs período anterior" },
    { label: "Valor médio", value: fmtCurrency(summary.avg_order_value), delta: calcDelta(summary.avg_order_value, compare.avg_order_value as number | null), helper: "vs período anterior" },
    { label: "Taxa paga", value: fmtPercent(summary.paid_rate), delta: calcDelta(summary.paid_rate, compare.paid_rate as number | null), helper: "vs período anterior" },
    { label: "Novos clientes", value: fmtNumber(summary.new_customers), delta: calcDelta(summary.new_customers, compare.new_customers as number | null), helper: "vs período anterior" },
    { label: "Livros activos", value: fmtNumber(summary.active_books), delta: "", helper: "Actualmente activos" },
    { label: "Stock baixo", value: fmtNumber(summary.low_stock), delta: "", helper: "Limite: 5" },
  ];

  return (
    <main className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visao Geral</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard Catalogus</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Vendas, saude do catalogo e KPIs operacionais.</p>
            <p className="text-xs text-muted-foreground mt-1">{range.start} - {range.end}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ultima actualizacao: {metrics.last_updated ? new Date(metrics.last_updated).toLocaleString("pt-MZ") : "—"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={rangePreset} onValueChange={(v) => setRangePreset(v as RangePreset)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {rangePreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[150px]" />
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[150px]" />
              </div>
            )}
            <div className="flex items-center gap-2 border rounded-md px-3 py-2">
              <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} className="data-[state=checked]:bg-amber-600" />
              <span className="text-sm">Comparar periodo anterior</span>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Falha ao carregar metricas do dashboard.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? "..." : kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.helper}</p>
                  </div>
                  {compareEnabled && kpi.delta ? <span className="text-xs text-muted-foreground">{kpi.delta}</span> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencia de Receita e Pedidos</CardTitle>
              <CardDescription>Totais diarios para o intervalo seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full bg-emerald-500" />Receita</div>
                <div className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full bg-blue-500" />Pedidos</div>
              </div>
              <TrendChart data={metrics.trend || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Estado dos Pedidos</CardTitle>
              <CardDescription>Distribuicao por estado.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(metrics.status_breakdown || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem pedidos neste intervalo.</p>
                ) : (
                  (metrics.status_breakdown || []).map((status) => (
                    <div key={status.status} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{status.status}</span>
                      <span className="text-muted-foreground">{fmtNumber(status.count)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Livros Mais Vendidos</CardTitle>
                <CardDescription>Best-sellers para o intervalo seleccionado.</CardDescription>
              </div>
              <span className="text-xs text-muted-foreground">Apenas pedidos pagos</span>
            </CardHeader>
            <CardContent>
              {(metrics.top_books || []).length === 0 ? (
                <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Sem vendas de livros neste intervalo.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Livro</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Receita</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(metrics.top_books || []).map((book) => (
                      <TableRow key={book.book_id}>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{fmtNumber(book.units_sold)}</TableCell>
                        <TableCell>{fmtCurrency(book.revenue)}</TableCell>
                        <TableCell>{book.is_digital ? <Badge variant="secondary">Digital</Badge> : fmtNumber(book.stock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Saude do Inventario</CardTitle>
              <CardDescription>Estado do stock fisico e divisao digital.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Digital</p>
                  <p className="text-xl font-bold">{fmtNumber(summary.digital_books)}</p>
                </div>
                <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Fisico</p>
                  <p className="text-xl font-bold">{fmtNumber(summary.physical_books)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Stock Baixo</p>
                  <div className="space-y-1">
                    {(metrics.inventory?.low_stock_books || []).slice(0, 3).map((book) => (
                      <div key={book.id} className="flex items-center justify-between text-sm p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                        <span>{book.title}</span>
                        <span className="text-muted-foreground">{fmtNumber(book.stock)} restantes</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Esgotado</p>
                  <div className="space-y-1">
                    {(metrics.inventory?.out_of_stock_books || []).slice(0, 2).map((book) => (
                      <div key={book.id} className="flex items-center justify-between text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span>{book.title}</span>
                        <span className="text-muted-foreground">0 restantes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Pedidos Recentes</CardTitle>
                <CardDescription>Ultimos pedidos no periodo seleccionado.</CardDescription>
              </div>
              <span className="text-xs text-muted-foreground">{fmtNumber((metrics.recent_orders || []).length)} mostrados</span>
            </CardHeader>
            <CardContent>
              {(metrics.recent_orders || []).length === 0 ? (
                <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Sem pedidos neste intervalo.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(metrics.recent_orders || []).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                        <TableCell>{fmtCurrency(order.total)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleString("pt-MZ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Engajamento</CardTitle>
              <CardDescription>Inscricoes na newsletter e qualidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Inscricoes na Newsletter</p>
                <p className="text-2xl font-bold">{fmtNumber(summary.newsletter_signups)}</p>
                <p className="text-xs text-muted-foreground">Verificadas: {fmtNumber(summary.newsletter_verified)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Novos Clientes</p>
                <p className="text-2xl font-bold">{fmtNumber(summary.new_customers)}</p>
                <p className="text-xs text-muted-foreground">Primeiro pedido neste intervalo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
