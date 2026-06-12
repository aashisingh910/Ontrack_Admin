import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Store,
  Users,
  CalendarCheck,
  Target,
  Gift,
  BookOpen,
  Bell,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "WEEKLY_OFF" | "LEAVE" | "HALF_DAY";

interface ApiAttendanceRecord {
  _id: string;
  employeeCode: string;
  employeeName: string;
  role: "MANAGER" | "STAFF";
  status: AttendanceStatus;
  checkIn: { time: string | null; geofenceStatus: "INSIDE" | "OUTSIDE" | "NOT_APPLICABLE" };
  checkOut: { time: string | null };
  workingMinutes: number;
  lateMinutes: number;
}

interface MonthlyTarget {
  targetMonth: string;
  adminAssignment: { assignedMonthlyTarget: number };
  categoryBreakup: {
    furnitureTarget: number;
    homewareTarget: number;
    decorTarget: number;
    servicesTarget: number;
  };
  progress: {
    actualSales: number;
    achievementPercent: number;
    remainingTarget: number;
    daysElapsed: number;
    daysRemaining: number;
  };
  status: string;
}

interface DailyTarget {
  targetDate: string;
  dayName: string;
  assignedDailyTarget: number;
  progress: { actualSales: number; achievementPercent: number; remainingTarget: number };
  status: string;
}

type ManagerDashboardData = {
  manager: {
    employeeCode: string;
    name: string;
    email: string;
    role: string;
    storeCode: string;
    storeName: string;
    city?: string;
    region?: string;
  };
  store: {
    storeCode: string;
    storeName: string;
    city: string;
    state?: string;
    region: string;
    address?: string;
    status?: string;
  } | null;
  kpis: {
    staffCount: number;
    presentToday: number;
    lateToday: number;
    halfDayToday: number;
    absentToday: number;
    leaveToday: number;
    weeklyOffToday: number;
    attendancePercent: number;
    monthlyTarget: number;
    monthlyAchieved: number;
    monthlyAchievementPercent: number;
    dailyTarget: number;
    dailyAchieved: number;
    dailyAchievementPercent: number;
    activeCourses: number;
    activeNotices: number;
    totalPayableIncentive?: number;
    pendingIncentiveReviews?: number;
  };
  staff: any[];
  attendance: { date: string; summary: any; records: ApiAttendanceRecord[] };
  targets: { targetMonth: string; monthly: MonthlyTarget | null; daily: DailyTarget | null };
  incentives: { incentiveMonth: string; summary: any; records: any[] };
  courses: any[];
  notices: any[];
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function pctBadgeCls(pct: number) {
  if (pct >= 100) return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (pct >= 60) return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-red-500/10 text-red-700 border-red-500/30";
}

const ATTENDANCE_META: Record<string, { label: string; cls: string }> = {
  PRESENT:    { label: "Present",    cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  LATE:       { label: "Late",       cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  ABSENT:     { label: "Absent",     cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  LEAVE:      { label: "On leave",   cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  HALF_DAY:   { label: "Half day",   cls: "bg-purple-500/15 text-purple-700 border-purple-500/30" },
  WEEKLY_OFF: { label: "Weekly off", cls: "bg-slate-500/15 text-slate-600 border-slate-500/30" },
};

// ─── component ───────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const session = getSession();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const month = useMemo(() => currentMonth(), []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login token missing. Please login again.");
      const res = await fetch(
        `${API_BASE_URL}/manager/dashboard?targetMonth=${month}&attendanceDate=${today}&incentiveMonth=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.message || "Failed to load manager dashboard");
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="font-semibold text-red-600">{error || "No manager data found"}</div>
          <button
            onClick={fetchDashboard}
            className="mt-3 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const attendanceRecords = data.attendance?.records ?? [];
  const monthly = data.targets?.monthly ?? null;
  const daily = data.targets?.daily ?? null;
  const storePct = monthly?.progress.achievementPercent ?? 0;
  const dailyPct = daily?.progress.achievementPercent ?? 0;

  return (
    <div className="space-y-6">

      {/* Store header */}
      <header className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-brand" />
              <h1 className="text-2xl font-display font-bold">
                {data.store?.storeName || data.manager.storeName}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">Store #{data.manager.storeCode}</Badge>
              {data.manager.city && <Badge variant="outline">{data.manager.city}</Badge>}
              {data.manager.region && <Badge variant="outline">{data.manager.region}</Badge>}
              <Badge variant="outline">{data.store?.status || "ACTIVE"}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Manager: <b>{data.manager.name}</b> · {data.manager.email}
            </p>
            {data.store?.address && (
              <p className="mt-1 text-sm text-muted-foreground">{data.store.address}</p>
            )}
          </div>
          {session && (
            <div className="rounded-xl border bg-muted/40 p-3 text-sm">
              <div className="text-muted-foreground">Logged in as</div>
              <div className="font-semibold">{session.name}</div>
              <div className="text-xs text-muted-foreground">
                {session.storeName} · #{session.storeCode}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users}        title="Store Staff"       value={data.kpis.staffCount} />
        <KpiCard icon={CalendarCheck} title="Attendance %"     value={`${data.kpis.attendancePercent}%`} />
        <KpiCard icon={Target}       title="Monthly Target"    value={fmtINR(data.kpis.monthlyTarget)} />
        <KpiCard icon={Gift}         title="Payable Incentive" value={fmtINR(data.kpis.totalPayableIncentive || 0)} />
      </div>

      {/* ── ATTENDANCE ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-brand" /> Attendance
          <span className="text-sm font-normal text-muted-foreground">
            · {new Date(today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </h2>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { icon: Users,        label: "Roster",     value: data.kpis.staffCount,      tint: "bg-brand/10 text-brand" },
            { icon: CheckCircle2, label: "Present",    value: data.kpis.presentToday,    tint: "bg-emerald-500/10 text-emerald-700" },
            { icon: Clock,        label: "Late",       value: data.kpis.lateToday,       tint: "bg-amber-500/10 text-amber-700" },
            { icon: XCircle,      label: "Absent",     value: data.kpis.absentToday,     tint: "bg-red-500/10 text-red-700" },
            { icon: MapPin,       label: "On leave",   value: data.kpis.leaveToday,      tint: "bg-sky-500/10 text-sky-700" },
            { icon: CalendarCheck,label: "Weekly off", value: data.kpis.weeklyOffToday,  tint: "bg-slate-500/10 text-slate-600" },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${k.tint}`}>
                  <k.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                  <div className="font-display text-lg font-bold leading-none">{k.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Records table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team roster</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!attendanceRecords.length ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No attendance records for today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Geofence</TableHead>
                      <TableHead>Working</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((r) => {
                      const meta = ATTENDANCE_META[r.status] ?? { label: r.status, cls: "" };
                      const geo = r.checkIn?.geofenceStatus ?? "NOT_APPLICABLE";
                      return (
                        <TableRow key={r._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-brand/15 text-brand grid place-items-center text-[11px] font-semibold shrink-0">
                                {r.employeeName.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{r.employeeName}</div>
                                <div className="text-[11px] text-muted-foreground">{r.employeeCode}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs capitalize text-muted-foreground">
                            {r.role.toLowerCase()}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">{fmtTime(r.checkIn?.time ?? null)}</TableCell>
                          <TableCell className="text-sm tabular-nums">{fmtTime(r.checkOut?.time ?? null)}</TableCell>
                          <TableCell className="text-xs">
                            {geo !== "NOT_APPLICABLE" ? (
                              <span className={`flex items-center gap-1 ${geo === "INSIDE" ? "text-emerald-700" : "text-red-600"}`}>
                                <MapPin className="h-3 w-3" /> {geo}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {r.workingMinutes > 0
                              ? `${Math.floor(r.workingMinutes / 60)}h ${r.workingMinutes % 60}m`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
                              {meta.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── TARGETS ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-brand" /> Targets
          <span className="text-sm font-normal text-muted-foreground">· {month}</span>
        </h2>

        {/* KPI strip */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              icon: Target,
              label: "Monthly target",
              value: fmtINR(monthly?.adminAssignment.assignedMonthlyTarget ?? data.kpis.monthlyTarget),
              tint: "bg-brand/10 text-brand",
            },
            {
              icon: TrendingUp,
              label: "Achieved",
              value: fmtINR(monthly?.progress.actualSales ?? data.kpis.monthlyAchieved),
              hint: `${storePct.toFixed(1)}% of target`,
              tint: "bg-[color:var(--golden)]/15 text-[color:var(--brown)]",
            },
            {
              icon: Wallet,
              label: "Remaining",
              value: fmtINR(monthly?.progress.remainingTarget ?? 0),
              hint: monthly ? `${monthly.progress.daysRemaining} days left` : undefined,
              tint: "bg-sky-500/10 text-sky-700",
            },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${k.tint}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                  <div className="font-display text-lg font-bold">{k.value}</div>
                  {k.hint && <div className="text-[11px] text-muted-foreground">{k.hint}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly progress card */}
        {monthly ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Target className="h-4 w-4 text-brand" /> Monthly progress — {monthly.targetMonth}
                </CardTitle>
                <Badge variant="outline" className={pctBadgeCls(storePct)}>
                  {storePct.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={Math.min(100, storePct)} className="h-3 [&>div]:bg-brand" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmtINR(monthly.progress.actualSales)} achieved</span>
                <span>{fmtINR(monthly.progress.remainingTarget)} remaining</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { label: "Furniture", value: monthly.categoryBreakup.furnitureTarget },
                  { label: "Homeware",  value: monthly.categoryBreakup.homewareTarget },
                  { label: "Decor",     value: monthly.categoryBreakup.decorTarget },
                  { label: "Services",  value: monthly.categoryBreakup.servicesTarget },
                ].map((c) => (
                  <div key={c.label} className="rounded-md bg-secondary p-3 text-center">
                    <div className="text-[11px] text-muted-foreground">{c.label}</div>
                    <div className="font-semibold text-sm">{fmtINR(c.value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <Row label="Monthly Target"      value={fmtINR(data.kpis.monthlyTarget)} />
              <Row label="Achieved"            value={fmtINR(data.kpis.monthlyAchieved)} />
              <Row label="Achievement"         value={`${data.kpis.monthlyAchievementPercent}%`} />
            </CardContent>
          </Card>
        )}

        {/* Daily target card */}
        {daily ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">
                  Daily target — {daily.dayName},{" "}
                  {new Date(daily.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </CardTitle>
                <Badge variant="outline" className={pctBadgeCls(dailyPct)}>
                  {dailyPct.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={Math.min(100, dailyPct)} className="h-3 [&>div]:bg-brand" />
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-[11px] text-muted-foreground">Daily target</div>
                  <div className="font-semibold">{fmtINR(daily.assignedDailyTarget)}</div>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-[11px] text-muted-foreground">Achieved</div>
                  <div className="font-semibold">{fmtINR(daily.progress.actualSales)}</div>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-[11px] text-muted-foreground">Remaining</div>
                  <div className="font-semibold">{fmtINR(daily.progress.remainingTarget)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <Row label="Daily Target"   value={fmtINR(data.kpis.dailyTarget)} />
              <Row label="Daily Achieved" value={fmtINR(data.kpis.dailyAchieved)} />
            </CardContent>
          </Card>
        )}
      </section>

      {/* Staff + Learning */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">My Store Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.staff.slice(0, 10).map((member: any) => (
              <div
                key={member.employeeCode}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.employeeCode} · {member.designation} · {member.department}
                  </div>
                </div>
                <Badge variant="outline">{member.weeklyOff || "No off"}</Badge>
              </div>
            ))}
            {data.staff.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No staff mapped to this store.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning &amp; Notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Active Courses
              </span>
              <b>{data.kpis.activeCourses}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Active Notices
              </span>
              <b>{data.kpis.activeNotices}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Pending Incentive Reviews</span>
              <b>{data.kpis.pendingIncentiveReviews || 0}</b>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Users;
  title: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
