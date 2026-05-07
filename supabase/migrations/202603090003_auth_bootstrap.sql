create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'user_' || replace(new.id::text, '-', '')),
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
