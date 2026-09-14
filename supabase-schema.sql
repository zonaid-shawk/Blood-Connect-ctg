create table if not exists public.blood_donors (
  id bigint primary key,
  donor_id text,
  full_name text,
  email text,
  phone text,
  blood_group text,
  age integer,
  gender text,
  city text,
  address text,
  last_donation text,
  is_available boolean default true,
  status text default 'pending',
  registered_at timestamptz default now(),
  total_donations integer default 0
);

create table if not exists public.blood_requests (
  id bigint primary key,
  request_id text,
  patient_name text,
  email text,
  blood_group text,
  hospital text,
  city text,
  contact text,
  urgency text,
  units integer default 1,
  notes text,
  status text default 'Pending',
  date timestamptz default now()
);

create table if not exists public.blood_stock (
  id text primary key,
  blood_group text unique not null,
  units integer default 0
);

insert into public.blood_stock (id, blood_group, units)
values
  ('A+', 'A+', 10),
  ('A-', 'A-', 5),
  ('B+', 'B+', 8),
  ('B-', 'B-', 3),
  ('AB+', 'AB+', 4),
  ('AB-', 'AB-', 2),
  ('O+', 'O+', 15),
  ('O-', 'O-', 7)
on conflict (id) do nothing;

alter table public.blood_donors enable row level security;
alter table public.blood_requests enable row level security;
alter table public.blood_stock enable row level security;

create policy "Allow public read access for donors" on public.blood_donors for select using (true);
create policy "Allow public insert access for donors" on public.blood_donors for insert with check (true);
create policy "Allow public update access for donors" on public.blood_donors for update using (true) with check (true);
create policy "Allow public read access for requests" on public.blood_requests for select using (true);
create policy "Allow public insert access for requests" on public.blood_requests for insert with check (true);
create policy "Allow public update access for requests" on public.blood_requests for update using (true) with check (true);
create policy "Allow public read access for stock" on public.blood_stock for select using (true);
create policy "Allow public insert access for stock" on public.blood_stock for insert with check (true);
create policy "Allow public update access for stock" on public.blood_stock for update using (true) with check (true);

