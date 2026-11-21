import { Archive, ArchiveRestore, Bell, Moon, Settings, Sun, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getStoredTheme, setTheme } from "@/lib/theme";
import { actions, invTitle, useStore } from "@/lib/store";

export function SettingsDialog() {
  const { prefs, investigations, session } = useStore();
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const toggleTheme = (next: boolean) => {
    const value = next ? "dark" : "light";
    setTheme(value);
    setThemeState(value);
  };

  const mine = investigations.filter((i) => i.repHandle === session?.handle);
  const archived = mine.filter((i) => i.archived);

  async function toggleNotify(next: boolean) {
    setBlocked(false);
    if (next) {
      if (typeof Notification === "undefined") {
        setBlocked(true);
        return;
      }
      const result =
        Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (result !== "granted") {
        setBlocked(true);
        return;
      }
    }
    actions.setPrefs({ notifyOnDone: next });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Configurações"
        title="Configurações"
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
            <DialogDescription>Preferências do assistente de investigação.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-lg border border-border p-3.5">
            <div className="flex min-w-0 items-start gap-2.5">
              {theme === "dark" ? (
                <Moon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <Sun className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-[13px] font-medium text-foreground">Tema escuro</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                  Altera a aparência do assistente entre claro e escuro.
                </p>
              </div>
            </div>
            <Switch
              className="shrink-0"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              aria-label="Tema escuro"
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-lg border border-border p-3.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-medium text-foreground">Avisar quando a resposta estiver pronta</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                  Você recebe uma notificação do navegador assim que o assistente terminar de trazer a resposta.
                </p>
                {blocked && (
                  <p className="mt-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
                    As notificações estão bloqueadas no navegador. Libere nas configurações do site para ativar.
                  </p>
                )}
              </div>
            </div>
            <Switch
              className="shrink-0"
              checked={prefs.notifyOnDone}
              onCheckedChange={(v) => void toggleNotify(v)}
              aria-label="Avisar quando a resposta estiver pronta"
            />
          </div>
          <div className="rounded-lg border border-border p-3.5">
            <div className="flex items-center gap-2.5">
              <Archive className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">Arquivadas</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                  {archived.length === 0
                    ? "Nenhuma investigação arquivada."
                    : `${archived.length} investigação(ões) arquivada(s). Desarquive para voltar às listas.`}
                </p>
              </div>
            </div>
            {archived.length > 0 && (
              <ul className="mt-3 space-y-1">
                {archived.map((inv) => (
                  <li
                    key={inv.id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">
                      {invTitle(inv)}
                    </span>
                    <button
                      type="button"
                      onClick={() => actions.toggleArchive(inv.id)}
                      aria-label={`Desarquivar ${invTitle(inv)}`}
                      title="Desarquivar"
                      className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                    >
                      <ArchiveRestore className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Excluir "${invTitle(inv)}"? Essa ação não pode ser desfeita.`)) {
                          actions.deleteInvestigation(inv.id);
                        }
                      }}
                      aria-label={`Excluir ${invTitle(inv)}`}
                      title="Excluir"
                      className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex w-full min-w-0 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
