import { getSession } from "@/lib/session";
import { staff as allStaff, stores, fmtINR, incentive, courses } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Target, GraduationCap, Award, Megaphone, CalendarCheck, Store as StoreIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function StaffDashboard() {
  const session = getSession();
  const me = allStaff.find((s) => s.email === session?.email) ?? allStaff[0];
  const store = stores.find((s) => s.id === me.storeId) ?? stores[0];

  const [checkedIn, setCheckedIn] = useState(false);
  const pct = Math.min(100, Math.round((me.achieved / me.monthlyTarget) * 100));
  const myCourses = courses.filter((c) => c.assignedTo.includes(me.id));
  const myIncentive = incentive(me.achieved);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-gradient-to-r from-card to-accent/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              {greeting()}, <span className="text-brand">{session?.name.split(" ")[0]}</span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <StoreIcon className="h-3.5 w-3.5" /> {store.name} · {store.city}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {!checkedIn ? (
              <Button
                onClick={() => setCheckedIn(true)}
                className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm gap-1.5"
              >
                <MapPin className="h-4 w-4" /> Check In
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Checked in</span>
              </div>
            )}
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 42m from {store.name}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Attendance", value: me.attendanceRate + "%", icon: CalendarCheck, tint: "bg-emerald-500/10 text-emerald-700", to: "/attendance" },
          { label: "My target", value: pct + "%", icon: Target, tint: "bg-brand/10 text-brand", to: "/targets" },
          { label: "Incentive", value: fmtINR(myIncentive), icon: Award, tint: "bg-[color:var(--golden)]/15 text-[color:var(--brown)]", to: "/incentives" },
          { label: "Courses done", value: me.coursesCompleted, icon: GraduationCap, tint: "bg-info/10 text-info", to: "/courses" },
        ].map((k) => (
          <Link key={k.label} to={k.to}>
            <Card className="hover:border-brand/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.tint}`}>
                  <k.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-2xl font-display font-bold">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-brand" /> Monthly target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3 [&>div]:bg-brand" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fmtINR(me.achieved)} achieved</span>
              <span>Target: {fmtINR(me.monthlyTarget)}</span>
            </div>
            <div className="rounded-md bg-[color:var(--golden)]/10 border border-[color:var(--golden)]/20 px-3 py-2 text-sm">
              <div className="text-[11px] text-muted-foreground">Your incentive this month</div>
              <div className="font-display font-bold text-[color:var(--brown)] text-lg">{fmtINR(myIncentive)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-brand" /> My courses
            </CardTitle>
            <Link to="/courses" className="text-xs text-brand hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myCourses.length === 0 && (
              <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
            )}
            {myCourses.slice(0, 3).map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`} className="block group">
                <div className="flex items-center gap-3 rounded-md hover:bg-accent/40 -mx-2 px-2 py-1.5 transition-colors">
                  <div className="h-8 w-10 rounded shrink-0" style={{ background: c.cover }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate group-hover:text-brand transition-colors">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">{c.duration} · {c.level}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{c.category}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-[color:var(--golden)]" /> My badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {me.badges.map((b) => (
                <Badge key={b} className="bg-[color:var(--golden)]/15 text-[color:var(--brown)] border-[color:var(--golden)]/30 hover:bg-[color:var(--golden)]/20">
                  {b}
                </Badge>
              ))}
              {!me.badges.length && <span className="text-sm text-muted-foreground">No badges yet. Complete a course to earn one!</span>}
            </div>
          </CardContent>
        </Card>

        <Link to="/notices">
          <Card className="hover:border-brand/40 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-brand" /> Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                2 unread notices from your store and HQ. Tap to view.
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
