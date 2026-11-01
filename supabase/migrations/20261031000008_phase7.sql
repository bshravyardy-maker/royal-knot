-- ==============================================================================
-- THE ROYAL KNOT - Phase 7 Migration: Precision Dues (30-day window) & Overdue View
-- ==============================================================================

-- 1. Redefine dues_next_30_days: strictly current_date <= due_date <= current_date + 30 days
create or replace view dues_next_30_days with (security_invoker = true) as
-- Direction 'in': Unpaid client milestones due from today through today + 30 days
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
  and cp.due_date >= current_date
  and cp.due_date <= (current_date + interval '30 days')

union all

-- Direction 'out': Unpaid vendor balances for weddings occurring from today through today + 30 days
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
  and w.wedding_date >= current_date
  and w.wedding_date <= (current_date + interval '30 days');

-- 2. New view: overdue_dues (strictly due_date < current_date and unpaid)
create or replace view overdue_dues with (security_invoker = true) as
-- Direction 'in': Client milestones with due_date in the past that are unpaid
select
  cp.id::text as id,
  cp.wedding_id,
  (w.title || ' - ' || cp.milestone || ' Milestone') as title,
  coalesce(c.partner_1_name || ' & ' || c.partner_2_name, w.title) as counterparty,
  cp.amount,
  cp.due_date,
  'in'::text as direction,
  (current_date - cp.due_date)::int as days_overdue
from client_payments cp
join weddings w on w.id = cp.wedding_id
left join couples c on c.id = w.couple_id
where cp.paid_at is null
  and cp.due_date is not null
  and cp.due_date < current_date

union all

-- Direction 'out': Vendor balances for past weddings (past wedding date) that remain unpaid
select
  vb.wedding_vendor_id::text as id,
  vb.wedding_id,
  (w.title || ' - ' || vb.vendor_name || ' (' || vb.category || ')') as title,
  vb.vendor_name as counterparty,
  vb.remaining as amount,
  w.wedding_date as due_date,
  'out'::text as direction,
  (current_date - w.wedding_date)::int as days_overdue
from vendor_balances vb
join weddings w on w.id = vb.wedding_id
where vb.remaining > 0
  and w.wedding_date is not null
  and w.wedding_date < current_date;
