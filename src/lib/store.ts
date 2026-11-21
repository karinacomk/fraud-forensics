import { useSyncExternalStore } from "react";

export type StepKind = "table" | "kv";
export type Step = {
  label: string;
  tool: string;
  kind: StepKind;
  columns?: string[];
  rows?: string[][];
  pairs?: [string, string][];
};

export type Message = {
  id: string;
  role: "rep" | "assistant";
  text?: string;
  steps?: Step[];
  summary?: string;
  /** rep feedback on the assistant response */
  feedback?: "up" | "down";
  /** how many parts (steps + summary) are already revealed */
  revealed?: number;
  done?: boolean;
  at: string;
};

export type Investigation = {
  id: string;
  /** nome livre dado pelo rep; cai para a solicitação inicial quando ausente */
  title?: string;
  targetUserId: string;
  repName: string;
  repHandle: string;
  createdAt: string;
  updatedAt: string;
  initialRequest: string;
  messages: Message[];
  status: "active" | "closed";
  queries: number;
  costUsd: number;
  favorite?: boolean;
  /** fixada no topo da barra lateral */
  pinned?: boolean;
  /** arquivada: sai das listas principais */
  archived?: boolean;
  /** pasta (tipo "Meus projetos") */
  folderId?: string | null;
  tags?: string[];
  /** "byMe" = você compartilhou · "withMe" = compartilharam com você */
  shared?: "byMe" | "withMe";
  /** com quem você compartilhou, ou quem compartilhou com você */
  sharedWith?: string;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

export type Note = {
  id: string;
  author: string;
  content: string;
  at: string;
};

export type Session = { name: string; handle: string; team: string } | null;

export type Prefs = {
  /** avisar (notificação do navegador) quando o assistente terminar a resposta */
  notifyOnDone: boolean;
};

type State = {
  hydrated: boolean;
  session: Session;
  investigations: Investigation[];
  folders: Folder[];
  /** investigationId -> notes */
  notes: Record<string, Note[]>;
  prefs: Prefs;
};

const defaultPrefs: Prefs = { notifyOnDone: false };

const KEY = "fia:state:v5";

const seedInvestigations: Investigation[] = [
  {
    id: "INV-2038",
    title: "Pagamentos recusados e cartões compartilhados",
    targetUserId: "884120377",
    repName: "Marina Reis",
    repHandle: "mreis",
    createdAt: "2026-09-17T13:12:00.000Z",
    updatedAt: "2026-09-17T13:40:00.000Z",
    initialRequest: "Verificar pagamentos recusados nos últimos 30 dias e cartões compartilhados com outras contas.",
    status: "closed",
    queries: 6,
    costUsd: 3.42,
    messages: [],
    favorite: true,
    tags: ["chargeback"],
  },
  {
    id: "INV-2039",
    title: "Denúncias e anúncios após restrição",
    targetUserId: "551209884",
    repName: "Marina Reis",
    repHandle: "mreis",
    createdAt: "2026-09-17T16:05:00.000Z",
    updatedAt: "2026-09-17T16:22:00.000Z",
    initialRequest: "Checar denúncias recebidas e itens anunciados após a última restrição.",
    status: "closed",
    queries: 4,
    costUsd: 2.11,
    messages: [],
    tags: [],
  },
  {
    id: "INV-2037",
    title: "Rede de contas com cartão em comum",
    targetUserId: "770118234",
    repName: "Ana Paula Duarte",
    repHandle: "aduarte",
    createdAt: "2026-09-16T18:20:00.000Z",
    updatedAt: "2026-09-16T19:02:00.000Z",
    initialRequest: "Mapear contas que compartilham o mesmo cartão e dispositivos com esta conta.",
    status: "closed",
    queries: 7,
    costUsd: 4.05,
    messages: [],
    tags: ["conta-compartilhada"],
    shared: "withMe",
    sharedWith: "Ana Paula Duarte",
  },
  {
    id: "INV-2040",
    title: "Dispositivos e restrições ativas",
    targetUserId: "203399150",
    repName: "Marina Reis",
    repHandle: "mreis",
    createdAt: "2026-09-18T01:48:00.000Z",
    updatedAt: "2026-09-18T02:10:00.000Z",
    initialRequest: "Levantar dispositivos e restrições ativas relacionadas a esta conta.",
    status: "active",
    queries: 5,
    costUsd: 2.87,
    messages: [],
    tags: ["prioridade-alta"],
  },
];

const seedFolders: Folder[] = [
  { id: "F-1", name: "Meus projetos", createdAt: "2026-09-10T12:00:00.000Z" },
];

const seedNotes: Record<string, Note[]> = {
  "INV-2040": [
    {
      id: "n-1",
      author: "Marina Reis",
      content: "Dispositivo DEV-9F2C também aparece na INV-2038 — vale cruzar as duas investigações.",
      at: "2026-09-18T02:05:00.000Z",
    },
  ],
};

const emptyState: State = {
  hydrated: false,
  session: null,
  investigations: [],
  folders: [],
  notes: {},
  prefs: defaultPrefs,
};

let state: State = emptyState;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      investigations: state.investigations,
      folders: state.folders,
      notes: state.notes,
      prefs: state.prefs,
    }),
  );
}

const demoSession: NonNullable<Session> = {
  name: "Marina Reis",
  handle: "mreis",
  team: "Rep · Fraude N2",
};

const seededState: State = {
  hydrated: true,
  session: demoSession,
  investigations: seedInvestigations,
  folders: seedFolders,
  notes: seedNotes,
  prefs: defaultPrefs,
};

function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = {
        hydrated: true,
        session: demoSession,
        investigations: parsed.investigations ?? seedInvestigations,
        folders: parsed.folders ?? seedFolders,
        notes: parsed.notes ?? seedNotes,
        prefs: parsed.prefs ?? defaultPrefs,
      };
    } else {
      state = seededState;
    }
  } catch {
    state = seededState;
  }
  emit();
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!state.hydrated) queueMicrotask(hydrate);
  return () => listeners.delete(l);
}

export function useStore() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => emptyState,
  );
}

export function nextId(prefix: string, ids: string[], base: number) {
  const max = ids.reduce((m, c) => {
    const n = Number(c.replace(`${prefix}-`, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, base);
  return `${prefix}-${max + 1}`;
}

export function nextInvestigationId() {
  return nextId("INV", state.investigations.map((i) => i.id), 2040);
}

export const actions = {
  addInvestigation(inv: Investigation) {
    set({ investigations: [inv, ...state.investigations] });
  },
  updateInvestigation(id: string, fn: (inv: Investigation) => Investigation) {
    set({
      investigations: state.investigations.map((i) => (i.id === id ? fn(i) : i)),
    });
  },
  toggleFavorite(id: string) {
    actions.updateInvestigation(id, (i) => ({ ...i, favorite: !i.favorite }));
  },
  togglePin(id: string) {
    actions.updateInvestigation(id, (i) => ({ ...i, pinned: !i.pinned }));
  },
  toggleArchive(id: string) {
    actions.updateInvestigation(id, (i) => ({ ...i, archived: !i.archived, pinned: false }));
  },
  toggleClosed(id: string) {
    actions.updateInvestigation(id, (i) => ({
      ...i,
      status: i.status === "active" ? "closed" : "active",
    }));
  },
  setFolder(id: string, folderId: string | null) {
    actions.updateInvestigation(id, (i) => ({ ...i, folderId }));
  },
  addFolder(name: string) {
    const n = name.trim();
    if (!n) return null;
    const folder: Folder = { id: nextId("F", state.folders.map((f) => f.id), 0), name: n, createdAt: new Date().toISOString() };
    set({ folders: [...state.folders, folder] });
    return folder;
  },
  renameFolder(id: string, name: string) {
    const n = name.trim();
    if (!n) return;
    set({ folders: state.folders.map((f) => (f.id === id ? { ...f, name: n } : f)) });
  },
  deleteFolder(id: string) {
    set({
      folders: state.folders.filter((f) => f.id !== id),
      investigations: state.investigations.map((i) => (i.folderId === id ? { ...i, folderId: null } : i)),
    });
  },
  renameInvestigation(id: string, title: string) {
    const t = title.trim();
    if (!t) return;
    actions.updateInvestigation(id, (i) => ({ ...i, title: t }));
  },
  shareInvestigation(id: string, withWhom: string) {
    actions.updateInvestigation(id, (i) => ({ ...i, shared: "byMe", sharedWith: withWhom }));
  },
  unshareInvestigation(id: string) {
    actions.updateInvestigation(id, (i) => {
      const { shared: _s, sharedWith: _w, ...rest } = i;
      return rest;
    });
  },
  deleteInvestigation(id: string) {
    const { [id]: _dropped, ...restNotes } = state.notes;
    set({ investigations: state.investigations.filter((i) => i.id !== id), notes: restNotes });
  },
  duplicateInvestigation(id: string) {
    const inv = state.investigations.find((i) => i.id === id);
    if (!inv) return null;
    const now = new Date().toISOString();
    const {
      favorite: _f,
      pinned: _p,
      archived: _a,
      shared: _s,
      sharedWith: _w,
      ...rest
    } = inv;
    const copy: Investigation = {
      ...rest,
      id: nextInvestigationId(),
      title: `${invTitle(inv)} (cópia)`,
      repName: state.session?.name ?? inv.repName,
      repHandle: state.session?.handle ?? inv.repHandle,
      createdAt: now,
      updatedAt: now,
      status: "active",
      queries: 0,
      costUsd: 0,
      messages: inv.messages.map((m) => {
        const { feedback: _fb, ...mr } = m;
        return { ...mr, done: true };
      }),
    };
    actions.addInvestigation(copy);
    return copy;
  },
  setPrefs(patch: Partial<Prefs>) {
    set({ prefs: { ...state.prefs, ...patch } });
  },
  setFeedback(id: string, messageId: string, feedback: "up" | "down") {
    actions.updateInvestigation(id, (i) => ({
      ...i,
      messages: i.messages.map((m) => {
        if (m.id !== messageId) return m;
        if (m.feedback === feedback) {
          const { feedback: _cleared, ...rest } = m;
          return rest;
        }
        return { ...m, feedback };
      }),
    }));
  },
  addTag(id: string, tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    actions.updateInvestigation(id, (i) =>
      (i.tags ?? []).includes(t) ? i : { ...i, tags: [...(i.tags ?? []), t] },
    );
  },
  removeTag(id: string, tag: string) {
    actions.updateInvestigation(id, (i) => ({ ...i, tags: (i.tags ?? []).filter((t) => t !== tag) }));
  },
  addNote(investigationId: string, content: string) {
    const note: Note = {
      id: `n-${Date.now()}`,
      author: state.session?.name ?? "Rep",
      content,
      at: new Date().toISOString(),
    };
    set({ notes: { ...state.notes, [investigationId]: [...(state.notes[investigationId] ?? []), note] } });
  },
};

/** nome exibido da investigação: título livre ou um resumo da solicitação */
export function invTitle(inv: Investigation) {
  if (inv.title?.trim()) return inv.title.trim();
  const req = inv.initialRequest.trim().replace(/\s+/g, " ");
  if (!req) return inv.id;
  const short = req.length > 52 ? `${req.slice(0, 52).trimEnd()}…` : req;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("");
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
