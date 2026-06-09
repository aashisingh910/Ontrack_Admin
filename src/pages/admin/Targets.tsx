import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Target as TargetIcon, Store as StoreIcon, TrendingUp, Wallet, Pencil, CalendarDays, CalendarRange,
  Sparkles, Loader2, Plus,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:5002/api/aashi";

// ------------------ Types ------------------
interface MonthlyTarget {
  _id: string;
  targetId: string;
  targetType: string;
  targetMonth: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  managerName: string;
  previousMonth: {
    month: string;
    assignedTarget: number;
    actualSales: number;
    achievementPercent: number;
  };
  predictionLogic: {
    method: string;
    baseValue: number;
    growthPercent: number;
    predictedTarget: number;
  };
  adminAssignment: {
    assignedBy: string;
    assignedAt: string;
    adminAdjustmentPercent: number;
    assignedMonthlyTarget: number;
    remarks: string;
  };
  categoryBreakup: {
    furnitureTarget: number;
    homewareTarget: number;
    decorTarget: number;
    servicesTarget: number;
  };
  progress: {
    actualSales: number;
    achievementPercent: number;
    remainingTarget: number;
    daysElapsed: number;
    daysRemaining: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyTarget {
  _id: string;
  dailyTargetId: string;
  monthlyTargetId: string;
  targetType: string;
  targetDate: string;
  dayName: string;
  targetMonth: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  managerName: string;
  currency: string;
  assignedDailyTarget: number;
  categoryBreakup: {
    furnitureTarget: number;
    homewareTarget: number;
    decorTarget: number;
    servicesTarget: number;
  };
  weighting: {
    strategy: string;
    dayWeight: number;
  };
  progress: {
    actualSales: number;
    achievementPercent: number;
    remainingTarget: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Store {
  _id: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  managerName?: string;
}

// ------------------ Main Component ------------------
export default function Targets() {
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  // Prediction state
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<MonthlyTarget | null>(null);
  const [predictedTarget, setPredictedTarget] = useState<number | null>(null);
  const [growthPercent, setGrowthPercent] = useState<number>(10);
  const [predicting, setPredicting] = useState(false);

  // Add Monthly Target state
  const [addMonthlyOpen, setAddMonthlyOpen] = useState(false);
  const [newMonthly, setNewMonthly] = useState({
    targetMonth: "",
    storeCode: "",
    storeName: "",
    city: "",
    region: "",
    managerName: "",
    previousMonthActual: 0,
    growthPercent: 10,
    assignedMonthlyTarget: 0,
    remarks: "",
  });
  const [submittingMonthly, setSubmittingMonthly] = useState(false);

  // Fetch stores
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) setStores(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch monthly targets
  const fetchMonthlyTargets = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/targets/monthly?month=${selectedMonth}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) setMonthlyTargets(data.data);
      else toast.error(data.message || "Failed to load monthly targets");
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    }
  };

  // Fetch daily targets
  const fetchDailyTargets = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/targets/daily?date=${selectedDate}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) setDailyTargets(data.data);
      else toast.error(data.message || "Failed to load daily targets");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMonthlyTargets(), fetchDailyTargets()]).finally(() => setLoading(false));
  }, [selectedMonth, selectedDate]);

  // Update monthly target (existing)
  const updateMonthlyTarget = async (targetId: string, newMonthlyTarget: number, remarks?: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/targets/monthly/${targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assignedMonthlyTarget: newMonthlyTarget, remarks }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Monthly target updated");
        fetchMonthlyTargets();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Update daily target (existing)
  const updateDailyTarget = async (dailyTargetId: string, newDailyTarget: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/targets/daily/${dailyTargetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assignedDailyTarget: newDailyTarget }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Daily target updated");
        fetchDailyTargets();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // --- Prediction logic (creates monthly target for next month) ---
  const openPrediction = (store: MonthlyTarget) => {
    setSelectedStore(store);
    const defaultGrowth = store.predictionLogic?.growthPercent || 10;
    setGrowthPercent(defaultGrowth);
    const nextMonthActual = store.progress.actualSales;
    const predicted = Math.round(nextMonthActual * (1 + defaultGrowth / 100));
    setPredictedTarget(predicted);
    setPredictionOpen(true);
  };

  const recalcPrediction = () => {
    if (!selectedStore) return;
    const nextMonthActual = selectedStore.progress.actualSales;
    const predicted = Math.round(nextMonthActual * (1 + growthPercent / 100));
    setPredictedTarget(predicted);
  };

  const acceptPrediction = async () => {
    if (!selectedStore || !predictedTarget) return;
    setPredicting(true);
    try {
      const token = localStorage.getItem("token");
      const [year, month] = selectedMonth.split("-");
      let nextYear = parseInt(year);
      let nextMonth = parseInt(month) + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
      }
      const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
      const payload = {
        targetMonth: nextMonthStr,
        storeCode: selectedStore.storeCode,
        storeName: selectedStore.storeName,
        city: selectedStore.city,
        region: selectedStore.region,
        managerName: selectedStore.managerName,
        previousMonthActual: selectedStore.progress.actualSales,
        growthPercent: growthPercent,
        assignedMonthlyTarget: predictedTarget,
        remarks: `Auto-generated from prediction (${growthPercent}% growth)`,
      };
      const res = await fetch(`${API_BASE_URL}/targets/monthly`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Predicted target for ${nextMonthStr} created. ${data.data?.dailyTargetsCreated || 0} daily targets generated.`);
        setPredictionOpen(false);
        if (nextMonthStr === selectedMonth) fetchMonthlyTargets();
      } else {
        toast.error(data.message || "Failed to create prediction");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setPredicting(false);
    }
  };

  // --- Add Monthly Target manually ---
  const handleAddMonthly = async () => {
    if (!newMonthly.targetMonth || !newMonthly.storeCode || !newMonthly.assignedMonthlyTarget) {
      toast.error("Please fill required fields (Target month, Store, Amount)");
      return;
    }
    setSubmittingMonthly(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        targetMonth: newMonthly.targetMonth,
        storeCode: newMonthly.storeCode,
        storeName: newMonthly.storeName,
        city: newMonthly.city,
        region: newMonthly.region,
        managerName: newMonthly.managerName,
        previousMonthActual: newMonthly.previousMonthActual || 0,
        growthPercent: newMonthly.growthPercent,
        assignedMonthlyTarget: newMonthly.assignedMonthlyTarget,
        remarks: newMonthly.remarks,
      };
      const res = await fetch(`${API_BASE_URL}/targets/monthly`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Monthly target for ${newMonthly.storeName} (${newMonthly.targetMonth}) created. ${data.data?.dailyTargetsCreated || 0} daily targets generated.`);
        setAddMonthlyOpen(false);
        setNewMonthly({
          targetMonth: "",
          storeCode: "",
          storeName: "",
          city: "",
          region: "",
          managerName: "",
          previousMonthActual: 0,
          growthPercent: 10,
          assignedMonthlyTarget: 0,
          remarks: "",
        });
        if (newMonthly.targetMonth === selectedMonth) fetchMonthlyTargets();
      } else {
        toast.error(data.message || "Creation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmittingMonthly(false);
    }
  };

  const handleStoreChange = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    if (store) {
      setNewMonthly({
        ...newMonthly,
        storeCode: store.storeCode,
        storeName: store.storeName,
        city: store.city,
        region: store.region,
        managerName: store.managerName || "",
      });
    }
  };

  // Summary stats
  const monthlyTotals = monthlyTargets.reduce(
    (acc, t) => ({
      totalTarget: acc.totalTarget + t.adminAssignment.assignedMonthlyTarget,
      totalActual: acc.totalActual + t.progress.actualSales,
    }),
    { totalTarget: 0, totalActual: 0 }
  );
  const monthlyAchievement = monthlyTotals.totalTarget ? (monthlyTotals.totalActual / monthlyTotals.totalTarget) * 100 : 0;
  const dailyTotals = dailyTargets.reduce(
    (acc, t) => ({
      totalTarget: acc.totalTarget + t.assignedDailyTarget,
      totalActual: acc.totalActual + t.progress.actualSales,
    }),
    { totalTarget: 0, totalActual: 0 }
  );
  const dailyAchievement = dailyTotals.totalTarget ? (dailyTotals.totalActual / dailyTotals.totalTarget) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center py-12">Loading targets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Sales Targets</h1>
          <p className="text-sm text-muted-foreground">
            Monthly and daily targets assigned to stores. Progress tracked in real time.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addMonthlyOpen} onOpenChange={setAddMonthlyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Plus className="h-4 w-4" /> Add Monthly
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monthly Target</DialogTitle>
                <DialogDescription>Create a new monthly target for a store.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Target Month (YYYY-MM)</Label>
                  <Input
                    type="month"
                    value={newMonthly.targetMonth}
                    onChange={(e) => setNewMonthly({ ...newMonthly, targetMonth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Store</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value=""
                    onChange={(e) => handleStoreChange(e.target.value)}
                  >
                    <option value="">Select a store</option>
                    {stores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.storeName} ({s.storeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Previous month actual (₹) <span className="text-xs text-muted-foreground">(optional, for tracking)</span></Label>
                  <Input
                    type="number"
                    value={newMonthly.previousMonthActual || ""}
                    onChange={(e) => setNewMonthly({ ...newMonthly, previousMonthActual: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Growth percentage (%)</Label>
                  <Input
                    type="number"
                    value={newMonthly.growthPercent}
                    onChange={(e) => setNewMonthly({ ...newMonthly, growthPercent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Target Amount (₹)</Label>
                  <Input
                    type="number"
                    value={newMonthly.assignedMonthlyTarget || ""}
                    onChange={(e) => setNewMonthly({ ...newMonthly, assignedMonthlyTarget: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remarks (optional)</Label>
                  <Input
                    value={newMonthly.remarks}
                    onChange={(e) => setNewMonthly({ ...newMonthly, remarks: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMonthlyOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMonthly} disabled={submittingMonthly} className="bg-brand">
                  {submittingMonthly ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryTile icon={StoreIcon} label="Stores" value={monthlyTargets.length.toString()} tint="brand" />
        <SummaryTile icon={TargetIcon} label="Monthly Target" value={fmtINR(monthlyTotals.totalTarget)} hint={`Achieved: ${fmtINR(monthlyTotals.totalActual)}`} tint="brown" />
        <SummaryTile icon={TrendingUp} label="Monthly Achievement" value={`${Math.round(monthlyAchievement)}%`} hint={`${monthlyTargets.length} stores`} tint="golden" />
        <SummaryTile icon={Wallet} label="Daily Target (today)" value={fmtINR(dailyTotals.totalTarget)} hint={`Achieved: ${fmtINR(dailyTotals.totalActual)} (${Math.round(dailyAchievement)}%)`} tint="info" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly"><CalendarRange className="h-4 w-4 mr-2" /> Monthly Targets</TabsTrigger>
          <TabsTrigger value="daily"><CalendarDays className="h-4 w-4 mr-2" /> Daily Targets</TabsTrigger>
        </TabsList>

        {/* Monthly View */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="flex justify-end">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-48"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Monthly Target</TableHead>
                      <TableHead className="text-right">Achieved</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Edit</TableHead>
                      <TableHead className="text-right">Predict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyTargets.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell className="font-medium">{t.storeName}</TableCell>
                        <TableCell>{t.city}</TableCell>
                        <TableCell>{t.managerName || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtINR(t.adminAssignment.assignedMonthlyTarget)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtINR(t.progress.actualSales)}</TableCell>
                        <TableCell className="w-[200px]">
                          <div className="flex items-center gap-2">
                            <Progress value={t.progress.achievementPercent} className="h-1.5 [&>div]:bg-brand" />
                            <span className="text-[11px] w-9 text-right">{Math.round(t.progress.achievementPercent)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <EditMonthlyTargetButton target={t} onSave={(newTarget, remarks) => updateMonthlyTarget(t._id, newTarget, remarks)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openPrediction(t)}>
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Category breakdown cards for monthly */}
          <div className="grid md:grid-cols-2 gap-4">
            {monthlyTargets.map((t) => (
              <CategoryCard key={t._id} title={t.storeName} categories={t.categoryBreakup} />
            ))}
          </div>
        </TabsContent>

        {/* Daily View – store‑wise cards */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-56"
            />
            <div className="text-sm text-muted-foreground">
              {dailyTargets.length} stores · Total target {fmtINR(dailyTotals.totalTarget)} · Achievement {Math.round(dailyAchievement)}%
            </div>
          </div>

          {dailyTargets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No daily targets found for {selectedDate}.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {[...dailyTargets].sort((a, b) => a.storeName.localeCompare(b.storeName)).map((target) => (
                <DailyStoreCard key={target._id} target={target} onEdit={(newTarget) => updateDailyTarget(target._id, newTarget)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Prediction Dialog */}
      <Dialog open={predictionOpen} onOpenChange={setPredictionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Predict Next Month's Target</DialogTitle>
            <DialogDescription>
              Based on actual sales of current month, set a growth percentage to calculate next month's target.
            </DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-4">
              <div className="text-sm">
                <div>Store: <strong>{selectedStore.storeName}</strong></div>
                <div>Current month actual: <strong>{fmtINR(selectedStore.progress.actualSales)}</strong></div>
                <div>Next month: <strong>{getNextMonth(selectedMonth)}</strong></div>
              </div>
              <div>
                <Label>Growth percentage (%)</Label>
                <Input
                  type="number"
                  value={growthPercent}
                  onChange={(e) => setGrowthPercent(Number(e.target.value))}
                  onBlur={recalcPrediction}
                />
              </div>
              <div className="rounded-lg bg-secondary p-3 text-center">
                <div className="text-sm text-muted-foreground">Predicted target</div>
                <div className="text-2xl font-bold text-brand">{predictedTarget !== null ? fmtINR(predictedTarget) : "—"}</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPredictionOpen(false)}>Cancel</Button>
                <Button onClick={acceptPrediction} disabled={predicting} className="bg-brand">
                  {predicting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {predicting ? "Creating..." : "Create & Assign"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------ Helper Components ------------------
function SummaryTile({ icon: Icon, label, value, hint, tint }: any) {
  const bg =
    tint === "brand" ? "bg-brand/10 text-brand"
    : tint === "brown" ? "bg-[color:var(--brown)]/10 text-[color:var(--brown)]"
    : tint === "golden" ? "bg-[color:var(--golden)]/15 text-[color:var(--brown)]"
    : "bg-[color:var(--info)]/10 text-[color:var(--info)]";
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-md flex items-center justify-center ${bg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-lg font-bold leading-tight">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ title, categories }: { title: string; categories: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="flex justify-between"><span>Furniture</span><span className="font-mono">{fmtINR(categories.furnitureTarget)}</span></div>
        <div className="flex justify-between"><span>Homeware</span><span className="font-mono">{fmtINR(categories.homewareTarget)}</span></div>
        <div className="flex justify-between"><span>Decor</span><span className="font-mono">{fmtINR(categories.decorTarget)}</span></div>
        <div className="flex justify-between"><span>Services</span><span className="font-mono">{fmtINR(categories.servicesTarget)}</span></div>
      </CardContent>
    </Card>
  );
}

function EditMonthlyTargetButton({ target, onSave }: { target: MonthlyTarget; onSave: (newTarget: number, remarks: string) => void }) {
  const [open, setOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(target.adminAssignment.assignedMonthlyTarget.toString());
  const [remarks, setRemarks] = useState(target.adminAssignment.remarks || "");
  const handleSave = () => {
    const num = Number(newTarget);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid target amount");
      return;
    }
    onSave(num, remarks);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit monthly target – {target.storeName}</DialogTitle>
          <DialogDescription>Update the assigned monthly target and add remarks.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Monthly target (₹)</Label><Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} /></div>
          <div><Label>Remarks</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-brand">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DailyStoreCard({ target, onEdit }: { target: DailyTarget; onEdit: (newTarget: number) => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(target.assignedDailyTarget.toString());

  const pct = target.progress.achievementPercent;
  const dayWeight = target.weighting.dayWeight;

  return (
    <Card className="overflow-hidden hover:shadow-md transition">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{target.storeName}</CardTitle>
            <p className="text-xs text-muted-foreground">{target.city} · {target.region}</p>
            <p className="text-xs text-muted-foreground mt-1">Manager: {target.managerName || "—"}</p>
          </div>
          <Badge variant="outline" className="bg-brand/10 text-brand">
            {target.dayName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Daily Target</div>
            <div className="font-semibold">{fmtINR(target.assignedDailyTarget)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Achieved</div>
            <div className="font-semibold">{fmtINR(target.progress.actualSales)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Remaining</div>
            <div className="font-semibold">{fmtINR(target.progress.remainingTarget)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Day Weight</div>
            <div className="font-mono">{dayWeight}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={pct} className="h-2 [&>div]:bg-brand" />
          <span className="text-[11px] w-9 text-right">{Math.round(pct)}%</span>
        </div>

        {/* Category breakdown */}
        <div className="rounded-md bg-secondary/50 p-2 text-xs">
          <div className="font-semibold mb-1">Category targets</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="flex justify-between"><span>Furniture</span><span>{fmtINR(target.categoryBreakup.furnitureTarget)}</span></div>
            <div className="flex justify-between"><span>Homeware</span><span>{fmtINR(target.categoryBreakup.homewareTarget)}</span></div>
            <div className="flex justify-between"><span>Decor</span><span>{fmtINR(target.categoryBreakup.decorTarget)}</span></div>
            <div className="flex justify-between"><span>Services</span><span>{fmtINR(target.categoryBreakup.servicesTarget)}</span></div>
          </div>
        </div>

        <div className="flex justify-end">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit daily target – {target.storeName}</DialogTitle>
                <DialogDescription>Update the assigned daily target for {target.dayName}.</DialogDescription>
              </DialogHeader>
              <div><Label>Daily target (₹)</Label><Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} /></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={() => { onEdit(Number(newTarget)); setEditOpen(false); }} className="bg-brand">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split("-");
  let nextYear = parseInt(year);
  let nextMonth = parseInt(month) + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

function fmtINR(amount: number): string {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}