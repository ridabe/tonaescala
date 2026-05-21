-- ── org_contacts ─────────────────────────────────────────────────────────────
-- Agenda de contatos da organização: pessoas que podem ser escaladas em eventos.
-- Alimentada manualmente e auto-populada quando um novo escalado é adicionado.

CREATE TABLE IF NOT EXISTS public.org_contacts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  email        TEXT,
  phone        TEXT,
  default_role TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante que, dentro da mesma org, não existam dois contatos com o mesmo email
CREATE UNIQUE INDEX IF NOT EXISTS org_contacts_org_email_unique
  ON public.org_contacts (org_id, lower(email))
  WHERE email IS NOT NULL AND trim(email) <> '';

CREATE INDEX IF NOT EXISTS org_contacts_org_id_idx ON public.org_contacts (org_id);
CREATE INDEX IF NOT EXISTS org_contacts_name_idx   ON public.org_contacts (org_id, lower(name));

-- RLS
ALTER TABLE public.org_contacts ENABLE ROW LEVEL SECURITY;

-- Apenas membros autenticados da mesma org podem ler/escrever
CREATE POLICY "org_contacts_org_member" ON public.org_contacts
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- ── RPC: search_org_contacts ──────────────────────────────────────────────────
-- Busca contatos por nome ou email (case-insensitive, parcial).
-- Retorna no máx. 20 resultados, ordenados por nome.
CREATE OR REPLACE FUNCTION public.search_org_contacts(
  p_org_id UUID,
  p_query  TEXT DEFAULT ''
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  default_role TEXT,
  created_at   TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.default_role,
    c.created_at
  FROM public.org_contacts c
  WHERE c.org_id = p_org_id
    AND (
      p_query = ''
      OR lower(c.name)  LIKE '%' || lower(p_query) || '%'
      OR lower(c.email) LIKE '%' || lower(p_query) || '%'
    )
  ORDER BY c.name
  LIMIT 20;
$$;

-- ── RPC: upsert_org_contact ───────────────────────────────────────────────────
-- Insere um contato ou atualiza nome/telefone/role se o email já existir na org.
-- Se email for null/vazio, sempre insere (sem deduplicação).
CREATE OR REPLACE FUNCTION public.upsert_org_contact(
  p_org_id      UUID,
  p_name        TEXT,
  p_email       TEXT       DEFAULT NULL,
  p_phone       TEXT       DEFAULT NULL,
  p_default_role TEXT      DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT := NULLIF(trim(p_email), '');
BEGIN
  IF v_email IS NOT NULL THEN
    -- Tenta encontrar contato existente pelo email
    SELECT id INTO v_id
    FROM public.org_contacts
    WHERE org_id = p_org_id AND lower(email) = lower(v_email)
    LIMIT 1;
  END IF;

  IF v_id IS NOT NULL THEN
    -- Atualiza somente campos que foram fornecidos
    UPDATE public.org_contacts SET
      name         = COALESCE(NULLIF(trim(p_name), ''), name),
      phone        = COALESCE(NULLIF(trim(p_phone), ''), phone),
      default_role = COALESCE(NULLIF(trim(p_default_role), ''), default_role),
      updated_at   = NOW()
    WHERE id = v_id;
  ELSE
    INSERT INTO public.org_contacts (org_id, name, email, phone, default_role)
    VALUES (p_org_id, trim(p_name), v_email, NULLIF(trim(p_phone), ''), NULLIF(trim(p_default_role), ''))
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- ── RPC: delete_org_contact ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_org_contact(
  p_contact_id UUID,
  p_org_id     UUID
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.org_contacts
  WHERE id = p_contact_id AND org_id = p_org_id;
$$;

-- ── RPC: list_org_contacts ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_org_contacts(p_org_id UUID)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  default_role TEXT,
  created_at   TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, email, phone, default_role, created_at
  FROM public.org_contacts
  WHERE org_id = p_org_id
  ORDER BY name;
$$;
