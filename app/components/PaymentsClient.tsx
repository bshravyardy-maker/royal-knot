"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExtraCharge, addVendorBill, markClientPaymentReceived, payVendor } from "@/actions/payments";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;
type Result = { ok: boolean; error?: string; message?: string };

const inr = (n: number) => {
  const a = Math.abs(n || 0);
  const s = a >= 1e7 ? (a / 1e7).toFixed(2) + " Cr" : a >= 1e5 ? (a / 1e5).toFixed(2) + " L" : a.toLocaleString("en-IN");
  return (n < 0 ? "-" : "") + "₹" + s;
};
const fd = (s?: string) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-");
const wLabel = (w: Row) => w?.couple_names ?? w?.couple_name ?? w?.title ?? w?.name ?? (w?.id ? "Wedding " + String(w.id).slice(0, 6) : "Wedding");

const input = "w-full rounded-lg border border-[#e8e3d8] bg-white px-3 py-2 text-sm";
const btn = "rounded-lg bg-[#151B2B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const gold = "rounded-lg bg-[#C6A46A] px-4 py-2 text-sm font-semibold text-[#151B2B] disabled:opacity-50";
const card = "rounded-2xl border border-[#e8e3d8] bg-white p-5 shadow-sm";
const th = "px-3 py-2 text-left text-xs font-semibold text-[#6b7185]";
const td = "px-3 py-3 border-t border-[#f0ece3] align-middle";

export default function PaymentsClient({ payments, balances, bills, extras, invoices, weddings }: { payments: Row[]; balances: Row[]; bills: Row[]; extras: Row[]; invoices: Row[]; weddings: Row[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"milestones" | "vendors" | "extras" | "invoice">("milestones");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const wById: Record<string, Row> = {};
  weddings.forEach((w) => (wById[w.id] = w));
  const balById: Record<string, Row> = {};
  balances.forEach((b) => (balById[b.wedding_vendor_id] = b));

  function run(fn: () => Promise<Result>, after?: () => void) {
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { t: "ok", m: r.message ?? "Done" } : { t: "err", m: r.error ?? "Failed" });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  /* forms */
  const [billVendor, setBillVendor] = useState("");
  const [billAmt, setBillAmt] = useState("");
  const [billNote, setBillNote] = useState("");

  const [payBill, setPayBill] = useState("");
  const [payAmt, setPayAmt] = useState("");
  const [payKey, setPayKey] = useState("");
  useEffect(() => setPayKey(crypto.randomUUID()), []);

  const [exWed, setExWed] = useState("");
  const [exDesc, setExDesc] = useState("");
  const [exQty, setExQty] = useState("1");
  const [exPrice, setExPrice] = useState("");
  const [exBill, setExBill] = useState(true);

  const openBills = bills
    .map((b) => {
      const bal = balById[b.wedding_vendor_id];
      const billRemaining = Number(b.amount) - Number(b.paid);
      const vendorRemaining = bal ? Number(bal.remaining) : billRemaining;
      return { ...b, vendor: bal?.vendor_name ?? "Vendor", wedding: wLabel(wById[bal?.wedding_id]), maxPay: Math.max(0, Math.min(billRemaining, vendorRemaining)) };
    })
    .filter((b) => b.maxPay > 0);

  const totals = {
    received: payments.filter((p) => p.paid_at).reduce((a, p) => a + Number(p.amount), 0),
    due: payments.filter((p) => !p.paid_at).reduce((a, p) => a + Number(p.amount), 0),
    vendorOwed: balances.reduce((a, b) => a + Math.max(0, Number(b.remaining)), 0),
    overruns: balances.filter((b) => Number(b.variance) > 0).length,
  };

  const tabs: [typeof tab, string][] = [["milestones", "Client milestones"], ["vendors", "Vendor bills and payments"], ["extras", "Extra charges"], ["invoice", "Final invoices"]];

  return (
    <div className="p-4 md:p-8 max-w-[1500px]">
      <h1 className="font-serif text-4xl text-[#151B2B]">Payments and Expenses</h1>
      <p className="mt-1 text-[#6b7185]">Client milestones, vendor bills matched to agreed amounts, extras, and a guard against paying twice.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["Received from clients", inr(totals.received)], ["Client payments due", inr(totals.due)], ["Owed to vendors", inr(totals.vendorOwed)], ["Bills over agreed amount", String(totals.overruns)]].map(([l, v]) => (
          <div key={l} className={card + " border-t-4 border-t-[#C6A46A]"}>
            <p className="text-xs text-[#6b7185]">{l}</p>
            <p className="font-serif text-3xl text-[#151B2B]">{v}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div role="status" className={"mt-4 rounded-xl border p-3 text-sm " + (msg.t === "ok" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800")}>
          {msg.m}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={"rounded-full px-4 py-2 text-sm font-semibold " + (tab === id ? "bg-[#151B2B] text-[#C6A46A]" : "bg-white border border-[#e8e3d8] text-[#151B2B]")}>
            {l}
          </button>
        ))}
      </div>

      {tab === "milestones" && (
        <div className={card + " mt-4 overflow-x-auto"}>
          {payments.length === 0 ? (
            <p className="p-6 text-center text-[#6b7185]">No payment milestones yet. Record a booking deposit to create them.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr><th className={th}>Wedding</th><th className={th}>Milestone</th><th className={th}>Due</th><th className={th}>Amount</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {payments.map((p) => {
                  const overdue = !p.paid_at && p.due_date && new Date(p.due_date) < new Date();
                  return (
                    <tr key={p.id}>
                      <td className={td}>{wLabel(wById[p.wedding_id])}</td>
                      <td className={td}>{p.milestone}</td>
                      <td className={td}>{fd(p.due_date)}</td>
                      <td className={td + " font-semibold"}>{inr(Number(p.amount))}</td>
                      <td className={td}>
                        {p.paid_at ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Received {fd(p.paid_at)}</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {overdue && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Overdue</span>}
                            <button className={btn} disabled={pending} onClick={() => run(() => markClientPaymentReceived(p.id))}>Mark received</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "vendors" && (
        <div className="mt-4 space-y-4">
          <div className={card + " overflow-x-auto"}>
            <h2 className="mb-3 font-serif text-2xl text-[#151B2B]">Reconciliation</h2>
            {balances.length === 0 ? (
              <p className="p-6 text-center text-[#6b7185]">No vendors have been awarded yet. Award a quote first.</p>
            ) : (
              <table className="w-full min-w-[820px] text-sm">
                <thead><tr><th className={th}>Vendor</th><th className={th}>Wedding</th><th className={th}>Agreed</th><th className={th}>Billed</th><th className={th}>Variance</th><th className={th}>Advance</th><th className={th}>Paid</th><th className={th}>Remaining</th></tr></thead>
                <tbody>
                  {balances.map((b) => (
                    <tr key={b.wedding_vendor_id}>
                      <td className={td}><b>{b.vendor_name ?? "Vendor"}</b><div className="text-xs text-[#6b7185]">{b.category}</div></td>
                      <td className={td}>{wLabel(wById[b.wedding_id])}</td>
                      <td className={td}>{inr(Number(b.agreed_amount))}</td>
                      <td className={td}>{Number(b.billed) ? inr(Number(b.billed)) : <span className="text-[#6b7185]">No bill yet</span>}</td>
                      <td className={td + " font-semibold " + (Number(b.variance) > 0 ? "text-red-700" : "text-green-700")}>{Number(b.billed) ? (Number(b.variance) > 0 ? "+" : "") + inr(Number(b.variance)) : "-"}</td>
                      <td className={td}>{inr(Number(b.advance_paid))}</td>
                      <td className={td}>{inr(Number(b.paid))}</td>
                      <td className={td + " font-semibold"}>{inr(Math.max(0, Number(b.remaining)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="mb-3 font-serif text-2xl text-[#151B2B]">Record a vendor bill</h2>
              <div className="space-y-3">
                <select className={input} value={billVendor} onChange={(e) => setBillVendor(e.target.value)} aria-label="Vendor">
                  <option value="">Choose vendor and wedding</option>
                  {balances.map((b) => <option key={b.wedding_vendor_id} value={b.wedding_vendor_id}>{(b.vendor_name ?? "Vendor") + " - " + wLabel(wById[b.wedding_id])}</option>)}
                </select>
                <input className={input} type="number" min="0" placeholder="Bill amount in rupees" value={billAmt} onChange={(e) => setBillAmt(e.target.value)} />
                <input className={input} placeholder="Note (optional)" value={billNote} onChange={(e) => setBillNote(e.target.value)} />
                <button className={gold} disabled={pending} onClick={() => run(() => addVendorBill(billVendor, Number(billAmt), billNote), () => { setBillAmt(""); setBillNote(""); })}>Save bill</button>
              </div>
            </div>

            <div className={card}>
              <h2 className="mb-3 font-serif text-2xl text-[#151B2B]">Pay a vendor</h2>
              {openBills.length === 0 ? (
                <p className="text-sm text-[#6b7185]">No unpaid balances. Record a bill first, or everything is settled.</p>
              ) : (
                <div className="space-y-3">
                  <select className={input} value={payBill} onChange={(e) => { setPayBill(e.target.value); const b = openBills.find((x) => x.id === e.target.value); setPayAmt(b ? String(b.maxPay) : ""); }} aria-label="Bill">
                    <option value="">Choose bill</option>
                    {openBills.map((b) => <option key={b.id} value={b.id}>{b.vendor + " - " + b.wedding + " - can pay up to " + inr(b.maxPay)}</option>)}
                  </select>
                  <input className={input} type="number" min="0" placeholder="Amount in rupees" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
                  <button className={gold} disabled={pending || !payKey} onClick={() => run(() => payVendor(payBill, Number(payAmt), payKey), () => { setPayKey(crypto.randomUUID()); setPayBill(""); setPayAmt(""); })}>Pay vendor</button>
                  <p className="text-xs text-[#6b7185]">Each submission carries a unique reference. A repeated click or retry cannot pay twice, and an amount above the remaining balance is refused.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "extras" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={card + " overflow-x-auto"}>
            <h2 className="mb-3 font-serif text-2xl text-[#151B2B]">Extras added after the agreement</h2>
            {extras.length === 0 ? (
              <p className="p-6 text-center text-[#6b7185]">No extra charges yet.</p>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead><tr><th className={th}>Wedding</th><th className={th}>Item</th><th className={th}>Qty</th><th className={th}>Unit</th><th className={th}>Amount</th><th className={th}>Billed to client</th></tr></thead>
                <tbody>
                  {extras.map((x) => (
                    <tr key={x.id}>
                      <td className={td}>{wLabel(wById[x.wedding_id])}</td>
                      <td className={td}>{x.description}</td>
                      <td className={td}>{Number(x.qty)}</td>
                      <td className={td}>{inr(Number(x.unit_price))}</td>
                      <td className={td + " font-semibold"}>{inr(Number(x.amount))}</td>
                      <td className={td}>{x.client_billable ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className={card}>
            <h2 className="mb-3 font-serif text-2xl text-[#151B2B]">Add an extra</h2>
            <div className="space-y-3">
              <select className={input} value={exWed} onChange={(e) => setExWed(e.target.value)} aria-label="Wedding">
                <option value="">Choose wedding</option>
                {weddings.map((w) => <option key={w.id} value={w.id}>{wLabel(w)}</option>)}
              </select>
              <input className={input} placeholder="e.g. 60 extra plates, 2 extra DJ hours" value={exDesc} onChange={(e) => setExDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className={input} type="number" min="0" placeholder="Quantity" value={exQty} onChange={(e) => setExQty(e.target.value)} />
                <input className={input} type="number" min="0" placeholder="Unit price" value={exPrice} onChange={(e) => setExPrice(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={exBill} onChange={(e) => setExBill(e.target.checked)} /> Bill this to the client</label>
              <button className={gold} disabled={pending} onClick={() => run(() => addExtraCharge(exWed, exDesc, Number(exQty), Number(exPrice), exBill), () => { setExDesc(""); setExPrice(""); setExQty("1"); })}>Add extra</button>
            </div>
          </div>
        </div>
      )}

      {tab === "invoice" && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {invoices.length === 0 ? (
            <div className={card}><p className="text-center text-[#6b7185]">No weddings to invoice yet.</p></div>
          ) : (
            invoices.map((i) => {
              const items = extras.filter((x) => x.wedding_id === i.wedding_id && x.client_billable);
              return (
                <div key={i.wedding_id} className={card}>
                  <h3 className="font-serif text-2xl text-[#151B2B]">{wLabel(wById[i.wedding_id])}</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Contract value</span><b>{inr(Number(i.contract_value))}</b></div>
                    {items.map((x) => <div key={x.id} className="flex justify-between text-[#6b7185]"><span>{x.description}</span><span>{inr(Number(x.amount))}</span></div>)}
                    <div className="flex justify-between border-t border-[#f0ece3] pt-2"><span>Invoice total</span><b>{inr(Number(i.total))}</b></div>
                    <div className="flex justify-between"><span>Received</span><b className="text-green-700">{inr(Number(i.received))}</b></div>
                    <div className="flex justify-between"><span>Outstanding</span><b className={Number(i.outstanding) > 0 ? "text-red-700" : "text-green-700"}>{inr(Number(i.outstanding))}</b></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
