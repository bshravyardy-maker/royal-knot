import { getSupabaseAdmin } from "@/lib/supabase/server";
import { OverviewMetrics, Stage } from "@/lib/types";

export async function fetchOverviewMetrics(): Promise<{
  metrics: OverviewMetrics;
  error?: string;
  isDbConnected: boolean;
}> {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch all overview datasets concurrently
    const [
      weddingsRes,
      enquiriesRes,
      paymentsRes,
      vendorPaymentsRes,
      expensesRes,
      quoteRequestsRes,
    ] = await Promise.all([
      supabase.from("weddings").select("*").order("wedding_date", { ascending: true }),
      supabase.from("enquiries").select("*"),
      supabase.from("client_payments").select("*"),
      supabase.from("vendor_payments").select("amount, status"),
      supabase.from("expenses").select("amount"),
      (supabase.from("quote_requests") as any).select("id, status").eq("status", "Open"),
    ]);

    if (weddingsRes.error) throw weddingsRes.error;
    if (enquiriesRes.error) throw enquiriesRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const weddings = (weddingsRes.data || []) as any[];
    const enquiries = (enquiriesRes.data || []) as any[];
    const payments = (paymentsRes.data || []) as any[];
    const vendorPayments = (vendorPaymentsRes.data || []) as any[];
    const expenses = (expensesRes.data || []) as any[];
    const openQuoteRequestsCount = ((quoteRequestsRes.data || []) as any[]).length;

    // KPI 1: Active Weddings (Planning, Confirmed, In Progress)
    const activeWeddingsCount = weddings.filter((w) =>
      ["Planning", "Confirmed", "In Progress"].includes(w.status)
    ).length;

    // KPI 2: New Enquiries (stage == 'New')
    const newEnquiriesCount = enquiries.filter((e) => e.stage === "New").length;

    // KPI 3: Confirmed Bookings (status == 'Confirmed' or 'In Progress')
    const confirmedBookingsCount = weddings.filter((w) =>
      ["Confirmed", "In Progress"].includes(w.status)
    ).length;

    // KPI 4: Total Revenue (Client payments marked 'Paid')
    const totalRevenue = payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // KPI 5: Outstanding Payments (Client payments marked 'Pending' or 'Overdue')
    const outstandingPayments = payments
      .filter((p) => ["Pending", "Overdue"].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // KPI 6: Estimated Profit = Total Paid Revenue - (Paid Vendor Payments + Expenses)
    const totalVendorCostPaid = vendorPayments
      .filter((vp) => vp.status === "Completed")
      .reduce((sum, vp) => sum + Number(vp.amount || 0), 0);

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount || 0),
      0
    );

    const estimatedProfit = Math.max(0, totalRevenue - (totalVendorCostPaid + totalExpenses));

    // Pipeline Breakdown
    const stages: Stage[] = ["New", "Contacted", "Meeting", "Proposal", "Won", "Lost"];
    const pipelineStages = stages.map((stage) => {
      const stageEnquiries = enquiries.filter((e) => e.stage === stage);
      const totalBudget = stageEnquiries.reduce(
        (sum, e) => sum + Number(e.budget || 0),
        0
      );
      return {
        stage,
        count: stageEnquiries.length,
        value: totalBudget,
      };
    });

    // Monthly Revenue Chart Data strictly grouped by client_payments.paid_at
    const monthlyMap: Record<string, number> = {};
    payments
      .filter((p) => p.paid_at)
      .forEach((p) => {
        const d = new Date(p.paid_at);
        const monthKey = d.toLocaleString("default", { month: "short", year: "numeric" });
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + Number(p.amount || 0);
      });

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount,
    }));

    // Real Recent Events (Enquiries created, payments received)
    const recentEvents: any[] = [];

    enquiries.slice(0, 4).forEach((e) => {
      recentEvents.push({
        id: `enq-${e.id}`,
        type: "enquiry" as const,
        title: `Enquiry Intake: ${e.couple_name}`,
        description: `${e.package} • ${e.city}`,
        amount: Number(e.budget || 0),
        timestamp: e.created_at,
      });
    });

    payments
      .filter((p) => p.paid_at)
      .slice(0, 4)
      .forEach((p) => {
        recentEvents.push({
          id: `pay-${p.id}`,
          type: "payment" as const,
          title: `Milestone Received: ${p.milestone}`,
          description: `Verified by treasury`,
          amount: Number(p.amount || 0),
          timestamp: p.paid_at,
        });
      });

    recentEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topRecentEvents = recentEvents.slice(0, 5);

    // Upcoming Weddings (Next 6)
    const upcomingWeddings = weddings.slice(0, 6);

    return {
      isDbConnected: true,
      metrics: {
        activeWeddingsCount,
        newEnquiriesCount,
        confirmedBookingsCount,
        totalRevenue,
        outstandingPayments,
        estimatedProfit,
        openQuoteRequestsCount,
        monthlyRevenue,
        pipelineStages,
        upcomingWeddings,
        recentEvents: topRecentEvents,
      },
    };
  } catch (err: any) {
    console.error("fetchOverviewMetrics error:", err);
    return {
      isDbConnected: false,
      error: err.message || "Could not query Supabase tables.",
      metrics: {
        activeWeddingsCount: 0,
        newEnquiriesCount: 0,
        confirmedBookingsCount: 0,
        totalRevenue: 0,
        outstandingPayments: 0,
        estimatedProfit: 0,
        openQuoteRequestsCount: 0,
        monthlyRevenue: [],
        pipelineStages: [],
        upcomingWeddings: [],
      },
    };
  }
}
