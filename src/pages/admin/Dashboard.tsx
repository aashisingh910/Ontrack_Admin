import { useEffect, useState, useMemo } from "react";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Users,
  UserCog,
  Target,
  TrendingUp,
  Award,
  GraduationCap,
  CalendarCheck,
  MapPin,
  Clock,
  BookOpen,
  Megaphone,
  Wallet,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface StoreData {
  id: string;
  storeCode: string;
  name: string;
  storeName: string;
  city: string;
  state: string;
  region: string;
  zone: string;
  managerName: string | null;
  monthlyTarget: number;
  achieved: number;
}

interface StaffMember {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  storeCode: string;
  storeName: string;
  managerName: string;
  weeklyOff: string;
  achieved: number;
  attendanceRate: number;
  coursesCompleted: number;
  badges: string[];
}

interface AttendanceRecord {
  _id: string;
  employeeCode: string;
  employeeName: string;
  storeCode: string;
  storeName: string;
  attendanceDate: string;
  dayName: string;
  status: string;
  dayScore: number | null;
  lateMinutes: number;
  workingMinutes: number;
}

interface KPIs {
  totalStores: number;
  totalManagers: number;
  totalStaff: number;
  avgAttendance: number;
  totalMonthlyTarget: number;
  totalAchieved: number;
  targetAchievementPercent: number;
  activeCourses: number;
}

interface ApiNotice {
  _id: string;
  noticeTitle: string;
  noticeNumber: string;
  effectiveDate: string;
  priority: string;
  content: { description: string };
}

interface ApiIncentive {
  calculation: { payableIncentive: number };
}

// ----------------------------------------------------------------------
// API
// ----------------------------------------------------------------------

const API_BASE = "http://localhost:5002/api/aashi";

async function fetchDashboard(): Promise<{
  kpis: KPIs;
  stores: StoreData[];
  staff: StaffMember[];
  attendance: AttendanceRecord[];
}> {
  const url = `${API_BASE}/dashboard/admin?targetMonth=2026-07&attendanceMonth=2026-06`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Unknown error");
  return json.data;
}

async function fetchLatestNotice(): Promise<ApiNotice | null> {
  try {
    const res = await fetch(`${API_BASE}/notices`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data.length > 0) return json.data[0];
    return null;
  } catch {
    return null;
  }
}

async function fetchTotalIncentive(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/incentives`);
    if (!res.ok) return 0;
    const json = await res.json();
    if (json.success) {
      return json.data.reduce(
        (sum: number, inc: ApiIncentive) => sum + inc.calculation.payableIncentive,
        0
      );
    }
    return 0;
  } catch {
    return 0;
  }
}

// ----------------------------------------------------------------------
// SVG Donut Chart (unchanged)
// ----------------------------------------------------------------------

const DonutChart = ({
  data,
  size = 160,
  strokeWidth = 20,
}: {
  data: { label: string; count: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.count, 0);
  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((segment) => {
          const percentage = total === 0 ? 0 : segment.count / total;
          const dashArray = `${percentage * circumference} ${circumference - percentage * circumference}`;
          const offset = -cumulativeOffset;
          cumulativeOffset += percentage * circumference;
          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-300"
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={radius - strokeWidth / 2} fill="white" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
        {data.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span>{seg.label} {seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const priorityMeta: Record<string, { label: string; cls: string }> = {
  HIGH: { label: "High", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  MEDIUM: { label: "Medium", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  LOW: { label: "Info", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function fmtINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function Dashboard() {
  const session = getSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Main dashboard data
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // New additional data
  const [latestNotice, setLatestNotice] = useState<ApiNotice | null>(null);
  const [totalIncentive, setTotalIncentive] = useState<number>(0);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [dashData, notice, incentiveTotal] = await Promise.all([
          fetchDashboard(),
          fetchLatestNotice(),
          fetchTotalIncentive(),
        ]);

        setKpis(dashData.kpis);
        setStores(dashData.stores || []);
        setStaff(dashData.staff || []);
        setAttendanceRecords(dashData.attendance || []);
        setLatestNotice(notice);
        setTotalIncentive(incentiveTotal);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // ==============================
  // Derived metrics (unchanged)
  // ==============================

  const storeProgress = useMemo(
    () =>
      stores.map((store) => ({
        id: store.id,
        name: store.name,
        city: store.city,
        region: store.region,
        achieved: store.achieved,
        target: store.monthlyTarget,
        pct: store.monthlyTarget > 0 ? Math.min(100, Math.round((store.achieved / store.monthlyTarget) * 100)) : 0,
        managerName: store.managerName || "—",
      })),
    [stores]
  );

  const topSalesStaff = useMemo(
    () => [...staff].filter((s) => s.achieved > 0).sort((a, b) => b.achieved - a.achieved).slice(0, 5),
    [staff]
  );

  const topAttendanceStaff = useMemo(
    () => [...staff].sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 5),
    [staff]
  );

  const topLearners = useMemo(
    () => [...staff].filter((s) => s.coursesCompleted > 0).sort((a, b) => b.coursesCompleted - a.coursesCompleted).slice(0, 5),
    [staff]
  );

  const attendanceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    attendanceRecords.forEach((rec) => {
      counts[rec.status] = (counts[rec.status] || 0) + 1;
    });
    return counts;
  }, [attendanceRecords]);

  const donutData = useMemo(
    () => [
      { label: "Present", count: attendanceBreakdown.PRESENT || 0, color: "#10b981" },
      { label: "Late", count: attendanceBreakdown.LATE || 0, color: "#f59e0b" },
      { label: "Half Day", count: attendanceBreakdown.HALF_DAY || 0, color: "#eab308" },
      { label: "Absent", count: attendanceBreakdown.ABSENT || 0, color: "#ef4444" },
      { label: "Weekly Off", count: attendanceBreakdown.WEEKLY_OFF || 0, color: "#94a3b8" },
    ],
    [attendanceBreakdown]
  );

  const regionalData = useMemo(() => {
    const regions = [...new Set(stores.map((s) => s.region))];
    return regions.map((region) => {
      const regionStores = stores.filter((s) => s.region === region);
      const regionStaff = staff.filter((s) => regionStores.some((rs) => rs.storeCode === s.storeCode));
      const totalTarget = regionStores.reduce((sum, s) => sum + s.monthlyTarget, 0);
      const totalAchieved = regionStores.reduce((sum, s) => sum + s.achieved, 0);
      const avgStaffAttendance =
        regionStaff.length > 0 ? Math.round(regionStaff.reduce((sum, s) => sum + s.attendanceRate, 0) / regionStaff.length) : 0;
      return {
        region,
        storeCount: regionStores.length,
        staffCount: regionStaff.length,
        totalTarget,
        totalAchieved,
        achievementPct: totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0,
        avgAttendance: avgStaffAttendance,
      };
    });
  }, [stores, staff]);

  const learningTotals = useMemo(() => {
    const totalCompletions = staff.reduce((sum, s) => sum + s.coursesCompleted, 0);
    const totalBadges = staff.reduce((sum, s) => sum + s.badges.length, 0);
    return { totalCompletions, totalBadges, activeCourses: kpis?.activeCourses || 0 };
  }, [staff, kpis]);

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
        <CardContent className="py-6 text-center text-red-700">Error loading dashboard: {error}</CardContent>
      </Card>
    );
  }

  if (!session || !kpis) return null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            Good to see you, <span className="text-brand">{session?.name?.split(" ")[0] || "User"}</span>
          </h1>
          <p className="text-sm text-muted-foreground">Network performance – July 2026 targets, June 2026 attendance.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-soft">
          <TrendingUp className="h-4 w-4 text-brand" />
          <div className="text-sm">
            <div className="font-semibold">
              {fmtINR(kpis.totalAchieved)} / {fmtINR(kpis.totalMonthlyTarget)}
            </div>
            <div className="text-[11px] text-muted-foreground">Network MTD (achievement {kpis.targetAchievementPercent}%)</div>
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Stores", value: kpis.totalStores, icon: Store, tint: "bg-brand/10 text-brand" },
          { label: "Managers", value: kpis.totalManagers, icon: UserCog, tint: "bg-info/10 text-info" },
          { label: "Staff", value: kpis.totalStaff, icon: Users, tint: "bg-golden/15 text-[color:var(--brown)]" },
          { label: "Avg Attendance", value: `${kpis.avgAttendance}%`, icon: CalendarCheck, tint: "bg-success/10 text-success" },
        ].map((k) => (
          <Card key={k.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.tint}`}>
                <k.icon className="h-4.5 w-4.5" />
              </div>
              <div className="mt-3 text-2xl font-display font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* NEW: Incentive & Notice Quick Cards */}
      <section className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-golden" /> Total Incentive Payable (July)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brown">{fmtINR(totalIncentive)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all stores, pending manager review.</p>
          </CardContent>
        </Card>

        {latestNotice && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-orange-500" /> Latest Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium text-sm">{latestNotice.noticeTitle}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {latestNotice.noticeNumber} · Effective {formatDate(latestNotice.effectiveDate)}
              </div>
              <Badge variant="outline" className={`mt-2 text-[10px] ${priorityMeta[latestNotice.priority]?.cls || ""}`}>
                {priorityMeta[latestNotice.priority]?.label || latestNotice.priority}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{latestNotice.content.description}</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* STORE TARGET PROGRESS & ATTENDANCE DONUT (unchanged) */}
      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand" /> Store Target Progress
            </CardTitle>
            <span className="text-xs text-muted-foreground">MTD</span>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {storeProgress.map((store) => (
              <div key={store.id}>
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{store.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {store.city} · {store.region} · Mgr: {store.managerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${store.pct === 0 ? "text-red-600" : ""}`}>{store.pct}%</div>
                    <div className="text-[11px] text-muted-foreground">
                      {fmtINR(store.achieved)} / {fmtINR(store.target)}
                    </div>
                  </div>
                </div>
                <Progress value={store.pct} className="mt-1 h-2 [&>div]:bg-brand" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-success" /> Attendance (Jun)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DonutChart data={donutData} />
          </CardContent>
        </Card>
      </section>

      {/* STAFF LEADERBOARDS (unchanged) */}
      {topSalesStaff.length > 0 && (
        <section className="grid lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-golden" /> Top Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSalesStaff.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-semibold">
                      {initials(s.name)}
                    </span>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.storeName}</div>
                    </div>
                  </div>
                  <span className="font-semibold">{fmtINR(s.achieved)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-info" /> Attendance Champions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topAttendanceStaff.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-info/10 text-info text-xs font-semibold">
                      {initials(s.name)}
                    </span>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.storeName}</div>
                    </div>
                  </div>
                  <span className="font-semibold text-success">{s.attendanceRate}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {topLearners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" /> Learning Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topLearners.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {initials(s.name)}
                      </span>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">{s.storeName}</div>
                      </div>
                    </div>
                    <span className="font-semibold">{s.coursesCompleted} courses</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* REGIONAL PERFORMANCE (unchanged) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" /> Regional Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionalData.map((reg) => (
              <div key={reg.region} className="rounded-lg border p-3 space-y-2">
                <h4 className="font-semibold text-sm">{reg.region} Region</h4>
                <div className="flex justify-between text-xs">
                  <span>{reg.storeCount} stores</span>
                  <span>{reg.staffCount} staff</span>
                </div>
                <Progress value={reg.achievementPct} className="h-1.5" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Achievement {reg.achievementPct}%</span>
                  <span>Attendance {reg.avgAttendance}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LEARNING SNAPSHOT & STORE ROLL CALL (unchanged) */}
      <section className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-info" /> Learning Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-display font-bold">{learningTotals.activeCourses}</div>
                <div className="text-xs text-muted-foreground">Active courses</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{learningTotals.totalCompletions}</div>
                <div className="text-xs text-muted-foreground">Completions</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{learningTotals.totalBadges}</div>
                <div className="text-xs text-muted-foreground">Badges earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-brand" /> Store Roll Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[180px] overflow-y-auto">
            {stores.map((store) => {
              const staffCount = staff.filter((s) => s.storeCode === store.storeCode).length;
              return (
                <div key={store.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{store.name}</span>
                  <span className="text-muted-foreground">
                    {staffCount} staff · {store.managerName || "—"}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}