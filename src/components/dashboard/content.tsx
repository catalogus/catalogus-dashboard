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


export function DashboardContent() {
  // Mock stats data
  const stats = {
    revenue: { value: "0,00", unit: "MTn", change: "0%" },
    paidOrders: { value: 0, change: "0%" },
    totalOrders: { value: 0, change: "-100.0%" },
    avgOrderValue: { value: "—", change: "" },
    paidRate: { value: "—", change: "" },
    newCustomers: { value: 0, change: "0%" },
    activeBooks: { value: 24, subtitle: "Actualmente activos" },
    lowStock: { value: 7, subtitle: "Limite: 5" },
  };

  // Low stock and out of stock books
  const lowStockBooks = [
    "Amores e outras cores",
    "Camões Revisitado e Reiventado",
    "Memórias",
    "Mutiladas (I edição)",
    "Navegar.amor.café",
    "Poemetria",
    "Todas as coisas visíveis",
  ];

  const outOfStockBooks = [
    "Amores e outras cores",
    "Camões Revisitado e Reiventado",
    "Memórias",
    "Mutiladas (I edição)",
    "Navegar.amor.café",
    "Poemetria",
    "Todas as coisas visíveis",
  ];

  // Order status data
  const orderStatusData = [
    { label: "Cancelado", count: 0, percentage: 0.0, color: "bg-gray-300" },
    { label: "Falhou", count: 0, percentage: 0.0, color: "bg-red-500" },
    { label: "Pago", count: 0, percentage: 0.0, color: "bg-emerald-500" },
    { label: "Pendente", count: 0, percentage: 0.0, color: "bg-amber-500" },
    { label: "Processando", count: 0, percentage: 0.0, color: "bg-blue-500" },
  ];

  return (
    <main className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Visão Geral
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Dashboard Catalogus
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vendas, saúde do catálogo e KPIs operacionais.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              12 Fev, 2026 – 18 Fev, 2026
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Última actualização: 18 Fev, 05:30 AM
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="7days">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2">
              <Switch className="data-[state=checked]:bg-amber-600" />
              <span className="text-sm">Comparar período anterior</span>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="size-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Receita</p>
                  <p className="text-2xl font-bold mt-1">{stats.revenue.value} {stats.revenue.unit}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
                </div>
                <span className="text-xs text-muted-foreground">{stats.revenue.change}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Pedidos Pagos</p>
                  <p className="text-2xl font-bold mt-1">{stats.paidOrders.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
                </div>
                <span className="text-xs text-muted-foreground">{stats.paidOrders.change}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Total de Pedidos</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalOrders.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
                </div>
                <span className="text-xs text-red-600">{stats.totalOrders.change}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Valor Médio do Pedido</p>
                  <p className="text-2xl font-bold mt-1">{stats.avgOrderValue.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
                </div>
                <span className="text-xs text-muted-foreground">{stats.avgOrderValue.change}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Taxa de Pagamento</p>
                <p className="text-2xl font-bold mt-1">{stats.paidRate.value}</p>
                <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Novos Clientes</p>
                  <p className="text-2xl font-bold mt-1">{stats.newCustomers.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">vs período anterior</p>
                </div>
                <span className="text-xs text-muted-foreground">{stats.newCustomers.change}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Livros Activos</p>
                <p className="text-2xl font-bold mt-1">{stats.activeBooks.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeBooks.subtitle}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Stock Baixo</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{stats.lowStock.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.lowStock.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendência de Receita e Pedidos</CardTitle>
              <CardDescription>Totais diários para o intervalo seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Receita</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Pedidos</span>
                </div>
              </div>
              <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem actividade neste intervalo.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Estado dos Pedidos</CardTitle>
              <CardDescription>Distribuição por estado.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden flex">
                {orderStatusData.map((status, idx) => (
                  <div key={idx} className={`h-full ${status.color}`} style={{ width: `${100 / orderStatusData.length}%` }} />
                ))}
              </div>
              <div className="space-y-2">
                {orderStatusData.map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                      <span>{status.label}</span>
                    </div>
                    <span className="text-muted-foreground">{status.count} • {status.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Top Books & Inventory */}
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
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem vendas de livros neste intervalo.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Saúde do Inventário</CardTitle>
              <CardDescription>Estado do stock físico e divisão digital.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Digital</p>
                  <p className="text-xl font-bold">0</p>
                </div>
                <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Físico</p>
                  <p className="text-xl font-bold">24</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Stock Baixo</p>
                  <div className="space-y-1">
                    {lowStockBooks.slice(0, 3).map((book, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                        <span>{book}</span>
                        <span className="text-muted-foreground">0 restantes</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Esgotado</p>
                  <div className="space-y-1">
                    {outOfStockBooks.slice(0, 2).map((book, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span>{book}</span>
                        <span className="text-muted-foreground">0 restantes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Recent Orders & Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Pedidos Recentes</CardTitle>
                <CardDescription>Últimos pedidos no período seleccionado.</CardDescription>
              </div>
              <span className="text-xs text-muted-foreground">0 mostrados</span>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem pedidos neste intervalo.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Engajamento</CardTitle>
              <CardDescription>Inscrições na newsletter e qualidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Inscrições na Newsletter</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Verificadas: 0</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Novos Clientes</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Primeiro pedido neste intervalo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
