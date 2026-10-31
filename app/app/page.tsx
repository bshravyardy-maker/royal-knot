import React from "react";
import {
  Crown,
  Inbox,
  CheckCircle,
  Coins,
  AlertCircle,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Database,
  Building,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { fetchOverviewMetrics } from "@/lib/overview";
import { DemoBadge } from "@/components/DemoBadge";

// Helper to format currency in Indian style (Lakhs & Crores)
function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export const revalidate = 0; // Dynamic server rendering on every request

export default async function OverviewPage() {
  const { metrics, isDbConnected, error } = await fetchOverviewMetrics();

  const kpis = [
    {
      label: "Active Weddings",
      value: metrics.activeWeddingsCount,
      subtext: "In planning or ongoing",
      icon: Crown,
      color: "from-amber-500/20 to-gold/20 text-gold-dark",
    },
    {
      label: "New Enquiries",
      value: metrics.newEnquiriesCount,
      subtext: "Awaiting initial consultation",
      icon: Inbox,
      color: "from-blue-500/20 to-indigo-500/20 text-indigo-700",
    },
    {
      label: "Confirmed Bookings",
      value: metrics.confirmedBookingsCount,
      subtext: "Signed royal contracts",
      icon: CheckCircle,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-700",
    },
    {
      label: "Total Revenue",
      value: formatINR(metrics.totalRevenue),
      subtext: "Client payments received",
      icon: Coins,
      color: "from-gold/20 to-amber-600/20 text-[#A58348]",
    },
    {
      label: "Outstanding Payments",
      value: formatINR(metrics.outstandingPayments),
      subtext: "Pending & advance dues",
      icon: AlertCircle,
      color: "from-rose-500/20 to-pink-500/20 text-rose-700",
    },
    {
      label: "Estimated Profit",
      value: formatINR(metrics.estimatedProfit),
      subtext: "Net after vendor bills & costs",
      icon: TrendingUp,
      color: "from-emerald-600/20 to-teal-600/20 text-teal-800",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner / Agency Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C6A46A]/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Royal Knot Concierge • Season 2026/27</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy">
            Palatial Operations Overview
          </h1>
          <p className="text-sm text-navy/70 mt-1">
            Real-time management for destination weddings across Jaipur & Udaipur palaces.
          </p>
        </div>

        {/* Status Indicators & Open Quote Requests */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/vendor-quotes"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gold/15 text-gold-dark border border-gold/30 text-xs font-semibold hover:bg-gold/25 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
            <span>{metrics.openQuoteRequestsCount} Open Quote Requests (RFPs)</span>
          </Link>

          {isDbConnected ? (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Connected</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Backend Disconnected: Check .env.local</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
          <p className="font-semibold mb-1">Database Notice:</p>
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="royal-card p-5 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-navy/60">
                    {kpi.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-navy mt-1">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-navy/60 mt-1 font-sans">{kpi.subtext}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Monthly Revenue Chart + Booking Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-7 royal-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-navy">
                Monthly Revenue Performance
              </h3>
              <p className="text-xs text-navy/60">
                Aggregated from verified milestone client payments
              </p>
            </div>
            <span className="text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
              Live Computed
            </span>
          </div>

          {metrics.monthlyRevenue.length === 0 ? (
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl">
              <Coins className="w-8 h-8 text-gold/60 mb-2" />
              <p className="text-sm font-medium text-navy/80">No settled payments yet</p>
              <p className="text-xs text-navy/60 max-w-sm mt-1">
                Run the database seed script (<code className="text-gold font-mono">npm run seed</code>) to populate verified payments.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end min-h-[220px] pt-4">
              <div className="flex items-end justify-between gap-3 h-48 border-b border-gray-200 pb-2">
                {(() => {
                  const maxAmount = Math.max(...metrics.monthlyRevenue.map((r) => r.amount), 1);
                  return metrics.monthlyRevenue.map((item) => {
                    const heightPercent = Math.max(12, Math.round((item.amount / maxAmount) * 100));
                    return (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center justify-end group h-full"
                      >
                        <span className="text-[10px] font-semibold text-navy/80 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatINR(item.amount)}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[#B89354] to-[#DFC698] shadow-sm group-hover:from-gold group-hover:to-gold-light transition-all"
                        />
                        <span className="text-[11px] font-medium text-navy/70 mt-2 truncate max-w-[64px]">
                          {item.month}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Booking Pipeline */}
        <div className="lg:col-span-5 royal-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-navy">
                Enquiry Booking Pipeline
              </h3>
              <p className="text-xs text-navy/60">
                Conversion funnels across royal packages
              </p>
            </div>
            <Link
              href="/enquiries"
              className="text-xs font-semibold text-gold hover:underline flex items-center"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3.5 flex-1 justify-center flex flex-col">
            {metrics.pipelineStages.map((stageItem) => {
              const maxCount = Math.max(...metrics.pipelineStages.map((s) => s.count), 1);
              const progressPct = Math.round((stageItem.count / maxCount) * 100);

              const stageColors: Record<string, string> = {
                New: "bg-blue-500",
                Contacted: "bg-amber-500",
                Meeting: "bg-purple-500",
                Proposal: "bg-indigo-500",
                Won: "bg-emerald-600",
                Lost: "bg-gray-400",
              };

              return (
                <div key={stageItem.stage}>
                  <div className="flex items-center justify-between text-xs font-medium text-navy mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${stageColors[stageItem.stage] || "bg-gold"}`} />
                      <span>{stageItem.stage}</span>
                    </span>
                    <span className="text-navy/70 font-sans">
                      {stageItem.count} enquiries ({formatINR(stageItem.value)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        stageItem.stage === "Won"
                          ? "bg-emerald-600"
                          : stageItem.stage === "Lost"
                          ? "bg-gray-300"
                          : "bg-[#C6A46A]"
                      }`}
                      style={{ width: `${stageItem.count > 0 ? progressPct : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Weddings List */}
      <div className="royal-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-navy">
              Upcoming Destination Weddings
            </h3>
            <p className="text-xs text-navy/60">
              Palatial celebrations scheduled across Rajasthan
            </p>
          </div>
          <Link
            href="/weddings"
            className="btn-gold text-xs py-2 px-4 inline-flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>All Weddings ({metrics.upcomingWeddings.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {metrics.upcomingWeddings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
            <Crown className="w-10 h-10 text-gold/60 mx-auto mb-3" />
            <p className="text-base font-medium text-navy">No Weddings Scheduled Yet</p>
            <p className="text-xs text-navy/60 max-w-md mx-auto mt-1 mb-4">
              Seed demo data or confirm incoming enquiries to populate the upcoming schedule.
            </p>
            <Link href="/enquiries" className="btn-gold text-xs py-2 px-4 inline-flex">
              Check Enquiries
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C6A46A]/20 text-[11px] font-semibold uppercase tracking-wider text-navy/60">
                  <th className="pb-3 pl-2">Wedding & Couple</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Venue & City</th>
                  <th className="pb-3 text-center">Guests</th>
                  <th className="pb-3 text-right">Budget</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Data Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium">
                {metrics.upcomingWeddings.map((wedding) => (
                  <tr key={wedding.id} className="hover:bg-ivory/60 transition-colors">
                    <td className="py-3.5 pl-2 font-serif text-sm font-semibold text-navy">
                      <Link
                        href={`/weddings/${wedding.id}`}
                        className="flex items-center space-x-2 hover:text-gold-dark transition-colors"
                      >
                        <Building className="w-4 h-4 text-gold flex-shrink-0" />
                        <span className="truncate max-w-xs">{wedding.title}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 text-navy/80 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(wedding.wedding_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-navy/80">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{wedding.venue}</span>
                        <span className="text-[10px] text-gray-500 font-sans">({wedding.city})</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center text-navy/80">
                      <div className="inline-flex items-center space-x-1 bg-gray-100 px-2 py-0.5 rounded-full text-[11px]">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span>{wedding.guest_count}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-semibold text-navy whitespace-nowrap">
                      {formatINR(wedding.total_budget)}
                    </td>
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          wedding.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : wedding.status === "Planning"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {wedding.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-center whitespace-nowrap">
                      {wedding.is_demo ? (
                        <DemoBadge />
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Live Client
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
