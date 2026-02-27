-- Create core application tables for users, zones, and audit logs.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  username text not null,
  avatar text,
  role text not null default 'user',
  last_login timestamptz,
  created_at timestamptz not null default now(),
  constraint users_discord_id_key unique (discord_id)
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint zones_created_by_fkey
    foreign key (created_by)
    references public.users (id)
    on update cascade
    on delete restrict
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  user_id uuid,
  "timestamp" timestamptz not null default now(),
  constraint audit_logs_user_id_fkey
    foreign key (user_id)
    references public.users (id)
    on update cascade
    on delete set null
);

create index if not exists idx_users_role
  on public.users (role);

create index if not exists idx_users_last_login
  on public.users (last_login desc);

create index if not exists idx_zones_created_by
  on public.zones (created_by);

create index if not exists idx_zones_created_at
  on public.zones (created_at desc);

create index if not exists idx_audit_logs_user_id
  on public.audit_logs (user_id);

create index if not exists idx_audit_logs_timestamp
  on public.audit_logs ("timestamp" desc);
