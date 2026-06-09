import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail, Phone, Plus, Users, Search, RefreshCw, Loader2, AlertCircle,
  MapPin, Building, Briefcase, Calendar, User as UserIcon
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/lib/api";

interface Manager {
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
  assignedStore?: {
    storeCode: string;
    storeName: string;
    city: string;
    region: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function Managers() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/managers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setManagers(data.data);
      } else {
        throw new Error(data.message || "Failed to load managers");
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
    fetchManagers();
  }, [fetchManagers]);

  const handleManagerClick = (manager: Manager) => {
    setSelectedManager(manager);
    setDialogOpen(true);
  };

  const filteredManagers = managers.filter((m) =>
    search === "" ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    m.city?.toLowerCase().includes(search.toLowerCase()) ||
    m.region?.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const getAvatarColor = (name: string) => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Managers</h1>
            <p className="text-sm text-muted-foreground">Loading managers...</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/manager"><Plus className="h-4 w-4 mr-1" /> Add manager</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Managers</h1>
            <p className="text-sm text-muted-foreground">Failed to load data</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/manager"><Plus className="h-4 w-4 mr-1" /> Add manager</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <div className="font-medium text-red-600">{error}</div>
            <Button variant="outline" onClick={fetchManagers}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (managers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Managers</h1>
            <p className="text-sm text-muted-foreground">No managers found</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/manager"><Plus className="h-4 w-4 mr-1" /> Add manager</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No managers registered yet. Click "Add manager" to onboard the first one.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Managers</h1>
          <p className="text-sm text-muted-foreground">
            {filteredManagers.length} manager{filteredManagers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchManagers} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/manager"><Plus className="h-4 w-4 mr-1" /> Add manager</Link>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, store, city, region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Manager cards (clickable) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredManagers.map((manager) => {
          const avatarColor = getAvatarColor(manager.name);
          const initials = manager.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const storeInfo = manager.assignedStore || {
            storeName: manager.storeName,
            city: manager.city,
            region: manager.region,
          };
          return (
            <Card
              key={manager._id}
              className="overflow-hidden hover:shadow-warm transition cursor-pointer"
              onClick={() => handleManagerClick(manager)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold text-sm"
                    style={{ background: avatarColor }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-semibold truncate">{manager.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {storeInfo.storeName} · {storeInfo.city}
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {manager.region}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{manager.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{manager.contactNumber || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>Staff count (coming soon)</span>
                  </div>
                  {manager.designation && (
                    <div className="text-[10px] text-muted-foreground mt-2 italic">
                      {manager.designation}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No results after filtering */}
      {filteredManagers.length === 0 && search !== "" && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No managers match "<span className="font-medium">{search}</span>".
          </CardContent>
        </Card>
      )}

      {/* Manager Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {selectedManager && <ManagerDetailsPopup manager={selectedManager} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Popup Component for Manager Details
function ManagerDetailsPopup({ manager }: { manager: Manager }) {
  const storeInfo = manager.assignedStore || {
    storeCode: manager.storeCode,
    storeName: manager.storeName,
    city: manager.city,
    region: manager.region,
  };

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold flex items-center justify-between">
          <span>{manager.name}</span>
          <Badge
            className={manager.status === "ACTIVE"
              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
              : "bg-red-500/15 text-red-700 border-red-500/30"}
          >
            {manager.status}
          </Badge>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Employee Code: {manager.employeeCode || "—"}</p>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><UserIcon className="h-4 w-4" /> Personal Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${manager.email}`} className="hover:underline">{manager.email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${manager.contactNumber}`}>{manager.contactNumber || "—"}</a>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{manager.designation || "Store Manager"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{manager.department || "OPERATIONS"}</span>
            </div>
          </div>
        </div>

        {/* Store Assignment */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Assigned Store</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Store Name:</span> {storeInfo.storeName}</div>
            <div><span className="text-muted-foreground">Store Code:</span> {storeInfo.storeCode}</div>
            <div><span className="text-muted-foreground">City:</span> {storeInfo.city}</div>
            <div><span className="text-muted-foreground">Region:</span> {storeInfo.region}</div>
          </div>
        </div>
      </div>

      {/* Role & Metadata */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t text-sm">
        <div>
          <div className="text-muted-foreground text-xs">Role</div>
          <div className="font-medium">{manager.role}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Manager ID</div>
          <div className="font-mono text-xs">{manager._id}</div>
        </div>
      </div>

      {/* Timestamps (if available) */}
      {(manager.createdAt || manager.updatedAt) && (
        <div className="text-xs text-muted-foreground text-right space-y-1 pt-3 border-t">
          {manager.createdAt && <div>Joined: {new Date(manager.createdAt).toLocaleDateString()}</div>}
          {manager.updatedAt && <div>Last updated: {new Date(manager.updatedAt).toLocaleDateString()}</div>}
        </div>
      )}
    </div>
  );
}