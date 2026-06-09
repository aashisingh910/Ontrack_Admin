import { useMemo, useState } from "react";
import { getSession } from "@/lib/session";
import { stores, staff, managers, getManagerByStore, initials } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, CheckCircle2, XCircle, Clock, Users, Store as StoreIcon, CalendarDays, Filter } from "lucide-react";

type Status = "present" | "late" | "absent" | "leave";

type Record_ = {
  id: string;
  personId: string;
  personName: string;
  role: "manager" | "staff";
  storeId: string;
  checkIn?: string;
  checkOut?: string;
  status: Status;
  distance?: number;
};

function seedToday(): Record_[] {
  const all: { id: string; name: string; storeId: string; role: "manager" | "staff" }[] = [
    ...managers.map((m) => ({ id: m.id, name: m.name, storeId: m.storeId, role: "manager" as const })),
    ...staff.map((s) => ({ id: s.id, name: s.name, storeId: s.storeId, role: "staff" as const })),
  ];
  return all.map((p, idx) => {
    const seed = (idx * 37) % 100;
    let status: Status = "present";
    let checkIn: string | undefined = `0${9 + (idx % 2)}:${(seed % 50).toString().padStart(2, "0")}`;
    let checkOut: string | undefined = `1${8 + (idx % 2)}:${((seed + 12) % 60).toString().padStart(2, "0")}`;
    let distance: number | undefined = (seed % 180);
    if (seed > 88) { status = "absent"; checkIn = undefined; checkOut = undefined; distance = undefined; }
    else if (seed > 78) { status = "leave"; checkIn = undefined; checkOut = undefined; distance = undefined; }
    else if (seed > 60) { status = "late"; checkIn = `10:${(seed % 50).toString().padStart(2, "0")}`; }
    return {
      id: `att-${p.id}`, personId: p.id, personName: p.name,
      role: p.role, storeId: p.storeId, checkIn, checkOut, status, distance,
    };
  });
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  present: { label: "Present", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  late:    { label: "Late",    cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  absent:  { label: "Absent",  cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  leave:   { label: "On leave", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
};

export default function Attendance() {
  const session = getSession();
  const role = session?.role ?? "admin";

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const records = useMemo(() => seedToday(), [date]);

  const scoped = useMemo(() => {
    let rs = records;
    if (role === "manager") {
      const myStore = managers.find((m) => m.email === session?.email)?.storeId ?? stores[0].id;
      rs = rs.filter((r) => r.storeId === myStore);
    } else if (role === "staff") {
      const me = staff.find((s) => s.email === session?.email);
      rs = rs.filter((r) => r.personId === me?.id);
    }
    if (storeFilter !== "all") rs = rs.filter((r) => r.storeId === storeFilter);
    if (statusFilter !== "all") rs = rs.filter((r) => r.status === statusFilter);
    return rs;
  }, [records, role, session, storeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = scoped.length;
    const c = (s: Status) => scoped.filter((r) => r.status === s).length;
    return { total, present: c("present"), late: c("late"), absent: c("absent"), leave: c("leave") };
  }, [scoped]);

  const byStore = useMemo(() => {
    return stores
      .filter((s) => storeFilter === "all" || s.id === storeFilter)
      .map((s) => {
        const list = scoped.filter((r) => r.storeId === s.id);
        return { store: s, list, present: list.filter((r) => r.status === "present" || r.status === "late").length };
      });
  }, [scoped, storeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Geo-fenced check-in within <span className="font-semibold">200&nbsp;m</span> of the assigned store.
            Auto check-out when staff leaves the store boundary.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <div className="relative">
              <CalendarDays className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-7 w-[160px]" />
            </div>
          </div>
          {role !== "staff" && (
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Store</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile icon={Users} label="On roster" value={stats.total} tint="brand" />
        <StatTile icon={CheckCircle2} label="Present" value={stats.present} tint="emerald" />
        <StatTile icon={Clock} label="Late" value={stats.late} tint="amber" />
        <StatTile icon={XCircle} label="Absent" value={stats.absent} tint="red" />
        <StatTile icon={MapPin} label="On leave" value={stats.leave} tint="sky" />
      </div>

      <Tabs defaultValue={role === "admin" ? "stores" : "list"}>
        <TabsList>
          {role !== "staff" && <TabsTrigger value="stores"><StoreIcon className="h-3.5 w-3.5 mr-1" /> By store</TabsTrigger>}
          <TabsTrigger value="list"><Filter className="h-3.5 w-3.5 mr-1" /> Roster</TabsTrigger>
        </TabsList>

        {role !== "staff" && (
          <TabsContent value="stores" className="space-y-4 pt-4">
            {byStore.map(({ store, list, present }) => {
              const mgr = getManagerByStore(store.id);
              return (
                <Card key={store.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-display flex items-center gap-2">
                          <StoreIcon className="h-4 w-4 text-brand" /> {store.name}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground mt-1">
                          {store.city} · Manager: {mgr?.name ?? "—"} · {list.length} on roster
                        </div>
                      </div>
                      <Badge className="bg-brand/10 text-brand border-0 hover:bg-brand/15">
                        {present}/{list.length} in
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <RosterTable rows={list} />
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        )}

        <TabsContent value="list" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <RosterTable rows={scoped} showStore />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RosterTable({ rows, showStore = false }: { rows: Record_[]; showStore?: boolean }) {
  if (!rows.length) {
    return <div className="p-6 text-sm text-muted-foreground text-center">No attendance records for these filters.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
            {showStore && <TableHead>Store</TableHead>}
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Geofence</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const store = stores.find((s) => s.id === r.storeId);
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
                {showStore && <TableCell className="text-xs">{store?.name}</TableCell>}
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
  );
}

function StatTile({
  icon: Icon, label, value, tint,
}: {
  icon: typeof Users; label: string; value: number;
  tint: "brand" | "emerald" | "amber" | "red" | "sky";
}) {
  const m: Record<string, string> = {
    brand: "bg-brand/10 text-brand",
    emerald: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-700",
    red: "bg-red-500/10 text-red-700",
    sky: "bg-sky-500/10 text-sky-700",
  };
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-md flex items-center justify-center ${m[tint]}`}>
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
