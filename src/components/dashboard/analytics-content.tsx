import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Eye, MousePointer, Clock, Globe, Monitor, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  type UmamiConfig,
  useUmamiConfig,
  useUmamiStats,
  useUmamiPageviews,
  useUmamiMetrics,
  useUmamiActive,
} from "@/hooks/use-umami";

type RangePreset = "today" | "7d" | "30d" | "90d";

const number = new Intl.NumberFormat("pt-MZ", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("pt-MZ", { style: "percent", maximumFractionDigits: 1 });

function fmtNumber(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return number.format(value);
}

function fmtDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getDateRange(preset: RangePreset): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "30d":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "90d":
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}

function TrendChart({ data, label, color }: { data: Array<{ x: string; y: number }>; label: string; color: string }) {
  if (!data.length) {
    return (
      <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados</p>
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const maxValue = Math.max(...data.map((d) => d.y), 1);
  const points = data.map((point, idx) => {
    const ratio = data.length === 1 ? 0.5 : idx / (data.length - 1);
    const x = ratio * width;
    const y = height - (point.y / maxValue) * height * 0.9;
    return `${x},${y}`;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" role="img" aria-label={`${label} chart`}>
        <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" />
      </svg>
    </div>
  );
}

function MetricList({ data, limit = 10 }: { data: Array<{ x: string; y: number }>; limit?: number }) {
  const items = data.slice(0, limit);
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Sem dados</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm">
          <span className="truncate mr-2" title={item.x || "(direct)"}>{item.x || "(direct)"}</span>
          <span className="text-muted-foreground shrink-0">{fmtNumber(item.y)}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, format = "number" }: {
  title: string;
  value?: number | null;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: "number" | "duration" | "percent";
}) {
  const formatted = format === "duration" ? fmtDuration(value) : format === "percent" ? percent.format((value || 0) / 100) : fmtNumber(value);
  const changeText = change !== undefined ? `${change > 0 ? "+" : ""}${change}%` : null;
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
            <p className="text-2xl font-bold mt-1">{formatted}</p>
            {changeText && (
              <p className={`text-xs mt-1 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                {changeText} vs periodo anterior
              </p>
            )}
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted shrink-0">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsContent({ initialConfig }: { initialConfig?: UmamiConfig }) {
  const [rangePreset, setRangePreset] = useState<RangePreset>("7d");
  const range = useMemo(() => getDateRange(rangePreset), [rangePreset]);

  const configQuery = useUmamiConfig(initialConfig);
  const isConfigured = configQuery.data?.configured === true;
  const isConfigLoading = configQuery.isLoading;
  const statsQuery = useUmamiStats(range.start, range.end, isConfigured);
  const pageviewsQuery = useUmamiPageviews(range.start, range.end, "day", isConfigured);
  const urlsQuery = useUmamiMetrics(range.start, range.end, "url", 10, isConfigured);
  const referrersQuery = useUmamiMetrics(range.start, range.end, "referrer", 8, isConfigured);
  const browsersQuery = useUmamiMetrics(range.start, range.end, "browser", 5, isConfigured);
  const devicesQuery = useUmamiMetrics(range.start, range.end, "device", 3, isConfigured);
  const countriesQuery = useUmamiMetrics(range.start, range.end, "country", 5, isConfigured);
  const activeQuery = useUmamiActive(isConfigured);

  const isLoading = statsQuery.isLoading || pageviewsQuery.isLoading;
  const isFetching = statsQuery.isFetching || pageviewsQuery.isFetching;
  const isError = statsQuery.isError || pageviewsQuery.isError;

  const refetch = () => {
    configQuery.refetch();
    statsQuery.refetch();
    pageviewsQuery.refetch();
    urlsQuery.refetch();
    referrersQuery.refetch();
    browsersQuery.refetch();
    devicesQuery.refetch();
    countriesQuery.refetch();
  };

  if (isConfigLoading) {
    return (
      <main className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              A verificar configuracao do analytics...
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!isConfigured) {
    return (
      <main className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardContent className="p-6 text-center">
              <Monitor className="size-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Analytics nao configurado</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione <code className="bg-muted px-1 rounded">UMAMI_API_TOKEN</code> ao ambiente do servidor.
              </p>
              <p className="text-xs text-muted-foreground">
                Obtenha um token API em{" "}
                <a
                  href="https://cloud.umami.is/settings/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  cloud.umami.is/settings/api-tokens
                  <ExternalLink className="size-3" />
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const stats = statsQuery.data;
  const pageviews = pageviewsQuery.data;

  return (
    <main className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analytics</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Web Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Dados do site Catalogus via Umami
            </p>
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
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://cloud.umami.is" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <ExternalLink className="size-4" />
                Ver no Umami
              </a>
            </Button>
          </div>
        </div>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Falha ao carregar dados do Umami. Verifique o token API.
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant={activeQuery.data ? "default" : "secondary"} className="gap-1">
            <div className={`size-2 rounded-full ${activeQuery.data ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
            {activeQuery.data ?? 0} utilizadores activos
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Visualizacoes"
            value={stats?.pageviews?.value}
            change={stats?.pageviews?.change}
            icon={Eye}
          />
          <StatCard
            title="Visitantes"
            value={stats?.visitors?.value}
            change={stats?.visitors?.change}
            icon={Users}
          />
          <StatCard
            title="Visitas"
            value={stats?.visits?.value}
            change={stats?.visits?.change}
            icon={MousePointer}
          />
          <StatCard
            title="Taxa de Rejeicao"
            value={stats?.bounces?.value}
            change={stats?.bounces?.change}
            icon={Globe}
            format="percent"
          />
          <StatCard
            title="Tempo Medio"
            value={stats?.totaltime?.value}
            change={stats?.totaltime?.change}
            icon={Clock}
            format="duration"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencia de Trafego</CardTitle>
              <CardDescription>Visualizacoes e sessoes ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
              ) : (
                <div className="space-y-4">
                  <TrendChart data={pageviews?.pageviews || []} label="Visualizacoes" color="#10B981" />
                  <TrendChart data={pageviews?.sessions || []} label="Sessoes" color="#3B82F6" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Paginas Mais Visitadas</CardTitle>
              <CardDescription>URLs com mais trafego</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricList data={urlsQuery.data || []} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Fontes de Trafego</CardTitle>
              <CardDescription>De onde vêm os visitantes</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricList data={referrersQuery.data || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Navegadores</CardTitle>
              <CardDescription>Browsers mais utilizados</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricList data={browsersQuery.data || []} limit={5} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dispositivos</CardTitle>
              <CardDescription>Tipos de dispositivo</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricList data={devicesQuery.data || []} limit={3} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Paises</CardTitle>
            <CardDescription>Localizacao geografica dos visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricList data={countriesQuery.data || []} limit={5} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
