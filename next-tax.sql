-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iso2 text,
  base_duty_rate numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  code text,
  import_tax_rate numeric NOT NULL DEFAULT 0,
  export_tax_rate numeric NOT NULL DEFAULT 0,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exchange_rates (
  code text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (code)
);
CREATE TABLE public.fiscal_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year_label text NOT NULL UNIQUE,
  start_date date,
  end_date date,
  CONSTRAINT fiscal_years_pkey PRIMARY KEY (id)
);
CREATE TABLE public.import_export_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  officer_id uuid,
  country_id uuid,
  category_id uuid NOT NULL,
  declared_value numeric NOT NULL,
  duty_total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  amount numeric,
  calculated_tax numeric,
  calculation_data jsonb,
  country text,
  product_category text,
  product_name text,
  type text,
  CONSTRAINT import_export_records_pkey PRIMARY KEY (id),
  CONSTRAINT import_export_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT import_export_records_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES auth.users(id),
  CONSTRAINT import_export_records_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id),
  CONSTRAINT import_export_records_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id)
);
CREATE TABLE public.officer_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  officer_id uuid NOT NULL,
  citizen_id uuid,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  target_user_id uuid,
  CONSTRAINT officer_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT officer_activity_logs_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES auth.users(id),
  CONSTRAINT officer_activity_logs_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES auth.users(id)
);
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category_duty_rate numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  base_tax_rate numeric NOT NULL DEFAULT 0,
  CONSTRAINT product_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  phone text,
  location text,
  tin_number text,
  officer_id text,
  office_type text,
  office_location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.tax_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  officer_id uuid,
  total_income numeric NOT NULL,
  total_expense numeric NOT NULL,
  taxable_income numeric NOT NULL,
  calculated_tax numeric NOT NULL,
  fiscal_year text NOT NULL DEFAULT '2026-2027'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  calculation_data jsonb,
  CONSTRAINT tax_calculations_pkey PRIMARY KEY (id),
  CONSTRAINT tax_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT tax_calculations_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tax_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL,
  fiscal_year text NOT NULL,
  total_income numeric NOT NULL DEFAULT 0,
  total_expense numeric NOT NULL DEFAULT 0,
  taxable_income numeric NOT NULL DEFAULT 0,
  calculated_tax numeric NOT NULL DEFAULT 0,
  calculation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::tax_request_status,
  officer_id uuid,
  officer_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tax_requests_pkey PRIMARY KEY (id),
  CONSTRAINT tax_requests_citizen_fk FOREIGN KEY (citizen_id) REFERENCES auth.users(id),
  CONSTRAINT tax_requests_citizen_id_fkey FOREIGN KEY (citizen_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tax_slabs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fiscal_year_id uuid NOT NULL,
  slab_from numeric NOT NULL,
  slab_to numeric,
  rate numeric NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT tax_slabs_pkey PRIMARY KEY (id),
  CONSTRAINT tax_slabs_fiscal_year_id_fkey FOREIGN KEY (fiscal_year_id) REFERENCES public.fiscal_years(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
