import { getSession } from "@/lib/session";
import { stores, staff, managers, fmtINR, incentive, getStaffByStore, getManagerByStore } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, UserCog, Target, TrendingUp, Award, GraduationCap, CalendarCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const session = getSession();
  if (!session) return null;

  const totalAchieved = stores.reduce((s, x) => s + x.achieved, 0);
  const totalTarget = stores.reduce((s, x) => s + x.monthlyTarget, 0);
  const totalIncentive = staff.reduce((s, x) => s + incentive(x.achieved), 0);

  const kpis = [
    { label: "Stores", value: stores.length, icon: Store, tint: "bg-brand/10 text-brand" },
    { label: "Managers", value: managers.length, icon: UserCog, tint: "bg-info/10 text-info" },
    { label: "Staff", value: staff.length, icon: Users, tint: "bg-golden/15 text-[color:var(--brown)]" },
    { label: "Avg attendance", value: Math.round(staff.reduce((a, b) => a + b.attendanceRate, 0) / staff.length) + "%", icon: CalendarCheck, tint: "bg-success/10 text-success" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            Good to see you, <span className="text-brand">{session.name.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground">Here's how the network is performing this month.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-soft">
          <TrendingUp className="h-4 w-4 text-brand" />
          <div className="text-sm">
            <div className="font-semibold">{fmtINR(totalAchieved)} / {fmtINR(totalTarget)}</div>
            <div className="text-[11px] text-muted-foreground">Network MTD vs target</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => (
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

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-brand" /> Store target progress</CardTitle>
            <span className="text-xs text-muted-foreground">MTD</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {stores.map((s) => {
              const pct = Math.min(100, Math.round((s.achieved / s.monthlyTarget) * 100));
              const mgr = getManagerByStore(s.id);
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.city} · Manager: {mgr?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{pct}%</div>
                      <div className="text-[11px] text-muted-foreground">{fmtINR(s.achieved)} / {fmtINR(s.monthlyTarget)}</div>
                    </div>
                  </div>
                  <Progress value={pct} className="mt-2 h-2 [&>div]:bg-brand" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-golden" /> Incentive pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-brown">{fmtINR(totalIncentive)}</div>
            <p className="text-xs text-muted-foreground mt-1">10% of staff achieved targets this month.</p>
            <div className="mt-4 space-y-2">
              {[...staff].sort((a, b) => b.achieved - a.achieved).slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm rounded-md bg-secondary px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-semibold" style={{ background: s.avatarColor }}>
                      {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </span>
                    <span>{s.name}</span>
                  </div>
                  <span className="font-medium">{fmtINR(incentive(s.achieved))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-info" /> Learning snapshot</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-display font-bold">12</div>
                <div className="text-xs text-muted-foreground">Active courses</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{staff.reduce((a, b) => a + b.coursesCompleted, 0)}</div>
                <div className="text-xs text-muted-foreground">Completions</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{staff.reduce((a, b) => a + b.badges.length, 0)}</div>
                <div className="text-xs text-muted-foreground">Badges issued</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-brand" /> Store roll-call</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stores.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{getStaffByStore(s.id).length} staff · {getManagerByStore(s.id)?.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
