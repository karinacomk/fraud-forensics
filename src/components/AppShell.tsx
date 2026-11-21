import { Link, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  Folder,
  History,
  Inbox,
  Menu,
  PanelLeftClose,
  Pencil,
  Pin,
  Plus,
  ScanSearch,
  Share2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/GlobalSearch";
import { InvestigationMenu } from "@/components/InvestigationMenu";
import { SettingsDialog } from "@/components/SettingsDialog";
import { actions, initials, invTitle, useStore, type Investigation } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-0.5 truncate text-[17px] font-semibold leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors",
        active
          ? "bg-background font-medium text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function NavIcon({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-md transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
      )}
    >
      {icon}
    </Link>
  );
}

function InvRow({ inv, note }: { inv: Investigation; note?: string }) {
  return (
    <div className="group relative">
      <Link
        to="/investigations/$id"
        params={{ id: inv.id }}
        className="block rounded-md px-3 py-1.5 pr-9 hover:bg-background/70"
      >
        <p className="flex items-center gap-1.5 truncate text-[12.5px] text-foreground">
          {inv.pinned && <Pin className="size-3 shrink-0 fill-current text-muted-foreground" />}
          <span className="truncate">{invTitle(inv)}</span>
          {inv.status === "closed" && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              Encerrada
            </span>
          )}
        </p>
        {note && <p className="truncate font-mono text-[10.5px] text-muted-foreground">{note}</p>}
      </Link>
      <InvestigationMenu
        inv={inv}
        className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 px-1 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </p>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, investigations, folders, hydrated } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [showShared, setShowShared] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const mine = investigations.filter((i) => i.repHandle === session?.handle);
  const live = mine.filter((i) => !i.archived);
  const pinned = live.filter((i) => i.pinned);
  const favorites = live.filter((i) => i.favorite);
  const recent = live.filter((i) => !i.pinned && !i.folderId).slice(0, 8);
  const archived = mine.filter((i) => i.archived);
  const shared = investigations.filter((i) => i.shared === "byMe" || i.shared === "withMe");
  const collapsed = desktopCollapsed && isDesktop;

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {mobileOpen && (
        <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] md:hidden" />
      )}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] shrink-0 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full", collapsed ? "md:w-[60px]" : "md:w-[264px]")}>
        {collapsed && (
          <div className="hidden h-full flex-col items-center gap-1 px-2 py-3 md:flex">
            <button
              onClick={() => setDesktopCollapsed(false)}
              aria-label="Abrir menu"
              title="Abrir menu"
              className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
            >
              <ScanSearch className="size-4" />
            </button>
            <Link
              to="/investigations/new"
              aria-label="Nova investigação"
              title="Nova investigação"
              className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
            >
              <Plus className="size-4" />
            </Link>
            <div className="my-1 h-px w-6 bg-border" />
            <NavIcon
              to="/dashboard"
              icon={<Inbox className="size-4" />}
              label="Investigações"
              active={pathname === "/dashboard" || pathname.startsWith("/investigations")}
            />
            <NavIcon to="/history" icon={<History className="size-4" />} label="Meu histórico" active={pathname === "/history"} />
            <button
              onClick={() => setDesktopCollapsed(false)}
              aria-label="Compartilhadas"
              title="Compartilhadas"
              className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
            >
              <Share2 className="size-4" />
            </button>
            <NavIcon to="/governance" icon={<BarChart3 className="size-4" />} label="Governança" active={pathname === "/governance"} />
            <div className="flex-1" />
            {session && (
              <button
                onClick={() => setDesktopCollapsed(false)}
                aria-label="Abrir menu"
                title="Abrir menu"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
              >
                {initials(session.name)}
              </button>
            )}
          </div>
        )}
        <div className={cn("min-h-0 flex-1 flex-col", collapsed ? "flex md:hidden" : "flex")}>
        <div className="px-4 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ScanSearch className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[13px] font-semibold">Fraud Forensics</p>
              <p className="text-[11px] text-muted-foreground">Assistente de investigação</p>
            </div>
            <button
              onClick={() => setDesktopCollapsed(true)}
              aria-label="Recolher menu"
              title="Recolher menu"
              className="hidden size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground md:grid"
            >
              <PanelLeftClose className="size-4" />
            </button>
            <GlobalSearch />
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-background/70 hover:text-foreground md:hidden">
              <X className="size-4" />
            </button>
          </div>
          <Link
            to="/investigations/new"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova investigação
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          <NavItem
            to="/dashboard"
            icon={<Inbox className="h-4 w-4" />}
            label="Investigações"
            active={pathname === "/dashboard" || pathname.startsWith("/investigations")}
          />
          <NavItem
            to="/history"
            icon={<History className="h-4 w-4" />}
            label="Meu histórico"
            active={pathname === "/history"}
          />
          {shared.length > 0 && (
            <div>
              <button
                onClick={() => setShowShared((v) => !v)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors text-muted-foreground hover:bg-background/70 hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
                <span className="truncate">Compartilhadas</span>
                {showShared ? (
                  <ChevronDown className="ml-auto size-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="ml-auto size-3.5 shrink-0" />
                )}
              </button>
              {showShared && (
                <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-1">
                  {shared.map((inv) => (
                    <InvRow
                      key={inv.id}
                      inv={inv}
                      note={
                        inv.shared === "byMe"
                          ? `com ${inv.sharedWith ?? "outro rep"}`
                          : `por ${inv.repName}`
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <NavItem
            to="/governance"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Governança"
            active={pathname === "/governance"}
          />
        </nav>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {pinned.length > 0 && (
            <>
              <SectionLabel>
                <Pin className="size-3" /> Fixadas
              </SectionLabel>
              <div className="flex flex-col gap-0.5">
                {pinned.map((inv) => (
                  <InvRow key={inv.id} inv={inv} />
                ))}
              </div>
            </>
          )}

          {favorites.length > 0 && (
            <>
              <SectionLabel>
                <Star className="size-3" /> Favoritas
              </SectionLabel>
              <div className="flex flex-col gap-0.5">
                {favorites.map((inv) => (
                  <InvRow key={inv.id} inv={inv} />
                ))}
              </div>
            </>
          )}

          <SectionLabel>
            <Folder className="size-3" /> Pastas
          </SectionLabel>
          <div className="flex flex-col gap-0.5">
            {folders.map((f) => {
              const items = live.filter((i) => i.folderId === f.id);
              const open = openFolders[f.id] ?? true;
              return (
                <div key={f.id} className="group relative">
                  <button
                    onClick={() => setOpenFolders((s) => ({ ...s, [f.id]: !open }))}
                    className="flex w-full items-center gap-1.5 rounded-md py-1.5 pl-3 pr-8 text-left text-[12.5px] text-foreground hover:bg-background/70"
                  >
                    {open ? (
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">{items.length}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Opções da pasta ${f.name}`}
                        className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <Ellipsis className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem
                        onSelect={() => {
                          const name = window.prompt("Renomear pasta", f.name);
                          if (name && name.trim()) actions.renameFolder(f.id, name.trim());
                        }}
                      >
                        <Pencil className="size-3.5" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => {
                          if (window.confirm(`Excluir a pasta "${f.name}"? As investigações não serão excluídas.`)) {
                            actions.deleteFolder(f.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" /> Excluir pasta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {open && (
                    <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-1">
                      {items.length === 0 && (
                        <p className="px-3 py-1.5 text-[11.5px] text-muted-foreground">Pasta vazia.</p>
                      )}
                      {items.map((inv) => (
                        <InvRow key={inv.id} inv={inv} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => {
                const name = window.prompt("Nome da pasta", "Meus projetos");
                if (name) actions.addFolder(name);
              }}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-background/70 hover:text-foreground"
            >
              <Plus className="size-3.5" /> Nova pasta
            </button>
          </div>

          <SectionLabel>Recentes</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {hydrated && recent.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-muted-foreground">Nenhuma investigação ainda.</p>
            )}
            {recent.map((inv) => (
              <InvRow key={inv.id} inv={inv} />
            ))}
          </div>

          {archived.length > 0 && (
            <>
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="flex w-full items-center gap-1.5 px-1 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground"
              >
                <Archive className="size-3" /> Arquivadas
                <span className="ml-auto font-mono normal-case">{archived.length}</span>
              </button>
              {showArchived && (
                <div className="flex flex-col gap-0.5">
                  {archived.map((inv) => (
                    <InvRow key={inv.id} inv={inv} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {session && (
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2.5 rounded-md px-1 py-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-[11.5px] font-semibold text-foreground">
                {initials(session.name)}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[12.5px] font-medium">{session.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{session.team}</p>
              </div>
              <SettingsDialog />
            </div>
          </div>
        )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-sidebar px-3 md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="grid size-9 shrink-0 place-items-center rounded-md text-foreground hover:bg-background">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">Fraud Forensics</p>
            <p className="truncate text-[10.5px] text-muted-foreground">Assistente de investigação</p>
          </div>
          <Link to="/investigations/new" aria-label="Nova investigação" className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Plus className="size-4" />
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
