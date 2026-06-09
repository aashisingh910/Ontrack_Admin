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
  Plus,
  Mail,
  Phone,
  Search,
  RefreshCw,
  AlertCircle,
  User,
  Building,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/lib/api";

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
  assignedStore: {
    storeCode: string;
    storeName: string;
    city: string;
    region: string;
  };
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

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [groupedStores, setGroupedStores] = useState<GroupedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/users/staff`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStaff(data.data);
        // Initially expand all stores
        const allStoreCodes = new Set<string>(data.data.map((s: StaffMember) => s.storeCode));
        setExpandedStores(allStoreCodes);
      } else {
        throw new Error(data.message || "Failed to load staff");
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
    fetchStaff();
  }, [fetchStaff]);

  // Group staff by store
  useEffect(() => {
    const storeMap = new Map<string, GroupedStore>();
    staff.forEach((s) => {
      const key = s.storeCode;
      if (!storeMap.has(key)) {
        storeMap.set(key, {
          storeCode: s.storeCode,
          storeName: s.storeName,
          city: s.city,
          region: s.region,
          managerName: s.managerName,
          managerEmail: s.managerEmail,
          managerContactNumber: s.managerContactNumber,
          staff: [],
        });
      }
      storeMap.get(key)!.staff.push(s);
    });
    const sorted = Array.from(storeMap.values()).sort((a, b) =>
      a.storeName.localeCompare(b.storeName)
    );
    setGroupedStores(sorted);
  }, [staff]);

  // Toggle store expansion
  const toggleStore = (storeCode: string) => {
    setExpandedStores((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storeCode)) {
        newSet.delete(storeCode);
      } else {
        newSet.add(storeCode);
      }
      return newSet;
    });
  };

  const handleStaffClick = (member: StaffMember) => {
    setSelectedStaff(member);
    setDialogOpen(true);
  };

  // Filter stores and staff based on search
  const filteredStores = groupedStores
    .map((store) => ({
      ...store,
      staff: store.staff.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()) ||
          s.designation.toLowerCase().includes(search.toLowerCase()) ||
          s.department.toLowerCase().includes(search.toLowerCase()) ||
          s.employeeCode.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((store) => store.staff.length > 0);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Staff</h1>
            <p className="text-sm text-muted-foreground">Loading staff members...</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/staff"><Plus className="h-4 w-4 mr-1" /> Add staff</Link>
          </Button>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="border-b bg-secondary px-5 py-3 space-y-2">
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Staff</h1>
            <p className="text-sm text-muted-foreground">Failed to load data</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/staff"><Plus className="h-4 w-4 mr-1" /> Add staff</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <div className="font-medium text-red-600">{error}</div>
            <Button variant="outline" onClick={fetchStaff}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Staff</h1>
            <p className="text-sm text-muted-foreground">No staff members found</p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/staff"><Plus className="h-4 w-4 mr-1" /> Add staff</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No staff registered yet. Click "Add staff" to onboard the first member.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Staff</h1>
          <p className="text-sm text-muted-foreground">
            {staff.length} staff member{staff.length !== 1 ? "s" : ""} across {groupedStores.length} store{groupedStores.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchStaff} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
            <Link to="/register/staff"><Plus className="h-4 w-4 mr-1" /> Add staff</Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search staff by name, email, role, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Staff grouped by store with collapsible cards */}
      <div className="space-y-4">
        {filteredStores.map((store) => {
          const isExpanded = expandedStores.has(store.storeCode);
          return (
            <Card key={store.storeCode} className="overflow-hidden">
              {/* Store header – click to toggle */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary px-5 py-3 cursor-pointer hover:bg-secondary/80 transition"
                onClick={() => toggleStore(store.storeCode)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <span className="font-display font-semibold">{store.storeName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {store.city} · {store.region} · {store.staff.length} staff
                    </span>
                  </div>
                </div>
                {store.managerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-semibold"
                      style={{ background: getAvatarColor(store.managerName) }}
                    >
                      {getInitials(store.managerName)}
                    </span>
                    <span className="font-medium">{store.managerName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      Manager
                    </Badge>
                  </div>
                )}
              </div>

              {/* Staff list – only shown when expanded */}
              {isExpanded && (
                <CardContent className="p-0">
                  <div className="divide-y">
                    {store.staff.map((staffMember) => (
                      <div
                        key={staffMember._id}
                        className="grid grid-cols-12 items-center gap-3 px-5 py-3 hover:bg-accent/40 transition cursor-pointer"
                        onClick={() => handleStaffClick(staffMember)}
                      >
                        {/* Avatar + Name + Email */}
                        <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                          <span
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold"
                            style={{ background: getAvatarColor(staffMember.name) }}
                          >
                            {getInitials(staffMember.name)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{staffMember.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {staffMember.email}
                            </div>
                          </div>
                        </div>

                        {/* Designation & Department */}
                        <div className="col-span-5 sm:col-span-3 text-xs">
                          <div className="text-muted-foreground">Role</div>
                          <div className="font-medium truncate">{staffMember.designation}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{staffMember.department}</div>
                        </div>

                        {/* Contact */}
                        <div className="col-span-4 sm:col-span-2 text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{staffMember.contactNumber || "—"}</span>
                        </div>

                        {/* Employee Code */}
                        <div className="col-span-3 sm:col-span-2 text-xs">
                          <div className="text-muted-foreground">Emp ID</div>
                          <div className="font-mono text-[11px]">{staffMember.employeeCode}</div>
                        </div>

                        {/* Status badge */}
                        <div className="col-span-2 sm:col-span-1">
                          <Badge
                            variant="outline"
                            className={
                              staffMember.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]"
                                : "bg-red-500/15 text-red-700 border-red-500/30 text-[10px]"
                            }
                          >
                            {staffMember.status}
                          </Badge>
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

      {filteredStores.length === 0 && search !== "" && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No staff match "<span className="font-medium">{search}</span>".
          </CardContent>
        </Card>
      )}

      {/* Staff Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {selectedStaff && <StaffDetailsPopup staff={selectedStaff} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Staff Details Popup Component
function StaffDetailsPopup({ staff }: { staff: StaffMember }) {
  const storeInfo = staff.assignedStore || {
    storeName: staff.storeName,
    storeCode: staff.storeCode,
    city: staff.city,
    region: staff.region,
  };

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-display font-bold flex items-center justify-between">
          <span>{staff.name}</span>
          <Badge
            className={
              staff.status === "ACTIVE"
                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                : "bg-red-500/15 text-red-700 border-red-500/30"
            }
          >
            {staff.status}
          </Badge>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Employee Code: {staff.employeeCode}</p>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${staff.email}`} className="hover:underline">
                {staff.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${staff.contactNumber}`}>{staff.contactNumber || "—"}</a>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{staff.designation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{staff.department}</span>
            </div>
            {staff.weeklyOff && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Weekly Off:</span>
                <span>{staff.weeklyOff}</span>
              </div>
            )}
          </div>
        </div>

        {/* Store Assignment */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Building className="h-4 w-4" /> Assigned Store
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Store Name:</span> {storeInfo.storeName}
            </div>
            <div>
              <span className="text-muted-foreground">Store Code:</span> {storeInfo.storeCode}
            </div>
            <div>
              <span className="text-muted-foreground">City:</span> {storeInfo.city}
            </div>
            <div>
              <span className="text-muted-foreground">Region:</span> {storeInfo.region}
            </div>
          </div>
        </div>
      </div>

      {/* Manager Information */}
      {staff.managerName && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4" /> Reporting Manager
          </h3>
          <div className="rounded-lg bg-secondary p-4 space-y-2">
            <div className="font-medium">{staff.managerName}</div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${staff.managerEmail}`} className="hover:underline">
                {staff.managerEmail}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${staff.managerContactNumber}`}>{staff.managerContactNumber}</a>
            </div>
          </div>
        </div>
      )}

      {/* Timestamps */}
      {(staff.createdAt || staff.updatedAt) && (
        <div className="text-xs text-muted-foreground text-right space-y-1 pt-3 border-t">
          {staff.createdAt && <div>Joined: {new Date(staff.createdAt).toLocaleDateString()}</div>}
          {staff.updatedAt && <div>Last updated: {new Date(staff.updatedAt).toLocaleDateString()}</div>}
        </div>
      )}
    </div>
  );
}