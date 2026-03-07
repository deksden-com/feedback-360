create table if not exists xe_runs (
  run_id text primary key,
  scenario_id text not null,
  scenario_version text not null,
  environment text not null,
  status text not null default 'created',
  workspace_path text not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz not null,
  cleanup_status text not null default 'active',
  summary_json jsonb not null default '{}'::jsonb,
  bindings_json jsonb not null default '{}'::jsonb,
  last_error text
);

create table if not exists xe_run_locks (
  environment text primary key,
  run_id text not null references xe_runs(run_id) on delete cascade,
  owner text not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_xe_runs_status on xe_runs(status);
create index if not exists idx_xe_runs_expires_at on xe_runs(expires_at);
