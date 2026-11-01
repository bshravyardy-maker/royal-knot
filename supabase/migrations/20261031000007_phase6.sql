-- ==============================================================================
-- THE ROYAL KNOT - Phase 6 Migration: Founder Analytics, Views & Share Tokens
-- ==============================================================================

-- 1. Create time_logs table
create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  member_id uuid not null references team_members(id) on delete cascade,
  hours numeric(6,2) not null check (hours > 0),
  hourly_cost numeric(10,2) not null check (hourly_cost >= 0),
  logged_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Create share_tokens table
create table if not exists share_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked boolean not null default false,
  is_demo boolean not null default false
);

-- 3. Row Level Security: anon select-only, service role full
do $$
declare t text;
begin
  foreach t in array array['time_logs', 'share_tokens'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon read" on %I', t);
    execute format('create policy "anon read" on %I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "service all" on %I', t);
    execute format('create policy "service all" on %I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;

-- 4. View wedding_profit (security_invoker = true)
create or replace view wedding_profit with (security_invoker = true) as
with vendor_agg as (
  select
    wv.wedding_id,
    sum(wv.agreed_amount) as total_agreed,
    sum(case when coalesce(b.billed, 0) > 0 then b.billed else coalesce(wv.agreed_amount, 0) end) as total_vendor_cost
  from wedding_vendors wv
  left join (
    select wedding_vendor_id, sum(amount) as billed
    from vendor_bills
    group by wedding_vendor_id
  ) b on b.wedding_vendor_id = wv.id
  group by wv.wedding_id
),
extras_agg as (
  select
    wedding_id,
    coalesce(sum(amount) filter (where client_billable = false), 0) as absorbed_extras
  from extra_charges
  group by wedding_id
),
team_agg as (
  select
    wedding_id,
    coalesce(sum(hours * hourly_cost), 0) as team_cost
  from time_logs
  group by wedding_id
)
select
  w.id as wedding_id,
  w.title as wedding_title,
  w.wedding_date,
  w.city,
  w.is_demo,
  coalesce(inv.total, w.contract_value, 0) as revenue_total,
  coalesce(va.total_vendor_cost, 0) as vendor_cost,
  coalesce(ea.absorbed_extras, 0) as absorbed_extras,
  coalesce(ta.team_cost, 0) as team_cost,
  (coalesce(inv.total, w.contract_value, 0) - coalesce(va.total_vendor_cost, 0) - coalesce(ea.absorbed_extras, 0) - coalesce(ta.team_cost, 0)) as profit,
  case
    when coalesce(inv.total, w.contract_value, 0) > 0 then
      round(
        ((coalesce(inv.total, w.contract_value, 0) - coalesce(va.total_vendor_cost, 0) - coalesce(ea.absorbed_extras, 0) - coalesce(ta.team_cost, 0))
        / coalesce(inv.total, w.contract_value, 0)) * 100.0,
        2
      )
    else 0
  end as margin_pct,
  case
    when (coalesce(inv.total, w.contract_value, 0) - coalesce(va.total_vendor_cost, 0) - coalesce(ea.absorbed_extras, 0) - coalesce(ta.team_cost, 0)) >= 0 then null
    when (coalesce(va.total_vendor_cost, 0) - coalesce(va.total_agreed, 0)) > 0
         and (coalesce(va.total_vendor_cost, 0) - coalesce(va.total_agreed, 0)) >= coalesce(ea.absorbed_extras, 0)
         and (coalesce(va.total_vendor_cost, 0) - coalesce(va.total_agreed, 0)) >= coalesce(ta.team_cost, 0) then 'Vendor overrun'
    when coalesce(ea.absorbed_extras, 0) >= coalesce(ta.team_cost, 0) and coalesce(ea.absorbed_extras, 0) > 0 then 'Absorbed extras'
    else 'Team hours'
  end as loss_reason
from weddings w
left join client_invoice inv on inv.wedding_id = w.id
left join vendor_agg va on va.wedding_id = w.id
left join extras_agg ea on ea.wedding_id = w.id
left join team_agg ta on ta.wedding_id = w.id;

-- 5. View vendor_scorecard (security_invoker = true)
create or replace view vendor_scorecard with (security_invoker = true) as
with on_time_stats as (
  select
    responsible_vendor_id as vendor_id,
    count(*) as total_events,
    count(*) filter (where arrived_at is not null and arrived_at <= scheduled_time) as on_time_events
  from schedule_items
  where responsible_vendor_id is not null
  group by responsible_vendor_id
),
billing_stats as (
  select
    wv.vendor_id,
    count(distinct wv.wedding_id) as weddings_count,
    avg(
      case
        when coalesce(wv.agreed_amount, 0) > 0 and coalesce(b.billed, 0) > 0 then
          ((b.billed - wv.agreed_amount) / wv.agreed_amount) * 100.0
        else 0
      end
    ) as avg_bill_variance_pct
  from wedding_vendors wv
  left join (
    select wedding_vendor_id, sum(amount) as billed
    from vendor_bills
    group by wedding_vendor_id
  ) b on b.wedding_vendor_id = wv.id
  group by wv.vendor_id
)
select
  v.id as vendor_id,
  v.name as vendor_name,
  v.category,
  v.rating,
  v.city,
  coalesce(bs.weddings_count, 0) as weddings_count,
  case
    when coalesce(ots.total_events, 0) > 0 then
      round((ots.on_time_events::numeric / ots.total_events::numeric) * 100.0, 1)
    else 100.0
  end as on_time_rate,
  round(coalesce(bs.avg_bill_variance_pct, 0)::numeric, 1) as avg_bill_variance_pct,
  v.is_demo
from vendors v
left join on_time_stats ots on ots.vendor_id = v.id
left join billing_stats bs on bs.vendor_id = v.id;

-- 6. View dues_next_30_days (security_invoker = true)
create or replace view dues_next_30_days with (security_invoker = true) as
-- Direction 'in': Client milestone payments due within next 30 days
select
  cp.id::text as id,
  cp.wedding_id,
  (w.title || ' - ' || cp.milestone || ' Milestone') as title,
  coalesce(c.partner_1_name || ' & ' || c.partner_2_name, w.title) as counterparty,
  cp.amount,
  cp.due_date,
  'in'::text as direction
from client_payments cp
join weddings w on w.id = cp.wedding_id
left join couples c on c.id = w.couple_id
where cp.paid_at is null
  and cp.due_date is not null
  and cp.due_date <= (current_date + interval '30 days')

union all

-- Direction 'out': Vendor remaining balances for weddings within next 30 days
select
  vb.wedding_vendor_id::text as id,
  vb.wedding_id,
  (w.title || ' - ' || vb.vendor_name || ' (' || vb.category || ')') as title,
  vb.vendor_name as counterparty,
  vb.remaining as amount,
  w.wedding_date as due_date,
  'out'::text as direction
from vendor_balances vb
join weddings w on w.id = vb.wedding_id
where vb.remaining > 0
  and w.wedding_date is not null
  and w.wedding_date >= (current_date - interval '14 days')
  and w.wedding_date <= (current_date + interval '30 days');

-- 7. Seed time_logs & realistic extra charges for demo weddings
do $$
declare
  r_w record;
  r_m record;
  v_lead_id uuid;
  v_logistics_id uuid;
  v_decor_id uuid;
  v_decor_wv_id uuid;
  v_idx int := 0;
begin
  -- Select team members
  select id into v_lead_id from team_members where role ilike '%Lead%' limit 1;
  select id into v_logistics_id from team_members where role ilike '%Logistics%' limit 1;
  select id into v_decor_id from team_members where role ilike '%Vendor%' limit 1;

  if v_lead_id is null then select id into v_lead_id from team_members limit 1; end if;
  if v_logistics_id is null then v_logistics_id := v_lead_id; end if;
  if v_decor_id is null then v_decor_id := v_lead_id; end if;

  -- Clean existing demo time_logs
  delete from time_logs where is_demo = true;

  -- Loop through each demo wedding and seed realistic hours
  for r_w in select id, title from weddings where is_demo = true loop
    v_idx := v_idx + 1;

    -- Standard hours across planning, coordination, and day-of
    insert into time_logs (wedding_id, member_id, hours, hourly_cost, is_demo)
    values
      (r_w.id, v_lead_id, 45.0, 2500, true),
      (r_w.id, v_logistics_id, 60.0, 1800, true),
      (r_w.id, v_decor_id, 35.0, 1500, true);

    -- For wedding index 3, seed an intensive overtime scenario + absorbed extras to demonstrate loss-maker
    if v_idx = 3 then
      insert into time_logs (wedding_id, member_id, hours, hourly_cost, is_demo)
      values
        (r_w.id, v_logistics_id, 120.0, 2200, true);

      -- Add absorbed non-billable extra charge
      insert into extra_charges (wedding_id, description, qty, unit_price, client_billable, is_demo)
      values
        (r_w.id, 'Emergency Generator & Fuel Overtime (Absorbed by Agency)', 1, 450000, false, true)
      on conflict do nothing;
    end if;
  end loop;

  -- Seed initial demo share token
  insert into share_tokens (token, created_at, expires_at, revoked, is_demo)
  values ('demo-executive-board', now(), now() + interval '7 days', false, true)
  on conflict (token) do nothing;

end $$;
