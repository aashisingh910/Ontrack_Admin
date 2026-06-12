import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Store,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEligibilityBadge(status: string) {
  switch (status) {
    case "ELIGIBLE":
    case "ELIGIBLE_HIGH_PERFORMANCE":
      return { icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50" };
    case "PARTIAL_ELIGIBLE":
      return { icon: AlertCircle, cls: "text-amber-600 bg-amber-50" };
    default:
      return { icon: XCircle, cls: "text-red-600 bg-red-50" };
  }
}

const API_BASE = "http://localhost:5002/api/aashi";

async function fetchIncentives(): Promise<ApiIncentive[]> {
  const res = await fetch(`${API_BASE}/incentives`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Unknown error");
  return json.data;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function Incentives() {
  const [incentives, setIncentives] = useState<ApiIncentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which store sections are expanded
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  // Track which staff row is being edited (by _id)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    fetchIncentives()
      .then((data) => {
        setIncentives(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load incentives");
      })
      .finally(() => setLoading(false));
  }, []);

  // Group incentives by store
  const storeWiseData = useMemo(() => {
    const map = new Map<string, { name: string; city: string; totalPayable: number; staff: ApiIncentive[] }>();

    incentives.forEach((inc) => {
      const key = inc.store.storeCode;
      const existing = map.get(key);
      if (existing) {
        existing.totalPayable += inc.calculation.payableIncentive;
        existing.staff.push(inc);
      } else {
        map.set(key, {
          name: inc.store.storeName,
          city: inc.store.city,
          totalPayable: inc.calculation.payableIncentive,
          staff: [inc],
        });
      }
    });

    return Array.from(map.entries())
      .map(([code, data]) => ({ storeCode: code, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [incentives]);

  const toggleStore = (storeCode: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      if (next.has(storeCode)) next.delete(storeCode);
      else next.add(storeCode);
      return next;
    });
  };

  // Edit handlers
  const startEdit = (inc: ApiIncentive) => {
    setEditingId(inc._id);
    setEditValue(String(inc.calculation.payableIncentive));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (inc: ApiIncentive) => {
    const newVal = Number(editValue);
    if (isNaN(newVal) || newVal < 0) {
      toast.error("Invalid amount");
      return;
    }

    setIncentives((prev) =>
      prev.map((item) =>
        item._id === inc._id
          ? {
              ...item,
              calculation: {
                ...item.calculation,
                payableIncentive: newVal,
              },
            }
          : item
      )
    );
    setEditingId(null);
    toast.success("Incentive updated locally");
    // TODO: call API to persist
  };

  // Approve / Reject handler
  const toggleApproval = (inc: ApiIncentive, newStatus: string) => {
    setIncentives((prev) =>
      prev.map((item) =>
        item._id === inc._id
          ? { ...item, approval: { ...item.approval, status: newStatus } }
          : item
      )
    );
    toast.success(`Status changed to ${newStatus.replace(/_/g, " ")}`);
    // TODO: call API to persist
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6 text-center text-red-700">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Store‑wise Incentives</h1>
        <p className="text-sm text-muted-foreground">
          Click a store to expand. Edit payable amounts or approve/reject individual entries.
        </p>
      </div>

      {storeWiseData.map((store) => {
        const isExpanded = expandedStores.has(store.storeCode);

        return (
          <Card key={store.storeCode} className="overflow-hidden">
            {/* Collapsible header */}
            <button
              onClick={() => toggleStore(store.storeCode)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
            >
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Store className="h-4 w-4 text-brand" />
                  {store.name}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {store.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {store.staff.length} staff
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total Payable
                  </div>
                  <div className="text-xl font-display font-bold text-brown">
                    {fmtINR(store.totalPayable)}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground bg-muted/20">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Employee</th>
                        <th className="text-right px-4 py-2 font-medium">Achieved</th>
                        <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">%</th>
                        <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">Att.</th>
                        <th className="text-center px-4 py-2 font-medium hidden xs:table-cell">Status</th>
                        <th className="text-right px-4 py-2 font-medium">Payable</th>
                        <th className="text-center px-4 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {store.staff.map((inc) => {
                        const eligibility = inc.performanceInputs.targetEligibilityStatus;
                        const badge = getEligibilityBadge(eligibility);
                        const Icon = badge.icon;
                        const isEditing = editingId === inc._id;

                        return (
                          <tr key={inc._id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="font-medium">{inc.employee.employeeName}</div>
                              <div className="text-xs text-muted-foreground">
                                {inc.employee.designation}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium">
                              {fmtINR(inc.targetReference.achievedSales)}
                            </td>
                            <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                              {inc.targetReference.achievementPercent}%
                            </td>
                            <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                              {inc.performanceInputs.attendancePercent}%
                            </td>
                            <td className="px-4 py-2.5 text-center hidden xs:table-cell">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}
                              >
                                <Icon className="h-3 w-3" />
                                {eligibility.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-brand">
                              {isEditing ? (
                                <div className="flex items-center gap-1 justify-end">
                                  <Input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-24 h-7 text-xs"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => saveEdit(inc)}
                                  >
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-3.5 w-3.5 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 justify-end">
                                  <span>{fmtINR(inc.calculation.payableIncentive)}</span>
                                  {inc.calculation.deductionAmount !== 0 && (
                                    <div className="text-[11px] text-muted-foreground">
                                      {inc.calculation.deductionAmount > 0
                                        ? `(-${fmtINR(inc.calculation.deductionAmount)})`
                                        : `(+${fmtINR(Math.abs(inc.calculation.deductionAmount))})`}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Edit button */}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => startEdit(inc)}
                                  disabled={isEditing}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {/* Approval buttons */}
                                {inc.approval.status === "APPROVED" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => toggleApproval(inc, "PENDING_MANAGER_REVIEW")}
                                  >
                                    Reject
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => toggleApproval(inc, "APPROVED")}
                                  >
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}