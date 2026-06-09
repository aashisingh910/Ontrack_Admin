import { Link, useParams } from "react-router-dom";
import { getStaff, getStore, getManagerByStore, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Award, GraduationCap, CalendarCheck, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StaffDetail() {
  const { staffId } = useParams<{ staffId: string }>();
  const s = getStaff(staffId!);

  if (!s) {
    return <div className="p-8 text-muted-foreground">Staff not found.</div>;
  }

  const store = getStore(s.storeId)!;
  const manager = getManagerByStore(s.storeId);
  const pct = Math.min(100, Math.round((s.achieved / s.monthlyTarget) * 100));

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/staff"><ArrowLeft className="h-4 w-4 mr-1" /> All staff</Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="h-20" style={{ background: "linear-gradient(120deg, var(--brand), var(--golden))" }} />
        <CardContent className="p-6 -mt-10">
          <div className="flex flex-wrap items-end gap-4">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl text-white text-2xl font-display font-bold ring-4 ring-card shadow-warm" style={{ background: s.avatarColor }}>
              {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </span>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-display font-bold">{s.name}</h1>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>
                <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>
              </div>
              <div className="mt-2 text-sm">
                <Link to={`/stores/${store.id}`} className="text-brand hover:underline font-medium">{store.name}</Link>
                <span className="text-muted-foreground"> · {store.city} · Reports to {manager?.name}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline"><Target className="h-4 w-4 mr-1" /> Set target</Button>
              <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Message</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Monthly target" value={fmtINR(s.monthlyTarget)} sub={`Achieved ${fmtINR(s.achieved)}`} pct={pct} />
        <StatCard label="Incentive (MTD)" value={fmtINR(incentive(s.achieved))} sub="10% of achieved" tint="text-brown" />
        <StatCard label="Attendance" value={`${s.attendanceRate}%`} sub="Last 30 days" icon={CalendarCheck} tint="text-success" />
        <StatCard label="Courses done" value={`${s.coursesCompleted}`} sub={`${s.badges.length} badges`} icon={GraduationCap} tint="text-info" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-golden" /> Badges & certifications</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {s.badges.length === 0 && <p className="text-sm text-muted-foreground">No badges yet.</p>}
          {s.badges.map((b: string) => (
            <span key={b} className="inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1.5 text-xs font-medium">
              <Award className="h-3.5 w-3.5 text-golden" /> {b}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label, value, sub, pct, icon: Icon, tint,
}: { label: string; value: string; sub?: string; pct?: number; icon?: typeof Target; tint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          {Icon && <Icon className={`h-4 w-4 ${tint ?? "text-brand"}`} />}
        </div>
        <div className={`mt-2 text-2xl font-display font-bold ${tint ?? ""}`}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        {typeof pct === "number" && <Progress value={pct} className="mt-3 h-1.5 [&>div]:bg-brand" />}
      </CardContent>
    </Card>
  );
}
