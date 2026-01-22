-- Core tables required for auth + tax workflow

-- 1) Utility trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2) Profiles (user metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  location text,
  tin_number text,
  officer_id text,
  office_type text,
  office_location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_tin_idx ON public.profiles (tin_number);
CREATE INDEX IF NOT EXISTS profiles_officer_id_idx ON public.profiles (officer_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) User roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('citizen', 'officer', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper predicates for RLS (security definer to avoid RLS recursion issues)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_officer_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('officer','admin')
  );
$$;

-- 4) Tax calculations
CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  officer_id uuid,
  fiscal_year text NOT NULL,
  total_income numeric NOT NULL DEFAULT 0,
  total_expense numeric NOT NULL DEFAULT 0,
  taxable_income numeric NOT NULL DEFAULT 0,
  calculated_tax numeric NOT NULL DEFAULT 0,
  calculation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tax_calculations_user_idx ON public.tax_calculations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tax_calculations_officer_idx ON public.tax_calculations (officer_id, created_at DESC);

DROP TRIGGER IF EXISTS update_tax_calculations_updated_at ON public.tax_calculations;
CREATE TRIGGER update_tax_calculations_updated_at
BEFORE UPDATE ON public.tax_calculations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Tax review requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_request_status') THEN
    CREATE TYPE public.tax_request_status AS ENUM ('draft','submitted','approved','rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tax_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL,
  fiscal_year text NOT NULL,
  total_income numeric NOT NULL DEFAULT 0,
  total_expense numeric NOT NULL DEFAULT 0,
  taxable_income numeric NOT NULL DEFAULT 0,
  calculated_tax numeric NOT NULL DEFAULT 0,
  calculation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.tax_request_status NOT NULL DEFAULT 'draft',
  officer_id uuid,
  officer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tax_requests_citizen_idx ON public.tax_requests (citizen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tax_requests_status_idx ON public.tax_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS update_tax_requests_updated_at ON public.tax_requests;
CREATE TRIGGER update_tax_requests_updated_at
BEFORE UPDATE ON public.tax_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Officer activity logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'officer_activity_type') THEN
    CREATE TYPE public.officer_activity_type AS ENUM (
      'TIN_SEARCH',
      'OFFICER_CALC_CREATE',
      'REQUEST_APPROVED',
      'REQUEST_REJECTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.officer_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id uuid NOT NULL,
  activity_type public.officer_activity_type NOT NULL,
  target_user_id uuid,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS officer_logs_officer_idx ON public.officer_activity_logs (officer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS officer_logs_target_idx ON public.officer_activity_logs (target_user_id, created_at DESC);

-- =========================
-- Row Level Security
-- =========================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Profiles: self read" ON public.profiles;
CREATE POLICY "Profiles: self read"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: officer/admin read" ON public.profiles;
CREATE POLICY "Profiles: officer/admin read"
ON public.profiles FOR SELECT
USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Profiles: self upsert" ON public.profiles;
CREATE POLICY "Profiles: self upsert"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: self update" ON public.profiles;
CREATE POLICY "Profiles: self update"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- USER_ROLES
DROP POLICY IF EXISTS "Roles: self read" ON public.user_roles;
CREATE POLICY "Roles: self read"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Roles: admin read" ON public.user_roles;
CREATE POLICY "Roles: admin read"
ON public.user_roles FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Roles: self insert (non-admin)" ON public.user_roles;
CREATE POLICY "Roles: self insert (non-admin)"
ON public.user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('citizen','officer')
);

DROP POLICY IF EXISTS "Roles: admin manage" ON public.user_roles;
CREATE POLICY "Roles: admin manage"
ON public.user_roles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- TAX_CALCULATIONS
DROP POLICY IF EXISTS "Tax calcs: self read" ON public.tax_calculations;
CREATE POLICY "Tax calcs: self read"
ON public.tax_calculations FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tax calcs: officer/admin read" ON public.tax_calculations;
CREATE POLICY "Tax calcs: officer/admin read"
ON public.tax_calculations FOR SELECT
USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Tax calcs: citizen insert own" ON public.tax_calculations;
CREATE POLICY "Tax calcs: citizen insert own"
ON public.tax_calculations FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND officer_id IS NULL
);

DROP POLICY IF EXISTS "Tax calcs: officer insert" ON public.tax_calculations;
CREATE POLICY "Tax calcs: officer insert"
ON public.tax_calculations FOR INSERT
WITH CHECK (
  public.is_officer_or_admin()
  AND officer_id = auth.uid()
);

-- TAX_REQUESTS
DROP POLICY IF EXISTS "Tax req: citizen read own" ON public.tax_requests;
CREATE POLICY "Tax req: citizen read own"
ON public.tax_requests FOR SELECT
USING (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Tax req: officer/admin read submitted" ON public.tax_requests;
CREATE POLICY "Tax req: officer/admin read submitted"
ON public.tax_requests FOR SELECT
USING (
  public.is_officer_or_admin()
  AND status = 'submitted'
);

DROP POLICY IF EXISTS "Tax req: citizen insert own" ON public.tax_requests;
CREATE POLICY "Tax req: citizen insert own"
ON public.tax_requests FOR INSERT
WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Tax req: citizen update own" ON public.tax_requests;
CREATE POLICY "Tax req: citizen update own"
ON public.tax_requests FOR UPDATE
USING (auth.uid() = citizen_id)
WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Tax req: officer/admin update" ON public.tax_requests;
CREATE POLICY "Tax req: officer/admin update"
ON public.tax_requests FOR UPDATE
USING (public.is_officer_or_admin())
WITH CHECK (public.is_officer_or_admin());

-- OFFICER ACTIVITY LOGS
DROP POLICY IF EXISTS "Officer logs: officer read own" ON public.officer_activity_logs;
CREATE POLICY "Officer logs: officer read own"
ON public.officer_activity_logs FOR SELECT
USING (auth.uid() = officer_id);

DROP POLICY IF EXISTS "Officer logs: admin read" ON public.officer_activity_logs;
CREATE POLICY "Officer logs: admin read"
ON public.officer_activity_logs FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Officer logs: officer insert own" ON public.officer_activity_logs;
CREATE POLICY "Officer logs: officer insert own"
ON public.officer_activity_logs FOR INSERT
WITH CHECK (auth.uid() = officer_id);
