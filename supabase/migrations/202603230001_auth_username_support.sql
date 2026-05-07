create or replace function public.generate_unique_username(base text)
returns text
language plpgsql
as $$
declare
  normalized text := trim(both '_' from regexp_replace(lower(trim(coalesce(base, 'user'))), '[^a-z0-9_]+', '_', 'g'));
  candidate text;
  suffix integer := 0;
begin
  if normalized = '' then
    normalized := 'user';
  end if;

  candidate := left(normalized, 24);

  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(normalized, greatest(1, 24 - length(suffix::text) - 1)) || '_' || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text := trim(both '_' from regexp_replace(lower(trim(coalesce(new.raw_user_meta_data ->> 'username', ''))), '[^a-z0-9_]+', '_', 'g'));
  resolved_username text;
begin
  if requested_username <> '' then
    if length(requested_username) < 3 or length(requested_username) > 24 then
      raise exception 'Invalid username';
    end if;

    if exists (select 1 from public.profiles where username = requested_username) then
      raise exception 'Username already taken';
    end if;

    resolved_username := requested_username;
  else
    resolved_username := public.generate_unique_username(split_part(coalesce(new.email, 'user'), '@', 1));
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    resolved_username,
    split_part(coalesce(new.email, 'user'), '@', 1)
  )
  on conflict (id) do nothing;

  insert into public.app_settings (user_id, dark_mode, pay_frequency, last_modified_by_session)
  values (new.id, false, 'monthly', 'bootstrap')
  on conflict (user_id) do nothing;

  insert into public.sharing_preferences (user_id, share_data)
  values (new.id, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$;