import { getSession } from "@/lib/session";
import { managers, stores, getStaffByStore, courses } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManagerCourses() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];
  const team = getStaffByStore(store.id);
  const teamIds = team.map((s) => s.id);

  const relevantCourses = courses.filter(
    (c) => c.assignedTo.some((id) => teamIds.includes(id)) || c.assignedTo.length === 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Courses</h1>
        <p className="text-sm text-muted-foreground">
          Track your team's learning progress at {store.name}.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: BookOpen, label: "Active courses", value: relevantCourses.length, tint: "bg-brand/10 text-brand" },
          { icon: Users, label: "Team enrolled", value: relevantCourses.reduce((a, c) => a + c.assignedTo.filter((id) => teamIds.includes(id)).length, 0), tint: "bg-info/10 text-info" },
          { icon: CheckCircle2, label: "Avg completion", value: relevantCourses.length ? Math.round(relevantCourses.reduce((a, c) => a + c.completionRate, 0) / relevantCourses.length) + "%" : "—", tint: "bg-emerald-500/10 text-emerald-700" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-md flex items-center justify-center ${k.tint}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="font-display text-xl font-bold">{k.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {relevantCourses.map((course) => {
          const enrolled = course.assignedTo.filter((id) => teamIds.includes(id));
          const pct = course.completionRate;
          return (
            <Card key={course.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-12 w-16 rounded-md shrink-0" style={{ background: course.cover }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold">{course.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{course.level}</Badge>
                      <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{course.summary}</p>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Team completion</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5 [&>div]:bg-brand" />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-1">
                        {team.filter((s) => enrolled.includes(s.id)).map((s) => (
                          <span
                            key={s.id}
                            title={s.name}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-semibold ring-2 ring-background"
                            style={{ background: s.avatarColor }}
                          >
                            {s.name[0]}
                          </span>
                        ))}
                        {!enrolled.length && <span className="text-xs text-muted-foreground">Not assigned to your team</span>}
                      </div>
                      <Link to={`/courses/${course.id}`} className="text-xs text-brand hover:underline">
                        View course →
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!relevantCourses.length && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No courses assigned yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
