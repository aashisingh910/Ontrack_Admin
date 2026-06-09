import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MapPin, Clock, Navigation, ExternalLink,
  User, Mail, Phone, Loader2, AlertCircle, Store,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/lib/api";

interface Manager {
  name: string;
  email: string;
  contactNumber: string;
  remark?: string;
}

interface StoreDetails {
  _id: string;
  storeCode: string;
  storeName: string;
  city: string;
  state: string;
  region: string;
  zone: string;
  address: string;
  pincode?: string;
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
  mapLocationUrl?: string;
  location?: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    mapLocationUrl: string;
    geofenceRadiusMeters: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStore = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/stores/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStore(data.data);
      } else {
        throw new Error(data.message || "Store not found");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load store";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) { navigate("/stores"); return; }
    fetchStore();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          <div className="font-medium text-red-600">{error ?? "Store not found"}</div>
          <Button variant="outline" onClick={() => navigate("/stores")}>
            Back to stores
          </Button>
        </CardContent>
      </Card>
    );
  }

  const manager = store.manager ?? (store.managerName
    ? { name: store.managerName, email: store.managerEmail ?? "", contactNumber: store.managerContactNumber ?? "" }
    : null);

  const mapUrl = store.mapLocationUrl ?? store.location?.mapLocationUrl;
  const finalAddress = store.location?.address ?? store.address;
  const finalCity    = store.location?.city    ?? store.city;
  const finalState   = store.location?.state   ?? store.state;
  const finalPincode = store.pincode            ?? store.location?.pincode;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/stores")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">{store.storeName}</h1>
          <p className="text-sm text-muted-foreground">Store code: <span className="font-mono">{store.storeCode}</span></p>
        </div>
      </div>

      <div className="flex justify-end">
        <Badge
          className={store.status === "ACTIVE"
            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-sm py-1 px-3"
            : "bg-red-500/15 text-red-700 border-red-500/30 text-sm py-1 px-3"}
        >
          {store.status}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Store information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" /> Store information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <span className="text-muted-foreground">Region</span>   <span className="font-medium">{store.region}</span>
              <span className="text-muted-foreground">Zone</span>     <span className="font-medium">{store.zone}</span>
              <span className="text-muted-foreground">City</span>     <span className="font-medium">{finalCity}</span>
              <span className="text-muted-foreground">State</span>    <span className="font-medium">{finalState}</span>
              <span className="text-muted-foreground">Pincode</span>  <span className="font-medium font-mono">{finalPincode ?? "—"}</span>
            </div>
            <div>
              <div className="text-muted-foreground text-sm mb-1">Address</div>
              <div className="text-sm">{finalAddress}</div>
            </div>
          </CardContent>
        </Card>

        {/* Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <span className="text-muted-foreground">Opening time</span>    <span className="font-medium">{store.openingTime}</span>
              <span className="text-muted-foreground">Closing time</span>    <span className="font-medium">{store.closingTime}</span>
              <span className="text-muted-foreground">Geofence radius</span> <span className="font-medium">{store.geofenceRadiusMeters} m</span>
            </div>
            <div>
              <div className="text-muted-foreground text-sm mb-1">Coordinates</div>
              <div className="font-mono text-sm">{store.latitude.toFixed(6)}°N, {store.longitude.toFixed(6)}°E</div>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                >
                  <ExternalLink className="h-4 w-4" /> Open in Google Maps
                </a>
              )}
              {!mapUrl && (
                <a
                  href={`https://maps.google.com/?q=${store.latitude},${store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                >
                  <ExternalLink className="h-4 w-4" /> Open in Google Maps
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" /> Store manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          {manager ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <div className="font-semibold">{manager.name}</div>
                  {manager.remark && <div className="text-xs text-muted-foreground">{manager.remark}</div>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm pl-13">
                {manager.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${manager.email}`} className="hover:underline truncate">{manager.email}</a>
                  </div>
                )}
                {manager.contactNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${manager.contactNumber}`}>{manager.contactNumber}</a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground">
              <User className="h-5 w-5 opacity-40 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">No manager assigned</div>
                <div className="text-xs">
                  {store.managerId
                    ? <span>Manager ID: <span className="font-mono">{store.managerId}</span></span>
                    : "Register a manager and link them to this store."}
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/register/manager">Assign manager</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground text-right space-y-1">
        <div>Store ID: <span className="font-mono">{store._id}</span></div>
        <div>Created: {new Date(store.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
        <div>Last updated: {new Date(store.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
      </div>
    </div>
  );
}
