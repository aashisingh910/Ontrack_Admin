import { useState } from "react";
import { getSession } from "@/lib/session";
import { managers, stores } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Calendar, AlertTriangle, Info, Sparkles, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

type Priority = "info" | "important" | "urgent";

type Notice = {
  id: string;
  title: string;
  body: string;
  priority: Priority;
  effectiveDate: string;
  createdAt: string;
};

const PRIORITY_META: Record<Priority, { label: string; cls: string; icon: typeof Info }> = {
  info:      { label: "Info",      cls: "bg-sky-500/15 text-sky-700 border-sky-500/30",    icon: Info },
  important: { label: "Important", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Sparkles },
  urgent:    { label: "Urgent",    cls: "bg-red-500/15 text-red-700 border-red-500/30",    icon: AlertTriangle },
};

const seedNotices: Notice[] = [
  {
    id: "n1",
    title: "Diwali extended hours",
    body: "Stores will operate 9:00–22:00 from Oct 28 to Nov 5. Daily target is set at 130% of regular. Additional 2% incentive on any day exceeding daily target.",
    priority: "important",
    effectiveDate: "2026-10-28",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "n2",
    title: "Attendance app update required",
    body: "Please ask all staff to update the app to version 2.1.4 by end of week for the new geofence settings to take effect.",
    priority: "info",
    effectiveDate: "2026-06-10",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function ManagerNotices() {
  const session = getSession();
  const mgr = managers.find((m) => m.email === session?.email) ?? managers[0];
  const store = stores.find((s) => s.id === mgr.storeId) ?? stores[0];

  const [notices, setNotices] = useState<Notice[]>(seedNotices);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", priority: "info" as Priority, effectiveDate: new Date().toISOString().slice(0, 10) });

  const send = () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Title and body are required."); return; }
    setNotices((prev) => [
      { id: `n${Date.now()}`, ...form, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setForm({ title: "", body: "", priority: "info", effectiveDate: new Date().toISOString().slice(0, 10) });
    setComposing(false);
    toast.success("Notice sent to your store team.");
  };

  const remove = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notice removed.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Notices</h1>
          <p className="text-sm text-muted-foreground">Post notices for your team at {store.name}.</p>
        </div>
        <Button onClick={() => setComposing(!composing)} className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
          <Plus className="h-4 w-4 mr-1" /> New notice
        </Button>
      </div>

      {composing && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Megaphone className="h-4 w-4 text-brand" /> Compose notice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notice subject…" />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Effective date</Label>
                <Input type="date" value={form.effectiveDate} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Body *</Label>
                <Textarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Notice content…" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setComposing(false)}>Cancel</Button>
              <Button onClick={send} className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Send className="h-4 w-4 mr-1" /> Send to team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {notices.map((n) => {
          const meta = PRIORITY_META[n.priority];
          const Icon = meta.icon;
          return (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="font-semibold leading-tight">{n.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Effective {n.effectiveDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-red-600" onClick={() => remove(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Posted {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {store.name}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!notices.length && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No notices yet. Compose your first one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
