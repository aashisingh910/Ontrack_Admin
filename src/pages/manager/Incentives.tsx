import { useEffect, useState, useMemo } from "react";
import { getSession } from "@/lib/session";
import { managerApi } from "@/services/managerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Loader2, CheckCircle, AlertCircle, XCircle, Send } from "lucide-react";
import { toast } from "sonner";

// ─── types ───────────────────────────────────────────────────────────────────

interface ApiIncentive {
  _id: string;
  incentiveId: string;
  incentiveMonth: string;
  employee: {
    employeeCode: string;
    employeeName: string;
    designation: string;
  };
  store: {
    storeCode: string;
    storeName: string;
    city: string;
  };
  targetReference: {
    achievedSales: number;
    achievementPercent: number;
  };
  performanceInputs: {
    attendancePercent: number;
    targetEligibilityStatus: string;
  };
  calculation: {
    payableIncentive: number;
    deductionAmount: number;
  };
  approval: {
    status: string;
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function eligibilityBadge(status: string) {
  switch (status) {
    case "ELIGIBLE":
    case "ELIGIBLE_HIGH_PERFORMANCE":
      return {
        icon: CheckCircle,
        cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
        label: "Eligible",
      };
    case "PARTIAL_ELIGIBLE":
      return {
        icon: AlertCircle,
        cls: "bg-amber-500/10 text-amber-700 border-amber-500/30",
        label: "Partial",
      };
    default:
      return {
        icon: XCircle,
        cls: "bg-red-500/10 text-red-700 border-red-500/30",
        label: "Not eligible",
      };
  }
}

function approvalBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return { cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30", label: "Approved" };
    case "REJECTED":
      return { cls: "bg-red-500/10 text-red-700 border-red-500/30", label: "Rejected" };
    case "SENT_TO_ADMIN":
      return { cls: "bg-blue-500/10 text-blue-700 border-blue-500/30", label: "Sent to Admin" };
    default:
      return { cls: "bg-amber-500/10 text-amber-700 border-amber-500/30", label: "Pending" };
  }
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ManagerIncentives() {
  const session = getSession();
  const [incentives, setIncentives] = useState<ApiIncentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // track in-flight action per incentive id
  const [acting, setActing] = useState<Record<string, string>>({});

  const fetchIncentives = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login token missing.");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "/api/aashi"}/incentives`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to load incentives");
      setIncentives(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncentives();
  }, []);

  const runAction = async (
    id: string,
    action: "approve" | "reject" | "send",
    label: string,
    fn: () => Promise<unknown>
  ) => {
    setActing((prev) => ({ ...prev, [id]: action }));
    try {
      await fn();
      toast.success(label);
      await fetchIncentives();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setActing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const ranked = useMemo(
    () =>
      [...incentives].sort(
        (a, b) => b.calculation.payableIncentive - a.calculation.payableIncentive
      ),
    [incentives]
  );

  const totalPayable = useMemo(
    () => incentives.reduce((sum, i) => sum + i.calculation.payableIncentive, 0),
    [incentives]
  );

  const pendingCount = useMemo(
    () =>
      incentives.filter(
        (i) => i.approval.status !== "APPROVED" && i.approval.status !== "SENT_TO_ADMIN"
      ).length,
    [incentives]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-red-600 mb-2">{error}</div>
          <button
            onClick={fetchIncentives}
            className="rounded-md border px-3 py-1.5 text-xs"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Incentives</h1>
        <p className="text-sm text-muted-foreground">
          {session?.storeName || "My store"} team — review and approve incentives.
        </p>
      </div>

      {/* Summary banner */}
      <Card className="overflow-hidden">
        <div
          className="h-2"
          style={{ background: "linear-gradient(90deg, var(--brand), var(--golden))" }}
        />
        <CardContent className="p-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Total incentive pool
            </div>
            <div className="text-3xl font-display font-bold text-[color:var(--brown)]">
              {fmtINR(totalPayable)}
            </div>
            <div className="text-xs text-muted-foreground">
              {incentives.length} staff · {pendingCount} pending review
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4 text-[color:var(--golden)]" />
            Based on achieved sales.
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" /> Store incentive leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!ranked.length ? (
            <div className="p-6 text-sm text-center text-muted-foreground">
              No incentive data for your store yet.
            </div>
          ) : (
            <div className="divide-y">
              {ranked.map((inc, idx) => {
                const eb = eligibilityBadge(inc.performanceInputs.targetEligibilityStatus);
                const EbIcon = eb.icon;
                const ab = approvalBadge(inc.approval.status);
                const status = inc.approval.status;
                const inFlight = acting[inc._id];
                const isSettled =
                  status === "APPROVED" ||
                  status === "REJECTED" ||
                  status === "SENT_TO_ADMIN";

                return (
                  <div key={inc._id} className="px-5 py-4 flex flex-wrap items-start gap-4">
                    <div className="text-sm font-mono text-muted-foreground w-6 pt-0.5">
                      #{idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{inc.employee.employeeName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {inc.employee.employeeCode} · {inc.employee.designation}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span>Achieved: {fmtINR(inc.targetReference.achievedSales)}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>Attendance: {inc.performanceInputs.attendancePercent}%</span>
                        <Badge variant="outline" className={`text-[10px] ${eb.cls}`}>
                          <EbIcon className="h-3 w-3 mr-1" />
                          {eb.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="font-display font-bold text-brand text-lg leading-none">
                        {fmtINR(inc.calculation.payableIncentive)}
                      </div>

                      {isSettled ? (
                        <Badge variant="outline" className={`text-[10px] ${ab.cls}`}>
                          {ab.label}
                        </Badge>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          <button
                            disabled={!!inFlight}
                            onClick={() =>
                              runAction(inc._id, "approve", "Incentive approved", () =>
                                managerApi.approveIncentive(inc._id, "Approved by manager")
                              )
                            }
                            className="rounded border border-emerald-500/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-50"
                          >
                            {inFlight === "approve" ? "…" : "Approve"}
                          </button>

                          <button
                            disabled={!!inFlight}
                            onClick={() =>
                              runAction(inc._id, "reject", "Incentive rejected", () =>
                                managerApi.rejectIncentive(inc._id, "Rejected by manager")
                              )
                            }
                            className="rounded border border-red-500/40 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50"
                          >
                            {inFlight === "reject" ? "…" : "Reject"}
                          </button>

                          <button
                            disabled={!!inFlight}
                            onClick={() =>
                              runAction(
                                inc._id,
                                "send",
                                "Sent to admin for approval",
                                () =>
                                  managerApi.sendIncentiveToAdmin(
                                    inc._id,
                                    "Forwarded by manager"
                                  )
                              )
                            }
                            className="flex items-center gap-1 rounded border border-blue-500/40 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors disabled:opacity-50"
                          >
                            <Send className="h-2.5 w-2.5" />
                            {inFlight === "send" ? "…" : "Send to Admin"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
