import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowUp,
  CreditCard,
  Flag,
  MonitorSmartphone,
  Package,
  Paperclip,
  ShoppingCart,
  UserSearch,
  type LucideIcon,
} from "lucide-react";
import { MicButton } from "@/components/MicButton";
import { useState } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Assistente de Investigação de Fraude" },
      { name: "description", content: "Comece uma investigação de fraude em linguagem natural." },
      { property: "og:title", content: "Painel — Assistente de Investigação de Fraude" },
      { property: "og:description", content: "Comece uma investigação de fraude em linguagem natural." },
    ],
  }),
  component: Dashboard,
});

const quickActions: { icon: LucideIcon; tone: string; title: string; desc: string; prompt: string }[] = [
  {
    icon: UserSearch,
    tone: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    title: "Investigar usuário",
    desc: "Perfil, restrições, histórico de ações e KYC",
    prompt: "Investigar usuário: quero ver perfil, restrições, histórico de ações e KYC do usuário ",
  },
  {
    icon: CreditCard,
    tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    title: "Analisar pagamentos",
    desc: "Busca de payins, payouts e movimentações da conta",
    prompt: "Analisar pagamentos: buscar payins, payouts e movimentações da conta do usuário ",
  },
  {
    icon: ShoppingCart,
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    title: "Revisar pedidos",
    desc: "Pedidos associados a um usuário",
    prompt: "Revisar pedidos associados ao usuário ",
  },
  {
    icon: MonitorSmartphone,
    tone: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    title: "Consultar dispositivos",
    desc: "Fingerprinting e cruzamentos de dispositivos",
    prompt: "Consultar dispositivos e cruzamentos de fingerprint relacionados ao usuário ",
  },
  {
    icon: Flag,
    tone: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    title: "Buscar denúncias",
    desc: "Denúncias e informes associados ao usuário",
    prompt: "Buscar denúncias e informes associados ao usuário ",
  },
  {
    icon: Package,
    tone: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400",
    title: "Revisar itens",
    desc: "Publicações e itens ativos no marketplace",
    prompt: "Revisar itens e publicações ativas no marketplace do usuário ",
  },
];

function Dashboard() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const firstName = session?.name.split(" ")[0] ?? "";

  function go(text: string) {
    const trimmed = text.trim();
    navigate({
      to: "/investigations/new",
      search: trimmed ? { request: trimmed } : {},
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 sm:items-center sm:px-6">
        <div className="w-full max-w-[640px] py-6 sm:py-10">
          <h1 className="text-center text-[22px] font-semibold tracking-tight text-ink text-balance sm:text-[24px]">
            Como posso ajudar na investigação{firstName ? `, ${firstName}` : ""}?
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3">
            {quickActions.map((a) => (
              <button
                key={a.title}
                type="button"
                onClick={() => go(a.prompt)}
                className="frost-inset group flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${a.tone}`}>
                  <a.icon className="size-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink">{a.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{a.desc}</p>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) go(draft);
          }}
          className="frost-inset mx-auto flex w-full max-w-[640px] items-center gap-2 rounded-[22px] py-1.5 pr-1.5 pl-3 focus-within:border-primary-soft/40"
        >
          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Envie uma mensagem…"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-ink outline-none placeholder:text-muted-foreground/70"
          />
          <MicButton onTranscript={(t) => setDraft((d) => (d ? `${d} ${t}` : t))} />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30"
            title="Enviar"
          >
            <ArrowUp className="size-4" strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
}
