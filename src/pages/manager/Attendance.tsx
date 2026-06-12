import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { managerApi } from "@/services/managerApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CalendarDays,
  Store as StoreIcon,
  Loader2,
} from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "WEEKLY_OFF" | "LEAVE" | "HALF_DAY";

interface ApiAttendance {
  _id: string;
  employeeCode: string;
  employeeName: string;
  role: "MANAGER" | "STAFF";
  storeCode: string;
  storeName: string;
  city: string;
  attendanceDate: string;
  dayName: string;
  status: AttendanceStatus;
  checkIn: {
    time: string | null;
    geofenceStatus: "INSIDE" | "OUTSIDE" | "NOT_APPLICABLE";
  };
  checkOut: { time: string | null };
  workingMinutes: number;
  lateMinutes: number;
  dayScore: number | null;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<AttendanceStatus, { label: string; cls: string }> = {
  PRESENT:    { label: "Present",    cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  LATE:       { label: "Late",       cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  ABSENT:     { label: "Absent",     cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  LEAVE:      { label: "On leave",   cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  HALF_DAY:   { label: "Half day",   cls: "bg-purple-500/15 text-purple-700 border-purple-500/30" },
  WEEKLY_OFF: { label: "Weekly off", cls: "bg-slate-500/15 text-slate-600 border-slate-500/30" },
};

// ─── component ───────────────────────────────────────────────────────────────

export default function ManagerAttendance() {
  const session = getSession();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState("all");
  const [records, setRecords] = useState<ApiAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await managerApi.attendance(date);
      // API may return an array directly or { records: [] }
      setRecords(Array.isArray(result) ? result : (result?.records ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return records;
    return records.filter((r) => r.status === statusFilter.toUpperCase());
  }, [records, statusFilter]);

  const stats = useMemo(() => ({
    total:   records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    late:    records.filter((r) => r.status === "LATE").length,
    absent:  records.filter((r) => r.status === "ABSENT").length,
    leave:   records.filter((r) => r.status === "LEAVE").length,
  }), [records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <StoreIcon className="h-3.5 w-3.5" />
            {session?.storeName || "My store"} · {session?.city || ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <div className="relative">
              <CalendarDays className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-7 w-[160px]"
              />
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
                <SelectItem value="weekly_off">Weekly off</SelectItem>
                <SelectItem value="half_day">Half day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Users,        label: "Roster",   value: stats.total,   tint: "bg-brand/10 text-brand" },
          { icon: CheckCircle2, label: "Present",  value: stats.present, tint: "bg-emerald-500/10 text-emerald-700" },
          { icon: Clock,        label: "Late",     value: stats.late,    tint: "bg-amber-500/10 text-amber-700" },
          { icon: XCircle,      label: "Absent",   value: stats.absent,  tint: "bg-red-500/10 text-red-700" },
          { icon: MapPin,       label: "On leave", value: stats.leave,   tint: "bg-sky-500/10 text-sky-700" },
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Team roster —{" "}
            {new Date(date).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-sm text-red-600 mb-2">{error}</div>
              <button onClick={fetchAttendance} className="rounded-md border px-3 py-1.5 text-xs">
                Retry
              </button>
            </div>
          ) : !filtered.length ? (
            <div className="p-6 text-sm text-center text-muted-foreground">
              No records for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Geofence</TableHead>
                    <TableHead>Working</TableHead>
                    <TableHead>Late by</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const meta = STATUS_META[r.status] ?? { label: r.status, cls: "" };
                    const geo = r.checkIn?.geofenceStatus ?? "NOT_APPLICABLE";
                    return (
                      <TableRow key={r._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-brand/15 text-brand grid place-items-center text-[11px] font-semibold shrink-0">
                              {r.employeeName
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{r.employeeName}</div>
                              <div className="text-[11px] text-muted-foreground">{r.employeeCode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">
                          {r.role.toLowerCase()}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{formatTime(r.checkIn?.time ?? null)}</TableCell>
                        <TableCell className="text-sm tabular-nums">{formatTime(r.checkOut?.time ?? null)}</TableCell>
                        <TableCell className="text-xs">
                          {geo !== "NOT_APPLICABLE" ? (
                            <span className={`flex items-center gap-1 ${geo === "INSIDE" ? "text-emerald-700" : "text-red-600"}`}>
                              <MapPin className="h-3 w-3" /> {geo}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          {r.workingMinutes > 0
                            ? `${Math.floor(r.workingMinutes / 60)}h ${r.workingMinutes % 60}m`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          {r.lateMinutes > 0 ? `${r.lateMinutes}m` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
                            {meta.label}
                          </Badge>
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
