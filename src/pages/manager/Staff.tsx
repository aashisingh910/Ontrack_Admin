import { getSession } from "@/lib/session";
import { managers, getStaffByStore, stores, initials, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Award, CalendarCheck, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManagerStaff() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];
  const team = getStaffByStore(store.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Team</h1>
        <p className="text-sm text-muted-foreground">
          {store.name} · {store.city} · {team.length} staff members
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
        {team.map((s) => {
          const pct = Math.min(100, Math.round((s.achieved / s.monthlyTarget) * 100));
          return (
            <Link key={s.id} to={`/staff/${s.id}`} className="block group">
              <Card className="hover:border-brand/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                      style={{ background: s.avatarColor }}
                    >
                      {initials(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold group-hover:text-brand transition-colors truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.email}</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Monthly target</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 [&>div]:bg-brand" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{fmtINR(s.achieved)}</span>
                      <span>of {fmtINR(s.monthlyTarget)}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-md bg-secondary p-1.5">
                      <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                        <CalendarCheck className="h-3 w-3" />
                      </div>
                      <div className="font-semibold">{s.attendanceRate}%</div>
                      <div className="text-muted-foreground">Attendance</div>
                    </div>
                    <div className="rounded-md bg-secondary p-1.5">
                      <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                      </div>
                      <div className="font-semibold">{s.coursesCompleted}</div>
                      <div className="text-muted-foreground">Courses</div>
                    </div>
                    <div className="rounded-md bg-secondary p-1.5">
                      <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                        <Award className="h-3 w-3" />
                      </div>
                      <div className="font-semibold">{fmtINR(incentive(s.achieved))}</div>
                      <div className="text-muted-foreground">Incentive</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.badges.map((b) => (
                      <Badge key={b} variant="secondary" className="text-[10px] py-0 h-5">{b}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
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
              <div className="text-2xl font-display font-bold">
                {Math.round(team.reduce((a, s) => a + s.attendanceRate, 0) / team.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg attendance</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold">
                {team.reduce((a, s) => a + s.coursesCompleted, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Courses done</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold">
                {fmtINR(team.reduce((a, s) => a + incentive(s.achieved), 0))}
              </div>
              <div className="text-xs text-muted-foreground">Incentive pool</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
