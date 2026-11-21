import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { InvestigationMenu } from "@/components/InvestigationMenu";
import { fmtDate, fmtTime, invTitle, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/investigations/")({
  head: () => ({
    meta: [
      { title: "Minhas investigações — Assistente de Investigação de Fraude" },
      { name: "description", content: "Investigações abertas e recentes do representante autenticado." },
      { property: "og:title", content: "Minhas investigações — Assistente de Investigação de Fraude" },
      { property: "og:description", content: "Investigações abertas e recentes." },
    ],
  }),
  component: MyInvestigations,
});

function MyInvestigations() {
  const { session, investigations } = useStore();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const mine = investigations.filter((i) => i.repHandle === session?.handle);
  const allTags = [...new Set(mine.flatMap((i) => i.tags ?? []))];
  const filtered = mine.filter(
    (i) => (!onlyFavorites || i.favorite) && (!tagFilter || (i.tags ?? []).includes(tagFilter)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Investigações"
        title="Suas investigações"
        right={
          <Link
            to="/investigations/new"
            className="rounded-[9px] bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground ring-1 ring-ink/20 hover:bg-primary/90"
          >
            + Nova
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[80ch] space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyFavorites((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                onlyFavorites
                  ? "border-primary-soft/50 bg-card font-medium text-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
              )}
            >
              <Star className={`size-3.5 ${onlyFavorites ? "fill-amber-400 text-amber-400" : ""}`} />
              Favoritas
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter((cur) => (cur === t ? null : t))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  tagFilter === t
                    ? "border-primary-soft/50 bg-card font-medium text-foreground"
                    : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="frost-inset px-6 py-10 text-center">
              <p className="text-[18px] text-ink">
                {mine.length === 0 ? "Você ainda não iniciou nenhuma investigação." : "Nada encontrado com esses filtros."}
              </p>
              {mine.length === 0 && (
                <Link to="/investigations/new" className="mt-2 inline-block font-mono text-[12px] text-primary-soft hover:underline">
                  iniciar a primeira →
                </Link>
              )}
            </div>
          )}
          {filtered.map((inv) => (
            <div key={inv.id} className="frost-inset group relative transition-colors hover:bg-card/80">
              <Link
                to="/investigations/$id"
                params={{ id: inv.id }}
                className="block px-4 py-3 pr-12"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 sm:flex sm:items-center">
                  <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{invTitle(inv)}</span>
                  {inv.favorite && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-ink-soft ring-1 ring-ink/5 sm:ml-auto sm:px-2.5 sm:text-[11px]">
                    <span className={`size-1.5 rounded-full ${inv.status === "active" ? "bg-success" : "bg-muted-foreground/50"}`} />
                    {inv.status === "active" ? "Em andamento" : "Encerrada"}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-ink-soft text-pretty">{inv.initialRequest}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {inv.id} · {fmtDate(inv.createdAt)} · {fmtTime(inv.createdAt)} ·{" "}
                    {inv.messages.filter((m) => m.role === "rep").length} pergunta(s)
                  </p>
                  {(inv.tags ?? []).map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-ink-soft ring-1 ring-ink/5">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
              <InvestigationMenu
                inv={inv}
                align="end"
                className="absolute right-2.5 top-11 opacity-100 sm:top-2.5 sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
