import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  Check,
  CircleCheck,
  Copy,
  Folder,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Pin,
  RotateCcw,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { actions, invTitle, useStore, type Investigation } from "@/lib/store";
import { cn } from "@/lib/utils";

export function InvestigationMenu({
  inv,
  className,
  align = "start",
  onDeleted,
}: {
  inv: Investigation;
  className?: string;
  align?: "start" | "end";
  onDeleted?: () => void;
}) {
  const { folders, session } = useStore();
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [name, setName] = useState(invTitle(inv));
  const [shareWith, setShareWith] = useState("");
  const mine = inv.repHandle === session?.handle;

  function confirmFolder() {
    const folder = actions.addFolder(folderName);
    if (folder) actions.setFolder(inv.id, folder.id);
    setCreatingFolder(false);
  }

  function confirmRename() {
    actions.renameInvestigation(inv.id, name);
    setRenaming(false);
  }

  function remove() {
    setConfirming(false);
    actions.deleteInvestigation(inv.id);
    if (onDeleted) onDeleted();
    else navigate({ to: "/history" });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Mais ações"
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
            className,
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56">
          <DropdownMenuLabel className="font-mono text-[11px] font-normal text-muted-foreground">
            {inv.id}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => {
              setName(invTitle(inv));
              setRenaming(true);
            }}
          >
            <Pencil className="size-4" /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.togglePin(inv.id)}>
            <Pin className={cn("size-4", inv.pinned && "fill-current")} />
            {inv.pinned ? "Desafixar" : "Fixar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.toggleFavorite(inv.id)}>
            <Star className={cn("size-4", inv.favorite && "fill-amber-400 text-amber-400")} />
            {inv.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              const copy = actions.duplicateInvestigation(inv.id);
              if (copy) navigate({ to: "/investigations/$id", params: { id: copy.id } });
            }}
          >
            <Copy className="size-4" /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="size-4" /> Mover investigação
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Pastas</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => actions.setFolder(inv.id, null)}>Sem pasta</DropdownMenuItem>
              {folders.map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => actions.setFolder(inv.id, f.id)}>
                  <Folder className="size-4" />
                  <span className="truncate">{f.name}</span>
                  {inv.folderId === f.id && <Check className="ml-auto size-3.5" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() => {
                  setFolderName("");
                  setCreatingFolder(true);
                }}
              >
                <FolderPlus className="size-4" /> Nova pasta…
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            onSelect={() => {
              if (mine && inv.shared === "byMe") {
                actions.unshareInvestigation(inv.id);
                return;
              }
              setShareWith("");
              setSharing(true);
            }}
          >
            <Share2 className="size-4" />
            {mine && inv.shared === "byMe" ? "Parar de compartilhar" : "Compartilhar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.toggleArchive(inv.id)}>
            <Archive className="size-4" />
            {inv.archived ? "Desarquivar" : "Arquivar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.toggleClosed(inv.id)}>
            {inv.status === "closed" ? (
              <>
                <RotateCcw className="size-4" /> Reabrir investigação
              </>
            ) : (
              <>
                <CircleCheck className="size-4" /> Encerrar investigação
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirming(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Renomear investigação</DialogTitle>
            <DialogDescription>Use qualquer nome que faça sentido para você.</DialogDescription>
          </DialogHeader>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
            }}
            autoFocus
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/40"
          />
          <DialogFooter>
            <button
              onClick={() => setRenaming(false)}
              className="rounded-md border border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={confirmRename}
              disabled={!name.trim()}
              className="rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground disabled:opacity-40"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sharing} onOpenChange={setSharing}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Compartilhar investigação</DialogTitle>
            <DialogDescription>
              Informe o representante que deve ter acesso. O link também é copiado para você enviar.
            </DialogDescription>
          </DialogHeader>
          <input
            value={shareWith}
            onChange={(e) => setShareWith(e.target.value)}
            autoFocus
            placeholder="Nome ou usuário do representante"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/40 placeholder:text-muted-foreground"
          />
          <DialogFooter>
            <button
              onClick={() => setSharing(false)}
              className="rounded-md border border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                actions.shareInvestigation(inv.id, shareWith.trim());
                navigator.clipboard
                  ?.writeText(`${window.location.origin}/investigations/${inv.id}`)
                  .catch(() => {});
                setSharing(false);
              }}
              disabled={!shareWith.trim()}
              className="rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground disabled:opacity-40"
            >
              Compartilhar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Excluir investigação?</DialogTitle>
            <DialogDescription>
              “{invTitle(inv)}” e suas observações serão removidas. Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md border border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={remove}
              className="rounded-md bg-destructive px-3 py-2 text-[12.5px] font-medium text-destructive-foreground"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creatingFolder} onOpenChange={setCreatingFolder}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Nova pasta</DialogTitle>
            <DialogDescription>A investigação será movida para esta pasta.</DialogDescription>
          </DialogHeader>
          <input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmFolder();
            }}
            autoFocus
            placeholder="Ex.: Meus projetos"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary/40 placeholder:text-muted-foreground"
          />
          <DialogFooter>
            <button
              onClick={() => setCreatingFolder(false)}
              className="rounded-md border border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={confirmFolder}
              disabled={!folderName.trim()}
              className="rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground disabled:opacity-40"
            >
              Criar pasta
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
