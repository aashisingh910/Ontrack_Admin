import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/lib/api";

interface Manager {
  _id: string;
  name: string;
  email: string;
  contactNumber?: string;
  storeCode?: string;
}

export default function RegisterStore() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const [formData, setFormData] = useState({
    storeCode: "",
    storeName: "",
    city: "",
    state: "",
    region: "",
    zone: "",
    address: "",
    latitude: "",
    longitude: "",
    geofenceRadiusMeters: "200",
    openingTime: "10:00",
    closingTime: "22:00",
    status: "ACTIVE",
    managerId: "",
  });

  // Fetch managers for dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      setLoadingManagers(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/managers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setManagers(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch managers", err);
      } finally {
        setLoadingManagers(false);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      storeCode: formData.storeCode,
      storeName: formData.storeName,
      city: formData.city,
      state: formData.state,
      region: formData.region,
      zone: formData.zone,
      address: formData.address,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      geofenceRadiusMeters: parseInt(formData.geofenceRadiusMeters, 10),
      openingTime: formData.openingTime,
      closingTime: formData.closingTime,
      status: formData.status,
      managerId: (formData.managerId && formData.managerId !== "__none") ? formData.managerId : null,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Store "${formData.storeName}" created successfully`);
        navigate("/stores");
      } else {
        toast.error(data.message || "Failed to create store");
        console.error("Backend error:", data);
      }
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display font-semibold">New store</div>
              <div className="text-xs text-muted-foreground">All fields marked * are required</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeCode">Store code *</Label>
              <Input
                id="storeCode"
                name="storeCode"
                value={formData.storeCode}
                onChange={handleChange}
                placeholder="634689"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeName">Store name *</Label>
              <Input
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Ht-Siliguri"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Siliguri"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="West Bengal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Input
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="East"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zone *</Label>
              <Input
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                placeholder="East"
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="3rd Floor, Cosmos Mall, Sevoke Road, Siliguri, West Bengal 734001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="26.7271"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="88.3953"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geofenceRadiusMeters">Geofence radius (meters)</Label>
              <Input
                id="geofenceRadiusMeters"
                name="geofenceRadiusMeters"
                type="number"
                value={formData.geofenceRadiusMeters}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingTime">Opening time *</Label>
              <Input
                id="openingTime"
                name="openingTime"
                value={formData.openingTime}
                onChange={handleChange}
                placeholder="10:00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingTime">Closing time *</Label>
              <Input
                id="closingTime"
                name="closingTime"
                value={formData.closingTime}
                onChange={handleChange}
                placeholder="22:00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Manager (optional)</Label>
              <Select
                value={formData.managerId}
                onValueChange={(val) => setFormData({ ...formData, managerId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {loadingManagers ? (
                    <SelectItem value="__loading" disabled>Loading managers...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="__none">None</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name} ({m.email})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/stores")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand text-brand-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Creating..." : "Register store"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}