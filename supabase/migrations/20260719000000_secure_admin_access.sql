-- Admin data is accessed only through the server-side /api/admin/data route.
-- The route authenticates the admin cookie and uses the service role.

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'admin_leads',
    'admin_lead_notes',
    'admin_lead_tasks',
    'admin_tickets',
    'admin_ticket_messages',
    'admin_notifications'
  ]
  loop
    if to_regclass('public.' || relation_name) is not null then
      execute format(
        'revoke all privileges on table public.%I from anon, authenticated',
        relation_name
      );
      execute format(
        'grant all privileges on table public.%I to service_role',
        relation_name
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if to_regprocedure('public.admin_stats()') is not null then
    execute 'revoke execute on function public.admin_stats() from public, anon, authenticated';
    execute 'grant execute on function public.admin_stats() to service_role';
  end if;
end
$$;
