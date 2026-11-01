-- Phase 5: money and reconciliation
-- vendor_bills and vendor_payments were never used by earlier phases, so they are rebuilt here with known columns.

drop table if exists vendor_payments cascade;
drop table if exists vendor_bills cascade;

create table vendor_bills (
  id uuid primary key default gen_random_uuid(),
  wedding_vendor_id uuid not null references wedding_vendors(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  billed_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_bill_id uuid not null references vendor_bills(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  idempotency_key text not null unique,
  paid_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists extra_charges (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  wedding_vendor_id uuid references wedding_vendors(id) on delete set null,
  description text not null,
  qty numeric(12,2) not null check (qty > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  amount numeric(14,2) generated always as (qty * unit_price) stored,
  client_billable boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row level security: anon can read, only the service role writes
do $$
declare t text;
begin
  foreach t in array array['vendor_bills','vendor_payments','extra_charges'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon read" on %I', t);
    execute format('create policy "anon read" on %I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "service all" on %I', t);
    execute format('create policy "service all" on %I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;

-- Per-bill status
create or replace view vendor_bill_status with (security_invoker = true) as
select b.id, b.wedding_vendor_id, b.amount, b.note, b.billed_at, b.is_demo,
       coalesce((select sum(p.amount) from vendor_payments p where p.vendor_bill_id = b.id), 0) as paid
from vendor_bills b;

-- Per-vendor reconciliation: agreed vs billed, advance, paid, remaining
create or replace view vendor_balances with (security_invoker = true) as
select wv.id as wedding_vendor_id, wv.wedding_id, wv.vendor_id, v.name as vendor_name, wv.category,
       coalesce(wv.agreed_amount, 0) as agreed_amount,
       coalesce(wv.advance_paid, 0) as advance_paid,
       coalesce(b.billed, 0) as billed,
       coalesce(p.paid, 0) as paid,
       coalesce(b.billed, 0) - coalesce(wv.agreed_amount, 0) as variance,
       coalesce(b.billed, 0) - coalesce(wv.advance_paid, 0) - coalesce(p.paid, 0) as remaining
from wedding_vendors wv
left join vendors v on v.id = wv.vendor_id
left join (select wedding_vendor_id, sum(amount) as billed from vendor_bills group by wedding_vendor_id) b
       on b.wedding_vendor_id = wv.id
left join (select b2.wedding_vendor_id, sum(p2.amount) as paid
           from vendor_payments p2 join vendor_bills b2 on b2.id = p2.vendor_bill_id
           group by b2.wedding_vendor_id) p
       on p.wedding_vendor_id = wv.id;

-- Client invoice: contract + billable extras, minus what has been received
create or replace view client_invoice with (security_invoker = true) as
select w.id as wedding_id,
       coalesce(w.contract_value, 0) as contract_value,
       coalesce(e.extras, 0) as extras,
       coalesce(w.contract_value, 0) + coalesce(e.extras, 0) as total,
       coalesce(c.received, 0) as received,
       coalesce(w.contract_value, 0) + coalesce(e.extras, 0) - coalesce(c.received, 0) as outstanding
from weddings w
left join (select wedding_id, sum(amount) as extras from extra_charges where client_billable group by wedding_id) e
       on e.wedding_id = w.id
left join (select wedding_id, sum(amount) as received from client_payments where paid_at is not null group by wedding_id) c
       on c.wedding_id = w.id;

-- The payment guard: one transaction, idempotent, never overpays
create or replace function pay_vendor(p_bill_id uuid, p_amount numeric, p_key text)
returns jsonb
language plpgsql
as $$
declare
  v_bill vendor_bills%rowtype;
  v_existing vendor_payments%rowtype;
  v_bill_paid numeric;
  v_vendor_remaining numeric;
  v_bill_remaining numeric;
  v_remaining numeric;
  v_id uuid;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'A payment reference is required';
  end if;

  select * into v_existing from vendor_payments where idempotency_key = p_key;
  if found then
    return jsonb_build_object('status', 'duplicate', 'payment_id', v_existing.id);
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select * into v_bill from vendor_bills where id = p_bill_id for update;
  if not found then
    raise exception 'Bill not found';
  end if;

  select coalesce(sum(amount), 0) into v_bill_paid from vendor_payments where vendor_bill_id = p_bill_id;
  v_bill_remaining := v_bill.amount - v_bill_paid;

  select remaining into v_vendor_remaining from vendor_balances where wedding_vendor_id = v_bill.wedding_vendor_id;
  v_remaining := least(v_bill_remaining, coalesce(v_vendor_remaining, v_bill_remaining));

  if p_amount > v_remaining then
    raise exception 'Payment blocked: remaining balance is Rs %, you tried to pay Rs %', v_remaining, p_amount;
  end if;

  begin
    insert into vendor_payments (vendor_bill_id, amount, idempotency_key)
    values (p_bill_id, p_amount, p_key)
    returning id into v_id;
  exception when unique_violation then
    select * into v_existing from vendor_payments where idempotency_key = p_key;
    return jsonb_build_object('status', 'duplicate', 'payment_id', v_existing.id);
  end;

  return jsonb_build_object('status', 'paid', 'payment_id', v_id);
end;
$$;

-- Demo data: bills on the first awarded vendors (one with an overrun), plus the 60 surprise guests
do $$
declare r record; i int := 0;
begin
  for r in select id, agreed_amount from wedding_vendors
           where coalesce(agreed_amount, 0) > 0 order by created_at limit 4 loop
    i := i + 1;
    insert into vendor_bills (wedding_vendor_id, amount, note, is_demo)
    values (r.id,
            round(r.agreed_amount * case i when 2 then 1.08 else 1 end, 2),
            case i when 2 then 'Includes overtime and extra staff' else 'As agreed' end,
            true);
  end loop;

  insert into extra_charges (wedding_id, description, qty, unit_price, client_billable, is_demo)
  select id, '60 unexpected guests at the banquet (extra plates)', 60, 1850, true, true
  from weddings order by created_at limit 1;
end $$;

notify pgrst, 'reload schema';
