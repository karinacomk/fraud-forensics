import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_shell/governance")({
  head: () => ({
    meta: [
      { title: "Governança — Assistente de Investigação de Fraude" },
      { name: "description", content: "Consumo, custos, limites e auditoria do assistente de investigação." },
      { property: "og:title", content: "Governança — Assistente de Investigação de Fraude" },
      { property: "og:description", content: "Consumo, custos, limites e auditoria." },
    ],
  }),
  component: GovernancePage,
});

const monthlyCost = [
  { month: "abr", usd: 412 },
  { month: "mai", usd: 538 },
  { month: "jun", usd: 471 },
  { month: "jul", usd: 623 },
  { month: "ago", usd: 705 },
  { month: "set", usd: 648 },
];

const costPerSkill = [
  { skill: "payments.list", usd: 182.4 },
  { skill: "devices.list", usd: 141.9 },
  { skill: "reports.byUser", usd: 96.2 },
  { skill: "restrictions.active", usd: 74.5 },
  { skill: "items.byUser", usd: 52.8 },
];

const alerts = [
  { level: "atenção", text: "Consumo de setembro está 8% acima da média dos últimos 3 meses." },
  { level: "info", text: "3 investigações ultrapassaram US$ 5,00 em consultas nesta semana." },
];

const limits = [
  { label: "Consultas por investigação", used: 6, max: 20 },
  { label: "Investigações ativas por rep", used: 2, max: 5 },
  { label: "Custo mensal da equipe", used: 648, max: 900, money: true },
];

const audit = [
  { when: "18/09 02:10", who: "cmenezes", what: "consultou restrictions.active em INV-2040" },
  { when: "18/09 02:14", who: "mreis", what: "abriu INV-2041" },
  { when: "17/09 16:22", who: "aduarte", what: "consultou items.byUser em INV-2039" },
  { when: "17/09 13:40", who: "cmenezes", what: "encerrou INV-2038" },
];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="frost-inset px-4 py-3.5">
      <p className="label-caps">{label}</p>
      <p className="mt-1.5 font-mono text-[20px] font-medium text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function GovernancePage() {
  const { session, investigations: allInvestigations } = useStore();
  // escopo: apenas as investigações do próprio representante
  const investigations = allInvestigations.filter((i) => i.repHandle === session?.handle);

  const totalCost = investigations.reduce((s, i) => s + i.costUsd, 0);
  const totalQueries = investigations.reduce((s, i) => s + i.queries, 0);
  const topCostly = [...investigations].sort((a, b) => b.costUsd - a.costUsd).slice(0, 5);
  const maxMonthly = Math.max(...monthlyCost.map((m) => m.usd));
  const maxSkill = Math.max(...costPerSkill.map((s) => s.usd));
  const myAudit = audit.filter((a) => a.who === session?.handle);

  return (
    <>
      <PageHeader eyebrow="Governança" title="Consumo, custos e limites" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[88ch] space-y-8">
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4">
            <Stat label="Suas investigações" value={String(investigations.length)} sub="na sessão" />
            <Stat label="Consultas" value={String(totalQueries)} sub="chamadas às ferramentas" />
            <Stat label="Seu custo na sessão" value={`$${totalCost.toFixed(2)}`} sub="soma das suas investigações" />
            <Stat label="Custo médio" value={`$${investigations.length ? (totalCost / investigations.length).toFixed(2) : "0.00"}`} sub="por investigação" />
          </div>

          <section>
            <h2 className="mb-3 text-[13.5px] font-semibold">Evolução do seu custo</h2>
            <div className="frost-inset flex items-end gap-2 overflow-x-auto px-3 pb-4 pt-5 sm:gap-3 sm:px-5">
              {monthlyCost.map((m) => (
                <div key={m.month} className="flex min-w-10 flex-1 flex-col items-center gap-1.5">
                  <span className="font-mono text-[10.5px] text-muted-foreground">${m.usd}</span>
                  <div
                    className="w-full max-w-[46px] rounded-t-[6px] bg-primary/80"
                    style={{ height: `${Math.round((m.usd / maxMonthly) * 120)}px` }}
                  />
                  <span className="font-mono text-[10.5px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">dados ilustrativos de meses anteriores</p>
          </section>

          <section>
            <h2 className="mb-3 text-[13.5px] font-semibold">Custo por skill</h2>
            <div className="frost-inset space-y-2.5 px-4 py-3.5">
              {costPerSkill.map((s) => (
                <div key={s.skill} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2 sm:flex sm:gap-3">
                  <span className="min-w-0 truncate font-mono text-[11.5px] text-ink-soft sm:w-[150px]">{s.skill}</span>
                  <div className="col-span-2 row-start-2 h-2 overflow-hidden rounded-full bg-muted sm:col-auto sm:row-auto sm:flex-1">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.usd / maxSkill) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[11.5px] text-ink">${s.usd.toFixed(2)}</span>
                </div>
              ))}
              <p className="pt-1 font-mono text-[10.5px] text-muted-foreground">dados ilustrativos</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[13.5px] font-semibold">Investigações mais caras</h2>
            <div className="frost-inset divide-y divide-border">
              {topCostly.map((inv) => (
                <Link
                  key={inv.id}
                  to="/investigations/$id"
                  params={{ id: inv.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 px-4 py-2.5 transition-colors hover:bg-card/60 sm:flex sm:items-center sm:gap-3"
                >
                  <span className="truncate text-[12.5px] text-ink-soft">{inv.initialRequest}</span>
                  <span className="row-start-2 font-mono text-[11px] text-muted-foreground sm:row-auto sm:ml-auto">{inv.queries} consultas</span>
                  <span className="shrink-0 font-mono text-[12.5px] font-medium text-ink">${inv.costUsd.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-[13.5px] font-semibold">Alertas de consumo</h2>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className="frost-inset flex items-start gap-3 px-4 py-3">
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${a.level === "atenção" ? "bg-amber-400" : "bg-primary-soft/70"}`}
                    />
                    <p className="text-[12.5px] leading-relaxed text-ink-soft">{a.text}</p>
                  </div>
                ))}
                <p className="font-mono text-[10.5px] text-muted-foreground">dados ilustrativos</p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-[13.5px] font-semibold">Limites de utilização</h2>
              <div className="frost-inset space-y-3 px-4 py-3.5">
                {limits.map((l) => (
                  <div key={l.label}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12.5px] text-ink-soft">{l.label}</span>
                      <span className="font-mono text-[11.5px] text-ink">
                        {l.money ? `$${l.used} / $${l.max}` : `${l.used} / ${l.max}`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${l.used / l.max > 0.8 ? "bg-amber-400" : "bg-primary/70"}`}
                        style={{ width: `${(l.used / l.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-1 font-mono text-[10.5px] text-muted-foreground">dados ilustrativos</p>
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-3 text-[13.5px] font-semibold">Auditoria e rastreabilidade</h2>
            <div className="frost-inset divide-y divide-border">
              {myAudit.length === 0 && (
                <p className="px-4 py-3 text-[12px] text-muted-foreground">Nenhum evento seu registrado (dados ilustrativos).</p>
              )}
              {myAudit.map((a, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-4 py-2.5 font-mono text-[11.5px] sm:flex sm:items-center">
                  <span className="text-muted-foreground">{a.when}</span>
                  <span className="text-ink">@{a.who}</span>
                  <span className="col-span-2 text-ink-soft sm:col-auto sm:truncate">{a.what}</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">dados ilustrativos</p>
          </section>
        </div>
      </div>
    </>
  );
}
