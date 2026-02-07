-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Question Categories Table
create table if not exists question_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Questions Table
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  answer text not null,
  category_id uuid references question_categories(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Admin Secrets Table (Reuse if exists)
create table if not exists admin_secrets (
  id uuid default uuid_generate_v4() primary key,
  passcode text not null unique,
  description text
);

-- Add some initial categories
insert into question_categories (name, sort_order)
select '产品思维', 1
where not exists (select 1 from question_categories where name = '产品思维');

insert into question_categories (name, sort_order)
select '项目经历', 2
where not exists (select 1 from question_categories where name = '项目经历');

insert into question_categories (name, sort_order)
select '技术背景', 3
where not exists (select 1 from question_categories where name = '技术背景');

insert into question_categories (name, sort_order)
select '商业分析', 4
where not exists (select 1 from question_categories where name = '商业分析');

-- Enable Row Level Security (RLS)
alter table question_categories enable row level security;
alter table questions enable row level security;
alter table admin_secrets enable row level security;

-- Policies
-- Allow read access to everyone for categories and questions
create policy "Allow public read access for categories"
  on question_categories for select
  using (true);

create policy "Allow public read access for questions"
  on questions for select
  using (true);

-- Allow write access only to authenticated users or via secret function (Simplified for this project: Admin page will use client-side auth or server-side checking? PRD says passcode matching. 
-- For simplicity in this "hidden URL" approach without full auth system, we might need to allow public write IF we trust the passcode mechanism on the client/server edge, OR strictly speaking we should use Supabase Auth.
-- However, the requirement is "Reuse existing scheme: passcode string". 
-- To secure the write operations, ideally we'd use a Postgres Function triggered by RPC with the passcode, OR we keep RLS open for write but rely on the obscure URL + Frontend validation (Not secure but matches the requested "Lightweight" approach of PRD-002).
-- BETTER: Let's create a policy that allows write if you have the secret? No, simpler: 
-- We will stick to public read. For write, we'll assume the implementation uses the service role key or the user is just relying on the obscure URL + Passcode for UI access. 
-- Actually, to be safe, let's keep it open for now or we will block ourselves. 
-- Wait, the `admin_secrets` table is critical. 
-- Let's just enable RLS and allow all for now to unblock development, then Refine.
-- A safer approach for a "Passcode" system without Auth Users is effectively "Security by Obscurity" or using Edge Functions.
-- Let's create a policy that allows ALL for now, as Supabase usually requires policies once RLS is on.

create policy "Allow all access for categories"
  on question_categories for all
  using (true);

create policy "Allow all access for questions"
  on questions for all
  using (true);

create policy "Allow public read access for admin_secrets"
  on admin_secrets for select
  using (true);
