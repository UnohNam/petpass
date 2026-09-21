-- 이메일 없는 아이디·비밀번호 가입.
-- Supabase Auth 는 이메일을 요구하므로 아이디를 내부 전용 주소(<아이디>@id.petpass.local)로 저장합니다.
-- 이 주소로는 메일을 보내지 않으며(가입 즉시 확인 처리), 화면에는 아이디만 노출합니다.
create or replace function public.register_user(p_username text, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_email text;
  v_id uuid := gen_random_uuid();
begin
  if v_username !~ '^[a-z0-9_]{4,20}$' then raise exception 'INVALID_USERNAME'; end if;
  if length(coalesce(p_password, '')) < 8 or length(p_password) > 72 then raise exception 'WEAK_PASSWORD'; end if;
  v_email := v_username || '@id.petpass.local';
  if (select count(*) from auth.users where created_at > now() - interval '1 hour') >= 300 then raise exception 'RATE_LIMIT'; end if;
  if exists (select 1 from auth.users where email = v_email) then raise exception 'USERNAME_TAKEN'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email, extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('username', v_username), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());
exception when unique_violation then raise exception 'USERNAME_TAKEN';
end $$;
revoke all on function public.register_user(text, text) from public;
grant execute on function public.register_user(text, text) to anon, authenticated;
