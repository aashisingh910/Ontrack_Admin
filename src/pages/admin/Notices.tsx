import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import logo from "@/assets/react-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Download,
  FileText,
  Share2,
  Plus,
  Calendar,
  AlertTriangle,
  Info,
  Sparkles,
  BookOpen,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface ApiNotice {
  _id: string;
  noticeId: string;
  noticeTitle: string;
  noticeNumber: string;
  noticeDate: string;
  effectiveDate: string;
  dueDate: string;
  acknowledgementRequired: boolean;
  acknowledgementText: string;
  issuer: {
    issuedBy: string;
    designation: string;
  };
  target: {
    targetAudience: string[];
    storeScope: string;
    zone: string;
    region: string;
    department: string;
    storeCodes: string[];
    departments: string[];
  };
  content: {
    description: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    importantInstructions: string[];
  };
  digitalSignatory: {
    signatoryName: string;
    designation: string;
    signedAt?: string;
  };
  attachments: any[];
  status: string;
  priority: string;
  visibility: string;
  acknowledgementStats: {
    totalTargeted: number;
    acknowledged: number;
    pending: number;
    acknowledgementPercent: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------
// API
// ----------------------------------------------------------------------

const API_BASE = "http://localhost:5002/api/aashi";

async function fetchNotices(): Promise<ApiNotice[]> {
  const res = await fetch(`${API_BASE}/notices`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Unknown error");
  return json.data;
}

async function createNotice(payload: Partial<ApiNotice>): Promise<ApiNotice> {
  const res = await fetch(`${API_BASE}/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Unknown error");
  return json.data;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const priorityMeta: Record<string, { label: string; cls: string; icon: typeof Info }> = {
  HIGH: { label: "High", cls: "bg-red-500/15 text-red-700 border-red-500/30", icon: AlertTriangle },
  MEDIUM: { label: "Medium", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Sparkles },
  LOW: { label: "Info", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30", icon: Info },
};

function audienceLabel(notice: ApiNotice): string {
  const { targetAudience, storeScope } = notice.target;
  if (storeScope === "All Stores" && targetAudience.includes("MANAGER") && targetAudience.includes("STAFF"))
    return "All managers & staff";
  if (targetAudience.includes("MANAGER") && targetAudience.includes("STAFF")) return "Managers & staff";
  if (targetAudience.includes("MANAGER")) return "All managers";
  if (targetAudience.includes("STAFF")) return "All staff";
  return targetAudience.join(", ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

// ----------------------------------------------------------------------
// PDF Generation (unchanged, already works for ApiNotice)
// ----------------------------------------------------------------------

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logo);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function buildNoticePdf(notice: ApiNotice): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;

  const priColorMap: Record<string, [number, number, number]> = {
    HIGH: [185, 28, 28],
    MEDIUM: [180, 83, 9],
    LOW: [14, 116, 144],
  };
  const [pr, pg, pb] = priColorMap[notice.priority] || [14, 116, 144];

  // Header
  doc.setFillColor(120, 53, 15);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 90, pageW, 4, "F");

  const logoData = await loadLogoDataUrl();
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", margin, 22, 50, 50);
    } catch {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("HOMETOWN", margin + 64, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Official Notice · Staff Workspace", margin + 64, 68);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(notice.noticeNumber, pageW - margin, 50, { align: "right" });
  doc.text(formatDate(notice.noticeDate), pageW - margin, 64, { align: "right" });

  // Priority badge
  doc.setFillColor(pr, pg, pb);
  doc.roundedRect(margin, 110, 70, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(notice.priority.toUpperCase(), margin + 35, 125, { align: "center" });

  // To & effective date
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`To: ${audienceLabel(notice)}`, margin + 82, 125);
  doc.text(`Effective: ${formatDate(notice.effectiveDate)}`, pageW - margin, 125, { align: "right" });

  // Title
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(notice.noticeTitle, pageW - margin * 2);
  doc.text(titleLines, margin, 170);

  const titleH = (titleLines as string[]).length * 22;
  const dividerY = 170 + titleH + 8;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  // Body
  const body = `${notice.content.description}

${notice.content.paragraph1}

${notice.content.paragraph2}

${notice.content.paragraph3}

Important Instructions:
${notice.content.importantInstructions.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const bodyLines = doc.splitTextToSize(body, pageW - margin * 2);
  let y = dividerY + 26;
  const lineH = 16;
  (bodyLines as string[]).forEach((ln) => {
    if (y > 740) {
      doc.addPage();
      y = margin;
    }
    doc.text(ln, margin, y);
    y += lineH;
  });

  // Signature
  if (y > 680) {
    doc.addPage();
    y = margin;
  }
  y += 24;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, margin + 200, y);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(notice.digitalSignatory.signatoryName, margin, y + 16);
  doc.text(notice.digitalSignatory.designation, margin, y + 30);

  // Footer
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

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function Notices() {
  const [notices, setNotices] = useState<ApiNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [paragraph1, setParagraph1] = useState("");
  const [paragraph2, setParagraph2] = useState("");
  const [paragraph3, setParagraph3] = useState("");
  const [instructionsStr, setInstructionsStr] = useState(""); // comma separated
  const [audience, setAudience] = useState<string[]>(["MANAGER", "STAFF"]);
  const [storeScope, setStoreScope] = useState("All Stores");
  const [priority, setPriority] = useState("MEDIUM");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [signatoryName, setSignatoryName] = useState("Head Office HR & Training");
  const [signatoryDesignation, setSignatoryDesignation] = useState("HR Manager");
  const [acknowledgementRequired, setAcknowledgementRequired] = useState(true);

  // Load notices on mount
  const loadNotices = () => {
    setLoading(true);
    fetchNotices()
      .then((data) => {
        setNotices(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load notices");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // Create notice
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setCreating(true);
    try {
      // Generate a unique noticeId and noticeNumber (backend may also generate, but we provide one)
      const now = new Date();
      const noticeId = `NOTICE-${now.getFullYear()}-${String(now.getMilliseconds()).padStart(3, "0")}`;
      const noticeNumber = `HT/NOTICE/${now.getFullYear()}/${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

      const payload = {
        noticeId,
        noticeTitle: title.trim(),
        noticeNumber,
        noticeDate: new Date().toISOString().slice(0, 10),
        effectiveDate,
        dueDate,
        acknowledgementRequired,
        acknowledgementText: acknowledgementRequired ? "Yes — Staff must acknowledge" : "",
        issuer: {
          issuedBy: signatoryName.trim(),
          designation: signatoryDesignation.trim(),
        },
        target: {
          targetAudience: audience,
          storeScope,
          zone: "All Zones",
          region: "All Regions",
          department: "All Departments",
          storeCodes: [],
          departments: [],
        },
        content: {
          description: description.trim(),
          paragraph1: paragraph1.trim(),
          paragraph2: paragraph2.trim(),
          paragraph3: paragraph3.trim(),
          importantInstructions: instructionsStr
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
        },
        digitalSignatory: {
          signatoryName: signatoryName.trim(),
          designation: signatoryDesignation.trim(),
        },
        status: "PUBLISHED",
        priority,
        visibility: "ACTIVE",
      };

      const createdNotice = await createNotice(payload);
      setNotices((prev) => [createdNotice, ...prev]);
      toast.success("Notice published successfully");

      // Reset form
      setTitle("");
      setDescription("");
      setParagraph1("");
      setParagraph2("");
      setParagraph3("");
      setInstructionsStr("");
      setAudience(["MANAGER", "STAFF"]);
      setPriority("MEDIUM");
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setAcknowledgementRequired(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create notice");
    } finally {
      setCreating(false);
    }
  };

  // Delete (if needed – backend may support DELETE later)
  // For now we hide the delete button because the backend has no DELETE yet

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error && notices.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6 text-center text-red-700">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-brand" /> Notices
        </h1>
        <p className="text-sm text-muted-foreground">
          Create and publish official notices. All notices are visible to managers and staff.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Creation Form */}
        <Card className="lg:col-span-2 self-start">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand" /> New Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Monthly Target Assignment"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description *</Label>
                <Textarea
                  id="desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of the notice"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Additional paragraphs (optional)</Label>
                <Input
                  value={paragraph1}
                  onChange={(e) => setParagraph1(e.target.value)}
                  placeholder="Paragraph 1"
                  className="mb-1"
                />
                <Input
                  value={paragraph2}
                  onChange={(e) => setParagraph2(e.target.value)}
                  placeholder="Paragraph 2"
                  className="mb-1"
                />
                <Input
                  value={paragraph3}
                  onChange={(e) => setParagraph3(e.target.value)}
                  placeholder="Paragraph 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">
                  Important Instructions (comma separated)
                </Label>
                <Input
                  id="instructions"
                  value={instructionsStr}
                  onChange={(e) => setInstructionsStr(e.target.value)}
                  placeholder="Review targets, Align staff, etc."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select
                    value={audience.join(",")}
                    onValueChange={(v) => setAudience(v.split(","))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANAGER,STAFF">All managers & staff</SelectItem>
                      <SelectItem value="MANAGER">All managers</SelectItem>
                      <SelectItem value="STAFF">All staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Store Scope</Label>
                  <Select value={storeScope} onValueChange={setStoreScope}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Stores">All Stores</SelectItem>
                      <SelectItem value="West Zone">West Zone</SelectItem>
                      {/* Add more if needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eff">Effective Date</Label>
                  <Input
                    id="eff"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due">Due Date</Label>
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signName">Signed by (Name)</Label>
                  <Input
                    id="signName"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signDes">Designation</Label>
                  <Input
                    id="signDes"
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="ackReq"
                  checked={acknowledgementRequired}
                  onCheckedChange={(v) => setAcknowledgementRequired(!!v)}
                />
                <Label htmlFor="ackReq" className="text-sm cursor-pointer">
                  Acknowledgement required
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm"
                disabled={creating}
              >
                {creating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                {creating ? "Publishing..." : "Publish Notice"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notice List */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-brand" /> Published Notices
            </h2>
            <Badge variant="outline">{notices.length}</Badge>
          </div>

          {notices.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No notices published yet.
              </CardContent>
            </Card>
          )}

          {notices.map((notice) => {
            const pri = priorityMeta[notice.priority] || priorityMeta.LOW;
            return (
              <Card key={notice._id} className="overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={pri.cls}>
                          <pri.icon className="h-3 w-3 mr-1" /> {pri.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {notice.noticeNumber}
                        </span>
                        {notice.acknowledgementRequired && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            Ack. required
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-display text-base font-semibold leading-tight">
                        {notice.noticeTitle}
                      </h3>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Effective: {formatDate(notice.effectiveDate)}
                        </span>
                        <span>Due: {formatDate(notice.dueDate)}</span>
                        <span>To: {audienceLabel(notice)}</span>
                        <span>Issued by: {notice.issuer.issuedBy}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-line text-muted-foreground line-clamp-2">
                    {notice.content.description}
                  </p>

                  {notice.acknowledgementRequired && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>
                        Acknowledged: {notice.acknowledgementStats.acknowledged}/
                        {notice.acknowledgementStats.totalTargeted} (
                        {notice.acknowledgementStats.acknowledgementPercent}%)
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const doc = await buildNoticePdf(notice);
                        doc.save(`Hometown-Notice-${notice.noticeNumber}.pdf`);
                        toast.success("PDF downloaded");
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const doc = await buildNoticePdf(notice);
                        window.open(doc.output("bloburl"), "_blank", "noopener,noreferrer");
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const doc = await buildNoticePdf(notice);
                        const blob = doc.output("blob");
                        const file = new File(
                          [blob],
                          `Hometown-Notice-${notice.noticeNumber}.pdf`,
                          { type: "application/pdf" }
                        );
                        if (
                          navigator.share &&
                          navigator.canShare &&
                          navigator.canShare({ files: [file] })
                        ) {
                          try {
                            await navigator.share({
                              title: `Hometown Notice — ${notice.noticeTitle}`,
                              text: `${notice.noticeTitle}\nRef: ${notice.noticeNumber}`,
                              files: [file],
                            });
                            toast.success("Shared");
                          } catch {}
                        } else {
                          const text = `${notice.noticeTitle}\nRef: ${notice.noticeNumber}\nTo: ${audienceLabel(notice)}\nEffective: ${formatDate(notice.effectiveDate)}\n\n${notice.content.description}`;
                          await navigator.clipboard.writeText(text);
                          toast.success("Notice text copied to clipboard");
                        }
                      }}
                    >
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