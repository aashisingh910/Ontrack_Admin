import { getSession } from "@/lib/session";
import { staff as allStaff, courses } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Clock, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function StaffCourses() {
  const session = getSession();
  const me = allStaff.find((s) => s.email === session?.email) ?? allStaff[0];
  const myCourses = courses.filter((c) => c.assignedTo.includes(me.id));

  const simulatedProgress: Record<string, number> = {
    c1: 60, c2: 100, c3: 100, c4: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          {myCourses.length} course{myCourses.length !== 1 ? "s" : ""} assigned · {me.coursesCompleted} completed
        </p>
      </div>

      {!myCourses.length && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No courses assigned yet. Check back soon.
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {myCourses.map((course) => {
          const pct = simulatedProgress[course.id] ?? 0;
          const done = pct >= 100;
          return (
            <Link key={course.id} to={`/courses/${course.id}`} className="block group">
              <Card className="hover:border-brand/40 transition-colors overflow-hidden h-full">
                <div className="h-24 w-full" style={{ background: course.cover }} />
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <Badge variant="secondary" className="text-[10px]">{course.level}</Badge>
                    <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
                    {done && (
                      <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="font-semibold group-hover:text-brand transition-colors leading-tight">{course.title}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.summary}</p>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lessons.length} lessons</span>
                    {course.certificate && (
                      <span className="flex items-center gap-1 text-[color:var(--golden)]">
                        <GraduationCap className="h-3 w-3" /> Certificate
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} className={`h-1.5 ${done ? "[&>div]:bg-emerald-500" : "[&>div]:bg-brand"}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
