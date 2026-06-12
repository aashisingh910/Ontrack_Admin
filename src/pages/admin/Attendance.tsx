import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Store as StoreIcon,
  CalendarDays,
  Filter,
  Loader2,
} from "lucide-react";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "WEEKLY_OFF" | "LEAVE" | "HALF_DAY";
type MappedStatus = "present" | "late" | "absent" | "leave";

interface ApiAttendance {
  _id: string;
  attendanceId: string;
  employeeCode: string;
  employeeName: string;
  role: "MANAGER" | "STAFF";
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  attendanceDate: string;
  dayName: string;
  status: AttendanceStatus;
  checkIn: {
    time: string | null;
    latitude: number | null;
    longitude: number | null;
    geofenceStatus: "INSIDE" | "OUTSIDE" | "NOT_APPLICABLE";
    source: string | null;
  };
  checkOut: {
    time: string | null;
    latitude: number | null;
    longitude: number | null;
    geofenceStatus: "INSIDE" | "OUTSIDE" | "NOT_APPLICABLE";
    source: string | null;
  };
  workingMinutes: number;
  lateMinutes: number;
  earlyCheckoutMinutes: number;
  dayScore: number | null;
  leaveType: string | null;
  leaveApprovalStatus: string | null;
  reason: string;
  correctionRequest: any;
  approval: any;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  role: "manager" | "staff";
  storeId: string;
  storeName: string;
  city: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: MappedStatus;
  geofenceStatus: "INSIDE" | "OUTSIDE" | "NOT_APPLICABLE";
  workingMinutes: number;
  lateMinutes: number;
  dayScore: number | null;
}

interface StoreInfo {
  id: string;
  name: string;
  city: string;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function formatTime(isoString: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapStatus(apiStatus: AttendanceStatus): MappedStatus {
  switch (apiStatus) {
    case "PRESENT":
      return "present";
    case "LATE":
      return "late";
    case "ABSENT":
      return "absent";
    case "WEEKLY_OFF":
    case "LEAVE":
    case "HALF_DAY":
      return "leave";
    default:
      return "absent";
  }
}

function transformApiRecord(api: ApiAttendance): AttendanceRecord {
  return {
    id: api._id,
    personId: api.employeeCode,
    personName: api.employeeName,
    role: api.role === "MANAGER" ? "manager" : "staff",
    storeId: api.storeCode,
    storeName: api.storeName,
    city: api.city,
    checkInTime: formatTime(api.checkIn?.time ?? null),
    checkOutTime: formatTime(api.checkOut?.time ?? null),
    status: mapStatus(api.status),
    geofenceStatus: api.checkIn?.geofenceStatus ?? "NOT_APPLICABLE",
    workingMinutes: api.workingMinutes,
    lateMinutes: api.lateMinutes,
    dayScore: api.dayScore,
  };
}

// ----------------------------------------------------------------------
// API call
// ----------------------------------------------------------------------

async function fetchAttendance(date: string): Promise<AttendanceRecord[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/aashi/attendance?date=${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Unknown error");
  return json.data.map(transformApiRecord);
}

// ----------------------------------------------------------------------
// Status badge meta
// ----------------------------------------------------------------------

const STATUS_META: Record<MappedStatus, { label: string; cls: string }> = {
  present: { label: "Present", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  late: { label: "Late", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  absent: { label: "Absent", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  leave: { label: "On leave", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
};

// ----------------------------------------------------------------------
// Helper to safely get storeCode/employeeCode from session
// ----------------------------------------------------------------------

function getSessionStoreCode(session: any): string | undefined {
  return session?.storeCode ?? session?.user?.storeCode ?? session?.storeId;
}

function getSessionEmployeeCode(session: any): string | undefined {
  return session?.employeeCode ?? session?.user?.employeeCode ?? session?.employeeId;
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function Attendance() {
  const session = getSession();
  const role = session?.role ?? "admin";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load data when date changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAttendance(date)
      .then(setRecords)
      .catch((err) => {
        console.error(err);
        setError("Failed to load attendance data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [date]);

  // Apply role and filter logic
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Role-based restriction
    if (role === "manager") {
      const myStoreId = getSessionStoreCode(session);
      if (myStoreId) filtered = filtered.filter((r) => r.storeId === myStoreId);
    } else if (role === "staff") {
      const myEmployeeCode = getSessionEmployeeCode(session);
      if (myEmployeeCode) filtered = filtered.filter((r) => r.personId === myEmployeeCode);
    }

    // Store filter (only for admin/manager if they have multiple stores)
    if (storeFilter !== "all") filtered = filtered.filter((r) => r.storeId === storeFilter);

    // Status filter
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);

    return filtered;
  }, [records, role, session, storeFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const count = (s: MappedStatus) => filteredRecords.filter((r) => r.status === s).length;
    return {
      total,
      present: count("present"),
      late: count("late"),
      absent: count("absent"),
      leave: count("leave"),
    };
  }, [filteredRecords]);

  // Unique stores for filter (from current loaded records)
  const uniqueStores = useMemo(() => {
    const storeMap = new Map<string, StoreInfo>();
    for (const r of records) {
      if (!storeMap.has(r.storeId)) {
        storeMap.set(r.storeId, { id: r.storeId, name: r.storeName, city: r.city });
      }
    }
    return Array.from(storeMap.values());
  }, [records]);

  // Group by store for "By store" tab
  const storesWithRecords = useMemo(() => {
    const map = new Map<string, { store: StoreInfo; records: AttendanceRecord[] }>();
    for (const r of filteredRecords) {
      if (!map.has(r.storeId)) {
        map.set(r.storeId, {
          store: { id: r.storeId, name: r.storeName, city: r.city },
          records: [],
        });
      }
      map.get(r.storeId)!.records.push(r);
    }
    return Array.from(map.values()).map(({ store, records }) => ({
      store,
      records,
      presentCount: records.filter((r) => r.status === "present" || r.status === "late").length,
    }));
  }, [filteredRecords]);

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header & filters */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Real‑time attendance with geo‑fencing. Check‑ins are validated inside a 200m radius of the store.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
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

          {(role === "admin" || role === "manager") && uniqueStores.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Store</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {uniqueStores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile icon={Users} label="On roster" value={stats.total} tint="brand" />
        <StatTile icon={CheckCircle2} label="Present" value={stats.present} tint="emerald" />
        <StatTile icon={Clock} label="Late" value={stats.late} tint="amber" />
        <StatTile icon={XCircle} label="Absent" value={stats.absent} tint="red" />
        <StatTile icon={MapPin} label="On leave" value={stats.leave} tint="sky" />
      </div>

      {/* Loading / error state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Main content */}
      {!loading && !error && (
        <Tabs defaultValue={role === "admin" ? "stores" : "list"}>
          <TabsList>
            {(role === "admin" || role === "manager") && (
              <TabsTrigger value="stores">
                <StoreIcon className="h-3.5 w-3.5 mr-1" /> By store
              </TabsTrigger>
            )}
            <TabsTrigger value="list">
              <Filter className="h-3.5 w-3.5 mr-1" /> Roster
            </TabsTrigger>
          </TabsList>

          {(role === "admin" || role === "manager") && (
            <TabsContent value="stores" className="space-y-4 pt-4">
              {storesWithRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No attendance records for the selected filters.
                  </CardContent>
                </Card>
              ) : (
                storesWithRecords.map(({ store, records, presentCount }) => (
                  <Card key={store.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="font-display flex items-center gap-2">
                            <StoreIcon className="h-4 w-4 text-brand" /> {store.name}
                          </CardTitle>
                          <div className="text-xs text-muted-foreground mt-1">
                            {store.city} · {records.length} on roster
                          </div>
                        </div>
                        <Badge className="bg-brand/10 text-brand border-0 hover:bg-brand/15">
                          {presentCount}/{records.length} in
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <AttendanceTable records={records} showStore={false} />
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}

          <TabsContent value="list" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <AttendanceTable
                  records={filteredRecords}
                  showStore={role === "admin" || role === "manager"}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------

function AttendanceTable({
  records,
  showStore,
}: {
  records: AttendanceRecord[];
  showStore: boolean;
}) {
  if (records.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground text-center">
        No attendance records for these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
            {showStore && <TableHead>Store</TableHead>}
            <TableHead>Check‑in</TableHead>
            <TableHead>Check‑out</TableHead>
            <TableHead>Geofence</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const meta = STATUS_META[record.status];
            return (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-brand/15 text-brand grid place-items-center text-[11px] font-semibold">
                      {initials(record.personName)}
                    </div>
                    <span className="text-sm font-medium">{record.personName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs capitalize text-muted-foreground">
                  {record.role}
                </TableCell>
                {showStore && (
                  <TableCell className="text-xs">
                    {record.storeName}
                  </TableCell>
                )}
                <TableCell className="text-sm tabular-nums">
                  {record.checkInTime ?? "—"}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {record.checkOutTime ?? "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {record.geofenceStatus !== "NOT_APPLICABLE" ? (
                    <Badge
                      variant="outline"
                      className={
                        record.geofenceStatus === "INSIDE"
                          ? "text-emerald-700 border-emerald-500/30"
                          : "text-red-700 border-red-500/30"
                      }
                    >
                      {record.geofenceStatus}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={meta.cls}>
                    {meta.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tint: "brand" | "emerald" | "amber" | "red" | "sky";
}) {
  const colorMap: Record<string, string> = {
    brand: "bg-brand/10 text-brand",
    emerald: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-700",
    red: "bg-red-500/10 text-red-700",
    sky: "bg-sky-500/10 text-sky-700",
  };
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-md flex items-center justify-center ${colorMap[tint]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-bold leading-none">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}