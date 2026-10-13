-- Supabase SQL Editor에 붙여넣고 Run
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  site text not null check (char_length(site) between 1 and 60),
  parent_id uuid references public.comments(id) on delete cascade,
  author text not null check (char_length(author) between 1 and 30),
  body text not null check (char_length(body) between 1 and 1000),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_site_idx on public.comments(site, created_at);

alter table public.comments enable row level security;

-- 누구나 읽기
create policy "read all" on public.comments for select using (true);

-- 방문자: 일반 코멘트만 작성 (답글/관리자 표시 불가)
create policy "visitor insert" on public.comments for insert
  to anon, authenticated
  with check (parent_id is null and is_admin = false);

-- 관리자: 답글 작성 (이메일은 본인 것으로 바꿔도 됨)
create policy "admin insert" on public.comments for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'pje@abbg.co.kr' and is_admin = true);

-- 관리자: 삭제
create policy "admin delete" on public.comments for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'pje@abbg.co.kr');
