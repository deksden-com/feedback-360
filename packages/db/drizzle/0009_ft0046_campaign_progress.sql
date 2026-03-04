alter table questionnaires
  add column if not exists first_draft_at timestamptz;

create index if not exists idx_questionnaires_campaign_status
  on questionnaires (campaign_id, status);
