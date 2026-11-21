import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  FolderOpen,
  History,
  Inbox,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { invTitle, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  group: "Investigações" | "Ir para";
  label: string;
  sub?: string;
  to: string;
  params?: Record<string, string>;
};

export function GlobalSearch() {
  const { session, investigations } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  const items = useMemo<Item[]>(() => {
    const invItems: Item[] = investigations
      .filter(
        (i) =>
          i.repHandle === session?.handle ||
          i.shared === "byMe" ||
          i.shared === "withMe",
      )
      .filter(
        (i) =>
          !q ||
          invTitle(i).toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          (i.targetUserId !== "—" && i.targetUserId.includes(q)) ||
          (i.tags ?? []).some((t) => t.includes(q)),
      )
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 8)
      .map((i) => ({
        key: `inv-${i.id}`,
        group: "Investigações" as const,
        label: invTitle(i),
        sub: `${i.id}${i.targetUserId !== "—" ? ` · usuário ${i.targetUserId}` : ""}`,
        to: "/investigations/$id",
        params: { id: i.id },
      }));

    const navOptions: Array<{ label: string; to: string }> = [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Nova investigação", to: "/investigations/new" },
      { label: "Meu histórico", to: "/history" },
      { label: "Governança", to: "/governance" },
    ];
    const navItems: Item[] = navOptions
      .filter((n) => !q || n.label.toLowerCase().includes(q))
      .map((n) => ({
        key: `nav-${n.to}`,
        group: "Ir para" as const,
        label: n.label,
        to: n.to,
      }));

    return [...invItems, ...navItems];
  }, [q, investigations, session]);

  const activeItem = items[active];

  function go(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    if (item.params) {
      navigate({ to: item.to, params: item.params });
    } else {
      navigate({ to: item.to });
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Buscar (Ctrl+K)"
        title="Buscar (Ctrl+K)"
        className="ml-auto grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[18%] max-w-[560px] translate-y-0 gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Buscar</DialogTitle>
            <DialogDescription>Busque investigações e telas.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, Math.max(items.length - 1, 0)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  go(activeItem);
                }
              }}
              autoFocus
              placeholder="Buscar investigações ou telas…"
              className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              Esc
            </kbd>
          </div>
          <div className="max-h-[380px] overflow-y-auto p-2">
            {items.length === 0 && (
              <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
                Nada encontrado para “{query}”.
              </p>
            )}
            {items.map((it, idx) => {
              const showGroup = idx === 0 || items[idx - 1]?.group !== it.group;
              const isActive = idx === active;
              return (
                <div key={it.key}>
                  {showGroup && (
                    <p className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground first:pt-1">
                      {it.group}
                    </p>
                  )}
                  <button
                    onClick={() => go(it)}
                    onMouseEnter={() => setActive(idx)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                      isActive ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-foreground">{it.label}</span>
                      {it.sub && (
                        <span className="block truncate font-mono text-[10.5px] text-muted-foreground">
                          {it.sub}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        Enter
                      </kbd>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
