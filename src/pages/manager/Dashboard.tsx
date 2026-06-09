import { getSession } from "@/lib/session";
import { managers, stores, getStaffByStore, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Target, CalendarCheck, Award, TrendingUp, BookOpen, Store as StoreIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManagerDashboard() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];
  const team = getStaffByStore(store.id);

  const pct = Math.min(100, Math.round((store.achieved / store.monthlyTarget) * 100));
  const avgAtt = Math.round(team.reduce((a, s) => a + s.attendanceRate, 0) / Math.max(1, team.length));
  const totalIncentive = team.reduce((a, s) => a + incentive(s.achieved), 0);
  const totalCourses = team.reduce((a, s) => a + s.coursesCompleted, 0);

  const kpis = [
    { label: "Team members", value: team.length, icon: Users, tint: "bg-brand/10 text-brand" },
    { label: "Avg attendance", value: avgAtt + "%", icon: CalendarCheck, tint: "bg-emerald-500/10 text-emerald-700" },
    { label: "Incentive pool", value: fmtINR(totalIncentive), icon: Award, tint: "bg-[color:var(--golden)]/15 text-[color:var(--brown)]" },
    { label: "Courses done", value: totalCourses, icon: BookOpen, tint: "bg-info/10 text-info" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            Good to see you, <span className="text-brand">{session?.name.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <StoreIcon className="h-3.5 w-3.5" />
            {store.name} · {store.city} · {team.length} team members
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-soft">
          <TrendingUp className="h-4 w-4 text-brand" />
          <div className="text-sm">
            <div className="font-semibold">{fmtINR(store.achieved)} / {fmtINR(store.monthlyTarget)}</div>
            <div className="text-[11px] text-muted-foreground">Store MTD vs target</div>
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

      <section className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand" /> Store target this month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3 [&>div]:bg-brand" />
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Achieved: {fmtINR(store.achieved)}</span>
              <span>Target: {fmtINR(store.monthlyTarget)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-md bg-secondary p-3 text-center">
                <div className="text-[11px] text-muted-foreground">Daily target</div>
                <div className="font-semibold">{fmtINR(Math.round(store.monthlyTarget / 30))}</div>
              </div>
              <div className="rounded-md bg-secondary p-3 text-center">
                <div className="text-[11px] text-muted-foreground">Remaining</div>
                <div className="font-semibold">{fmtINR(Math.max(0, store.monthlyTarget - store.achieved))}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" /> Team performance
            </CardTitle>
            <Link to="/staff" className="text-xs text-brand hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...team].sort((a, b) => b.achieved - a.achieved).map((s) => {
              const spct = Math.min(100, Math.round((s.achieved / s.monthlyTarget) * 100));
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-semibold"
                        style={{ background: s.avatarColor }}
                      >
                        {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      {s.name}
                    </span>
                    <span className="text-muted-foreground">{spct}%</span>
                  </div>
                  <Progress value={spct} className="h-1.5 [&>div]:bg-brand" />
                </div>
              );
            })}
            {!team.length && (
              <p className="text-sm text-muted-foreground text-center py-4">No staff assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        {[
          { label: "Pending approvals", value: "2", hint: "Assignment submissions", to: "/staff" },
          { label: "Low attendance", value: team.filter((s) => s.attendanceRate < 85).length.toString(), hint: "Staff below 85%", to: "/attendance" },
          { label: "Pending courses", value: team.filter((s) => s.coursesCompleted < 2).length.toString(), hint: "Staff with < 2 courses", to: "/courses" },
        ].map((item) => (
          <Link key={item.label} to={item.to}>
            <Card className="hover:border-brand/40 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="text-2xl font-display font-bold">{item.value}</div>
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.hint}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
