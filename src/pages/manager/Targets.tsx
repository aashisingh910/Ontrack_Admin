import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getSession } from "@/lib/session";
import { managerApi } from "@/services/managerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Target,
  TrendingUp,
  Wallet,
  Store as StoreIcon,
  Loader2,
  CalendarDays,
  Users,
  PencilLine,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";

// ─── types ───────────────────────────────────────────────────────────────────

interface MonthlyTarget {
  _id: string;
  targetMonth: string;
  adminAssignment: { assignedMonthlyTarget: number; remarks?: string };
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
  _id: string;
  targetDate: string;
  dayName: string;
  assignedDailyTarget: number;
  progress: { actualSales: number; achievementPercent: number; remainingTarget: number };
  status: string;
}

interface StaffTarget {
  employeeCode: string;
  employeeName: string;
  designation?: string;
  department?: string;
  targetId?: string;
  targetMonth: string;
  assignedTarget: number;
  achieved: number;
  achievementPercent: number;
  status?: string;
  categoryBreakup?: {
    furnitureTarget?: number;
    homewareTarget?: number;
    decorTarget?: number;
    servicesTarget?: number;
  };
  remarks?: string;
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

function pctBadgeCls(pct: number) {
  if (pct >= 100) return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (pct >= 60)  return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-red-500/10 text-red-700 border-red-500/30";
}

const avatarColors = ["#8B5E34","#C56A2D","#34568B","#6B7280","#9A3412","#166534","#7C3AED"];
const avatarColor = (i: number) => avatarColors[i % avatarColors.length];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── assign monthly target modal ─────────────────────────────────────────────

type MonthlyModalProps = {
  member: StaffTarget;
  targetMonth: string;
  onClose: () => void;
  onSaved: () => void;
};

function AssignMonthlyModal({ member, targetMonth, onClose, onSaved }: MonthlyModalProps) {
  const [month, setMonth] = useState(targetMonth);
  const [amount, setAmount] = useState(member.assignedTarget > 0 ? String(member.assignedTarget) : "");
  const [furniture, setFurniture] = useState(String(member.categoryBreakup?.furnitureTarget ?? ""));
  const [homeware, setHomeware]   = useState(String(member.categoryBreakup?.homewareTarget ?? ""));
  const [decor, setDecor]         = useState(String(member.categoryBreakup?.decorTarget ?? ""));
  const [services, setServices]   = useState(String(member.categoryBreakup?.servicesTarget ?? ""));
  const [remarks, setRemarks]     = useState(member.remarks ?? "");
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(amount);
    if (!total || total <= 0) { toast.error("Enter a valid target amount"); return; }
    setSaving(true);
    try {
      if (member.targetId) {
        await managerApi.updateStaffTarget(member.targetId, {
          assignedTarget: total,
          categoryBreakup: {
            furnitureTarget: Number(furniture) || undefined,
            homewareTarget:  Number(homeware)  || undefined,
            decorTarget:     Number(decor)     || undefined,
            servicesTarget:  Number(services)  || undefined,
          },
          remarks: remarks || undefined,
        });
      } else {
        await managerApi.assignStaffTarget({
          employeeCode: member.employeeCode,
          targetMonth: month,
          assignedTarget: total,
          categoryBreakup: {
            furnitureTarget: Number(furniture) || undefined,
            homewareTarget:  Number(homeware)  || undefined,
            decorTarget:     Number(decor)     || undefined,
            servicesTarget:  Number(services)  || undefined,
          },
          remarks: remarks || undefined,
        });
      }
      toast.success(`Monthly target ${member.targetId ? "updated" : "assigned"} for ${member.employeeName}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save target");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-bold text-lg mb-0.5">Monthly Target</h2>
        <p className="text-xs text-muted-foreground mb-5">
          {member.employeeName} · {member.employeeCode}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Month</Label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Total target (₹)</Label>
            <input type="number" min="1" placeholder="e.g. 450000" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Furniture", value: furniture, set: setFurniture },
              { label: "Homeware",  value: homeware,  set: setHomeware },
              { label: "Decor",     value: decor,     set: setDecor },
              { label: "Services",  value: services,  set: setServices },
            ].map((c) => (
              <div key={c.label}>
                <Label className="text-[11px] mb-1 block text-muted-foreground">{c.label} (₹)</Label>
                <input type="number" min="0" placeholder="0" value={c.value}
                  onChange={(e) => c.set(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
              </div>
            ))}
          </div>

          <div>
            <Label className="text-xs mb-1 block">Remarks (optional)</Label>
            <input type="text" placeholder="e.g. Festive season push" value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border px-3 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              {saving ? "Saving…" : member.targetId ? "Update" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── assign daily target modal ────────────────────────────────────────────────

type DailyModalProps = {
  member: StaffTarget;
  selectedDate: string;
  onClose: () => void;
  onSaved: () => void;
};

function AssignDailyModal({ member, selectedDate, onClose, onSaved }: DailyModalProps) {
  const [date, setDate]     = useState(selectedDate);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(amount);
    if (!total || total <= 0) { toast.error("Enter a valid target amount"); return; }
    setSaving(true);
    try {
      await managerApi.assignStaffDailyTarget({
        employeeCode: member.employeeCode,
        targetDate: date,
        assignedDailyTarget: total,
        remarks: remarks || undefined,
      });
      toast.success(`Daily target assigned to ${member.employeeName}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save target");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-bold text-lg mb-0.5">Daily Target</h2>
        <p className="text-xs text-muted-foreground mb-5">
          {member.employeeName} · {member.employeeCode}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Date</Label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Daily target (₹)</Label>
            <input type="number" min="1" placeholder="e.g. 20000" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" required />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Remarks (optional)</Label>
            <input type="text" placeholder="e.g. Weekend push" value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border px-3 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              {saving ? "Saving…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ManagerTargets() {
  const session = getSession();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // store targets
  const [monthly, setMonthly] = useState<MonthlyTarget[]>([]);
  const [daily, setDaily]     = useState<DailyTarget[]>([]);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError, setStoreError]     = useState("");

  // staff targets
  const [staffTargets, setStaffTargets] = useState<StaffTarget[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError]     = useState("");

  // modals
  const [monthlyModal, setMonthlyModal] = useState<StaffTarget | null>(null);
  const [dailyModal, setDailyModal]     = useState<StaffTarget | null>(null);

  // ── fetch store targets ──
  const fetchStoreTargets = async () => {
    setStoreLoading(true);
    setStoreError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login token missing.");
      const [mRes, dRes] = await Promise.all([
        fetch(`${API_BASE_URL}/targets/monthly?month=${selectedMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/targets/daily?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [mJson, dJson] = await Promise.all([mRes.json(), dRes.json()]);
      if (mRes.ok && mJson.success) setMonthly(mJson.data);
      if (dRes.ok && dJson.success) setDaily(dJson.data);
      if (!mRes.ok) setStoreError(mJson.message || "Failed to load store targets");
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStoreLoading(false);
    }
  };

  // ── fetch staff targets ──
  const fetchStaffTargets = async () => {
    setStaffLoading(true);
    setStaffError("");
    try {
      const result = await managerApi.staffTargets(selectedMonth);
      setStaffTargets(Array.isArray(result) ? result : (result?.staff ?? result?.targets ?? []));
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : "Failed to load staff targets");
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => { fetchStoreTargets(); }, [selectedMonth, selectedDate]);
  useEffect(() => { fetchStaffTargets(); }, [selectedMonth]);

  const storeMonthly = monthly[0] ?? null;
  const storePct     = storeMonthly?.progress.achievementPercent ?? 0;
  const storeTarget  = storeMonthly?.adminAssignment.assignedMonthlyTarget ?? 0;
  const storeAchieved = storeMonthly?.progress.actualSales ?? 0;
  const todayDaily   = daily[0] ?? null;
  const dailyPct     = todayDaily?.progress.achievementPercent ?? 0;

  return (
    <>
      {monthlyModal && (
        <AssignMonthlyModal
          member={monthlyModal}
          targetMonth={selectedMonth}
          onClose={() => setMonthlyModal(null)}
          onSaved={fetchStaffTargets}
        />
      )}
      {dailyModal && (
        <AssignDailyModal
          member={dailyModal}
          selectedDate={selectedDate}
          onClose={() => setDailyModal(null)}
          onSaved={fetchStaffTargets}
        />
      )}

      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Targets</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <StoreIcon className="h-3.5 w-3.5" />
              {session?.storeName || "My store"} — store &amp; staff performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Month</Label>
              <Input type="month" value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Daily date</Label>
              <div className="relative">
                <CalendarDays className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="date" value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)} className="pl-7 w-[160px]" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ STORE TARGETS ══ */}
        <section className="space-y-4">
          <h2 className="text-base font-display font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-brand" /> Store Targets
          </h2>

          {storeLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : storeError ? (
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-red-600 mb-2">{storeError}</div>
                <button onClick={fetchStoreTargets} className="rounded-md border px-3 py-1.5 text-xs">Retry</button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI strip */}
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Target,     label: "Monthly target", value: fmtINR(storeTarget),                              hint: undefined,                                    tint: "bg-brand/10 text-brand" },
                  { icon: TrendingUp, label: "Achieved",       value: fmtINR(storeAchieved),                            hint: `${storePct.toFixed(1)}% of target`,           tint: "bg-[color:var(--golden)]/15 text-[color:var(--brown)]" },
                  { icon: Wallet,     label: "Remaining",      value: fmtINR(storeMonthly?.progress.remainingTarget ?? 0), hint: `${storeMonthly?.progress.daysRemaining ?? 0} days left`, tint: "bg-sky-500/10 text-sky-700" },
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

              {/* Monthly progress */}
              {storeMonthly && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 font-display text-base">
                        <Target className="h-4 w-4 text-brand" /> Monthly progress — {storeMonthly.targetMonth}
                      </CardTitle>
                      <Badge variant="outline" className={pctBadgeCls(storePct)}>{storePct.toFixed(1)}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={Math.min(100, storePct)} className="h-3 [&>div]:bg-brand" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{fmtINR(storeAchieved)} achieved</span>
                      <span>{fmtINR(storeMonthly.progress.remainingTarget)} remaining</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { label: "Furniture", value: storeMonthly.categoryBreakup.furnitureTarget },
                        { label: "Homeware",  value: storeMonthly.categoryBreakup.homewareTarget },
                        { label: "Decor",     value: storeMonthly.categoryBreakup.decorTarget },
                        { label: "Services",  value: storeMonthly.categoryBreakup.servicesTarget },
                      ].map((c) => (
                        <div key={c.label} className="rounded-md bg-secondary p-3 text-center">
                          <div className="text-[11px] text-muted-foreground">{c.label}</div>
                          <div className="font-semibold text-sm">{fmtINR(c.value)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily target */}
              {todayDaily && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-display">
                        Daily target — {todayDaily.dayName},{" "}
                        {new Date(todayDaily.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </CardTitle>
                      <Badge variant="outline" className={pctBadgeCls(dailyPct)}>{dailyPct.toFixed(1)}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={Math.min(100, dailyPct)} className="h-3 [&>div]:bg-brand" />
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      {[
                        { label: "Daily target", value: fmtINR(todayDaily.assignedDailyTarget) },
                        { label: "Achieved",     value: fmtINR(todayDaily.progress.actualSales) },
                        { label: "Remaining",    value: fmtINR(todayDaily.progress.remainingTarget) },
                      ].map((c) => (
                        <div key={c.label} className="rounded-md bg-secondary p-3">
                          <div className="text-[11px] text-muted-foreground">{c.label}</div>
                          <div className="font-semibold">{c.value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!storeMonthly && !todayDaily && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No store target data for the selected period.
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>

        {/* ══ STAFF TARGETS ══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" /> Staff Targets
              <span className="text-sm font-normal text-muted-foreground">· {selectedMonth}</span>
            </h2>
            {staffTargets.length > 0 && (
              <span className="text-xs text-muted-foreground">{staffTargets.length} staff members</span>
            )}
          </div>

          {staffLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : staffError ? (
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-red-600 mb-2">{staffError}</div>
                <button onClick={fetchStaffTargets} className="rounded-md border px-3 py-1.5 text-xs">Retry</button>
              </CardContent>
            </Card>
          ) : !staffTargets.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No staff target data for {selectedMonth}. Use the buttons below to assign targets.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {staffTargets.map((s, index) => {
                const pct = Math.min(100, s.achievementPercent ?? 0);
                return (
                  <Card key={s.employeeCode} className="flex flex-col">
                    <CardContent className="p-4 flex-1 space-y-3">
                      {/* Identity */}
                      <div className="flex items-start gap-3">
                        <span
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                          style={{ background: avatarColor(index) }}
                        >
                          {initials(s.employeeName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{s.employeeName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.employeeCode}{s.designation ? ` · ${s.designation}` : ""}
                          </div>
                          {s.department && (
                            <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4">{s.department}</Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${pctBadgeCls(pct)}`}>
                          {pct.toFixed(1)}%
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5">
                        <Progress value={pct} className="h-2 [&>div]:bg-brand" />
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{fmtINR(s.achieved)} achieved</span>
                          <span>of {fmtINR(s.assignedTarget)}</span>
                        </div>
                      </div>

                      {/* Category breakup (if present) */}
                      {s.categoryBreakup && Object.values(s.categoryBreakup).some(Boolean) && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: "Furniture", value: s.categoryBreakup.furnitureTarget },
                            { label: "Homeware",  value: s.categoryBreakup.homewareTarget },
                            { label: "Decor",     value: s.categoryBreakup.decorTarget },
                            { label: "Services",  value: s.categoryBreakup.servicesTarget },
                          ].map((c) => c.value ? (
                            <div key={c.label} className="rounded bg-secondary px-2 py-1.5 text-center">
                              <div className="text-[10px] text-muted-foreground">{c.label}</div>
                              <div className="text-xs font-semibold">{fmtINR(c.value)}</div>
                            </div>
                          ) : null)}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setMonthlyModal(s)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md border border-brand/40 px-2 py-1.5 text-[11px] font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                        >
                          <PencilLine className="h-3 w-3" />
                          {s.assignedTarget > 0 ? "Edit Monthly" : "Set Monthly"}
                        </button>
                        <button
                          onClick={() => setDailyModal(s)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium hover:bg-secondary transition-colors"
                        >
                          <CalendarCheck className="h-3 w-3" />
                          Daily Target
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Quick-assign strip when no data */}
          {!staffLoading && !staffError && staffTargets.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Staff targets will appear here once assigned. Use the assign buttons on the My Team page or add targets manually.
            </p>
          )}
        </section>

      </div>
    </>
  );
}
