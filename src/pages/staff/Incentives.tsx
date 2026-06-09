import { getSession } from "@/lib/session";
import { staff as allStaff, getStaffByStore, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Trophy } from "lucide-react";

export default function StaffIncentives() {
  const session = getSession();
  const me = allStaff.find((s) => s.email === session?.email) ?? allStaff[0];
  const storeTeam = getStaffByStore(me.storeId);
  const ranked = [...storeTeam].sort((a, b) => incentive(b.achieved) - incentive(a.achieved));
  const myRank = ranked.findIndex((s) => s.id === me.id) + 1;
  const myIncentive = incentive(me.achieved);
  const pct = Math.min(100, Math.round((me.achieved / me.monthlyTarget) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Incentives</h1>
        <p className="text-sm text-muted-foreground">Your earnings and store leaderboard this month.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-2" style={{ background: "linear-gradient(90deg, var(--brand), var(--golden))" }} />
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your incentive this month</div>
              <div className="text-4xl font-display font-bold text-[color:var(--brown)] mt-1">{fmtINR(myIncentive)}</div>
              <div className="text-xs text-muted-foreground mt-1">10% of {fmtINR(me.achieved)} achieved</div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Store rank</div>
              <div className="flex items-center gap-2 mt-1">
                {myRank === 1 && <Trophy className="h-5 w-5 text-[color:var(--golden)]" />}
                <div className="text-4xl font-display font-bold text-brand">#{myRank}</div>
              </div>
              <div className="text-xs text-muted-foreground">of {storeTeam.length}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Target progress</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 [&>div]:bg-brand" />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>{fmtINR(me.achieved)} of {fmtINR(me.monthlyTarget)}</span>
              <span>{fmtINR(Math.max(0, me.monthlyTarget - me.achieved))} to go</span>
            </div>
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
          <div className="divide-y">
            {ranked.map((s, idx) => {
              const isMe = s.id === me.id;
              return (
                <div
                  key={s.id}
                  className={`grid grid-cols-12 items-center gap-3 px-5 py-3 ${isMe ? "bg-brand/5" : ""}`}
                >
                  <div className="col-span-1 text-sm font-mono text-muted-foreground flex items-center">
                    {idx === 0 ? <Trophy className="h-4 w-4 text-[color:var(--golden)]" /> : `#${idx + 1}`}
                  </div>
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold"
                      style={{ background: s.avatarColor }}
                    >
                      {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {s.name}
                        {isMe && <Badge className="text-[9px] h-4 px-1 bg-brand text-brand-foreground hover:bg-brand/90">You</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{s.attendanceRate}% attendance</div>
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-[color:var(--golden)] mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">How incentives work: </span>
              You earn 10% of your monthly achieved sales as a cash incentive. Incentives are paid on the 5th of the following month. Minimum attendance of 90% required to qualify.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
