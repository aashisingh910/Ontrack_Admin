import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, AlertTriangle, Info, Sparkles } from "lucide-react";

type Priority = "info" | "important" | "urgent";

type Notice = {
  id: string;
  title: string;
  body: string;
  priority: Priority;
  effectiveDate: string;
  from: string;
  createdAt: string;
};

const PRIORITY_META: Record<Priority, { label: string; cls: string; icon: typeof Info }> = {
  info:      { label: "Info",      cls: "bg-sky-500/15 text-sky-700 border-sky-500/30",       icon: Info },
  important: { label: "Important", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Sparkles },
  urgent:    { label: "Urgent",    cls: "bg-red-500/15 text-red-700 border-red-500/30",        icon: AlertTriangle },
};

const seedNotices: Notice[] = [
  {
    id: "n1",
    title: "Diwali bonus week — extended hours",
    body: "Stores will operate 9:00–22:00 from Oct 28 to Nov 5. Daily target stands at 130%. Additional 2% incentive on any day exceeding daily target. Let's make it our best week.",
    priority: "important",
    effectiveDate: "2026-10-28",
    from: "Admin · Hometown HQ",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "n2",
    title: "Attendance app — please update",
    body: "Update the app to version 2.1.4 by end of this week. The new geofence settings will not apply until you update.",
    priority: "info",
    effectiveDate: "2026-06-10",
    from: "Store Manager",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "n3",
    title: "Uniform compliance — reminder",
    body: "Please wear the full uniform including the name badge during all shift hours. CCTV audits are active. Non-compliance will be logged.",
    priority: "urgent",
    effectiveDate: "2026-06-08",
    from: "Regional Manager",
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
];

export default function StaffNotices() {
  const [read, setRead] = useState<Set<string>>(new Set());

  const markRead = (id: string) => setRead((prev) => new Set([...prev, id]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Notices</h1>
        <p className="text-sm text-muted-foreground">
          {seedNotices.length - read.size} unread · {seedNotices.length} total
        </p>
      </div>

      <div className="space-y-4">
        {seedNotices.map((n) => {
          const meta = PRIORITY_META[n.priority];
          const Icon = meta.icon;
          const isRead = read.has(n.id);
          return (
            <Card
              key={n.id}
              className={`transition-opacity cursor-pointer ${isRead ? "opacity-60" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold leading-tight">{n.title}</span>
                      {!isRead && (
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className={meta.cls + " text-[10px]"}>{meta.label}</Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {n.effectiveDate}
                      </span>
                      <span className="text-[11px] text-muted-foreground">· From: {n.from}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {isRead && <span className="ml-2 text-emerald-600">· Read</span>}
                  {!isRead && <span className="ml-2 text-brand">· Tap to mark as read</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!seedNotices.length && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No notices yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
