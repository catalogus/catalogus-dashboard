import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAuditEvents, usePurgeAuditEvents } from '@/hooks/supabase/audit'
import { supabase, type AuditEvent } from '@/lib/supabase'

const PAGE_SIZE = 25

const ENTITY_OPTIONS = ['all', 'posts', 'books', 'authors', 'profiles', 'orders', 'publications', 'hero_slides', 'author_claims']

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-MZ')
}

function normalizeChangedFields(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function ActivityLogContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [entityType, setEntityType] = useState('all')
  const [outcome, setOutcome] = useState('all')
  const [actorId, setActorId] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const eventsQuery = useAuditEvents({
    page,
    pageSize: PAGE_SIZE,
    search,
    action,
    entityType,
    outcome,
    actorId,
  })

  const purgeMutation = usePurgeAuditEvents()

  const actorsQuery = useQuery({
    queryKey: ['audit-actors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['admin', 'author'])
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  const availableActions = useMemo(() => {
    const unique = new Set<string>()
    for (const event of eventsQuery.data?.data ?? []) {
      unique.add(event.action)
    }
    return ['all', ...Array.from(unique)]
  }, [eventsQuery.data?.data])

  const totalPages = eventsQuery.data?.totalPages || 1

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Governança</p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Activity Log</h1>
            <p className="text-sm text-muted-foreground mt-1">Histórico de ações administrativas e de autores.</p>
          </div>
          <Button
            variant="outline"
            disabled={purgeMutation.isPending}
            onClick={async () => {
              try {
                const removed = await purgeMutation.mutateAsync(90)
                toast.success(`${removed} eventos antigos removidos (retenção de 90 dias).`)
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Falha ao limpar eventos antigos.'
                toast.error(message)
              }
            }}
          >
            {purgeMutation.isPending ? 'A limpar...' : 'Limpar > 90 dias'}
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Pesquisar ação, resumo, ator..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="lg:col-span-2"
          />

          <Select value={action} onValueChange={(value) => { setAction(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              {availableActions.map((item) => (
                <SelectItem key={item} value={item}>{item === 'all' ? 'Todas ações' : item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityType} onValueChange={(value) => { setEntityType(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Entidade" /></SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>{item === 'all' ? 'Todas entidades' : item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={outcome} onValueChange={(value) => { setOutcome(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Resultado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos resultados</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actorId} onValueChange={(value) => { setActorId(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Ator" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos atores</SelectItem>
              {(actorsQuery.data ?? []).map((actor) => (
                <SelectItem key={actor.id} value={actor.id}>{actor.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Resumo</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando atividade...</TableCell>
                </TableRow>
              )}

              {!eventsQuery.isLoading && (eventsQuery.data?.data ?? []).map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</TableCell>
                  <TableCell className="font-medium">{event.action}</TableCell>
                  <TableCell>{event.entity_type}</TableCell>
                  <TableCell>{event.actor_name || event.actor_id || '—'}</TableCell>
                  <TableCell>
                    {event.outcome === 'error' ? (
                      <Badge variant="destructive">error</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">success</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[360px] truncate text-muted-foreground">{event.summary || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(event)}>Ver</Button>
                  </TableCell>
                </TableRow>
              ))}

              {!eventsQuery.isLoading && (eventsQuery.data?.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum evento encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{eventsQuery.data?.totalCount || 0} eventos</span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage((prev) => prev - 1)
                  }}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem className="px-3">{page} / {totalPages}</PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) setPage((prev) => prev + 1)
                  }}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.action}</DialogTitle>
              <DialogDescription>
                {selectedEvent ? `${selectedEvent.entity_type} • ${formatDateTime(selectedEvent.occurred_at)}` : ''}
              </DialogDescription>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Ator</p>
                    <p className="font-medium">{selectedEvent.actor_name || selectedEvent.actor_id || '—'}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Resultado</p>
                    <p className="font-medium">{selectedEvent.outcome}</p>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Campos alterados</p>
                  <div className="flex flex-wrap gap-2">
                    {normalizeChangedFields(selectedEvent.changed_fields).map((field) => (
                      <Badge key={field} variant="outline">{field}</Badge>
                    ))}
                    {normalizeChangedFields(selectedEvent.changed_fields).length === 0 && (
                      <span className="text-muted-foreground">Sem campos registrados.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-2">Metadata</p>
                  <pre className="max-h-56 overflow-auto text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedEvent.meta || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
