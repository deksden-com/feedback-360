create schema if not exists app;

create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

create or replace function app.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(nullif(current_setting('app.is_service_role', true), '')::boolean, false)
$$;

create or replace function app.has_company_access(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists(
    select 1
    from company_memberships membership
    where membership.company_id = target_company_id
      and membership.user_id = app.current_user_id()
  )
$$;

revoke all on function app.has_company_access(uuid) from public;
grant execute on function app.has_company_access(uuid) to public;

alter table companies enable row level security;
alter table companies force row level security;
drop policy if exists p_companies_access on companies;
create policy p_companies_access
  on companies
  for all
  using (app.is_service_role() or app.has_company_access(id))
  with check (app.is_service_role() or app.has_company_access(id));

alter table company_memberships enable row level security;
alter table company_memberships force row level security;
drop policy if exists p_company_memberships_access on company_memberships;
create policy p_company_memberships_access
  on company_memberships
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table employees enable row level security;
alter table employees force row level security;
drop policy if exists p_employees_access on employees;
create policy p_employees_access
  on employees
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table departments enable row level security;
alter table departments force row level security;
drop policy if exists p_departments_access on departments;
create policy p_departments_access
  on departments
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table employee_user_links enable row level security;
alter table employee_user_links force row level security;
drop policy if exists p_employee_user_links_access on employee_user_links;
create policy p_employee_user_links_access
  on employee_user_links
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table campaigns enable row level security;
alter table campaigns force row level security;
drop policy if exists p_campaigns_access on campaigns;
create policy p_campaigns_access
  on campaigns
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table questionnaires enable row level security;
alter table questionnaires force row level security;
drop policy if exists p_questionnaires_access on questionnaires;
create policy p_questionnaires_access
  on questionnaires
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
