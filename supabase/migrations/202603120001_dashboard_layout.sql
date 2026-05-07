alter table public.app_settings
add column if not exists dashboard_layout jsonb not null default '{"order":["available","spent","focus"],"hidden":[]}'::jsonb;

update public.app_settings
set dashboard_layout = '{"order":["available","spent","focus"],"hidden":[]}'::jsonb
where dashboard_layout is null;

create or replace function public.rpc_update_dashboard_layout(
  p_dashboard_layout jsonb,
  p_expected_version integer,
  p_session_id text
)
returns public.app_settings
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_record public.app_settings;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if jsonb_typeof(p_dashboard_layout) <> 'object' then
    raise exception 'Invalid dashboard layout payload';
  end if;

  update public.app_settings
  set
    dashboard_layout = p_dashboard_layout,
    last_modified_by_session = coalesce(nullif(p_session_id, ''), 'unknown')
  where user_id = v_uid and version = p_expected_version
  returning * into v_record;

  if not found then
    raise exception 'Version conflict';
  end if;

  return v_record;
end;
$$;
