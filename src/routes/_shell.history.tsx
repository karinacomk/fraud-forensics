import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Pin, Search, Share2, Star } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { InvestigationMenu } from "@/components/InvestigationMenu";
import { fmtDate, fmtTime, initials, invTitle, useStore, type Investigation } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/history")({
  head: () => ({
    meta: [
      { title: "Histórico — Assistente de Investigação de Fraude" },
      { name: "description", content: "Histórico persistente das suas investigações e observações." },
      { property: "og:title", content: "Histórico — Assistente de Investigação de Fraude" },
      { property: "og:description", content: "Histórico de investigações de fraude." },
    ],
  }),
  component: HistoryPage,
});

function InvCard({ inv }: { inv: Investigation }) {
  return (
    <div className="frost-inset group relative transition-colors hover:bg-card/80">
      <Link to="/investigations/$id" params={{ id: inv.id }} className="block px-4 py-3 pr-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 sm:flex sm:items-center">
          <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{invTitle(inv)}</span>
          {inv.pinned && <Pin className="size-3.5 shrink-0 fill-current text-muted-foreground" />}
          {inv.favorite && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
          {inv.shared && <Share2 className="size-3.5 shrink-0 text-muted-foreground" />}
          {inv.archived && <Archive className="size-3.5 shrink-0 text-muted-foreground" />}
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-ink-soft ring-1 ring-ink/5 sm:ml-auto sm:px-2.5 sm:text-[11px]">
            <span className={`size-1.5 rounded-full ${inv.status === "active" ? "bg-success" : "bg-muted-foreground/50"}`} />
            {inv.status === "active" ? "Em andamento" : "Encerrada"}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] text-ink-soft text-pretty">{inv.initialRequest}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="font-mono text-[11px] text-muted-foreground">
            {inv.id} · {fmtDate(inv.createdAt)} · {fmtTime(inv.createdAt)} · {inv.queries} consulta(s) · $
            {inv.costUsd.toFixed(2)}
          </p>
          {(inv.tags ?? []).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-ink-soft ring-1 ring-ink/5">
              {t}
            </span>
          ))}
          {inv.shared === "byMe" && inv.sharedWith && (
            <span className="text-[11px] text-muted-foreground">compartilhada com {inv.sharedWith}</span>
          )}
          {inv.shared === "withMe" && (
            <span className="text-[11px] text-muted-foreground">compartilhada por {inv.repName}</span>
          )}
        </div>
      </Link>
      <InvestigationMenu
        inv={inv}
        align="end"
        className="absolute right-2.5 top-11 opacity-100 sm:top-2.5 sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:opacity-100"
      />
    </div>
  );
}

function HistoryPage() {
  const { session, investigations } = useStore();
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = investigations.filter((i) => i.repHandle === session?.handle);
  const allTags = [...new Set(visible.flatMap((i) => i.tags ?? []))];
  const match = (i: Investigation) =>
    (showArchived ? !!i.archived : !i.archived) &&
    (!onlyFavorites || i.favorite) &&
    (statusFilter === "all" || i.status === statusFilter) &&
    (!tagFilter || (i.tags ?? []).includes(tagFilter)) &&
    (!q ||
      i.id.toLowerCase().includes(q) ||
      invTitle(i).toLowerCase().includes(q) ||
      i.initialRequest.toLowerCase().includes(q) ||
      (i.tags ?? []).some((t) => t.toLowerCase().includes(q)));

  const filtered = visible.filter(match);

  return (
    <>
      <PageHeader eyebrow="Meu histórico" title="Suas investigações" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[80ch] space-y-6">
          <div className="frost-inset flex items-center gap-2.5 px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, código, descrição ou tag…"
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyFavorites((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                onlyFavorites
                  ? "border-primary/40 bg-card font-medium text-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
              )}
            >
              <Star className={`size-3.5 ${onlyFavorites ? "fill-amber-400 text-amber-400" : ""}`} />
              Favoritas
            </button>
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                showArchived
                  ? "border-primary/40 bg-card font-medium text-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
              )}
            >
              <Archive className="size-3.5" />
              Arquivadas
            </button>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <button
              onClick={() => setStatusFilter((cur) => (cur === "active" ? "all" : "active"))}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                statusFilter === "active"
                  ? "border-primary/40 bg-card font-medium text-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-success" />
              Em andamento
            </button>
            <button
              onClick={() => setStatusFilter((cur) => (cur === "closed" ? "all" : "closed"))}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                statusFilter === "closed"
                  ? "border-primary/40 bg-card font-medium text-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
              Encerradas
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter((cur) => (cur === t ? null : t))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  tagFilter === t
                    ? "border-primary/40 bg-card font-medium text-foreground"
                    : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="frost-inset px-6 py-10 text-center text-[13px] text-muted-foreground">
              Nenhuma investigação com esses filtros.
            </div>
          )}

          {filtered.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {session ? initials(session.name) : ""}
                </div>
                <h2 className="text-[13px] font-semibold">
                  {showArchived ? "Arquivadas" : "Suas investigações"}
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">{filtered.length}</span>
              </div>
              {filtered.map((inv) => (
                <InvCard key={inv.id} inv={inv} />
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
