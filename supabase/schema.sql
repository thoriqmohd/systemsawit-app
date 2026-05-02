create extension if not exists "uuid-ossp";

create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  registration_no text,
  subscription_status text not null default 'trial',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  role text not null default 'owner',
  phone text,
  created_at timestamptz not null default now()
);

create table public.estates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  state text,
  district text,
  total_hectares numeric(12,2),
  created_at timestamptz not null default now()
);

create table public.plots (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  estate_id uuid not null references public.estates(id) on delete cascade,
  code text not null,
  name text,
  hectares numeric(12,2),
  palm_count integer,
  planted_year integer,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now(),
  unique (estate_id, code)
);

create table public.collection_points (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,
  code text not null,
  name text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.workers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_no text,
  full_name text not null,
  role text not null default 'worker',
  team_name text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  latitude numeric(10,7),
  longitude numeric(10,7),
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.harvest_records (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plot_id uuid not null references public.plots(id) on delete cascade,
  collection_point_id uuid references public.collection_points(id) on delete set null,
  worker_id uuid references public.workers(id) on delete set null,
  harvested_at date not null,
  bunch_count integer not null default 0,
  estimated_weight_kg numeric(12,2),
  actual_weight_kg numeric(12,2),
  status text not null default 'recorded',
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.crop_health_reports (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plot_id uuid not null references public.plots(id) on delete cascade,
  reported_by uuid references public.profiles(id) on delete set null,
  issue_type text not null,
  severity text not null default 'medium',
  description text,
  action_taken text,
  status text not null default 'open',
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.delivery_records (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  delivered_at date not null,
  driver_name text,
  lorry_no text,
  mill_name text not null,
  delivery_order_no text,
  net_weight_kg numeric(12,2),
  price_per_tonne numeric(12,2),
  status text not null default 'delivered',
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.estates enable row level security;
alter table public.plots enable row level security;
alter table public.collection_points enable row level security;
alter table public.workers enable row level security;
alter table public.attendance_records enable row level security;
alter table public.harvest_records enable row level security;
alter table public.crop_health_reports enable row level security;
alter table public.delivery_records enable row level security;

create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create policy "Users can read own company" on public.companies
for select using (id = public.current_company_id());

create policy "Users can read own profile" on public.profiles
for select using (id = auth.uid() or company_id = public.current_company_id());

create policy "Tenant read estates" on public.estates
for select using (company_id = public.current_company_id());

create policy "Tenant read plots" on public.plots
for select using (company_id = public.current_company_id());

create policy "Tenant read collection points" on public.collection_points
for select using (company_id = public.current_company_id());

create policy "Tenant read workers" on public.workers
for select using (company_id = public.current_company_id());

create policy "Tenant read attendance" on public.attendance_records
for select using (company_id = public.current_company_id());

create policy "Tenant read harvest" on public.harvest_records
for select using (company_id = public.current_company_id());

create policy "Tenant read crop health" on public.crop_health_reports
for select using (company_id = public.current_company_id());

create policy "Tenant read deliveries" on public.delivery_records
for select using (company_id = public.current_company_id());
