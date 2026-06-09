import { getSession } from "@/lib/session";
import { staff as allStaff, stores, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Phone, Mail, MapPin, CalendarDays, Award, BookOpen, Target, Store as StoreIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "@/lib/session";

export default function StaffProfile() {
  const session = getSession();
  const navigate = useNavigate();
  const me = allStaff.find((s) => s.email === session?.email) ?? allStaff[0];
  const store = stores.find((s) => s.id === me.storeId) ?? stores[0];

  const pct = Math.min(100, Math.round((me.achieved / me.monthlyTarget) * 100));

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your personal details and performance summary.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span
              className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white text-2xl font-bold"
              style={{ background: me.avatarColor }}
            >
              {me.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-display font-bold">{me.name}</div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="capitalize">Staff</Badge>
                <Badge variant="outline" className="text-[10px]">{store.city}</Badge>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {me.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {me.phone}</div>
                <div className="flex items-center gap-2"><StoreIcon className="h-3.5 w-3.5" /> {store.name} · {store.address}</div>
                <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Joined {new Date(me.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-brand" /> This month's target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2 [&>div]:bg-brand" />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded bg-secondary p-2">
                <div className="text-muted-foreground">Achieved</div>
                <div className="font-semibold">{fmtINR(me.achieved)}</div>
              </div>
              <div className="rounded bg-secondary p-2">
                <div className="text-muted-foreground">Incentive</div>
                <div className="font-semibold text-[color:var(--brown)]">{fmtINR(incentive(me.achieved))}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-brand" /> Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded bg-secondary p-2 text-center">
                <div className="text-2xl font-display font-bold">{me.coursesCompleted}</div>
                <div className="text-muted-foreground">Courses done</div>
              </div>
              <div className="rounded bg-secondary p-2 text-center">
                <div className="text-2xl font-display font-bold">{me.attendanceRate}%</div>
                <div className="text-muted-foreground">Attendance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Award className="h-3 w-3 mr-1" /> {b}
              </Badge>
            ))}
            {!me.badges.length && <span className="text-sm text-muted-foreground">No badges yet.</span>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
