CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO anon, authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prototype_open_cases" ON public.cases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  target_user_id TEXT,
  rep_name TEXT NOT NULL,
  rep_handle TEXT NOT NULL,
  initial_request TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  favorite BOOLEAN NOT NULL DEFAULT false,
  queries INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigations TO anon, authenticated;
GRANT ALL ON public.investigations TO service_role;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prototype_open_investigations" ON public.investigations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  steps JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prototype_open_messages" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO anon, authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prototype_open_notes" ON public.notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prototype_open_tags" ON public.tags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.investigation_tags (
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (investigation_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigation_tags TO anon, authenticated;
GRANT ALL ON public.investigation_tags TO service_role;
ALTER TABLE public.investigation_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prototype_open_investigation_tags" ON public.investigation_tags FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Dados de exemplo para a primeira tela já abrir populada
INSERT INTO public.investigations (code, target_user_id, rep_name, rep_handle, initial_request, status, queries, cost_usd, created_at, updated_at) VALUES
  ('INV-2038', '884120377', 'Carlos Menezes', 'cmenezes', 'Verificar pagamentos recusados nos últimos 30 dias e cartões compartilhados com outras contas.', 'closed', 6, 3.42, '2026-09-17T13:12:00Z', '2026-09-17T13:40:00Z'),
  ('INV-2039', '551209884', 'Ana Paula Duarte', 'aduarte', 'Checar denúncias recebidas e itens anunciados após a última restrição.', 'closed', 4, 2.11, '2026-09-17T16:05:00Z', '2026-09-17T16:22:00Z'),
  ('INV-2040', '203399150', 'Carlos Menezes', 'cmenezes', 'Levantar dispositivos e restrições ativas relacionadas a esta conta.', 'active', 5, 2.87, '2026-09-18T01:48:00Z', '2026-09-18T02:10:00Z');

INSERT INTO public.tags (name) VALUES ('chargeback'), ('conta-compartilhada'), ('prioridade-alta');