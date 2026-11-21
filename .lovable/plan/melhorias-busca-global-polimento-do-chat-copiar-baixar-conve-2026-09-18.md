# Melhorias: busca global, polimento do chat, copiar/baixar conversa, duplicar investigação

## 1. Busca global (Ctrl+K)
Novo componente `src/components/GlobalSearch.tsx`, montado no `AppShell`:

- Atalho `Ctrl+K` (e `Cmd+K`) abre um diálogo central de busca, também acessível por um botão de lupa no topo da sidebar (ao lado do logo).
- Busca em três grupos:
  - **Investigações** — por nome (`invTitle`), código, tags e usuário investigado; só as da pessoa logada + compartilhadas.
  - **Casos** — por código e título.
  - **Ir para** — Dashboard, Nova investigação, Casos, Meu histórico, Governança.
- Navegação por teclado (setas ↑/↓, Enter seleciona, Esc fecha); clique também funciona. Enter em investigação/caso navega para a tela correspondente.
- Implementação leve com os primitivos `dialog` já existentes no projeto (sem instalar cmdk), seguindo o visual claro atual (bordas, font-mono para códigos, texto muted para subtítulos).

## 2. Polimento visual do chat (conversa)
Em `src/routes/_shell.investigations.$id.tsx`, dentro do `ConversationContent`:

- **Separadores de data**: antes da primeira mensagem de cada dia, um rótulo central discreto ("Hoje", "Ontem" ou dd/mm/aaaa) usando `m.at`.
- **Horário nas mensagens**: hora (fmtTime, pt-BR) em texto pequeno e muted — sob a mensagem do rep, e junto ao rodapé dos blocos do assistente.
- Mensagens do rep mantêm o balão atual; assistente continua sem balão (texto direto na página), com espaçamento e hierarquia revisados apenas via classes (sem mudar tokens do tema).

## 3. Copiar / baixar a conversa inteira
- Aproveitar o `exportMarkdown` já existente: extrair a geração do markdown para uma função reutilizável que retorna o texto.
- No painel lateral, adicionar **"Copiar conversa"** (ícone ClipboardCheck) acima de "Exportar (.md)": copia o markdown completo para a área de transferência, com feedback inline "Conversa copiada!" por 2s (padrão já usado no Compartilhar).
- "Exportar (.md)" passa a usar a mesma função (mesmo conteúdo, comportamento atual preservado).

## 4. Duplicar investigação
- Nova ação `duplicateInvestigation(id)` em `src/lib/store.ts`: cria uma cópia com novo id (`nextInvestigationId`), título `"<título> (cópia)"`, mesma solicitação inicial, mensagens (com `done: true`, sem feedback), tags, pasta e caso; `queries` e `costUsd` zerados (novo custo próprio), `status: "active"`, data de criação agora, mesma dona (rep logada).
- Item **"Duplicar"** (ícone Copy) no `InvestigationMenu`, abaixo de "Favoritar". Ao duplicar pela tela da investigação, navega para a cópia.

## Verificação
- `bunx tsgo --noEmit` limpo.
- Playwright: Ctrl+K abre a busca e navega para uma investigação; chat mostra separadores de data e horários; "Copiar conversa" copia sem erro; "Duplicar" cria a cópia e navega. Nenhum page error.
- Visual claro do anexo mantido em tudo; nada do PRD é violado (sem score, sem decisão automática, sem integração real).
