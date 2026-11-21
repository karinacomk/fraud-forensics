import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUp, Paperclip } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { MicButton } from "@/components/MicButton";
import { actions, nextInvestigationId, useStore } from "@/lib/store";

export const Route = createFileRoute("/_shell/investigations/new")({
  validateSearch: (search: Record<string, unknown>): { request?: string } => {
    const r = search["request"];
    return typeof r === "string" && r.length > 0 ? { request: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Nova investigação — Assistente de Investigação de Fraude" },
      { name: "description", content: "Inicie uma investigação descrevendo em linguagem natural o que deseja descobrir." },
      { property: "og:title", content: "Nova investigação — Assistente de Investigação de Fraude" },
      { property: "og:description", content: "Inicie uma investigação de fraude em linguagem natural." },
    ],
  }),
  component: NewInvestigation,
});

function NewInvestigation() {
  const { session } = useStore();
  const navigate = useNavigate();
  const { request: initialRequestParam } = Route.useSearch();
  const [request, setRequest] = useState(initialRequestParam ?? "");
  const canStart = request.trim().length > 0;

  function start() {
    if (!canStart || !session) return;
    const id = nextInvestigationId();
    const now = new Date().toISOString();
    const text = request.trim();
    actions.addInvestigation({
      id,
      targetUserId: "—",
      repName: session.name,
      repHandle: session.handle,
      createdAt: now,
      updatedAt: now,
      initialRequest: text,
      status: "active",
      queries: 0,
      costUsd: 0,
      messages: [{ id: `${id}-m1`, role: "rep", text, at: now }],
    });
    navigate({ to: "/investigations/$id", params: { id } });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader eyebrow="Nova investigação" title="O que você quer investigar?" />

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-6 sm:px-6">
        <div className="w-full max-w-[640px]">
          <h1 className="text-center text-[22px] font-semibold tracking-tight text-ink text-balance sm:text-[24px]">
            O que você quer investigar?
          </h1>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-muted-foreground">
            Escreva em linguagem natural — pode incluir o ID do usuário no texto, se tiver.
            <br className="hidden sm:block" />
            Não é preciso escolher ferramenta ou skill.
          </p>
        </div>
      </div>

      <div className="shrink-0 bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="frost-inset mx-auto flex w-full max-w-[640px] items-center gap-2 rounded-[22px] py-1.5 pr-1.5 pl-3 focus-within:border-primary-soft/40"
        >
          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            autoFocus
            placeholder="Descreva o que investigar…"
            aria-label="Descreva o que investigar"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-ink outline-none placeholder:text-muted-foreground/70"
          />
          <MicButton onTranscript={(t) => setRequest((r) => (r ? `${r} ${t}` : t))} />
          <button
            type="submit"
            disabled={!canStart}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30"
            title="Iniciar investigação"
            aria-label="Iniciar investigação"
          >
            <ArrowUp className="size-4" strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
}
