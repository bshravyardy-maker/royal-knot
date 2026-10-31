import { getSupabaseAdmin } from "@/lib/supabase/server";
import { OverviewMetrics, Stage } from "@/lib/types";

export async function fetchOverviewMetrics(): Promise<{
  metrics: OverviewMetrics;
  error?: string;
  isDbConnected: boolean;
}> {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch Weddings
    const { data: weddingsData, error: weddingsError } = await supabase
      .from("weddings")
      .select("*")
      .order("wedding_date", { ascending: true });

    if (weddingsError) throw weddingsError;

    // 2. Fetch Enquiries
    const { data: enquiriesData, error: enquiriesError } = await supabase
      .from("enquiries")
      .select("*");

    if (enquiriesError) throw enquiriesError;

    // 3. Fetch Client Payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("client_payments")
      .select("*");

    if (paymentsError) throw paymentsError;

    // 4. Fetch Vendor Payments and Expenses for Profit Computation
    const { data: vendorPaymentsData, error: vPayError } = await supabase
      .from("vendor_payments")
      .select("amount, status");

    const { data: expensesData, error: expError } = await supabase
      .from("expenses")
      .select("amount");

    const weddings = weddingsData || [];
    const enquiries = enquiriesData || [];
    const payments = paymentsData || [];
    const vendorPayments = vendorPaymentsData || [];
    const expenses = expensesData || [];

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

    // Monthly Revenue Chart Data from client_payments paid_at / due_date
    const monthlyMap: Record<string, number> = {};
    payments
      .filter((p) => p.status === "Paid")
      .forEach((p) => {
        const dateStr = p.paid_at || p.due_date;
        if (dateStr) {
          const d = new Date(dateStr);
          const monthKey = d.toLocaleString("default", { month: "short", year: "numeric" });
          monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + Number(p.amount || 0);
        }
      });

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount,
    }));

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
        monthlyRevenue,
        pipelineStages,
        upcomingWeddings,
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
        monthlyRevenue: [],
        pipelineStages: [],
        upcomingWeddings: [],
      },
    };
  }
}
