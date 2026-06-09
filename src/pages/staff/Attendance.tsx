import { useState } from "react";
import { getSession } from "@/lib/session";
import { staff as allStaff, stores } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2, XCircle, Clock, CalendarDays, Store as StoreIcon, LogOut } from "lucide-react";
import { toast } from "sonner";

type Status = "present" | "late" | "absent" | "leave";

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  present: { label: "Present", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  late:    { label: "Late",    cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  absent:  { label: "Absent",  cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  leave:   { label: "On leave", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
};

const historyData = [
  { date: "2026-06-07", checkIn: "09:14", checkOut: "18:32", status: "present" as Status, distance: 38 },
  { date: "2026-06-06", checkIn: "09:44", checkOut: "18:15", status: "late" as Status, distance: 52 },
  { date: "2026-06-05", checkIn: "09:08", checkOut: "18:45", status: "present" as Status, distance: 29 },
  { date: "2026-06-04", checkIn: undefined, checkOut: undefined, status: "absent" as Status, distance: undefined },
  { date: "2026-06-03", checkIn: "09:01", checkOut: "18:28", status: "present" as Status, distance: 61 },
  { date: "2026-06-02", checkIn: "09:12", checkOut: "18:20", status: "present" as Status, distance: 44 },
  { date: "2026-05-31", checkIn: undefined, checkOut: undefined, status: "leave" as Status, distance: undefined },
];

export default function StaffAttendance() {
  const session = getSession();
  const me = allStaff.find((s) => s.email === session?.email) ?? allStaff[0];
  const store = stores.find((s) => s.id === me.storeId) ?? stores[0];

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    setCheckedIn(true);
    const now = new Date();
    setCheckInTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    toast.success("Checked in successfully! 42m from store — within geofence.");
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    toast.success("Checked out. Have a great day!");
  };

  const presentDays = historyData.filter((d) => d.status === "present" || d.status === "late").length;
  const totalDays = historyData.filter((d) => d.status !== "leave").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Attendance</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <StoreIcon className="h-3.5 w-3.5" /> {store.name} · {store.city}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1.5" style={{ background: checkedIn ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, var(--brand), var(--golden))" }} />
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Today</div>
              <div className="font-display text-lg font-bold mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>42m from {store.name} — within geofence (200m)</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!checkedIn ? (
                <Button onClick={handleCheckIn} className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm gap-1.5 h-10 px-5">
                  <MapPin className="h-4 w-4" /> Check In
                </Button>
              ) : (
                <div className="space-y-2 text-right">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Checked in at {checkInTime}</span>
                  </div>
                  <Button onClick={handleCheckOut} variant="outline" size="sm" className="gap-1.5">
                    <LogOut className="h-3.5 w-3.5" /> Check Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "This month", value: presentDays + "/" + totalDays + " days", icon: CalendarDays, tint: "bg-brand/10 text-brand" },
          { label: "Rate", value: me.attendanceRate + "%", icon: CheckCircle2, tint: "bg-emerald-500/10 text-emerald-700" },
          { label: "Late arrivals", value: historyData.filter((d) => d.status === "late").length, icon: Clock, tint: "bg-amber-500/10 text-amber-700" },
          { label: "Absences", value: historyData.filter((d) => d.status === "absent").length, icon: XCircle, tint: "bg-red-500/10 text-red-700" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-3">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Recent history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {historyData.map((d, i) => {
              const meta = STATUS_META[d.status];
              return (
                <div key={i} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                  <div className="col-span-4">
                    <div className="font-medium">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
                  </div>
                  <div className="col-span-2 tabular-nums text-muted-foreground">{d.checkIn ?? "—"}</div>
                  <div className="col-span-2 tabular-nums text-muted-foreground">{d.checkOut ?? "—"}</div>
                  <div className="col-span-2 text-xs">
                    {d.distance != null ? (
                      <span className="text-emerald-700 flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {d.distance}m
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Badge variant="outline" className={meta.cls + " text-[10px]"}>{meta.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
