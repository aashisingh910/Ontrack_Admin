import { useState } from "react";
import { getSession } from "@/lib/session";
import { managers, stores, getStaffByStore, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, TrendingUp, Wallet, Pencil, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";

export default function ManagerTargets() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];
  const team = getStaffByStore(store.id);

  const [staffTargets, setStaffTargets] = useState(
    team.map((s) => ({ id: s.id, name: s.name, avatarColor: s.avatarColor, target: s.monthlyTarget, achieved: s.achieved }))
  );

  const updateTarget = (id: string, target: number) => {
    setStaffTargets((prev) => prev.map((s) => (s.id === id ? { ...s, target } : s)));
    toast.success("Target updated");
  };

  const storePct = Math.min(100, Math.round((store.achieved / store.monthlyTarget) * 100));
  const storeIncentive = team.reduce((a, s) => a + incentive(s.achieved), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Targets</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <StoreIcon className="h-3.5 w-3.5" /> {store.name} — manage and cascade store targets to your team.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Target, label: "Monthly target", value: fmtINR(store.monthlyTarget), tint: "bg-brand/10 text-brand" },
          { icon: TrendingUp, label: "Achieved", value: fmtINR(store.achieved), hint: `${storePct}% of target`, tint: "bg-[color:var(--golden)]/15 text-[color:var(--brown)]" },
          { icon: Wallet, label: "Team incentive (10%)", value: fmtINR(storeIncentive), tint: "bg-info/10 text-info" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-md flex items-center justify-center ${k.tint}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="font-display text-lg font-bold">{k.value}</div>
                {k.hint && <div className="text-[11px] text-muted-foreground">{k.hint}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display">
              <Target className="h-4 w-4 text-brand" /> Store monthly progress
            </CardTitle>
            <span className="text-sm font-semibold">{storePct}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={storePct} className="h-3 [&>div]:bg-brand" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{fmtINR(store.achieved)} achieved</span>
            <span>{fmtINR(Math.max(0, store.monthlyTarget - store.achieved))} remaining</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Staff targets — cascade view</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffTargets.map((s) => {
            const spct = Math.min(100, Math.round((s.achieved / s.target) * 100));
            return (
              <div key={s.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                      style={{ background: s.avatarColor }}
                    >
                      {s.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {fmtINR(s.achieved)} / {fmtINR(s.target)} · Incentive: {fmtINR(incentive(s.achieved))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={spct >= 100 ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : spct >= 60 ? "bg-amber-500/10 text-amber-700 border-amber-500/30" : "bg-red-500/10 text-red-700 border-red-500/30"}
                    >
                      {spct}%
                    </Badge>
                    <EditTargetDialog name={s.name} current={s.target} onSave={(t) => updateTarget(s.id, t)} />
                  </div>
                </div>
                <Progress value={spct} className="mt-3 h-1.5 [&>div]:bg-brand" />
              </div>
            );
          })}
          {!staffTargets.length && (
            <p className="text-sm text-muted-foreground text-center py-4">No staff in your store yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EditTargetDialog({ name, current, onSave }: { name: string; current: number; onSave: (t: number) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current.toString());
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Edit target">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Edit target — {name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Monthly target (₹)</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" />
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave(Number(value) || current); setOpen(false); }} className="bg-brand text-brand-foreground hover:bg-brand/90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
