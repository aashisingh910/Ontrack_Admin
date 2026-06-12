import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Plus,
  Calendar,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface ApiNotice {
  _id: string;
  noticeId?: string;
  noticeTitle: string;
  noticeNumber?: string;
  noticeDate?: string;
  effectiveDate: string;
  priority: string;
  content: { description: string };
  status?: string;
  createdAt: string;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const PRIORITY_META: Record<string, { label: string; cls: string; icon: typeof Info }> = {
  LOW:    { label: "Info",      cls: "bg-sky-500/15 text-sky-700 border-sky-500/30",      icon: Info },
  MEDIUM: { label: "Important", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Sparkles },
  HIGH:   { label: "Urgent",    cls: "bg-red-500/15 text-red-700 border-red-500/30",      icon: AlertTriangle },
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function ManagerNotices() {
  const session = getSession();
  const [notices, setNotices] = useState<ApiNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    noticeTitle: "",
    description: "",
    priority: "LOW" as Priority,
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  const fetchNotices = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login token missing.");
      // Backend scopes to manager's store via token — no storeCode from frontend
      const res = await fetch(`${API_BASE_URL}/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load notices");
      setNotices(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const sendNotice = async () => {
    if (!form.noticeTitle.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noticeTitle: form.noticeTitle,
          effectiveDate: form.effectiveDate,
          priority: form.priority,
          content: { description: form.description },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to post notice");
      toast.success("Notice posted to your store team.");
      setForm({
        noticeTitle: "",
        description: "",
        priority: "LOW",
        effectiveDate: new Date().toISOString().slice(0, 10),
      });
      setComposing(false);
      await fetchNotices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post notice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Notices</h1>
          <p className="text-sm text-muted-foreground">
            Notices for {session?.storeName || "your store"}.
          </p>
        </div>
        <Button
          onClick={() => setComposing(!composing)}
          className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm"
        >
          <Plus className="h-4 w-4 mr-1" /> New notice
        </Button>
      </div>

      {/* Compose form */}
      {composing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Megaphone className="h-4 w-4 text-brand" /> Compose notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  value={form.noticeTitle}
                  onChange={(e) => setForm((f) => ({ ...f, noticeTitle: e.target.value }))}
                  placeholder="Notice subject…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Info</SelectItem>
                    <SelectItem value="MEDIUM">Important</SelectItem>
                    <SelectItem value="HIGH">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Effective date</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description *</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notice content…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setComposing(false)}>
                Cancel
              </Button>
              <Button
                onClick={sendNotice}
                disabled={submitting}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Send to team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notices list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-red-600 mb-2">{error}</div>
            <button onClick={fetchNotices} className="rounded-md border px-3 py-1.5 text-xs">
              Retry
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => {
            const meta = PRIORITY_META[n.priority] ?? PRIORITY_META.LOW;
            const Icon = meta.icon;
            return (
              <Card key={n._id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="font-semibold leading-tight">{n.noticeTitle}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Effective{" "}
                            {new Date(n.effectiveDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {n.noticeNumber && (
                            <span className="text-[11px] text-muted-foreground">
                              #{n.noticeNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {n.content?.description}
                  </p>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Posted{" "}
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!notices.length && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No notices yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
