import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Copy,
  Download,
  Link2,
  Paperclip,
  Pin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { InvestigationMenu } from "@/components/InvestigationMenu";
import { MicButton } from "@/components/MicButton";
import {
  Conversation as ConversationView,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputButton, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { planInvestigation, suggestNextSteps, summarizeInvestigation } from "@/lib/mock-assistant";
import { actions, fmtDate, fmtTime, invTitle, useStore, type Investigation, type Message as Msg, type Step } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/investigations/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Assistente de Investigação de Fraude` },
      { name: "description", content: "Acompanhe e continue a investigação conversacional sobre o usuário investigado." },
      { property: "og:title", content: `${params.id} — Assistente de Investigação de Fraude` },
      { property: "og:description", content: "Investigação conversacional em andamento." },
    ],
  }),
  component: InvestigationPage,
});

function InvestigationPage() {
  const { id } = useParams({ from: "/_shell/investigations/$id" });
  const { investigations } = useStore();
  const inv = investigations.find((i) => i.id === id);

  if (!inv) {
    return (
      <>
        <PageHeader eyebrow="Investigação" title="Não encontrada" />
        <div className="p-6 text-[13px] text-muted-foreground">
          Esta investigação não existe.{" "}
          <Link to="/history" className="text-primary-soft hover:underline">
            Ver histórico
          </Link>
        </div>
      </>
    );
  }
  return <Conversation inv={inv} />;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, now)) return "Hoje";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Ontem";
  return fmtDate(iso);
}

function buildMarkdown(inv: Investigation, notes: { author: string; content: string; at: string }[]) {
  const lines: string[] = [
    `# ${invTitle(inv)}`,
    ``,
    `- Abertura: ${fmtDate(inv.createdAt)} ${fmtTime(inv.createdAt)}`,
    `- Representante: ${inv.repName} (@${inv.repHandle})`,
    `- Usuário investigado: ${inv.targetUserId === "—" ? "não fixado" : inv.targetUserId}`,
    `- Status: ${inv.status === "active" ? "Em andamento" : "Encerrada"}`,
    `- Consultas: ${inv.queries} · Custo: $${inv.costUsd.toFixed(2)}`,
    (inv.tags ?? []).length > 0 ? `- Tags: ${(inv.tags ?? []).join(", ")}` : null,
    ``,
    `## Solicitação inicial`,
    ``,
    inv.initialRequest,
    ``,
    `## Conversa`,
    ``,
  ].filter((l): l is string => l !== null);

  for (const m of inv.messages) {
    if (m.role === "rep") {
      lines.push(`**${inv.repName}** (${fmtTime(m.at)}):`, "", m.text ?? "", "");
    } else {
      for (const s of m.steps ?? []) {
        lines.push(`### ${s.label} (\`${s.tool}\`)`, "");
        if (s.kind === "table" && s.columns) {
          lines.push(`| ${s.columns.join(" | ")} |`, `| ${s.columns.map(() => "---").join(" | ")} |`);
          for (const r of s.rows ?? []) lines.push(`| ${r.join(" | ")} |`);
        } else if (s.pairs) {
          for (const [k, v] of s.pairs) lines.push(`- **${k}**: ${v}`);
        }
        lines.push("");
      }
      if (m.summary) lines.push(m.summary, "");
    }
  }
  if (notes.length > 0) {
    lines.push("## Observações do representante", "");
    for (const n of notes) lines.push(`- **${n.author}** (${fmtDate(n.at)} ${fmtTime(n.at)}): ${n.content}`);
  }

  return lines.join("\n");
}

function exportMarkdown(inv: Investigation, notes: { author: string; content: string; at: string }[]) {
  const blob = new Blob([buildMarkdown(inv, notes)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invTitle(inv).replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function Conversation({ inv }: { inv: Investigation }) {
  const { notes, prefs } = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedConv, setCopiedConv] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const pending = inv.messages.find((m) => m.role === "assistant" && !m.done);
  const lastRep = [...inv.messages].reverse().find((m) => m.role === "rep");
  const lastIsRep = inv.messages[inv.messages.length - 1]?.role === "rep";
  const invNotes = notes[inv.id] ?? [];

  const repQuestions = inv.messages.filter((m) => m.role === "rep").map((m) => m.text ?? "");
  const toolsUsed = inv.messages.flatMap((m) => (m.steps ?? []).map((s) => s.tool));
  const suggestions = pending ? [] : suggestNextSteps(repQuestions);

  // Older seeded and locally saved investigations may not have transcript data yet.
  // Materialize their initial request and completed tool response when first opened.
  useEffect(() => {
    if (inv.messages.length > 0 || !inv.initialRequest.trim()) return;
    const plan = planInvestigation(inv.initialRequest, inv.targetUserId);
    actions.updateInvestigation(inv.id, (i) => {
      if (i.messages.length > 0) return i;
      return {
        ...i,
        messages: [
          {
            id: `${i.id}-m1`,
            role: "rep",
            text: i.initialRequest,
            at: i.createdAt,
          },
          {
            id: `${i.id}-a2`,
            role: "assistant",
            steps: plan.steps,
            summary: plan.summary,
            revealed: plan.steps.length + 1,
            done: true,
            at: i.updatedAt,
          },
        ],
      };
    });
  }, [inv.id, inv.initialRequest, inv.targetUserId, inv.createdAt, inv.updatedAt, inv.messages.length]);

  // Kick off the assistant when the last message is from the rep.
  useEffect(() => {
    if (!lastIsRep || !lastRep) return;
    const plan = planInvestigation(lastRep.text ?? "", inv.targetUserId);
    const msg: Msg = {
      id: `${inv.id}-a${inv.messages.length + 1}`,
      role: "assistant",
      steps: plan.steps,
      summary: plan.summary,
      revealed: 0,
      done: false,
      at: new Date().toISOString(),
    };
    actions.updateInvestigation(inv.id, (i) => ({
      ...i,
      messages: [...i.messages, msg],
      updatedAt: msg.at,
    }));
  }, [lastIsRep, lastRep, inv.id, inv.targetUserId, inv.messages.length]);

  // Progressive reveal of tool steps.
  useEffect(() => {
    if (!pending) return;
    const total = (pending.steps?.length ?? 0) + 1;
    const t = setTimeout(() => {
      actions.updateInvestigation(inv.id, (i) => ({
        ...i,
        queries: i.queries + ((pending.revealed ?? 0) < total - 1 ? 1 : 0),
        costUsd: +(i.costUsd + 0.42).toFixed(2),
        messages: i.messages.map((m) =>
          m.id === pending.id
            ? { ...m, revealed: (m.revealed ?? 0) + 1, done: (m.revealed ?? 0) + 1 >= total }
            : m,
        ),
      }));
    }, 900);
    return () => clearTimeout(t);
  }, [pending, inv.id]);

  // Notify when the assistant finishes (optional, per Settings).
  const pendingRef = useRef<string | null>(null);
  useEffect(() => {
    if (pending) {
      pendingRef.current = pending.id;
      return;
    }
    if (pendingRef.current) {
      pendingRef.current = null;
      if (
        prefs.notifyOnDone &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification("Resposta pronta", {
          body: `O assistente terminou a pesquisa em "${invTitle(inv)}".`,
          tag: `${inv.id}-done`,
        });
      }
    }
  }, [pending, prefs.notifyOnDone, inv]);

  function sendText(text: string) {
    const t = text.trim();
    if (!t || pending) return;
    setDraft("");
    actions.updateInvestigation(inv.id, (i) => ({
      ...i,
      messages: [...i.messages, { id: `${i.id}-m${i.messages.length + 1}`, role: "rep", text: t, at: new Date().toISOString() }],
    }));
  }

  function regenerate(assistantId: string) {
    actions.updateInvestigation(inv.id, (i) => ({
      ...i,
      messages: i.messages.filter((m) => m.id !== assistantId),
    }));
  }

  function summarize() {
    if (pending) return;
    const text = summarizeInvestigation({
      code: inv.id,
      initialRequest: inv.initialRequest,
      questions: repQuestions,
      tools: toolsUsed,
    });
    actions.updateInvestigation(inv.id, (i) => ({
      ...i,
      updatedAt: new Date().toISOString(),
      messages: [
        ...i.messages,
        {
          id: `${i.id}-a${i.messages.length + 1}`,
          role: "assistant" as const,
          summary: text,
          revealed: 1,
          done: true,
          at: new Date().toISOString(),
        },
      ],
    }));
  }

  const cq = chatQuery.trim().toLowerCase();
  const shownMessages = cq
    ? inv.messages.filter((m) =>
        [m.text ?? "", m.summary ?? "", ...(m.steps ?? []).map((s) => s.label)]
          .join(" ")
          .toLowerCase()
          .includes(cq),
      )
    : inv.messages;

  const investigationTools = (
    <div className="flex min-h-full flex-col gap-5">
      <section>
        <p className="label-caps">Tags</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(inv.tags ?? []).map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-ink-soft ring-1 ring-ink/5"
            >
              {t}
              <button onClick={() => actions.removeTag(inv.id, t)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            actions.addTag(inv.id, tagDraft);
            setTagDraft("");
          }}
          className="mt-2 flex gap-2"
        >
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            placeholder="nova tag…"
            className="frost-inset w-full px-2.5 py-1.5 text-[12px] text-ink outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="submit"
            disabled={!tagDraft.trim()}
            className="rounded-[8px] border border-border bg-card/70 px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-card disabled:opacity-40"
          >
            +
          </button>
        </form>
      </section>

      <section className="min-h-0">
        <p className="label-caps flex items-center gap-1.5">
          <StickyNote className="size-3" /> Observações do rep
        </p>
        <div className="mt-1.5 space-y-2">
          {invNotes.length === 0 && <p className="text-[11.5px] text-muted-foreground">Nenhuma observação ainda.</p>}
          {invNotes.map((n) => (
            <div key={n.id} className="frost-inset px-3 py-2">
              <p className="text-pretty text-[12px] leading-relaxed text-ink">{n.content}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {n.author} · {fmtDate(n.at)} {fmtTime(n.at)}
              </p>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!noteDraft.trim()) return;
            actions.addNote(inv.id, noteDraft.trim());
            setNoteDraft("");
          }}
          className="mt-2 space-y-2"
        >
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={2}
            placeholder="Anotar algo sobre esta investigação…"
            className="frost-inset w-full resize-none px-2.5 py-1.5 text-[12px] leading-relaxed text-ink outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="submit"
            disabled={!noteDraft.trim()}
            className="rounded-[8px] border border-border bg-card/70 px-2.5 py-1.5 text-[11.5px] font-medium text-ink-soft hover:bg-card disabled:opacity-40"
          >
            Adicionar observação
          </button>
        </form>
      </section>

      <section className="mt-auto space-y-2 border-t border-border pt-4">
        <button
          onClick={summarize}
          disabled={!!pending || inv.messages.length === 0}
          className="w-full rounded-[9px] border border-border bg-card/70 px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-card disabled:opacity-40"
        >
          Resumir investigação
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(buildMarkdown(inv, invNotes)).catch(() => {});
            setCopiedConv(true);
            setTimeout(() => setCopiedConv(false), 2000);
          }}
          disabled={inv.messages.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-border bg-card/70 px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-card disabled:opacity-40"
        >
          <ClipboardCheck className="size-3.5" /> {copiedConv ? "Conversa copiada!" : "Copiar conversa"}
        </button>
        <button
          onClick={() => exportMarkdown(inv, invNotes)}
          className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-border bg-card/70 px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-card"
        >
          <Download className="size-3.5" /> Exportar (.md)
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-border bg-card/70 px-3 py-2 text-[12px] font-medium text-ink-soft hover:bg-card"
        >
          <Link2 className="size-3.5" /> {copied ? "Link copiado!" : "Compartilhar"}
        </button>
      </section>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card/40 px-3 py-2.5 sm:flex sm:flex-wrap sm:justify-between sm:gap-3 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold text-foreground">{invTitle(inv)}</h1>
            {inv.pinned && <Pin className="size-3.5 shrink-0 fill-current text-muted-foreground" />}
            {inv.favorite && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
            <InvestigationMenu inv={inv} onDeleted={() => navigate({ to: "/history" })} />
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
              {inv.id} · {inv.targetUserId === "—" ? "usuário não fixado" : `usuário ${inv.targetUserId}`}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <button
              onClick={() => setToolsOpen(true)}
              aria-label="Abrir detalhes e ações"
              className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-border bg-card/60 text-ink-soft hover:bg-card md:hidden"
            >
              <SlidersHorizontal className="size-3.5" />
            </button>
            {searchOpen ? (
              <div className="absolute inset-x-3 top-[4.25rem] z-20 flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-2.5 py-2 shadow-sm sm:static sm:py-1 sm:shadow-none">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  autoFocus
                  placeholder="Buscar nesta conversa…"
                  className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground sm:w-[190px]"
                />
                <button
                  onClick={() => {
                    setChatQuery("");
                    setSearchOpen(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fechar busca"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar na conversa"
                className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-border bg-card/60 text-ink-soft hover:bg-card sm:flex sm:w-auto sm:gap-1.5 sm:px-2.5 sm:py-1"
              >
                <Search className="size-3.5" /> <span className="hidden sm:inline">Buscar</span>
              </button>
            )}
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 min-[360px]:flex",
                inv.status === "closed"
                  ? "bg-muted text-muted-foreground ring-ink/5"
                  : "bg-muted text-ink-soft ring-1 ring-ink/5",
              )}
            >
              <span
                className={`size-1.5 rounded-full ${
                  inv.status === "closed"
                    ? "bg-muted-foreground/50"
                    : pending
                      ? "bg-primary-soft animate-pulse-dot"
                      : "bg-success"
                }`}
              />
              {inv.status === "closed" ? "Encerrada" : pending ? "Investigando" : "Em andamento"}
            </span>
            <span className="hidden font-mono text-[11px] text-muted-foreground lg:inline">
              aberta {fmtTime(inv.createdAt)} · {inv.repName}
            </span>
            <Link
              to="/investigations/new"
              className="ml-2 hidden rounded-[9px] border border-border bg-card/60 px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:bg-card sm:block"
            >
              + Nova investigação
            </Link>
          </div>
        </header>

        <ConversationView className="flex-1">
          <ConversationContent className="mx-auto max-w-[80ch] gap-5 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
            {cq && (
              <p className="text-[12px] text-muted-foreground">
                {shownMessages.length === 0
                  ? `Nada encontrado para “${chatQuery}” nesta conversa.`
                  : `${shownMessages.length} trecho(s) com “${chatQuery}”.`}
              </p>
            )}
            {shownMessages.map((m, idx) => {
              const prev = shownMessages[idx - 1];
              const showDay = !prev || dayKey(prev.at) !== dayKey(m.at);
              return (
                <Fragment key={m.id}>
                  {showDay && (
                    <div className="flex items-center gap-3 pt-2">
                      <span className="h-px flex-1 bg-border" />
                      <span className="label-caps">{dayLabel(m.at)}</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  {m.role === "rep" ? (
                    <Message from="user" className="animate-fade-up">
                      <div className="flex flex-col items-end gap-1">
                        <MessageContent>{m.text}</MessageContent>
                        <span className="pr-1 font-mono text-[10px] text-muted-foreground">
                          {fmtTime(m.at)}
                        </span>
                      </div>
                    </Message>
                  ) : (
                    <AssistantBlock
                      m={m}
                      onRegenerate={() => regenerate(m.id)}
                      onFeedback={(fb) => actions.setFeedback(inv.id, m.id, fb)}
                    />
                  )}
                </Fragment>
              );
            })}

            {!pending && (suggestions.length > 0 || inv.messages.length > 0) && (
              <div className="space-y-2 animate-fade-up">
                <p className="label-caps">Sugestões do assistente — você decide</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={summarize}
                    disabled={inv.messages.length === 0}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-primary-soft/50 hover:text-foreground disabled:opacity-40"
                  >
                    <Sparkles className="size-3" /> Resumo
                  </button>
                  {suggestions.map((s) => (
                    <button
                      key={s.tool}
                      onClick={() => sendText(s.prompt)}
                      className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-primary-soft/50 hover:text-foreground"
                    >
                      {s.prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </ConversationView>

        <footer className="shrink-0 bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4">
          <PromptInput
            onSubmit={({ text }) => sendText(text)}
            className="mx-auto max-w-[80ch] rounded-[18px] border-border bg-card shadow-sm"
          >
            <PromptInputTextarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!!pending}
              placeholder={pending ? "Aguarde a resposta…" : "Continuar investigação…"}
            />
            <PromptInputFooter className="gap-2">
              <PromptInputTools>
                <PromptInputButton disabled={!!pending} aria-label="Anexar arquivo">
                  <Paperclip className="size-4" />
                </PromptInputButton>
                <MicButton disabled={!!pending} onTranscript={(t) => setDraft((d) => (d ? `${d} ${t}` : t))} />
              </PromptInputTools>
              <PromptInputSubmit status={pending ? "streaming" : "ready"} disabled={!draft.trim() || !!pending} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mx-auto mt-2 max-w-[80ch] text-center font-mono text-[10.5px] text-muted-foreground">
            {inv.targetUserId === "—"
              ? `investigação livre · ${inv.id} · ${inv.queries} consulta(s)`
              : `contexto fixado · usuário ${inv.targetUserId} · ${inv.id} · ${inv.queries} consulta(s)`}
          </p>
        </footer>
      </div>

      <Sheet open={toolsOpen} onOpenChange={setToolsOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-[360px] overflow-y-auto p-0 md:hidden">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-[15px]">Detalhes da investigação</SheetTitle>
            <SheetDescription>Tags, observações e ações desta conversa.</SheetDescription>
          </SheetHeader>
          <div className="min-h-[calc(100dvh-77px)] px-5 py-5">{investigationTools}</div>
        </SheetContent>
      </Sheet>

      {/* painel lateral */}
      <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-border bg-card/30 px-5 py-5 md:block xl:w-[300px]">
        {investigationTools}
      </aside>
    </div>
  );
}

function AssistantBlock({
  m,
  onRegenerate,
  onFeedback,
}: {
  m: Msg;
  onRegenerate: () => void;
  onFeedback: (fb: "up" | "down") => void;
}) {
  const steps = m.steps ?? [];
  const revealed = m.revealed ?? steps.length + 1;
  const showSummary = revealed > steps.length;
  const running = !m.done && revealed <= steps.length ? steps[revealed] : undefined;

  return (
    <Message from="assistant" className="animate-fade-up">
      <MessageContent className="w-full bg-transparent p-0 text-foreground">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {steps.slice(0, revealed).map((s, i) => (
            <StepBlock key={i} step={s} />
          ))}
          {running && (
            <div className="flex items-center gap-2 pt-1 text-[12px]">
              <span className="size-2 rounded-full bg-primary-soft/80 animate-pulse-dot" />
              <Shimmer className="font-mono text-[12px]">{running.label}</Shimmer>
            </div>
          )}
          {showSummary && m.summary && (
            <div className="space-y-1 animate-fade-up">
              <MessageResponse className="text-[16px] leading-relaxed text-pretty">{m.summary}</MessageResponse>
            </div>
          )}
        </div>
        {m.done && (
          <MessageActions className="mt-2">
            <MessageAction
              label="Copiar"
              tooltip="Copiar resposta"
              onClick={() => navigator.clipboard?.writeText(m.summary ?? "").catch(() => {})}
            >
              <Copy className="size-3.5" />
            </MessageAction>
            <MessageAction label="Regenerar" tooltip="Refazer consulta" onClick={onRegenerate}>
              <RefreshCw className="size-3.5" />
            </MessageAction>
            <MessageAction
              label="Útil"
              tooltip="Resposta útil"
              onClick={() => onFeedback("up")}
              className={cn(
                "transition-colors",
                m.feedback === "up"
                  ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400"
                  : undefined,
              )}
            >
              <ThumbsUp className={`size-3.5 ${m.feedback === "up" ? "fill-current" : ""}`} />
            </MessageAction>
            <MessageAction
              label="Não útil"
              tooltip="Resposta não útil"
              onClick={() => onFeedback("down")}
              className={cn(
                "transition-colors",
                m.feedback === "down"
                  ? "bg-red-500/15 text-red-600 hover:bg-red-500/25 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                  : undefined,
              )}
            >
              <ThumbsDown className={`size-3.5 ${m.feedback === "down" ? "fill-current" : ""}`} />
            </MessageAction>
            <span className="ml-1 self-center font-mono text-[10px] text-muted-foreground">
              {fmtTime(m.at)}
            </span>
          </MessageActions>
        )}
      </MessageContent>
    </Message>
  );
}

function StepBlock({ step }: { step: Step }) {
  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary-soft/70" />
        <span className="font-mono">{step.label}</span>
        <span className="ml-auto font-mono text-[10.5px] text-muted-foreground/70">{step.tool}</span>
      </div>
      {step.kind === "table" && step.columns && (
        <div className="frost-inset overflow-x-auto">
          <div
            className="grid min-w-[440px] gap-2 border-b border-border bg-muted px-4 py-2 label-caps"
            style={{ gridTemplateColumns: `repeat(${step.columns.length}, minmax(0, 1fr))` }}
          >
            {step.columns.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          {step.rows?.map((r, i) => (
            <div
              key={i}
              className={`grid min-w-[440px] gap-2 px-4 py-2 font-mono text-[12px] text-ink-soft ${i > 0 ? "border-t border-border" : ""}`}
              style={{ gridTemplateColumns: `repeat(${step.columns!.length}, minmax(0, 1fr))` }}
            >
              {r.map((cell, j) => (
                <span key={j} className="truncate">
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {step.kind === "kv" && step.pairs && (
        <div className="frost-inset px-4 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[12px]">
            {step.pairs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{k}</span>
                <span className="truncate text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
