import { getSession } from "@/lib/session";
import { staff as allStaff, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Wallet, CalendarDays, CalendarRange, Trophy } from "lucide-react";

export default function StaffTargets() {
  const session = getSession();
  const me = allStaff.find((s) => s.email === session?.email) ?? allStaff[0];

  const monthly = { target: me.monthlyTarget, achieved: me.achieved };
  const weekly  = { target: Math.round(me.monthlyTarget / 4.3), achieved: Math.round(me.achieved / 4.3) };
  const yearly  = { target: me.monthlyTarget * 12, achieved: me.achieved * 8 };

  const pct = (a: number, t: number) => Math.min(100, Math.round((a / t) * 100));

  const statusBadge = (p: number) => {
    if (p >= 100) return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">Achieved</Badge>;
    if (p >= 60) return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20">On track</Badge>;
    return <Badge className="bg-red-500/15 text-red-700 border-red-500/30 hover:bg-red-500/20">Behind</Badge>;
  };

  const periods = [
    { label: "Weekly target", icon: CalendarDays, ...weekly, period: "This week" },
    { label: "Monthly target", icon: CalendarRange, ...monthly, period: "June 2026" },
    { label: "Yearly target", icon: Trophy, ...yearly, period: "FY 2026–27" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Targets</h1>
        <p className="text-sm text-muted-foreground">Track your weekly, monthly and yearly performance goals.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, label: "Monthly achieved", value: fmtINR(monthly.achieved), tint: "bg-brand/10 text-brand" },
          { icon: Wallet, label: "My incentive (10%)", value: fmtINR(incentive(me.achieved)), tint: "bg-[color:var(--golden)]/15 text-[color:var(--brown)]" },
          { icon: Target, label: "Monthly target", value: fmtINR(monthly.target), tint: "bg-info/10 text-info" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${k.tint}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="font-display text-base font-bold">{k.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {periods.map((p) => {
          const percent = pct(p.achieved, p.target);
          return (
            <Card key={p.label}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base font-display">
                    <p.icon className="h-4 w-4 text-brand" /> {p.label}
                  </CardTitle>
                  {statusBadge(percent)}
                </div>
                <div className="text-[11px] text-muted-foreground">{p.period}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2.5 [&>div]:bg-brand" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-md bg-secondary px-3 py-2">
                    <div className="text-muted-foreground">Achieved</div>
                    <div className="font-semibold">{fmtINR(p.achieved)}</div>
                  </div>
                  <div className="rounded-md bg-secondary px-3 py-2">
                    <div className="text-muted-foreground">Remaining</div>
                    <div className="font-semibold">{fmtINR(Math.max(0, p.target - p.achieved))}</div>
                  </div>
                </div>
                <div className="rounded-md bg-[color:var(--golden)]/10 border border-[color:var(--golden)]/20 px-3 py-2 text-[11px]">
                  <div className="text-muted-foreground">Incentive earned</div>
                  <div className="font-semibold text-[color:var(--brown)]">{fmtINR(incentive(p.achieved))}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[color:var(--golden)]" /> Tips to improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Greet every customer within 30 seconds of entering the department.</li>
            <li>Use the FAB framework (Features, Advantages, Benefits) when presenting products.</li>
            <li>Suggest add-on items to increase average order value.</li>
            <li>Follow up on enquiries within 24 hours.</li>
            <li>Complete your pending courses to unlock new selling techniques.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
