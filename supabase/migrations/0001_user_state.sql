-- 계정별 펫패스 상태: 반려동물 프로필과 저장한 곳 (브라우저 저장 구조 그대로 동기화)
create table public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pets jsonb not null default '{}'::jsonb,
  saved jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint pets_size check (pg_column_size(pets) < 20000),
  constraint saved_size check (pg_column_size(saved) < 200000)
);
alter table public.user_state enable row level security;
create policy "own row select" on public.user_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "own row insert" on public.user_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own row update" on public.user_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own row delete" on public.user_state for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.touch_user_state() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger user_state_touch before update on public.user_state for each row execute function public.touch_user_state();

-- 회원 탈퇴: 호출한 본인 계정만 삭제 (대상을 인자로 받지 않음)
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
