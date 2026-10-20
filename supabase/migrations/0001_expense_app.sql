-- ============================================================
-- Expense Tracker: schema expense_app
-- ระบบล็อกอินของแอปเอง (ไม่ใช้ Supabase Auth)
-- เบราว์เซอร์เข้าถึงตารางตรง ๆ ไม่ได้: ทุกคำขอต้องผ่าน API ของ Next.js (service role)
-- ============================================================

create schema if not exists expense_app;

-- ผู้ใช้ (admin สร้างให้ / admin คนแรกสร้างผ่านหน้า /setup)
create table expense_app.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username = lower(username) and length(username) between 3 and 40),
  display_name text not null check (length(display_name) between 1 and 80),
  password_hash text not null,                       -- scrypt: "salt:hash" (hex)
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,           -- ปิดใช้งานแทนการลบ ข้อมูลยังอยู่
  created_by uuid references expense_app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- การล็อกอินที่ยังใช้อยู่ (cookie เก็บ token, ตารางเก็บแค่ sha256 ของ token)
create table expense_app.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references expense_app.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_id_idx on expense_app.sessions (user_id);

-- รายรับรายจ่าย
create table expense_app.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references expense_app.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('THB', 'USD', 'EUR', 'JPY', 'CNY', 'SGD')),
  note text not null default '' check (length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_date_idx on expense_app.transactions (user_id, date desc, created_at desc);

-- updated_at อัตโนมัติ
create or replace function expense_app.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger users_updated_at before update on expense_app.users
  for each row execute function expense_app.set_updated_at();
create trigger transactions_updated_at before update on expense_app.transactions
  for each row execute function expense_app.set_updated_at();

-- ---------- ความปลอดภัย ----------
-- เปิด RLS โดยไม่มี policy = anon/authenticated อ่านเขียนไม่ได้เลย (service role ข้าม RLS ได้)
alter table expense_app.users enable row level security;
alter table expense_app.sessions enable row level security;
alter table expense_app.transactions enable row level security;

revoke all on schema expense_app from public, anon, authenticated;
revoke all on all tables in schema expense_app from public, anon, authenticated;
revoke all on all functions in schema expense_app from public, anon, authenticated;

grant usage on schema expense_app to service_role;
grant all on all tables in schema expense_app to service_role;
alter default privileges in schema expense_app grant all on tables to service_role;

-- ให้ Data API (PostgREST) มองเห็น schema นี้ (ใช้ได้เฉพาะ service role ตามสิทธิ์ด้านบน)
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, expense_app';
notify pgrst, 'reload config';
