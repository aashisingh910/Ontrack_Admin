import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, MapPin, Clock, RefreshCw, Search,
  Store as StoreIcon, ArrowRight, AlertCircle, Navigation,
  ExternalLink, User, Mail, Phone, Building, Briefcase,
  ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApiStore {
  _id: string;
  storeCode: string;
  storeName: string;
  city: string;
  state: string;
  region: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  openingTime: string;
  closingTime: string;
  status: string;
  managerId: string | null;
  managerName?: string;
  managerEmail?: string;
  managerContactNumber?: string;
  manager?: { _id?: string; name: string; email: string; phoneNumber?: string; contactNumber?: string; remark?: string };
  pincode?: string;
  mapLocationUrl?: string;
  location?: { address: string; city: string; state: string; pincode: string; latitude: number; longitude: number; mapLocationUrl: string; geofenceRadiusMeters: number };
  createdAt: string;
  updatedAt: string;
}

interface ApiManager {
  _id: string;
  employeeCode?: string;
  name: string;
  email: string;
  contactNumber: string;
  role: string;
  designation?: string;
  department?: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  status: string;
  assignedStore?: { storeCode: string; storeName: string; city: string; region: string };
  createdAt?: string;
  updatedAt?: string;
}

interface StaffMember {
  _id: string;
  employeeCode: string;
  name: string;
  email: string;
  contactNumber: string;
  role: string;
  designation: string;
  department: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  status: string;
  managerId: string;
  managerName: string;
  managerEmail: string;
  managerContactNumber: string;
  assignedStore: { storeCode: string; storeName: string; city: string; region: string };
  weeklyOff?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GroupedStore {
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  managerName: string;
  managerEmail: string;
  managerContactNumber: string;
  staff: StaffMember[];
}

type Tab = "stores" | "managers" | "staff";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  North: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  South: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  East:  "bg-amber-500/15 text-amber-700 border-amber-500/30",
  West:  "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

const WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const palette = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4"];
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return palette[Math.abs(h) % palette.length];
}

function authHdr(): Record<string, string> {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function People() {
  const [tab, setTab] = useState<Tab>("stores");

  // Stores
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [viewStore, setViewStore] = useState<ApiStore | null>(null);
  const [addStore, setAddStore] = useState(false);

  // Managers
  const [managers, setManagers] = useState<ApiManager[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersError, setManagersError] = useState<string | null>(null);
  const [managerSearch, setManagerSearch] = useState("");
  const [viewManager, setViewManager] = useState<ApiManager | null>(null);
  const [addManager, setAddManager] = useState(false);

  // Staff
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [viewStaff, setViewStaff] = useState<StaffMember | null>(null);
  const [addStaff, setAddStaff] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Fetch
  const fetchStores = useCallback(async () => {
    setStoresLoading(true); setStoresError(null);
    try {
      const r = await fetch(`${API_BASE_URL}/stores`, { headers: authHdr() });
      const d = await r.json();
      if (r.ok && d.success) setStores(d.data);
      else throw new Error(d.message || "Failed to load stores");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      setStoresError(m); toast.error(m);
    } finally { setStoresLoading(false); }
  }, []);

  const fetchManagers = useCallback(async () => {
    setManagersLoading(true); setManagersError(null);
    try {
      const r = await fetch(`${API_BASE_URL}/managers`, { headers: authHdr() });
      const d = await r.json();
      if (r.ok && d.success) setManagers(d.data);
      else throw new Error(d.message || "Failed to load managers");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      setManagersError(m); toast.error(m);
    } finally { setManagersLoading(false); }
  }, []);

  const fetchStaff = useCallback(async () => {
    setStaffLoading(true); setStaffError(null);
    try {
      const r = await fetch(`${API_BASE_URL}/users/staff`, { headers: authHdr() });
      const d = await r.json();
      if (r.ok && d.success) {
        setStaff(d.data);
        setExpanded(new Set(d.data.map((s: StaffMember) => s.storeCode)));
      } else throw new Error(d.message || "Failed to load staff");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Network error";
      setStaffError(m); toast.error(m);
    } finally { setStaffLoading(false); }
  }, []);

  useEffect(() => { fetchStores(); fetchManagers(); fetchStaff(); }, [fetchStores, fetchManagers, fetchStaff]);

  // Derived
  const groupedStores = useMemo<GroupedStore[]>(() => {
    const map = new Map<string, GroupedStore>();
    staff.forEach(s => {
      if (!map.has(s.storeCode)) map.set(s.storeCode, { storeCode: s.storeCode, storeName: s.storeName, city: s.city, region: s.region, managerName: s.managerName, managerEmail: s.managerEmail, managerContactNumber: s.managerContactNumber, staff: [] });
      map.get(s.storeCode)!.staff.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.storeName.localeCompare(b.storeName));
  }, [staff]);

  const filteredStores = stores.filter(s =>
    [s.storeName, s.city, s.storeCode, s.region, s.state].some(v => v?.toLowerCase().includes(storeSearch.toLowerCase()))
  );
  const filteredManagers = managers.filter(m =>
    !managerSearch || [m.name, m.storeName, m.city, m.region, m.email].some(v => v?.toLowerCase().includes(managerSearch.toLowerCase()))
  );
  const filteredStaffGroups = groupedStores
    .map(g => ({ ...g, staff: g.staff.filter(s => !staffSearch || [s.name, s.email, s.designation, s.department, s.employeeCode].some(v => v?.toLowerCase().includes(staffSearch.toLowerCase()))) }))
    .filter(g => g.staff.length > 0);

  const regionCounts = stores.reduce<Record<string, number>>((a, s) => { a[s.region] = (a[s.region] ?? 0) + 1; return a; }, {});

  const toggleExpand = (code: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "stores",   label: "Stores",   count: stores.length },
    { id: "managers", label: "Managers", count: managers.length },
    { id: "staff",    label: "Staff",    count: staff.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">People</h1>
        <p className="text-sm text-muted-foreground">Manage stores, managers, and staff across the Hometown network.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${tab === t.id ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
            <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${tab === t.id ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"}`}>
              {t.count}
            </span>
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand rounded-full" />}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === "stores" && (
        <StoresPanel
          stores={filteredStores} allCount={stores.length}
          loading={storesLoading} error={storesError}
          search={storeSearch} setSearch={setStoreSearch}
          regionCounts={regionCounts}
          onRefresh={fetchStores} onView={setViewStore} onAdd={() => setAddStore(true)}
        />
      )}
      {tab === "managers" && (
        <ManagersPanel
          managers={filteredManagers} allCount={managers.length}
          loading={managersLoading} error={managersError}
          search={managerSearch} setSearch={setManagerSearch}
          onRefresh={fetchManagers} onView={setViewManager} onAdd={() => setAddManager(true)}
        />
      )}
      {tab === "staff" && (
        <StaffPanel
          groups={filteredStaffGroups} allCount={staff.length} allStoreCount={groupedStores.length}
          loading={staffLoading} error={staffError}
          search={staffSearch} setSearch={setStaffSearch}
          expanded={expanded} toggleExpand={toggleExpand}
          onRefresh={fetchStaff} onView={setViewStaff} onAdd={() => setAddStaff(true)}
        />
      )}

      {/* ── View dialogs ─────────────────────────────────────────── */}
      <Dialog open={!!viewStore} onOpenChange={o => !o && setViewStore(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {viewStore && <StoreDetail store={viewStore} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewManager} onOpenChange={o => !o && setViewManager(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {viewManager && <ManagerDetail manager={viewManager} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewStaff} onOpenChange={o => !o && setViewStaff(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {viewStaff && <StaffDetail staff={viewStaff} />}
        </DialogContent>
      </Dialog>

      {/* ── Add dialogs ──────────────────────────────────────────── */}
      <Dialog open={addStore} onOpenChange={setAddStore}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="font-display">Register New Store</DialogTitle></DialogHeader>
          <AddStoreForm managers={managers} onSuccess={() => { setAddStore(false); fetchStores(); }} onCancel={() => setAddStore(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addManager} onOpenChange={setAddManager}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="font-display">Register New Manager</DialogTitle></DialogHeader>
          <AddManagerForm stores={stores} onSuccess={() => { setAddManager(false); fetchManagers(); }} onCancel={() => setAddManager(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={addStaff} onOpenChange={setAddStaff}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="font-display">Register New Staff Member</DialogTitle></DialogHeader>
          <AddStaffForm stores={stores} managers={managers} onSuccess={() => { setAddStaff(false); fetchStaff(); }} onCancel={() => setAddStaff(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stores Panel
// ─────────────────────────────────────────────────────────────────────────────

function StoresPanel({ stores, allCount, loading, error, search, setSearch, regionCounts, onRefresh, onView, onAdd }: {
  stores: ApiStore[]; allCount: number; loading: boolean; error: string | null;
  search: string; setSearch: (v: string) => void; regionCounts: Record<string, number>;
  onRefresh: () => void; onView: (s: ApiStore) => void; onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${allCount} store${allCount !== 1 ? "s" : ""} across ${Object.keys(regionCounts).length} region${Object.keys(regionCounts).length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button onClick={onAdd} className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm"><Plus className="h-4 w-4 mr-1" /> Add store</Button>
        </div>
      </div>

      {!loading && !error && Object.keys(regionCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(regionCounts).map(([r, c]) => (
            <Badge key={r} variant="outline" className={REGION_COLORS[r] ?? "bg-secondary text-secondary-foreground border-border"}>{r} · {c} store{c !== 1 ? "s" : ""}</Badge>
          ))}
        </div>
      )}

      {!loading && !error && allCount > 0 && (
        <div className="relative max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, city, code, region…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-2 bg-muted animate-pulse" />
              <CardContent className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card><CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          <div className="font-medium text-red-600">{error}</div>
          <Button variant="outline" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
        </CardContent></Card>
      )}

      {!loading && !error && stores.length === 0 && (
        <Card><CardContent className="p-8 text-center space-y-3 text-muted-foreground">
          <StoreIcon className="h-8 w-8 mx-auto opacity-40" />
          {search
            ? <div>No stores match "<span className="font-medium">{search}</span>".</div>
            : <><div>No stores yet.</div><Button onClick={onAdd} className="bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="h-4 w-4 mr-1" /> Add first store</Button></>}
        </CardContent></Card>
      )}

      {!loading && !error && stores.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map(s => <StoreCard key={s._id} store={s} onView={() => onView(s)} />)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Managers Panel
// ─────────────────────────────────────────────────────────────────────────────

function ManagersPanel({ managers, allCount, loading, error, search, setSearch, onRefresh, onView, onAdd }: {
  managers: ApiManager[]; allCount: number; loading: boolean; error: string | null;
  search: string; setSearch: (v: string) => void;
  onRefresh: () => void; onView: (m: ApiManager) => void; onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${allCount} manager${allCount !== 1 ? "s" : ""}`}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button onClick={onAdd} className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm"><Plus className="h-4 w-4 mr-1" /> Add manager</Button>
        </div>
      </div>

      {!loading && !error && allCount > 0 && (
        <div className="relative max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, store, city, region…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card><CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          <div className="font-medium text-red-600">{error}</div>
          <Button variant="outline" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
        </CardContent></Card>
      )}

      {!loading && !error && managers.length === 0 && (
        <Card><CardContent className="p-8 text-center space-y-3 text-muted-foreground">
          {search
            ? <div>No managers match "<span className="font-medium">{search}</span>".</div>
            : <><div>No managers registered yet.</div><Button onClick={onAdd} className="bg-brand text-brand-foreground hover:bg-brand/90 mt-2"><Plus className="h-4 w-4 mr-1" /> Add first manager</Button></>}
        </CardContent></Card>
      )}

      {!loading && !error && managers.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map(m => {
            const store = m.assignedStore || { storeName: m.storeName, city: m.city, region: m.region };
            return (
              <Card key={m._id} className="overflow-hidden hover:shadow-warm transition cursor-pointer" onClick={() => onView(m)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold text-sm shrink-0" style={{ background: avatarColor(m.name) }}>
                      {initials(m.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{store.storeName} · {store.city}</div>
                      <Badge variant="outline" className="text-[10px] mt-1">{m.region}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3" /><span className="truncate">{m.email}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3" /><span>{m.contactNumber || "—"}</span></div>
                    {m.designation && <div className="text-[10px] italic mt-2">{m.designation}</div>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff Panel
// ─────────────────────────────────────────────────────────────────────────────

function StaffPanel({ groups, allCount, allStoreCount, loading, error, search, setSearch, expanded, toggleExpand, onRefresh, onView, onAdd }: {
  groups: GroupedStore[]; allCount: number; allStoreCount: number;
  loading: boolean; error: string | null;
  search: string; setSearch: (v: string) => void;
  expanded: Set<string>; toggleExpand: (code: string) => void;
  onRefresh: () => void; onView: (s: StaffMember) => void; onAdd: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${allCount} member${allCount !== 1 ? "s" : ""} across ${allStoreCount} store${allStoreCount !== 1 ? "s" : ""}`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button onClick={onAdd} className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm"><Plus className="h-4 w-4 mr-1" /> Add staff</Button>
        </div>
      </div>

      {!loading && !error && allCount > 0 && (
        <div className="relative max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, email, role, department…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="border-b bg-secondary px-5 py-3 space-y-2">
                <div className="h-5 w-48 bg-muted rounded" /><div className="h-4 w-32 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card><CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          <div className="font-medium text-red-600">{error}</div>
          <Button variant="outline" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
        </CardContent></Card>
      )}

      {!loading && !error && allCount === 0 && (
        <Card><CardContent className="p-8 text-center space-y-3 text-muted-foreground">
          <div>No staff registered yet.</div>
          <Button onClick={onAdd} className="bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="h-4 w-4 mr-1" /> Add first staff member</Button>
        </CardContent></Card>
      )}

      {!loading && !error && allCount > 0 && groups.length === 0 && search && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          No staff match "<span className="font-medium">{search}</span>".
        </CardContent></Card>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map(g => {
            const open = expanded.has(g.storeCode);
            return (
              <Card key={g.storeCode} className="overflow-hidden">
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary px-5 py-3 cursor-pointer hover:bg-secondary/80 transition"
                  onClick={() => toggleExpand(g.storeCode)}
                >
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <span className="font-display font-semibold">{g.storeName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{g.city} · {g.region} · {g.staff.length} staff</span>
                    </div>
                  </div>
                  {g.managerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-semibold" style={{ background: avatarColor(g.managerName) }}>
                        {initials(g.managerName)}
                      </span>
                      <span className="font-medium">{g.managerName}</span>
                      <Badge variant="outline" className="text-[10px]">Manager</Badge>
                    </div>
                  )}
                </div>
                {open && (
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {g.staff.map(s => (
                        <div key={s._id} className="grid grid-cols-12 items-center gap-3 px-5 py-3 hover:bg-accent/40 transition cursor-pointer" onClick={() => onView(s)}>
                          <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold" style={{ background: avatarColor(s.name) }}>{initials(s.name)}</span>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{s.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</div>
                            </div>
                          </div>
                          <div className="col-span-5 sm:col-span-3 text-xs">
                            <div className="text-muted-foreground">Role</div>
                            <div className="font-medium truncate">{s.designation}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{s.department}</div>
                          </div>
                          <div className="col-span-4 sm:col-span-2 text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{s.contactNumber || "—"}</div>
                          <div className="col-span-3 sm:col-span-2 text-xs">
                            <div className="text-muted-foreground">Emp ID</div>
                            <div className="font-mono text-[11px]">{s.employeeCode}</div>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <Badge variant="outline" className={s.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]" : "bg-red-500/15 text-red-700 border-red-500/30 text-[10px]"}>{s.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Card
// ─────────────────────────────────────────────────────────────────────────────

function StoreCard({ store: s, onView }: { store: ApiStore; onView: () => void }) {
  const regionCls = REGION_COLORS[s.region] ?? "bg-secondary text-secondary-foreground border-border";
  const mgr = s.manager || (s.managerName ? { name: s.managerName, email: s.managerEmail, contactNumber: s.managerContactNumber } : null);
  return (
    <Card className="overflow-hidden group hover:shadow-warm transition-shadow">
      <div className="h-2" style={{ background: "linear-gradient(90deg, var(--brand), var(--golden))" }} />
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display font-semibold text-base leading-tight truncate">{s.storeName}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Code: <span className="font-mono font-medium">{s.storeCode}</span></div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={s.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]" : "bg-red-500/15 text-red-700 border-red-500/30 text-[10px]"}>{s.status}</Badge>
            <Badge variant="outline" className={`${regionCls} text-[10px]`}>{s.region}</Badge>
          </div>
        </div>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{s.address}, {s.city}, {s.state}{s.pincode && ` - ${s.pincode}`}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md bg-secondary px-2.5 py-2"><div className="text-muted-foreground">Zone</div><div className="font-medium">{s.zone}</div></div>
          <div className="rounded-md bg-secondary px-2.5 py-2 flex items-start gap-1"><Clock className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" /><div><div className="text-muted-foreground">Hours</div><div className="font-medium">{s.openingTime} – {s.closingTime}</div></div></div>
          <div className="rounded-md bg-secondary px-2.5 py-2 flex items-start gap-1"><Navigation className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" /><div><div className="text-muted-foreground">Geofence</div><div className="font-medium">{s.geofenceRadiusMeters} m</div></div></div>
          <div className="rounded-md bg-secondary px-2.5 py-2"><div className="text-muted-foreground">Manager</div><div className="font-medium truncate">{mgr ? mgr.name : <span className="italic text-muted-foreground">Not assigned</span>}</div></div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>{s.latitude.toFixed(4)}°N, {s.longitude.toFixed(4)}°E</span>
          {s.mapLocationUrl && <a href={s.mapLocationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">View map <ExternalLink className="h-3 w-3" /></a>}
        </div>
        <Button variant="outline" className="w-full justify-between" onClick={onView}>View store <ArrowRight className="h-4 w-4" /></Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Popups
// ─────────────────────────────────────────────────────────────────────────────

function StoreDetail({ store: s }: { store: ApiStore }) {
  const mgr = s.manager || (s.managerName ? { name: s.managerName, email: s.managerEmail || "", contactNumber: s.managerContactNumber || "" } : null);
  const mapUrl = s.mapLocationUrl || s.location?.mapLocationUrl;
  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold flex items-center justify-between">
          <span>{s.storeName}</span>
          <Badge className={s.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-red-500/15 text-red-700 border-red-500/30"}>{s.status}</Badge>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Store Code: {s.storeCode}</p>
      </DialogHeader>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><StoreIcon className="h-4 w-4" /> Store Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Region</div><div className="font-medium">{s.region}</div>
            <div className="text-muted-foreground">Zone</div><div className="font-medium">{s.zone}</div>
            <div className="text-muted-foreground">City</div><div className="font-medium">{s.location?.city || s.city}</div>
            <div className="text-muted-foreground">State</div><div className="font-medium">{s.location?.state || s.state}</div>
            <div className="text-muted-foreground">Pincode</div><div className="font-medium font-mono">{s.pincode || s.location?.pincode || "—"}</div>
          </div>
          <div><div className="text-muted-foreground text-sm">Address</div><div className="text-sm mt-1">{s.location?.address || s.address}</div></div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Operations</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Opening</div><div className="font-medium">{s.openingTime}</div>
            <div className="text-muted-foreground">Closing</div><div className="font-medium">{s.closingTime}</div>
            <div className="text-muted-foreground">Geofence</div><div className="font-medium">{s.geofenceRadiusMeters} m</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Coordinates</div>
            <div className="font-mono text-sm">{s.latitude.toFixed(6)}°N, {s.longitude.toFixed(6)}°E</div>
            {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"><ExternalLink className="h-4 w-4" /> Open in Google Maps</a>}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" /> Store Manager</h3>
        {mgr ? (
          <div className="rounded-lg bg-secondary p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
              <div><div className="font-semibold">{mgr.name}</div>{mgr.remark && <div className="text-xs text-muted-foreground">{mgr.remark}</div>}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm pl-2">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${mgr.email}`} className="hover:underline">{mgr.email}</a></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{mgr.contactNumber || mgr.phoneNumber || "—"}</span></div>
            </div>
          </div>
        ) : <p className="text-sm text-muted-foreground">No manager assigned.</p>}
      </div>
      <div className="text-xs text-muted-foreground text-right space-y-1 pt-3 border-t">
        <div>Created: {new Date(s.createdAt).toLocaleString()}</div>
        <div>Updated: {new Date(s.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}

function ManagerDetail({ manager: m }: { manager: ApiManager }) {
  const store = m.assignedStore || { storeCode: m.storeCode, storeName: m.storeName, city: m.city, region: m.region };
  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold flex items-center justify-between">
          <span>{m.name}</span>
          <Badge className={m.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-red-500/15 text-red-700 border-red-500/30"}>{m.status}</Badge>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Employee Code: {m.employeeCode || "—"}</p>
      </DialogHeader>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{m.contactNumber || "—"}</span></div>
            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{m.designation || "Store Manager"}</span></div>
            <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /><span>{m.department || "OPERATIONS"}</span></div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Assigned Store</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Store:</span> {store.storeName}</div>
            <div><span className="text-muted-foreground">Code:</span> {store.storeCode}</div>
            <div><span className="text-muted-foreground">City:</span> {store.city}</div>
            <div><span className="text-muted-foreground">Region:</span> {store.region}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
        <div><div className="text-muted-foreground text-xs">Role</div><div className="font-medium">{m.role}</div></div>
        <div><div className="text-muted-foreground text-xs">ID</div><div className="font-mono text-xs">{m._id}</div></div>
      </div>
      {(m.createdAt || m.updatedAt) && (
        <div className="text-xs text-muted-foreground text-right space-y-1 pt-3 border-t">
          {m.createdAt && <div>Joined: {new Date(m.createdAt).toLocaleDateString()}</div>}
          {m.updatedAt && <div>Updated: {new Date(m.updatedAt).toLocaleDateString()}</div>}
        </div>
      )}
    </div>
  );
}

function StaffDetail({ staff: s }: { staff: StaffMember }) {
  const store = s.assignedStore || { storeName: s.storeName, storeCode: s.storeCode, city: s.city, region: s.region };
  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold flex items-center justify-between">
          <span>{s.name}</span>
          <Badge className={s.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-red-500/15 text-red-700 border-red-500/30"}>{s.status}</Badge>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Employee Code: {s.employeeCode}</p>
      </DialogHeader>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{s.contactNumber || "—"}</span></div>
            <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /><span>{s.designation}</span></div>
            <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /><span>{s.department}</span></div>
            {s.weeklyOff && <div className="flex items-center gap-2 text-muted-foreground">Weekly Off: <span className="text-foreground">{s.weeklyOff}</span></div>}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Building className="h-4 w-4" /> Assigned Store</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Store:</span> {store.storeName}</div>
            <div><span className="text-muted-foreground">Code:</span> {store.storeCode}</div>
            <div><span className="text-muted-foreground">City:</span> {store.city}</div>
            <div><span className="text-muted-foreground">Region:</span> {store.region}</div>
          </div>
        </div>
      </div>
      {s.managerName && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" /> Reporting Manager</h3>
          <div className="rounded-lg bg-secondary p-4 space-y-2">
            <div className="font-medium">{s.managerName}</div>
            <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${s.managerEmail}`} className="hover:underline">{s.managerEmail}</a></div>
            <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{s.managerContactNumber}</span></div>
          </div>
        </div>
      )}
      {(s.createdAt || s.updatedAt) && (
        <div className="text-xs text-muted-foreground text-right space-y-1 pt-3 border-t">
          {s.createdAt && <div>Joined: {new Date(s.createdAt).toLocaleDateString()}</div>}
          {s.updatedAt && <div>Updated: {new Date(s.updatedAt).toLocaleDateString()}</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Registration Forms
// ─────────────────────────────────────────────────────────────────────────────

function AddStoreForm({ managers, onSuccess, onCancel }: { managers: ApiManager[]; onSuccess: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ storeCode: "", storeName: "", city: "", state: "", region: "", zone: "", address: "", latitude: "", longitude: "", geofenceRadiusMeters: "200", openingTime: "10:00", closingTime: "22:00", status: "ACTIVE", managerId: "" });
  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ ...f, latitude: parseFloat(f.latitude), longitude: parseFloat(f.longitude), geofenceRadiusMeters: parseInt(f.geofenceRadiusMeters, 10), managerId: (f.managerId && f.managerId !== "__none") ? f.managerId : null }),
      });
      const d = await res.json();
      if (res.ok && d.success) { toast.success(`Store "${f.storeName}" created`); onSuccess(); }
      else toast.error(d.message || "Failed to create store");
    } catch { toast.error("Network error."); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-5 pt-2">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Store code *</Label><Input name="storeCode" value={f.storeCode} onChange={ch} placeholder="634689" required /></div>
        <div className="space-y-2"><Label>Store name *</Label><Input name="storeName" value={f.storeName} onChange={ch} placeholder="Ht-Siliguri" required /></div>
        <div className="space-y-2"><Label>City *</Label><Input name="city" value={f.city} onChange={ch} placeholder="Siliguri" required /></div>
        <div className="space-y-2"><Label>State *</Label><Input name="state" value={f.state} onChange={ch} placeholder="West Bengal" required /></div>
        <div className="space-y-2"><Label>Region *</Label><Input name="region" value={f.region} onChange={ch} placeholder="East" required /></div>
        <div className="space-y-2"><Label>Zone *</Label><Input name="zone" value={f.zone} onChange={ch} placeholder="East" required /></div>
        <div className="sm:col-span-2 space-y-2"><Label>Address *</Label><Input name="address" value={f.address} onChange={ch} placeholder="3rd Floor, Cosmos Mall, Sevoke Road…" required /></div>
        <div className="space-y-2"><Label>Latitude *</Label><Input name="latitude" type="number" step="any" value={f.latitude} onChange={ch} placeholder="26.7271" required /></div>
        <div className="space-y-2"><Label>Longitude *</Label><Input name="longitude" type="number" step="any" value={f.longitude} onChange={ch} placeholder="88.3953" required /></div>
        <div className="space-y-2"><Label>Geofence radius (m)</Label><Input name="geofenceRadiusMeters" type="number" value={f.geofenceRadiusMeters} onChange={ch} /></div>
        <div className="space-y-2"><Label>Opening time *</Label><Input name="openingTime" value={f.openingTime} onChange={ch} placeholder="10:00" required /></div>
        <div className="space-y-2"><Label>Closing time *</Label><Input name="closingTime" value={f.closingTime} onChange={ch} placeholder="22:00" required /></div>
        <div className="space-y-2">
          <Label>Manager (optional)</Label>
          <Select value={f.managerId} onValueChange={v => setF(p => ({ ...p, managerId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {managers.map(m => <SelectItem key={m._id} value={m._id}>{m.name} ({m.email})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy} className="bg-brand text-brand-foreground">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? "Creating…" : "Register store"}
        </Button>
      </div>
    </form>
  );
}

function AddManagerForm({ stores, onSuccess, onCancel }: { stores: ApiStore[]; onSuccess: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ employeeCode: "", name: "", email: "", contactNumber: "", storeCode: "", storeName: "", city: "", region: "", designation: "Store Manager", department: "OPERATIONS", status: "ACTIVE" });
  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify(f),
      });
      const d = await res.json();
      if (res.ok && d.success) { toast.success(`Manager "${f.name}" registered`); onSuccess(); }
      else toast.error(d.message || "Registration failed");
    } catch { toast.error("Network error."); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-5 pt-2">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Employee code *</Label><Input name="employeeCode" value={f.employeeCode} onChange={ch} placeholder="MG7658" required /></div>
        <div className="space-y-2"><Label>Full name *</Label><Input name="name" value={f.name} onChange={ch} placeholder="Amit Sharma" required /></div>
        <div className="space-y-2"><Label>Email *</Label><Input name="email" type="email" value={f.email} onChange={ch} placeholder="amit@praxisretail.in" required /></div>
        <div className="space-y-2"><Label>Contact number *</Label><Input name="contactNumber" value={f.contactNumber} onChange={ch} placeholder="9876543210" required /></div>
        <div className="space-y-2">
          <Label>Store *</Label>
          <Select onValueChange={id => { const s = stores.find(s => s._id === id); if (s) setF(p => ({ ...p, storeCode: s.storeCode, storeName: s.storeName, city: s.city, region: s.region })); }}>
            <SelectTrigger><SelectValue placeholder="Pick a store" /></SelectTrigger>
            <SelectContent>{stores.map(s => <SelectItem key={s._id} value={s._id}>{s.storeName} — {s.city}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Department *</Label><Input name="department" value={f.department} onChange={ch} required /></div>
        <div className="space-y-2"><Label>Designation *</Label><Input name="designation" value={f.designation} onChange={ch} required /></div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={f.status} onValueChange={v => setF(p => ({ ...p, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ACTIVE">ACTIVE</SelectItem><SelectItem value="INACTIVE">INACTIVE</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy} className="bg-brand text-brand-foreground">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? "Registering…" : "Register manager"}
        </Button>
      </div>
    </form>
  );
}

function AddStaffForm({ stores, managers, onSuccess, onCancel }: { stores: ApiStore[]; managers: ApiManager[]; onSuccess: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ employeeCode: "", name: "", email: "", contactNumber: "", role: "STAFF", designation: "", department: "", storeCode: "", storeName: "", city: "", region: "", status: "ACTIVE", managerId: "", managerName: "", managerEmail: "", managerContactNumber: "", weeklyOff: "", assignedStore: { storeCode: "", storeName: "", city: "", region: "" } });
  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/users/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ ...f, weeklyOff: (f.weeklyOff && f.weeklyOff !== "__none") ? f.weeklyOff : undefined }),
      });
      const d = await res.json();
      if (res.ok && d.success) { toast.success(`Staff "${f.name}" registered`); onSuccess(); }
      else toast.error(d.message || "Registration failed");
    } catch { toast.error("Network error."); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-5 pt-2">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Employee code *</Label><Input name="employeeCode" value={f.employeeCode} onChange={ch} placeholder="STF6790001" required /></div>
        <div className="space-y-2"><Label>Full name *</Label><Input name="name" value={f.name} onChange={ch} placeholder="Rohit Sharma" required /></div>
        <div className="space-y-2"><Label>Email *</Label><Input name="email" type="email" value={f.email} onChange={ch} placeholder="rohit@praxisretail.in" required /></div>
        <div className="space-y-2"><Label>Contact number *</Label><Input name="contactNumber" value={f.contactNumber} onChange={ch} placeholder="9876543210" required /></div>
        <div className="space-y-2">
          <Label>Store *</Label>
          <Select onValueChange={id => { const s = stores.find(s => s._id === id); if (s) setF(p => ({ ...p, storeCode: s.storeCode, storeName: s.storeName, city: s.city, region: s.region, assignedStore: { storeCode: s.storeCode, storeName: s.storeName, city: s.city, region: s.region } })); }}>
            <SelectTrigger><SelectValue placeholder="Pick a store" /></SelectTrigger>
            <SelectContent>{stores.map(s => <SelectItem key={s._id} value={s._id}>{s.storeName} — {s.city}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Manager *</Label>
          <Select onValueChange={id => { const m = managers.find(m => m._id === id); if (m) setF(p => ({ ...p, managerId: m.employeeCode || m._id, managerName: m.name, managerEmail: m.email, managerContactNumber: m.contactNumber })); }}>
            <SelectTrigger><SelectValue placeholder="Select reporting manager" /></SelectTrigger>
            <SelectContent>{managers.map(m => <SelectItem key={m._id} value={m._id}>{m.name} ({m.employeeCode})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Designation *</Label><Input name="designation" value={f.designation} onChange={ch} placeholder="SENIOR PRODUCT EXPERT" required /></div>
        <div className="space-y-2"><Label>Department *</Label><Input name="department" value={f.department} onChange={ch} placeholder="HOMEWARE" required /></div>
        <div className="space-y-2">
          <Label>Weekly Off</Label>
          <Select value={f.weeklyOff} onValueChange={v => setF(p => ({ ...p, weeklyOff: v }))}>
            <SelectTrigger><SelectValue placeholder="Select weekly off (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No weekly off</SelectItem>
              {WEEK_DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={f.status} onValueChange={v => setF(p => ({ ...p, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ACTIVE">ACTIVE</SelectItem><SelectItem value="INACTIVE">INACTIVE</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy} className="bg-brand text-brand-foreground">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? "Registering…" : "Register staff"}
        </Button>
      </div>
    </form>
  );
}
