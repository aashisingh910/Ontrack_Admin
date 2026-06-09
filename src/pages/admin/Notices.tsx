import { useState } from "react";
import { jsPDF } from "jspdf";
import { stores, managers, staff } from "@/lib/mock-data";
import logo from "@/assets/react-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Megaphone, Download, FileText, Share2, Plus, Calendar, AlertTriangle, Info, Sparkles, Trash2, Send,
} from "lucide-react";
import { toast } from "sonner";

type Priority = "info" | "important" | "urgent";
type Audience = "all" | "managers" | "staff" | "store";

type Notice = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  storeId?: string;
  priority: Priority;
  reference: string;
  effectiveDate: string;
  signedBy: string;
  createdAt: string;
};

const PRIORITY_META: Record<Priority, { label: string; cls: string; icon: typeof Info }> = {
  info: { label: "Info", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30", icon: Info },
  important: { label: "Important", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Sparkles },
  urgent: { label: "Urgent", cls: "bg-red-500/15 text-red-700 border-red-500/30", icon: AlertTriangle },
};

const seed: Notice[] = [
  {
    id: "n1",
    title: "Diwali bonus week — extended hours",
    body:
      "Team, the Diwali bonus week runs Oct 28 – Nov 5. Stores will operate from 9:00 to 22:00 daily. Daily target stands at 130% of the regular daily target. Managers, please publish the staff rota by Friday 25.\n\nAdditional 2% incentive will be paid on any sale exceeding the daily target.\n\nLet's make it the best week of the quarter.",
    audience: "all",
    priority: "important",
    reference: "HT-2026-OCT-014",
    effectiveDate: "2026-10-28",
    signedBy: "Admin · Hometown HQ",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "n2",
    title: "Updated geo-fence radius for attendance",
    body:
      "Effective immediately, attendance auto check-in radius has been updated to 200 meters from the store entrance. Please reinstall the latest staff app if you face any issues.",
    audience: "managers",
    priority: "info",
    reference: "HT-2026-OPS-007",
    effectiveDate: "2026-06-10",
    signedBy: "Operations · Hometown HQ",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>(seed);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [storeId, setStoreId] = useState<string>(stores[0].id);
  const [priority, setPriority] = useState<Priority>("info");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [signedBy, setSignedBy] = useState("Admin · Hometown HQ");

  const reset = () => {
    setTitle(""); setBody(""); setAudience("all"); setStoreId(stores[0].id);
    setPriority("info"); setEffectiveDate(new Date().toISOString().slice(0, 10));
  };

  const audienceLabel = (n: Notice) => {
    if (n.audience === "store") {
      const s = stores.find((x) => x.id === n.storeId);
      return `Store · ${s?.name ?? "—"}`;
    }
    if (n.audience === "all") return "All managers & staff";
    if (n.audience === "managers") return "All managers";
    return "All staff";
  };

  const recipientsCount = (n: Notice) => {
    if (n.audience === "store") {
      return managers.filter((m) => m.storeId === n.storeId).length +
             staff.filter((s) => s.storeId === n.storeId).length;
    }
    if (n.audience === "all") return managers.length + staff.length;
    if (n.audience === "managers") return managers.length;
    return staff.length;
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const n: Notice = {
      id: "n" + Date.now(),
      title: title.trim(),
      body: body.trim(),
      audience,
      storeId: audience === "store" ? storeId : undefined,
      priority,
      reference: "HT-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      effectiveDate,
      signedBy,
      createdAt: new Date().toISOString(),
    };
    setNotices((prev) => [n, ...prev]);
    toast.success("Notice published");
    reset();
  };

  const remove = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notice removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Notices</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Compose an official notice; we'll generate a branded PDF you can share with managers and staff.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 self-start">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand" /> New notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Updated dress code from Monday" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Write the notice as you'd like it to appear on the PDF." />
                <div className="text-[11px] text-muted-foreground text-right">{body.length}/2000</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers &amp; staff</SelectItem>
                      <SelectItem value="managers">All managers</SelectItem>
                      <SelectItem value="staff">All staff</SelectItem>
                      <SelectItem value="store">Single store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {audience === "store" && (
                  <div className="space-y-2">
                    <Label>Store</Label>
                    <Select value={storeId} onValueChange={setStoreId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.city}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eff">Effective date</Label>
                  <Input id="eff" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sign">Signed by</Label>
                  <Input id="sign" value={signedBy} onChange={(e) => setSignedBy(e.target.value)} maxLength={80} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
                <Send className="h-4 w-4 mr-1" /> Publish & generate PDF
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-brand" /> Published notices
            </h2>
            <Badge variant="outline">{notices.length}</Badge>
          </div>

          {notices.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No notices yet. Compose one on the left.</CardContent></Card>
          )}

          {notices.map((n) => {
            const P = PRIORITY_META[n.priority];
            return (
              <Card key={n.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={P.cls}><P.icon className="h-3 w-3 mr-1" /> {P.label}</Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">{n.reference}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold leading-tight">{n.title}</h3>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        <span><Calendar className="h-3 w-3 inline mr-1" />Effective {new Date(n.effectiveDate).toLocaleDateString()}</span>
                        <span>To: {audienceLabel(n)}</span>
                        <span>{recipientsCount(n)} recipients</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(n.id)} aria-label="Delete notice">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-line text-muted-foreground line-clamp-3">{n.body}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => downloadNoticePdf(n, audienceLabel(n))}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => previewNoticePdf(n, audienceLabel(n))}>
                      <FileText className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => shareNotice(n, audienceLabel(n))}>
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logo);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function buildNoticePdf(n: Notice, audienceLabel: string): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;

  const priorityColors: Record<Priority, [number, number, number]> = {
    info: [14, 116, 144],
    important: [180, 83, 9],
    urgent: [185, 28, 28],
  };
  const [pr, pg, pb] = priorityColors[n.priority];

  doc.setFillColor(120, 53, 15);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 90, pageW, 4, "F");

  const logoData = await loadLogoDataUrl();
  if (logoData) {
    try { doc.addImage(logoData, "PNG", margin, 22, 50, 50); } catch { /* ignore */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("HOMETOWN", margin + 64, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Official Notice · Staff Workspace", margin + 64, 68);

  doc.setFontSize(9);
  doc.text(n.reference, pageW - margin, 50, { align: "right" });
  doc.text(new Date(n.createdAt).toLocaleDateString(), pageW - margin, 64, { align: "right" });

  doc.setFillColor(pr, pg, pb);
  doc.roundedRect(margin, 110, 80, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(PRIORITY_META[n.priority].label.toUpperCase(), margin + 40, 125, { align: "center" });

  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`To: ${audienceLabel}`, margin + 92, 125);
  doc.text(`Effective: ${new Date(n.effectiveDate).toLocaleDateString()}`, pageW - margin, 125, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(n.title, pageW - margin * 2);
  doc.text(titleLines, margin, 170);

  const titleH = (titleLines as string[]).length * 22;
  const dividerY = 170 + titleH + 8;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const bodyLines = doc.splitTextToSize(n.body, pageW - margin * 2);
  let y = dividerY + 26;
  const lineH = 16;
  (bodyLines as string[]).forEach((ln) => {
    if (y > 740) { doc.addPage(); y = margin; }
    doc.text(ln, margin, y);
    y += lineH;
  });

  if (y > 680) { doc.addPage(); y = margin; }
  y += 24;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, margin + 200, y);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(n.signedBy, margin, y + 16);
  doc.text("Authorised Signatory", margin, y + 30);

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageW - margin, footerY - 10);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Hometown — Staff Workspace · This is an internal notice for managers and staff.", margin, footerY);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageW - margin, footerY, { align: "right" });

  return doc;
}

async function downloadNoticePdf(n: Notice, audienceLabel: string) {
  const doc = await buildNoticePdf(n, audienceLabel);
  doc.save(`Hometown-Notice-${n.reference}.pdf`);
  toast.success("PDF downloaded");
}

async function previewNoticePdf(n: Notice, audienceLabel: string) {
  const doc = await buildNoticePdf(n, audienceLabel);
  const url = doc.output("bloburl");
  window.open(url, "_blank", "noopener,noreferrer");
}

async function shareNotice(n: Notice, audienceLabel: string) {
  try {
    const doc = await buildNoticePdf(n, audienceLabel);
    const blob = doc.output("blob");
    const file = new File([blob], `Hometown-Notice-${n.reference}.pdf`, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({
        title: `Hometown Notice — ${n.title}`,
        text: `${n.title}\nRef: ${n.reference}\nTo: ${audienceLabel}`,
        files: [file],
      });
      toast.success("Shared");
      return;
    }
  } catch {
    /* fall through to copy */
  }
  await navigator.clipboard.writeText(
    `Hometown Notice — ${n.title}\nRef: ${n.reference}\nTo: ${audienceLabel}\nEffective: ${n.effectiveDate}\n\n${n.body}\n\n— ${n.signedBy}`
  );
  toast.success("Notice text copied to clipboard");
}
