-- Close public exposure: the app stores data in the browser (localStorage) and never reads these tables.
-- Drop the permissive open policies so RLS default-deny applies, and revoke Data API grants
-- from anon/authenticated (service_role keeps full access for future server-side use).

DROP POLICY IF EXISTS prototype_open_cases ON public.cases;
DROP POLICY IF EXISTS prototype_open_investigations ON public.investigations;
DROP POLICY IF EXISTS prototype_open_messages ON public.messages;
DROP POLICY IF EXISTS prototype_open_notes ON public.notes;
DROP POLICY IF EXISTS prototype_open_tags ON public.tags;
DROP POLICY IF EXISTS prototype_open_investigation_tags ON public.investigation_tags;

REVOKE ALL ON public.cases FROM anon, authenticated;
REVOKE ALL ON public.investigations FROM anon, authenticated;
REVOKE ALL ON public.messages FROM anon, authenticated;
REVOKE ALL ON public.notes FROM anon, authenticated;
REVOKE ALL ON public.tags FROM anon, authenticated;
REVOKE ALL ON public.investigation_tags FROM anon, authenticated;