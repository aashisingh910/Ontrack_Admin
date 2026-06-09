import { useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { managers, stores, staff as allStaff, initials } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, CheckCircle2, XCircle, Clock, Users, CalendarDays, Store as StoreIcon } from "lucide-react";

type Status = "present" | "late" | "absent" | "leave";

type AttRecord = {
  id: string;
  personId: string;
  personName: string;
  role: "manager" | "staff";
  checkIn?: string;
  checkOut?: string;
  status: Status;
  distance?: number;
};

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  present: { label: "Present", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  late:    { label: "Late",    cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  absent:  { label: "Absent",  cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  leave:   { label: "On leave", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
};

function seed(people: { id: string; name: string; role: "manager" | "staff" }[]): AttRecord[] {
  return people.map((p, idx) => {
    const s = (idx * 37) % 100;
    let status: Status = "present";
    let checkIn: string | undefined = `0${9 + (idx % 2)}:${(s % 50).toString().padStart(2, "0")}`;
    let checkOut: string | undefined = `1${8 + (idx % 2)}:${((s + 12) % 60).toString().padStart(2, "0")}`;
    let distance: number | undefined = s % 180;
    if (s > 88) { status = "absent"; checkIn = undefined; checkOut = undefined; distance = undefined; }
    else if (s > 78) { status = "leave"; checkIn = undefined; checkOut = undefined; distance = undefined; }
    else if (s > 60) { status = "late"; checkIn = `10:${(s % 50).toString().padStart(2, "0")}`; }
    return { id: `att-${p.id}`, personId: p.id, personName: p.name, role: p.role, checkIn, checkOut, status, distance };
  });
}

export default function ManagerAttendance() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState("all");

  const people = useMemo(() => [
    { id: mgr.id, name: mgr.name, role: "manager" as const },
    ...allStaff.filter((s) => s.storeId === store.id).map((s) => ({ id: s.id, name: s.name, role: "staff" as const })),
  ], [mgr, store]);

  const records = useMemo(() => seed(people), [people, date]);

  const filtered = useMemo(
    () => statusFilter === "all" ? records : records.filter((r) => r.status === statusFilter),
    [records, statusFilter],
  );

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    leave: records.filter((r) => r.status === "leave").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <StoreIcon className="h-3.5 w-3.5" /> {store.name} · {store.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <div className="relative">
              <CalendarDays className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-7 w-[160px]" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Roster", value: stats.total, tint: "bg-brand/10 text-brand" },
          { icon: CheckCircle2, label: "Present", value: stats.present, tint: "bg-emerald-500/10 text-emerald-700" },
          { icon: Clock, label: "Late", value: stats.late, tint: "bg-amber-500/10 text-amber-700" },
          { icon: XCircle, label: "Absent", value: stats.absent, tint: "bg-red-500/10 text-red-700" },
          { icon: MapPin, label: "On leave", value: stats.leave, tint: "bg-sky-500/10 text-sky-700" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-3">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team roster — {new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!filtered.length ? (
            <div className="p-6 text-sm text-center text-muted-foreground">No records for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Geofence</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const meta = STATUS_META[r.status];
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-brand/15 text-brand grid place-items-center text-[11px] font-semibold">
                              {initials(r.personName)}
                            </div>
                            <span className="text-sm font-medium">{r.personName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">{r.role}</TableCell>
                        <TableCell className="text-sm tabular-nums">{r.checkIn ?? "—"}</TableCell>
                        <TableCell className="text-sm tabular-nums">{r.checkOut ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {r.distance != null ? (
                            <span className={`inline-flex items-center gap-1 ${r.distance > 200 ? "text-red-600" : "text-emerald-700"}`}>
                              <MapPin className="h-3 w-3" /> {r.distance}m
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
