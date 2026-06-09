import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL } from "@/lib/api";

interface Store {
  _id: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  zone?: string;
  state?: string;
}

interface Manager {
  _id: string;
  employeeCode: string;
  name: string;
  email: string;
  contactNumber: string;
}

export default function RegisterStaff() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode: "",
    name: "",
    email: "",
    contactNumber: "",
    role: "STAFF",
    designation: "",
    department: "",
    storeCode: "",
    storeName: "",
    city: "",
    region: "",
    status: "ACTIVE",
    managerId: "",
    managerName: "",
    managerEmail: "",
    managerContactNumber: "",
    weeklyOff: "",
    assignedStore: {
      storeCode: "",
      storeName: "",
      city: "",
      region: "",
    },
  });

  useEffect(() => {
    fetchStores();
    fetchManagers();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStores(data.data);
      } else {
        toast.error("Failed to load stores");
      }
    } catch (err) {
      toast.error("Network error while loading stores");
    } finally {
      setIsLoadingStores(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/managers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setManagers(data.data);
      } else {
        toast.error("Failed to load managers");
      }
    } catch (err) {
      toast.error("Network error while loading managers");
    } finally {
      setIsLoadingManagers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStoreChange = (storeId: string) => {
    const selectedStore = stores.find(s => s._id === storeId);
    if (selectedStore) {
      setFormData({
        ...formData,
        storeCode: selectedStore.storeCode,
        storeName: selectedStore.storeName,
        city: selectedStore.city,
        region: selectedStore.region,
        assignedStore: {
          storeCode: selectedStore.storeCode,
          storeName: selectedStore.storeName,
          city: selectedStore.city,
          region: selectedStore.region,
        },
      });
    }
  };

  const handleManagerChange = (managerId: string) => {
    const selectedManager = managers.find(m => m._id === managerId);
    if (selectedManager) {
      setFormData({
        ...formData,
        managerId: selectedManager.employeeCode, // use employeeCode as managerId
        managerName: selectedManager.name,
        managerEmail: selectedManager.email,
        managerContactNumber: selectedManager.contactNumber,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        employeeCode: formData.employeeCode,
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        role: formData.role,
        designation: formData.designation,
        department: formData.department,
        storeCode: formData.storeCode,
        storeName: formData.storeName,
        city: formData.city,
        region: formData.region,
        status: formData.status,
        managerId: formData.managerId,
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
        managerContactNumber: formData.managerContactNumber,
        assignedStore: formData.assignedStore,
        weeklyOff: (formData.weeklyOff && formData.weeklyOff !== "__none") ? formData.weeklyOff : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/users/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Staff "${formData.name}" registered successfully`);
        navigate("/staff");
      } else {
        toast.error(data.message || "Registration failed");
        console.error("Backend error:", data);
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-golden/30 text-[color:var(--brown)]">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display font-semibold">New staff member</div>
              <div className="text-xs text-muted-foreground">All fields marked * are required</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeCode">Employee code *</Label>
              <Input
                id="employeeCode"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleChange}
                placeholder="STF6790001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Rohit Sharma"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rohit.sharma@praxisretail.in"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact number *</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="9876543210"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Store *</Label>
              <Select onValueChange={handleStoreChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a store" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStores ? (
                    <SelectItem value="__loading" disabled>Loading stores…</SelectItem>
                  ) : (
                    stores.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.storeName} — {s.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manager *</Label>
              <Select onValueChange={handleManagerChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select reporting manager" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingManagers ? (
                    <SelectItem value="__loading" disabled>Loading managers…</SelectItem>
                  ) : (
                    managers.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name} ({m.employeeCode})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="SENIOR PRODUCT EXPERT"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="HOMEWARE"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Weekly Off</Label>
              <Select
                value={formData.weeklyOff}
                onValueChange={(val) => setFormData({ ...formData, weeklyOff: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weekly off day (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No weekly off</SelectItem>
                  {weekDays.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/staff")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand text-brand-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Registering..." : "Register staff"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}