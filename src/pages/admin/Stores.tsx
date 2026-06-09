import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, MapPin, Clock, RefreshCw, Search, Store as StoreIcon,
  ArrowRight, Loader2, AlertCircle, Navigation, ExternalLink,
  User, Mail, Phone, X
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/lib/api";

interface Manager {
  _id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  contactNumber?: string;
  remark?: string;
}

interface Location {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  mapLocationUrl: string;
  geofenceRadiusMeters: number;
}

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
  manager?: Manager;
  pincode?: string;
  mapLocationUrl?: string;
  subZoneAreaLocality?: string;
  location?: Location;
  createdAt: string;
  updatedAt: string;
}

const REGION_COLORS: Record<string, string> = {
  North: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  South: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  East:  "bg-amber-500/15 text-amber-700 border-amber-500/30",
  West:  "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

export default function Stores() {
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<ApiStore | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStores(data.data);
      } else {
        throw new Error(data.message || "Failed to load stores");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filtered = stores.filter(
    (s) =>
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.storeCode.toLowerCase().includes(search.toLowerCase()) ||
      s.region.toLowerCase().includes(search.toLowerCase()) ||
      s.state.toLowerCase().includes(search.toLowerCase())
  );

  const regionCounts = stores.reduce<Record<string, number>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  const handleViewStore = (store: ApiStore) => {
    setSelectedStore(store);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Stores</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${stores.length} store${stores.length !== 1 ? "s" : ""} across ${Object.keys(regionCounts).length} region${Object.keys(regionCounts).length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchStores} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/store"><Plus className="h-4 w-4 mr-1" /> Add store</Link>
          </Button>
        </div>
      </div>

      {/* Region summary pills */}
      {!loading && !error && Object.keys(regionCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(regionCounts).map(([region, count]) => (
            <Badge
              key={region}
              variant="outline"
              className={REGION_COLORS[region] ?? "bg-secondary text-secondary-foreground border-border"}
            >
              {region} · {count} store{count !== 1 ? "s" : ""}
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && !error && stores.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, code, region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {/* Loading skeleton */}
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

      {/* Error */}
      {!loading && error && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <div className="font-medium text-red-600">{error}</div>
            <Button variant="outline" onClick={fetchStores}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-3 text-muted-foreground">
            <StoreIcon className="h-8 w-8 mx-auto opacity-40" />
            {search ? (
              <div>No stores match "<span className="font-medium">{search}</span>".</div>
            ) : (
              <>
                <div>No stores yet.</div>
                <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link to="/register/store"><Plus className="h-4 w-4 mr-1" /> Add first store</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Store cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <StoreCard key={s._id} store={s} onView={() => handleViewStore(s)} />
          ))}
        </div>
      )}

      {/* Store Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {selectedStore && <StoreDetailsPopup store={selectedStore} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Store Card Component (with View button triggering popup)
function StoreCard({ store, onView }: { store: ApiStore; onView: () => void }) {
  const regionCls = REGION_COLORS[store.region] ?? "bg-secondary text-secondary-foreground border-border";
  const manager = store.manager || (store.managerName ? { name: store.managerName, email: store.managerEmail, contactNumber: store.managerContactNumber } : null);

  return (
    <Card className="overflow-hidden group hover:shadow-warm transition-shadow">
      <div className="h-2" style={{ background: "linear-gradient(90deg, var(--brand), var(--golden))" }} />
      <CardContent className="p-5 space-y-4">

        {/* Name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display font-semibold text-base leading-tight truncate">{store.storeName}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Code: <span className="font-mono font-medium">{store.storeCode}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className={store.status === "ACTIVE"
                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]"
                : "bg-red-500/15 text-red-700 border-red-500/30 text-[10px]"}
            >
              {store.status}
            </Badge>
            <Badge variant="outline" className={`${regionCls} text-[10px]`}>
              {store.region}
            </Badge>
          </div>
        </div>

        {/* Address + pincode */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{store.address}, {store.city}, {store.state} {store.pincode && `- ${store.pincode}`}</span>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md bg-secondary px-2.5 py-2">
            <div className="text-muted-foreground">Zone</div>
            <div className="font-medium">{store.zone}</div>
          </div>
          <div className="rounded-md bg-secondary px-2.5 py-2 flex items-start gap-1">
            <Clock className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Hours</div>
              <div className="font-medium">{store.openingTime} – {store.closingTime}</div>
            </div>
          </div>
          <div className="rounded-md bg-secondary px-2.5 py-2 flex items-start gap-1">
            <Navigation className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Geofence</div>
              <div className="font-medium">{store.geofenceRadiusMeters} m</div>
            </div>
          </div>
          <div className="rounded-md bg-secondary px-2.5 py-2">
            <div className="text-muted-foreground">Manager</div>
            <div className="font-medium truncate">
              {manager ? manager.name : (store.managerId ? "Assigned" : <span className="text-muted-foreground italic">Not assigned</span>)}
            </div>
          </div>
        </div>

        {/* Coordinates and map link */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>{store.latitude.toFixed(4)}°N, {store.longitude.toFixed(4)}°E</span>
          {store.mapLocationUrl && (
            <a href={store.mapLocationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              View map <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* CTA – now opens popup */}
        <Button variant="outline" className="w-full justify-between" onClick={onView}>
          View store <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Popup Content Component
function StoreDetailsPopup({ store }: { store: ApiStore }) {
  const manager = store.manager || (store.managerName ? {
    name: store.managerName,
    email: store.managerEmail || "",
    contactNumber: store.managerContactNumber || "",
  } : null);

  const mapUrl = store.mapLocationUrl || store.location?.mapLocationUrl;
  const finalAddress = store.location?.address || store.address;
  const finalCity = store.location?.city || store.city;
  const finalState = store.location?.state || store.state;
  const finalPincode = store.pincode || store.location?.pincode;

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold flex items-center justify-between">
          <span>{store.storeName}</span>
          <Badge
            className={store.status === "ACTIVE"
              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
              : "bg-red-500/15 text-red-700 border-red-500/30"}
          >
            {store.status}
          </Badge>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Store Code: {store.storeCode}</p>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Store Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><StoreIcon className="h-4 w-4" /> Store Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Region</div><div className="font-medium">{store.region}</div>
            <div className="text-muted-foreground">Zone</div><div className="font-medium">{store.zone}</div>
            <div className="text-muted-foreground">City</div><div className="font-medium">{finalCity}</div>
            <div className="text-muted-foreground">State</div><div className="font-medium">{finalState}</div>
            <div className="text-muted-foreground">Pincode</div><div className="font-medium font-mono">{finalPincode || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Address</div>
            <div className="text-sm mt-1">{finalAddress}</div>
          </div>
        </div>

        {/* Operations */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Operations</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Opening Time</div><div className="font-medium">{store.openingTime}</div>
            <div className="text-muted-foreground">Closing Time</div><div className="font-medium">{store.closingTime}</div>
            <div className="text-muted-foreground">Geofence Radius</div><div className="font-medium">{store.geofenceRadiusMeters} m</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Coordinates</div>
            <div className="font-mono text-sm">{store.latitude.toFixed(6)}°N, {store.longitude.toFixed(6)}°E</div>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                <ExternalLink className="h-4 w-4" /> Open in Google Maps
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Manager Information */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" /> Store Manager</h3>
        {manager ? (
          <div className="space-y-2 rounded-lg bg-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{manager.name}</div>
                {manager.remark && <div className="text-xs text-muted-foreground">{manager.remark}</div>}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm pl-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${manager.email}`} className="hover:underline">{manager.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${manager.contactNumber || manager.phoneNumber}`}>{manager.contactNumber || manager.phoneNumber || "—"}</a>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No manager assigned to this store.</p>
        )}
      </div>

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground text-right space-y-1 pt-3 border-t">
        <div>Created: {new Date(store.createdAt).toLocaleString()}</div>
        <div>Last updated: {new Date(store.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}