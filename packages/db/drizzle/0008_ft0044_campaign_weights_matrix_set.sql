alter table campaigns
  add column if not exists manager_weight integer not null default 40,
  add column if not exists peers_weight integer not null default 30,
  add column if not exists subordinates_weight integer not null default 30,
  add column if not exists self_weight integer not null default 0;
