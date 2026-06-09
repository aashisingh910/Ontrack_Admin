import { getSession } from "@/lib/session";
import { managers, stores, getStaffByStore, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";

export default function ManagerIncentives() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];
  const team = getStaffByStore(store.id);

  const ranked = [...team].sort((a, b) => incentive(b.achieved) - incentive(a.achieved));
  const total = ranked.reduce((a, s) => a + incentive(s.achieved), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Incentives</h1>
        <p className="text-sm text-muted-foreground">{store.name} team leaderboard — 10% of achieved target.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-2" style={{ background: "linear-gradient(90deg, var(--brand), var(--golden))" }} />
        <CardContent className="p-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total incentive pool</div>
            <div className="text-3xl font-display font-bold text-[color:var(--brown)]">{fmtINR(total)}</div>
            <div className="text-xs text-muted-foreground">{store.name} · {team.length} staff</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4 text-[color:var(--golden)]" />
            10% of each staff's achieved sales.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" /> Store leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!ranked.length ? (
            <div className="p-6 text-sm text-center text-muted-foreground">No staff in your store yet.</div>
          ) : (
            <div className="divide-y">
              {ranked.map((s, idx) => (
                <div key={s.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
                  <div className="col-span-1 text-sm font-mono text-muted-foreground">#{idx + 1}</div>
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold"
                      style={{ background: s.avatarColor }}
                    >
                      {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">Attendance: {s.attendanceRate}%</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs">
                    <div className="text-muted-foreground">Achieved</div>
                    <div className="font-medium">{fmtINR(s.achieved)}</div>
                  </div>
                  <div className="col-span-3 text-right">
                    <div className="text-xs text-muted-foreground">Incentive</div>
                    <div className="font-display font-bold text-brand">{fmtINR(incentive(s.achieved))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
