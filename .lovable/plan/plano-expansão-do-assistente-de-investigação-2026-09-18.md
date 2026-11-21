# Plano — Expansão do Assistente de Investigação

Escopo: apenas os três blocos recomendados, com **histórico persistido em banco de dados** (Lovable Cloud) em vez de armazenamento local. Tudo com dados mockados, sem inventar score/timeline/cards próprios de fraude — a apresentação segue o formato das ferramentas; o assistente sugere, o rep decide.

## Fase 0 — Persistência em banco de dados
- Ativar o Lovable Cloud (banco de dados gerenciado, sem configuração externa).
- Tabelas: `investigations` (conversa, mensagens, resumo, rep, data/hora), `cases`, `notes`, `tags` e vínculos entre elas.
- Migração inclui os dados de exemplo atuais (INV-2038/2039/2040) para a primeira tela já abrir populada.
- Substituir o store em localStorage por leituras/escritas no banco via funções de servidor.
- Sem tela de login: o protótipo segue sem autenticação; o rep demo (Marina Reis) é registrado como autor das investigações. Políticas de acesso abertas apenas para o protótipo.

## Fase 1 — Caso / Histórico
- Novo conceito de **Caso**: agrupa várias investigações (conversas) sobre um mesmo assunto.
- Tela de casos: criar caso, abrir caso, ver investigações e histórico do caso.
- Continuar investigação posteriormente (retomar conversa salva).
- Observações do rep por investigação (notas livres).
- Tags e favoritar investigações; filtros por tag/favorito no histórico.
- Compartilhar investigação (copiar resumo) e exportar (download em texto/Markdown).

## Fase 2 — Inteligência do assistente (modo sugestão)
- Sugestões de próximos passos após cada resposta (botões clicáveis, ex.: "Consultar dispositivos desta conta?").
- Indicar quais capacidades poderiam ser consultadas a seguir.
- Botão "Resumir investigação" — resumo textual do que foi consultado.
- Sempre como sugestão: nada é executado sem clique do rep.

## Fase 3 — Governança ampliada
- Custo por investigação, por rep e por skill; ranking de investigações mais caras.
- Evolução de custo ao longo do tempo (gráfico).
- Alertas de consumo e limites de utilização (faixas simuladas).
- Auditoria e rastreabilidade: trilha de quem consultou o quê e quando.

## Fora do escopo (por ora)
- Investigação multiusuário / comparação entre usuários / múltiplos IDs.
- Grafo de relacionamento, timeline e "ver fonte" de evidências.
- Colaboração: comentários, revisão, transferência, avaliação de qualidade.

## Detalhes técnicos
- Persistência: banco de dados do Lovable Cloud (tabelas `cases`, `investigations`, `notes`, `tags`); o localStorage atual é aposentado.
- Mock assistant estendido: follow-ups e sugestões determinísticas por seed.
- Novas rotas: `/cases`, `/cases/$id`; Governança ganha as novas seções; fluxo atual preservado.
- Design: manter o tema claro atual (fundo branco, sidebar cinza-clara, IBM Plex); novos elementos seguem os mesmos tokens.
- Dados 100% fictícios; sem integrações reais; sem score/decisão automática/ações transacionais (restrições do PRD mantidas).
- Validação ao final de cada fase: typecheck limpo + verificação no preview.
