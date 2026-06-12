import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "@/lib/session";
import { managerApi } from "@/services/managerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Award,
  CalendarCheck,
  BookOpen,
  Loader2,
  Target,
} from "lucide-react";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const fmtINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const avatarColors = [
  "#8B5E34",
  "#C56A2D",
  "#34568B",
  "#6B7280",
  "#9A3412",
  "#166534",
  "#7C3AED",
];

const avatarColor = (i: number) => avatarColors[i % avatarColors.length];

// ─── types ───────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  contactNumber?: string;
  designation?: string;
  department?: string;
  storeCode: string;
  storeName: string;
  managerName?: string;
  weeklyOff?: string;
  monthlyTarget: number;
  achieved: number;
  attendanceRate: number;
  coursesCompleted: number;
  payableIncentive: number;
  incentiveStatus?: string;
  badges: string[];
};

type ManagerStaffResponse = {
  store: {
    storeCode: string;
    storeName: string;
    city?: string;
    region?: string;
  };
  count: number;
  staff: StaffMember[];
};

// ─── assign target modal ─────────────────────────────────────────────────────

type AssignTargetModalProps = {
  member: StaffMember;
  onClose: () => void;
};

function AssignTargetModal({ member, onClose }: AssignTargetModalProps) {
  const [targetMonth, setTargetMonth] = useState("2026-07");
  const [assignedTarget, setAssignedTarget] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(assignedTarget);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid target amount");
      return;
    }
    setSaving(true);
    try {
      await managerApi.assignStaffTarget({
        employeeCode: member.employeeCode,
        targetMonth,
        assignedTarget: amount,
        remarks: remarks || undefined,
      });
      toast.success(`Target assigned to ${member.name}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign target");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display font-bold text-lg mb-1">Assign Target</h2>
        <p className="text-xs text-muted-foreground mb-5">
          {member.name} · {member.employeeCode}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Month</label>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Target amount (₹)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 450000"
              value={assignedTarget}
              onChange={(e) => setAssignedTarget(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Remarks (optional)</label>
            <input
              type="text"
              placeholder="e.g. Festive season push"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ManagerStaff() {
  const session = getSession();
  const navigate = useNavigate();

  const [data, setData] = useState<ManagerStaffResponse | null>(null);
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignTarget, setAssignTarget] = useState<StaffMember | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await managerApi.staff();
      setData(result);
      setTeam(result.staff || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

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
        <CardContent className="p-8 text-center">
          <div className="font-medium text-red-600">{error}</div>
          <button
            onClick={loadStaff}
            className="mt-3 rounded-md border px-3 py-2 text-sm"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const store = data?.store || {
    storeCode: session?.storeCode || "",
    storeName: session?.storeName || "My Store",
    city: session?.city || "",
    region: session?.region || "",
  };

  const avgAttendance =
    team.length > 0
      ? Math.round(
          team.reduce((a, s) => a + (s.attendanceRate || 0), 0) / team.length
        )
      : 0;

  const totalCourses = team.reduce((a, s) => a + Number(s.coursesCompleted || 0), 0);
  const totalIncentive = team.reduce((a, s) => a + Number(s.payableIncentive || 0), 0);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      {assignTarget && (
        <AssignTargetModal
          member={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">My Team</h1>
          <p className="text-sm text-muted-foreground">
            {store.storeName} · #{store.storeCode} · {store.city} ·{" "}
            {team.length} staff members
          </p>
        </div>

        {!team.length && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No staff assigned to your store yet.
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {team.map((s, index) => {
            const monthlyTarget = Number(s.monthlyTarget || 0);
            const achieved = Number(s.achieved || 0);
            const pct =
              monthlyTarget > 0
                ? Math.min(100, Math.round((achieved / monthlyTarget) * 100))
                : 0;

            return (
              <Card
                key={s.employeeCode}
                className="hover:border-brand/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/manager/staff/${s.employeeCode}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                      style={{ background: avatarColor(index) }}
                    >
                      {initials(s.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {s.email}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.employeeCode} · {s.designation || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Monthly target</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 [&>div]:bg-brand" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{fmtINR(achieved)}</span>
                      <span>of {fmtINR(monthlyTarget)}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-md bg-secondary p-1.5">
                      <CalendarCheck className="mx-auto h-3 w-3 text-muted-foreground" />
                      <div className="font-semibold">{s.attendanceRate || 0}%</div>
                      <div className="text-muted-foreground">Attendance</div>
                    </div>
                    <div className="rounded-md bg-secondary p-1.5">
                      <BookOpen className="mx-auto h-3 w-3 text-muted-foreground" />
                      <div className="font-semibold">{s.coursesCompleted || 0}</div>
                      <div className="text-muted-foreground">Courses</div>
                    </div>
                    <div className="rounded-md bg-secondary p-1.5">
                      <Award className="mx-auto h-3 w-3 text-muted-foreground" />
                      <div className="font-semibold">{fmtINR(s.payableIncentive || 0)}</div>
                      <div className="text-muted-foreground">Incentive</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                      {s.department || "Department"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                      Weekly Off: {s.weeklyOff || "-"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] py-0 h-5">
                      {s.incentiveStatus || "NOT_CALCULATED"}
                    </Badge>
                    {(s.badges || []).map((b) => (
                      <Badge key={b} variant="secondary" className="text-[10px] py-0 h-5">
                        {b}
                      </Badge>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        navigate(`/manager/attendance?date=${today}&employee=${s.employeeCode}`)
                      }
                      className="flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium hover:bg-secondary transition-colors"
                    >
                      <CalendarCheck className="h-3 w-3" />
                      View Attendance
                    </button>

                    <button
                      onClick={() => setAssignTarget(s)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-md border border-brand/40 px-2 py-1.5 text-[11px] font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      <Target className="h-3 w-3" />
                      Assign Target
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {team.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-brand" /> Team summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-display font-bold">{team.length}</div>
                <div className="text-xs text-muted-foreground">Team size</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{avgAttendance}%</div>
                <div className="text-xs text-muted-foreground">Avg attendance</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{totalCourses}</div>
                <div className="text-xs text-muted-foreground">Courses done</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{fmtINR(totalIncentive)}</div>
                <div className="text-xs text-muted-foreground">Incentive pool</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
