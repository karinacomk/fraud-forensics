import type { Step } from "./store";

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return h;
}

function pick(arr: string[], seed: number, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed + i * 7) % arr.length] ?? arr[0] ?? "");
  return out;
}

const DEVICES = ["DEV-9F2C", "DEV-3A71", "DEV-B0D4", "DEV-11E8", "DEV-7C40", "DEV-E2A9"];
const ACCOUNTS = ["ACC-44710", "ACC-58823", "ACC-61209", "ACC-30017", "ACC-72955"];
const MODELS = ["SM-G991B", "iPhone 13", "Xiaomi 12", "Moto G84", "iPhone 15 Pro"];

export function planInvestigation(question: string, userId: string): { steps: Step[]; summary: string } {
  const q = question.toLowerCase();
  const seed = hash(userId + q);
  const steps: Step[] = [];
  const findings: string[] = [];

  steps.push({
    label: `Localizando usuário ${userId}…`,
    tool: "user.lookup",
    kind: "kv",
    pairs: [
      ["user_id", userId],
      ["status", seed % 3 === 0 ? "restrito" : "ativo"],
      ["cadastro", `2023-${String((seed % 12) + 1).padStart(2, "0")}-14`],
      ["país", "BR"],
      ["kyc", seed % 2 === 0 ? "verificado" : "pendente"],
      ["último_login", "2026-09-17 21:08"],
    ],
  });

  const wantsDevices = /dispositiv|device|aparelho/.test(q);
  const wantsReports = /denúnc|denunc|report|reclama/.test(q);
  const wantsPayments = /pagament|cart[ãa]o|estorno|chargeback|pix|transa/.test(q);
  const wantsItems = /item|itens|anúnci|anunci|produto/.test(q);
  const wantsRestrictions = /restri|bloque|limite/.test(q);
  const nothing = !(wantsDevices || wantsReports || wantsPayments || wantsItems || wantsRestrictions);

  if (wantsDevices || nothing) {
    const devs = pick(DEVICES, seed, 3) as [string, string, string];
    const models = pick(MODELS, seed + 1, 3);
    steps.push({
      label: "Consultando dispositivos do usuário…",
      tool: "devices.list",
      kind: "table",
      columns: ["Dispositivo", "Modelo", "Última atividade", "Contas"],
      rows: devs.map((d, i) => [d, models[i] ?? "", `2026-09-${String(17 - i).padStart(2, "0")} ${9 + i * 5}:1${i}`, String(3 - i)]),
    });
    findings.push(
      `O dispositivo ${devs[0]} está associado a três contas distintas; ${devs[1]} aparece em duas.`,
    );
    if (wantsReports || nothing) {
      const accs = pick(ACCOUNTS, seed + 2, 3) as [string, string, string];
      steps.push({
        label: "Buscando contas associadas e denúncias…",
        tool: "accounts.linked + reports.byAccount",
        kind: "table",
        columns: ["Conta", "Dispositivo", "Denúncias"],
        rows: [
          [accs[0], devs[0], "1 · estorno"],
          [accs[1], devs[1], "0"],
          [accs[2], devs[0], "2 · item não entregue"],
        ],
      });
      findings.push(`Duas das contas vinculadas a ${devs[0]} (${accs[0]} e ${accs[2]}) possuem denúncias registradas.`);
    }
  } else if (wantsReports) {
    steps.push({
      label: "Consultando denúncias recebidas…",
      tool: "reports.byUser",
      kind: "table",
      columns: ["Denúncia", "Motivo", "Data", "Situação"],
      rows: [
        [`RPT-${7000 + (seed % 900)}`, "item não entregue", "2026-08-30", "aberta"],
        [`RPT-${7100 + (seed % 900)}`, "cobrança indevida", "2026-07-12", "procedente"],
        [`RPT-${7200 + (seed % 900)}`, "perfil falso", "2026-05-02", "arquivada"],
      ],
    });
    findings.push("Há 3 denúncias no período, uma delas ainda aberta (item não entregue).");
  }

  if (wantsPayments) {
    steps.push({
      label: "Analisando pagamentos dos últimos 30 dias…",
      tool: "payments.list",
      kind: "table",
      columns: ["Pagamento", "Método", "Valor", "Resultado"],
      rows: [
        [`PAY-${81000 + (seed % 999)}`, "cartão ****4412", "R$ 1.290,00", "recusado · CVV"],
        [`PAY-${81001 + (seed % 999)}`, "cartão ****4412", "R$ 1.290,00", "recusado · emissor"],
        [`PAY-${81002 + (seed % 999)}`, "cartão ****0977", "R$ 1.290,00", "aprovado"],
        [`PAY-${81003 + (seed % 999)}`, "pix", "R$ 340,00", "aprovado"],
      ],
    });
    steps.push({
      label: "Verificando cartões compartilhados com outras contas…",
      tool: "payments.sharedInstruments",
      kind: "kv",
      pairs: [
        ["cartão ****0977", `${pick(ACCOUNTS, seed + 3, 2).join(", ")}`],
        ["cartão ****4412", "somente este usuário"],
      ],
    });
    findings.push("Duas tentativas recusadas seguidas de aprovação com outro cartão; o cartão ****0977 é compartilhado com 2 contas.");
  }

  if (wantsItems) {
    steps.push({
      label: "Listando itens anunciados…",
      tool: "items.byUser",
      kind: "table",
      columns: ["Item", "Título", "Preço", "Publicado"],
      rows: [
        [`ITM-${5000 + (seed % 500)}`, "iPhone 15 Pro 256GB lacrado", "R$ 3.900,00", "2026-09-15"],
        [`ITM-${5001 + (seed % 500)}`, "PlayStation 5 Slim", "R$ 2.100,00", "2026-09-15"],
        [`ITM-${5002 + (seed % 500)}`, "Notebook Dell G15", "R$ 2.800,00", "2026-09-16"],
      ],
    });
    findings.push("Três itens de alto valor publicados em menos de 48h, com preços abaixo da média da categoria.");
  }

  if (wantsRestrictions || nothing) {
    steps.push({
      label: "Cruzando restrições ativas…",
      tool: "restrictions.active",
      kind: "kv",
      pairs: [
        ["restrição", seed % 2 === 0 ? "limite_saque" : "nenhuma"],
        ["origem", seed % 2 === 0 ? `manual_${2000 + (seed % 100)}` : "—"],
        ["vigência", seed % 2 === 0 ? "2026-08-30 → ativa" : "—"],
        ["aplicada a", userId],
      ],
    });
    if (seed % 2 === 0) findings.push("Existe uma restrição de limite de saque ativa desde 2026-08-30, aplicada manualmente.");
    else findings.push("Não há restrições ativas para esta conta no momento.");
  }

  const next = wantsPayments
    ? "Deseja que eu consulte os dispositivos usados nessas transações?"
    : "Deseja consultar os pagamentos das contas relacionadas?";

  return { steps, summary: `${findings.join(" ")} ${next}` };
}

// ---------- sugestões de próximos passos (o assistente sugere, o rep decide) ----------

const TOPICS: { re: RegExp; tool: string; prompt: string }[] = [
  { re: /dispositiv|device|aparelho/, tool: "devices.list", prompt: "Consultar dispositivos e cruzamentos de fingerprint deste usuário" },
  { re: /pagament|cart[ãa]o|estorno|chargeback|pix|transa/, tool: "payments.list", prompt: "Analisar pagamentos e cartões compartilhados com outras contas" },
  { re: /denúnc|denunc|report|reclama/, tool: "reports.byUser", prompt: "Buscar denúncias recebidas por este usuário" },
  { re: /item|itens|anúnci|anunci|produto/, tool: "items.byUser", prompt: "Revisar itens e publicações ativas deste usuário" },
  { re: /restri|bloque|limite/, tool: "restrictions.active", prompt: "Verificar restrições ativas aplicadas a esta conta" },
];

export function suggestNextSteps(askedQuestions: string[]): { tool: string; prompt: string }[] {
  const asked = askedQuestions.join(" ").toLowerCase();
  return TOPICS.filter((t) => !t.re.test(asked)).slice(0, 3);
}

/** Resumo textual da investigação — apenas organiza o que já foi consultado. */
export function summarizeInvestigation(input: {
  code: string;
  initialRequest: string;
  questions: string[];
  tools: string[];
}): string {
  const tools = [...new Set(input.tools)];
  const parts = [
    `Resumo da investigação ${input.code}. Solicitação inicial: "${input.initialRequest}".`,
    `Foram feitas ${input.questions.length} pergunta(s) ao assistente.`,
  ];
  if (tools.length > 0) {
    parts.push(`Capacidades consultadas: ${tools.join(", ")}.`);
  }
  parts.push("Os resultados apresentados acima seguem no formato retornado pelas ferramentas.");
  return parts.join(" ");
}
