-- 이메일 없는 비밀번호 찾기: 가입 시 발급하는 복구 코드.
-- 코드는 bcrypt 해시로만 저장하고, 5회 틀리면 15분 잠급니다. 테이블은 RLS 로 막고 아래 함수로만 접근합니다.
create table public.recovery_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null,
  attempts int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.recovery_codes enable row level security;
revoke all on public.recovery_codes from anon, authenticated;

-- 헷갈리는 글자(0,O,1,I)를 뺀 32자에서 16자: XXXX-XXXX-XXXX-XXXX
create or replace function public._new_recovery_code() returns text language plpgsql set search_path = '' as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(16); s text := ''; i int;
begin
  for i in 0..15 loop
    s := s || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    if i in (3, 7, 11) then s := s || '-'; end if;
  end loop;
  return s;
end $$;
revoke all on function public._new_recovery_code() from public, anon, authenticated;

create or replace function public._store_recovery_code(p_user uuid) returns text language plpgsql security definer set search_path = '' as $$
declare v_code text := public._new_recovery_code();
begin
  insert into public.recovery_codes (user_id, code_hash, attempts, locked_until, updated_at)
  values (p_user, extensions.crypt(replace(v_code, '-', ''), extensions.gen_salt('bf', 10)), 0, null, now())
  on conflict (user_id) do update set code_hash = excluded.code_hash, attempts = 0, locked_until = null, updated_at = now();
  return v_code;
end $$;
revoke all on function public._store_recovery_code(uuid) from public, anon, authenticated;

-- register_user 는 0002 의 본문 끝에서 `return public._store_recovery_code(v_id);` 를 하도록 반환형을 text 로 바꿔 다시 만듭니다.
-- (drop function public.register_user(text, text); 후 동일 본문 + returns text)

-- 비밀번호 재설정: 없는 아이디와 틀린 코드는 같은 응답('INVALID')
create or replace function public.reset_password(p_username text, p_code text, p_new_password text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(coalesce(p_username, ''))) || '@id.petpass.local';
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_user uuid; r public.recovery_codes%rowtype;
begin
  if length(coalesce(p_new_password, '')) < 8 or length(p_new_password) > 72 then raise exception 'WEAK_PASSWORD'; end if;
  select id into v_user from auth.users where email = v_email;
  if v_user is not null then select * into r from public.recovery_codes where user_id = v_user for update; end if;
  if v_user is null or r.user_id is null then perform extensions.crypt(v_code, extensions.gen_salt('bf', 10)); return 'INVALID'; end if;
  if r.locked_until is not null and r.locked_until > now() then raise exception 'RECOVERY_LOCKED'; end if;
  if length(v_code) <> 16 or r.code_hash <> extensions.crypt(v_code, r.code_hash) then
    update public.recovery_codes set attempts = case when attempts + 1 >= 5 then 0 else attempts + 1 end,
      locked_until = case when attempts + 1 >= 5 then now() + interval '15 minutes' else null end, updated_at = now() where user_id = v_user;
    return 'INVALID';
  end if;
  update auth.users set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)), updated_at = now() where id = v_user;
  delete from auth.sessions where user_id = v_user;
  return public._store_recovery_code(v_user);
end $$;
revoke all on function public.reset_password(text, text, text) from public;
grant execute on function public.reset_password(text, text, text) to anon, authenticated;

create or replace function public.regenerate_recovery_code() returns text language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  return public._store_recovery_code(auth.uid());
end $$;
revoke all on function public.regenerate_recovery_code() from public, anon;
grant execute on function public.regenerate_recovery_code() to authenticated;
