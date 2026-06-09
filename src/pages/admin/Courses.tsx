import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Clock, Users, GraduationCap, ArrowRight, Award, Loader2, 
  CheckCircle2, Trash2, Upload, ArrowLeft, Target, Trophy, 
  Printer, AlertCircle, GripVertical, Copy, ChevronDown, ChevronUp,
  BookOpen, ListChecks, Link as LinkIcon, Tag, CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE_URL = "http://localhost:5002/api/aashi";

// ------------------ Types ------------------
interface Question {
  _id?: string;
  questionId: string;
  type: "MCQ" | "TRUE_FALSE" | "DESCRIPTIVE";
  question: string;
  points: number;
  options?: string[];
  correctAnswer: string | boolean;
  explanation?: string;
  sampleAnswer?: string;
  keywords?: string[];
}

interface Course {
  _id: string;
  courseId: string;
  courseCode: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  courseText: string;
  audienceRoles: string[];
  applicableDepartments: string[];
  totalPoints: number;
  passingScore: number;
  questions: Question[];
  status: "ACTIVE" | "INACTIVE";
  enrolled?: number;
  completionRate?: number;
  badge?: string;
  certificate?: boolean;
  learningOutcomes?: string[];
  prerequisites?: string[];
  tags?: string[];
  difficulty?: "easy" | "medium" | "hard";
  estimatedTimePerDay?: number;
  supportingMaterials?: string;
  scoring?: {
    totalPoints: number;
    passingScore: number;
    scoreType: string;
    scoreCalculation: string;
  };
  attemptRules?: {
    maxAttempts: number;
    allowRetakeAfterFail: boolean;
    showCorrectAnswersAfterPass: boolean;
    managerReviewRequiredForDescriptive: boolean;
    questionRandomization: boolean;
  };
}

const COVERS = [
  "linear-gradient(135deg, var(--brand), var(--golden))",
  "linear-gradient(135deg, var(--info), var(--brand))",
  "linear-gradient(135deg, var(--brown), var(--golden))",
  "linear-gradient(135deg, var(--golden), var(--brand))",
  "linear-gradient(135deg, #b45309, #ea580c)",
  "linear-gradient(135deg, #1e3a8a, #b45309)",
];

const CATEGORIES = ["Product Knowledge", "Sales Skills", "Brand & Customer Experience", "Service", "Operations", "Compliance", "Store Excellence"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const AUDIENCE_ROLES = ["STAFF", "MANAGER"];
const DEPARTMENTS = ["FURNITURE", "HOMEWARE", "OPERATIONS", "DESIGN STUDIO", "ACCOUNT & FINANCE", "VISUAL MERCHANDISING"];

// ------------------ Main Component ------------------
export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/courses`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) setCourses(data.data);
      else toast.error(data.message || "Failed to load courses");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (newCourse: Omit<Course, "_id" | "createdAt" | "updatedAt">) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Course "${newCourse.title}" created`);
        setCourses((prev) => [data.data, ...prev]);
        setOpenDialog(false);
      } else {
        toast.error(data.message || "Creation failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (selectedCourse) {
    return (
      <CourseDetailView
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-display font-bold">Courses</h1>
          <Button disabled><Plus className="h-4 w-4 mr-1" /> New course</Button>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-48" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">{courses.length} course{courses.length !== 1 ? "s" : ""} available</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
              <Plus className="h-4 w-4 mr-1" /> New course
            </Button>
          </DialogTrigger>
          <NewCourseDialog onCreate={handleCreate} />
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map((c) => (
          <CourseCard key={c._id} course={c} onOpen={() => setSelectedCourse(c)} />
        ))}
      </div>
    </div>
  );
}

// ------------------ Course Card ------------------
function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const coverStyle = COVERS[Math.floor(Math.random() * COVERS.length)];
  const durationText = `${course.durationMinutes} min`;
  const questionCount = course.questions?.length || 0;
  return (
    <Card className="overflow-hidden hover:shadow-warm transition group">
      <div className="h-28 relative" style={{ background: coverStyle }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="bg-white/90 text-foreground">{course.category}</Badge>
          <Badge variant="outline" className="bg-white/70 border-white/40">{course.level}</Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white font-display text-lg font-semibold leading-tight drop-shadow">
            {course.title}
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{course.courseText?.substring(0, 100)}...</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {durationText}</span>
          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {questionCount} questions</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrolled || 0} enrolled</span>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-muted-foreground">Points</span>
            <span className="font-medium">{course.totalPoints} pts / Pass {course.passingScore} pts</span>
          </div>
          <Progress value={course.completionRate || 0} className="h-1.5 [&>div]:bg-brand" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--brown)]">
            <Award className="h-3 w-3 text-golden" /> {course.badge || "Badge"}
            {course.certificate && <CheckCircle2 className="h-3 w-3 text-brand ml-1" />}
          </span>
          <Button size="sm" variant="outline" onClick={onOpen}>
            Open <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------ Detailed Course View (Complete) ------------------
function CourseDetailView({ course, onBack }: { course: Course; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ autoPoints: number; totalPoints: number; passed: boolean; pendingDescriptive: boolean } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [userName, setUserName] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProgress();
    fetchUserName();
  }, []);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/courses/${course.courseId}/progress`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setAnswers(data.data.answers || {});
          setSubmitted(data.data.submitted || false);
          setScore({
            autoPoints: data.data.autoPoints || 0,
            totalPoints: data.data.totalPoints || 0,
            passed: data.data.passed || false,
            pendingDescriptive: data.data.pendingDescriptive || false,
          });
          setAttempts(data.data.attempts || 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchUserName = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUserName(data.data.name || data.data.fullName || "Learner");
        else setUserName(localStorage.getItem("userName") || "Hometown Staff Member");
      } else {
        setUserName(localStorage.getItem("userName") || "Hometown Staff Member");
      }
    } catch {
      setUserName(localStorage.getItem("userName") || "Hometown Staff Member");
    }
  };

  const handleAnswer = (qId: string, answer: string | boolean) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const submitQuiz = async () => {
    const unanswered = course.questions.filter(q => q.type !== "DESCRIPTIVE" && !answers[q.questionId]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all MCQ/TrueFalse questions (${unanswered.length} left).`);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        courseId: course.courseId,
        answers: Object.entries(answers).map(([qId, ans]) => ({ questionId: qId, answer: ans })),
      };
      const res = await fetch(`${API_BASE_URL}/courses/${course.courseId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScore({
          autoPoints: data.autoPoints,
          totalPoints: data.totalPoints,
          passed: data.passed,
          pendingDescriptive: data.pendingDescriptive,
        });
        setSubmitted(true);
        if (data.passed && !data.pendingDescriptive) toast.success("Congratulations! You passed!");
        else if (data.passed && data.pendingDescriptive) toast.info("Auto-passed, manager will review descriptive answers.");
        else toast.error("Not passed. Review and try again.");
      } else {
        toast.error(data.message || "Submission failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  const generateCertificate = async () => {
    if (!certificateRef.current) return;
    try {
      toast.info("Generating certificate...");
      const canvas = await html2canvas(certificateRef.current, { scale: 2, backgroundColor: "#ffffff", logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${course.title.replace(/\s+/g, "_")}_Certificate.pdf`);
      toast.success("Certificate downloaded!");
    } catch (err) {
      toast.error("Failed to generate certificate");
    }
  };

  if (loadingProgress) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const coverStyle = "linear-gradient(135deg, var(--brand), var(--golden))";
  const durationText = `${course.durationMinutes} min`;
  const autoScore = score?.autoPoints || 0;
  const percentage = score ? (autoScore / score.totalPoints) * 100 : 0;
  const passed = score?.passed || false;
  const showCertificateButton = passed && course.certificate && !score?.pendingDescriptive;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
      </Button>
      <Card className="overflow-hidden">
        <div className="relative p-6 sm:p-8" style={{ background: coverStyle }}>
          <div className="absolute inset-0 bg-black/15" />
          <div className="relative text-white space-y-3">
            <div className="flex gap-2">
              <Badge className="bg-white/90 text-foreground">{course.category}</Badge>
              <Badge variant="outline" className="bg-white/15 border-white/40 text-white">{course.level}</Badge>
              {course.certificate && <Badge className="bg-golden text-[color:var(--brown)]">Certificate</Badge>}
            </div>
            <h1 className="text-3xl font-display font-bold">{course.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {durationText}</span>
              <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {course.questions.length} questions</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.enrolled || 0} enrolled</span>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>About this course</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{course.courseText}</p>
              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase mb-2">Learning outcomes</div>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {course.learningOutcomes.map((outcome, i) => <li key={i}>{outcome}</li>)}
                  </ul>
                </div>
              )}
              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase mb-2">Prerequisites</div>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {course.prerequisites.map((prereq, i) => <li key={i}>{prereq}</li>)}
                  </ul>
                </div>
              )}
              {course.applicableDepartments && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase mb-2">Departments</div>
                  <div className="flex flex-wrap gap-1">{course.applicableDepartments.map(d => <Badge key={d} variant="secondary">{d}</Badge>)}</div>
                </div>
              )}
              {course.tags && course.tags.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1">{course.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-brand" /> Quiz</CardTitle>
              <div className="text-xs text-muted-foreground">Pass: {course.passingScore} / {course.totalPoints} points</div>
            </CardHeader>
            <CardContent className="space-y-5">
              {course.questions.map((q, idx) => (
                <div key={q.questionId} className="space-y-2">
                  <div className="text-sm font-medium">{idx+1}. {q.question} <span className="text-xs text-muted-foreground">({q.points} pts)</span></div>
                  {q.type === "MCQ" && q.options && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map(opt => {
                        const selected = answers[q.questionId] === opt;
                        const isRight = submitted && score && opt === q.correctAnswer;
                        const isWrong = submitted && selected && opt !== q.correctAnswer;
                        return (
                          <button key={opt} disabled={submitted} onClick={() => handleAnswer(q.questionId, opt)}
                            className={`text-left text-sm rounded-md border px-3 py-2 transition ${
                              isRight ? "border-success bg-success/10" :
                              isWrong ? "border-destructive bg-destructive/10" :
                              selected ? "border-brand bg-accent" : "hover:bg-accent/30"
                            }`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "TRUE_FALSE" && (
                    <div className="flex gap-2">
                      {["true","false"].map(val => {
                        const boolVal = val === "true";
                        const selected = answers[q.questionId] === boolVal;
                        const isRight = submitted && score && boolVal === q.correctAnswer;
                        const isWrong = submitted && selected && boolVal !== q.correctAnswer;
                        return (
                          <button key={val} disabled={submitted} onClick={() => handleAnswer(q.questionId, boolVal)}
                            className={`px-4 py-2 text-sm rounded-md border ${
                              isRight ? "border-success bg-success/10" :
                              isWrong ? "border-destructive bg-destructive/10" :
                              selected ? "border-brand bg-accent" : "hover:bg-accent/30"
                            }`}>
                            {val.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "DESCRIPTIVE" && (
                    <textarea disabled={submitted} className="w-full border rounded-md p-2 text-sm" rows={3}
                      value={answers[q.questionId] as string || ""}
                      onChange={(e) => handleAnswer(q.questionId, e.target.value)}
                      placeholder="Type your answer here..." />
                  )}
                  {submitted && q.type !== "DESCRIPTIVE" && (
                    <div className="text-xs mt-1">
                      {answers[q.questionId] === q.correctAnswer ?
                        <span className="text-success">✓ Correct (+{q.points} pts)</span> :
                        <span className="text-destructive">✗ Incorrect (correct: {typeof q.correctAnswer === 'string' ? q.correctAnswer : q.correctAnswer ? 'True' : 'False'})</span>
                      }
                      {q.explanation && <span className="text-muted-foreground ml-2">– {q.explanation}</span>}
                    </div>
                  )}
                  {submitted && q.type === "DESCRIPTIVE" && (
                    <div className="text-xs text-muted-foreground">✎ Descriptive answer submitted – pending manager review.</div>
                  )}
                </div>
              ))}
              {!submitted ? (
                <Button onClick={submitQuiz} disabled={Object.keys(answers).length < course.questions.filter(q => q.type !== "DESCRIPTIVE").length} className="bg-brand">
                  Submit quiz
                </Button>
              ) : (
                <div className={`rounded-lg border p-4 ${passed ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    {passed ? <Trophy className="h-4 w-4 text-success" /> : <Award className="h-4 w-4 text-destructive" />}
                    {passed ? (score?.pendingDescriptive ? "Auto-passed, pending manager review" : "Passed!") : "Not passed"}
                  </div>
                  <div className="text-sm mt-1">Score: {autoScore} / {score?.totalPoints} ({Math.round(percentage)}%)</div>
                  {score?.pendingDescriptive && <div className="text-sm mt-2 text-amber-600">Your descriptive answers are being reviewed by a manager. Final result will be updated later.</div>}
                  {!passed && !score?.pendingDescriptive && <Button variant="outline" size="sm" className="mt-3" onClick={resetQuiz}>Try again</Button>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex gap-2"><Award className="h-4 w-4 text-golden" /> Reward</CardTitle></CardHeader>
            <CardContent className="text-center p-6">
              <div className="inline-flex h-12 w-12 rounded-full bg-golden text-[color:var(--brown)] items-center justify-center mb-2"><Award className="h-6 w-6" /></div>
              <div className="font-display font-bold">{course.badge || "Badge"}</div>
              <div className="text-xs text-muted-foreground">Awarded on passing quiz</div>
              {course.certificate && <div className="text-xs mt-2">Certificate issued in PDF</div>}
              {showCertificateButton && (
                <Button onClick={generateCertificate} className="mt-4 w-full gap-2" variant="outline">
                  <Printer className="h-4 w-4" /> Print Certificate
                </Button>
              )}
            </CardContent>
          </Card>
          {course.attemptRules && (
            <Card>
              <CardHeader><CardTitle>Attempt Rules</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div>Max attempts: {course.attemptRules.maxAttempts}</div>
                <div>Retake allowed after fail: {course.attemptRules.allowRetakeAfterFail ? "Yes" : "No"}</div>
                <div>Show correct answers after pass: {course.attemptRules.showCorrectAnswersAfterPass ? "Yes" : "No"}</div>
                <div>Manager review for descriptive: {course.attemptRules.managerReviewRequiredForDescriptive ? "Required" : "Not required"}</div>
              </CardContent>
            </Card>
          )}
          {course.estimatedTimePerDay && (
            <Card>
              <CardHeader><CardTitle className="flex gap-2"><CalendarDays className="h-4 w-4" /> Time Commitment</CardTitle></CardHeader>
              <CardContent className="text-sm">
                Estimated {course.estimatedTimePerDay} minutes per day
              </CardContent>
            </Card>
          )}
          {course.supportingMaterials && (
            <Card>
              <CardHeader><CardTitle className="flex gap-2"><LinkIcon className="h-4 w-4" /> Resources</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <a href={course.supportingMaterials} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Supporting materials
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCertificateButton && (
        <div ref={certificateRef} className="fixed left-[-9999px] top-[-9999px] w-[800px] bg-white p-8 shadow-lg" style={{ fontFamily: "sans-serif" }}>
          <div className="border-8 border-golden p-6 text-center">
            <div className="mb-4 text-4xl">🏆</div>
            <h1 className="text-3xl font-bold text-brand mb-2">Certificate of Completion</h1>
            <p className="text-lg text-muted-foreground mb-6">This certificate is proudly presented to</p>
            <h2 className="text-2xl font-display font-bold text-[color:var(--brown)] mb-2">{userName}</h2>
            <p className="text-base mb-4">for successfully completing the course</p>
            <h3 className="text-xl font-semibold text-brand mb-4">{course.title}</h3>
            <div className="flex justify-center gap-2 mb-4">
              <Badge>{course.category}</Badge>
              <Badge variant="outline">{course.level}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Awarded on {new Date().toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground mt-4">Hometown Academy · Certified Excellence</p>
            <div className="mt-6 text-xs text-muted-foreground">Certificate ID: {course.courseId}-{Date.now()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------ Advanced New Course Dialog ------------------
function NewCourseDialog({ onCreate }: { onCreate: (c: any) => void }) {
  // Course basic info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Product Knowledge");
  const [level, setLevel] = useState("Intermediate");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [courseText, setCourseText] = useState("");
  const [audienceRoles, setAudienceRoles] = useState<string[]>(["STAFF"]);
  const [applicableDepartments, setApplicableDepartments] = useState<string[]>(["FURNITURE"]);
  const [badge, setBadge] = useState("");
  const [certificate, setCertificate] = useState(true);
  const [coverIdx, setCoverIdx] = useState(0);

  // Advanced fields
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([""]);
  const [prerequisites, setPrerequisites] = useState<string[]>([""]);
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [estimatedTimePerDay, setEstimatedTimePerDay] = useState(30);
  const [supportingMaterials, setSupportingMaterials] = useState("");

  // Questions
  const [questions, setQuestions] = useState<Question[]>([
    { questionId: "q1", type: "MCQ", question: "", points: 1, options: ["", "", "", ""], correctAnswer: "", explanation: "" }
  ]);

  // PDF upload state
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers for dynamic arrays
  const addOutcome = () => setLearningOutcomes([...learningOutcomes, ""]);
  const removeOutcome = (idx: number) => {
    if (learningOutcomes.length === 1) return;
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== idx));
  };
  const updateOutcome = (idx: number, value: string) => {
    const updated = [...learningOutcomes];
    updated[idx] = value;
    setLearningOutcomes(updated);
  };

  const addPrereq = () => setPrerequisites([...prerequisites, ""]);
  const removePrereq = (idx: number) => {
    if (prerequisites.length === 1) return;
    setPrerequisites(prerequisites.filter((_, i) => i !== idx));
  };
  const updatePrereq = (idx: number, value: string) => {
    const updated = [...prerequisites];
    updated[idx] = value;
    setPrerequisites(updated);
  };

  // PDF extraction (fixed)
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file");
      return;
    }
    setUploadingPDF(true);
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/courses/extract-pdf`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.text) {
        const extracted = data.text.trim();
        if (extracted) {
          setCourseText(prev => prev + (prev ? "\n\n--- Extracted from PDF ---\n" : "") + extracted);
          toast.success("PDF text extracted and appended to course description");
        } else {
          toast.warning("PDF contained no readable text");
        }
      } else {
        toast.error(data.message || "PDF extraction failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while extracting PDF");
    } finally {
      setUploadingPDF(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Question management (with reorder, duplicate)
  const generateQuestionId = (index: number) => `COURSE-TEMP-Q${String(index + 1).padStart(2, "0")}`;
  const updateQuestion = (idx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "type") {
      if (value === "MCQ") {
        updated[idx].options = ["", "", "", ""];
        updated[idx].correctAnswer = "";
      } else if (value === "TRUE_FALSE") {
        updated[idx].correctAnswer = true;
        delete updated[idx].options;
      } else if (value === "DESCRIPTIVE") {
        updated[idx].correctAnswer = "";
        delete updated[idx].options;
      }
    }
    setQuestions(updated);
  };
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionId: generateQuestionId(questions.length), type: "MCQ", question: "", points: 1, options: ["", "", "", ""], correctAnswer: "", explanation: "" }
    ]);
  };
  const removeQuestion = (idx: number) => {
    if (questions.length === 1) {
      toast.error("At least one question is required");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };
  const duplicateQuestion = (idx: number) => {
    const q = questions[idx];
    const newQ = { ...q, questionId: generateQuestionId(questions.length) };
    setQuestions([...questions.slice(0, idx + 1), newQ, ...questions.slice(idx + 1)]);
  };
  const moveQuestion = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === questions.length - 1) return;
    const newQuestions = [...questions];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]];
    setQuestions(newQuestions);
  };
  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      updated[qIdx].options![optIdx] = value;
      setQuestions(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Course title required");
    if (questions.length === 0) return toast.error("Add at least one question");

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return toast.error(`Question ${i + 1} text is empty`);
      if (q.type === "MCQ") {
        if (!q.options || q.options.some(opt => !opt.trim())) return toast.error(`Question ${i + 1}: all MCQ options must be filled`);
        if (!q.correctAnswer) return toast.error(`Question ${i + 1}: correct answer missing`);
      }
      if (q.type === "TRUE_FALSE" && q.correctAnswer === undefined) return toast.error(`Question ${i + 1}: correct answer (true/false) missing`);
    }

    // Filter out empty learning outcomes and prerequisites
    const finalOutcomes = learningOutcomes.filter(o => o.trim());
    const finalPrereqs = prerequisites.filter(p => p.trim());
    const tagArray = tags.split(",").map(t => t.trim()).filter(t => t);

    const finalQuestions = questions.map((q, idx) => ({
      ...q,
      questionId: `COURSE-${Date.now()}-Q${String(idx + 1).padStart(2, "0")}`,
      sequence: idx + 1,
      courseId: `COURSE-${Date.now()}`,
      courseCode: `HT-COURSE-${Date.now()}`,
      correctAnswer: q.type === "TRUE_FALSE" ? (q.correctAnswer === "true" || q.correctAnswer === true) : q.correctAnswer
    }));

    const totalPoints = finalQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
    const passingScore = Math.round(totalPoints * 0.7);

    const newCourse = {
      courseId: `COURSE-${Date.now()}`,
      courseCode: `HT-COURSE-${Date.now()}`,
      title: title.trim(),
      category,
      level,
      durationMinutes,
      courseText: courseText.trim() || "Course description",
      audienceRoles,
      applicableDepartments,
      totalPoints,
      passingScore,
      questions: finalQuestions,
      status: "ACTIVE",
      badge: badge.trim() || `${category} Badge`,
      certificate,
      learningOutcomes: finalOutcomes,
      prerequisites: finalPrereqs,
      tags: tagArray,
      difficulty,
      estimatedTimePerDay,
      supportingMaterials: supportingMaterials.trim() || undefined,
      scoring: {
        totalPoints,
        passingScore,
        scoreType: "AUTO_WITH_MANAGER_REVIEW_FOR_DESCRIPTIVE",
        scoreCalculation: "score = sum(points for correct answers) + manager-reviewed descriptive points; passed = score >= passingScore"
      },
      attemptRules: {
        maxAttempts: 3,
        allowRetakeAfterFail: true,
        showCorrectAnswersAfterPass: true,
        managerReviewRequiredForDescriptive: true,
        questionRandomization: false
      }
    };
    onCreate(newCourse);
  };

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl">Create a new course</DialogTitle>
        <DialogDescription>Fill in all details. You can upload a PDF to extract text for the course description.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ----- Basic Information ----- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5" /> Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Course title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Recliner Product Knowledge" required /></div>
            <div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger /><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Level</Label><Select value={level} onValueChange={setLevel}><SelectTrigger /><SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Duration (minutes)</Label><Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} min={5} /></div>
            <div><Label>Audience roles</Label><Select value={audienceRoles[0]} onValueChange={(val) => setAudienceRoles([val])}><SelectTrigger /><SelectContent>{AUDIENCE_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Applicable departments</Label><Select value={applicableDepartments[0]} onValueChange={(val) => setApplicableDepartments([val])}><SelectTrigger /><SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          </div>

          {/* Course Text with PDF Upload */}
          <div>
            <Label>Course text *</Label>
            <div className="flex gap-2 items-start mt-1">
              <Textarea rows={5} value={courseText} onChange={(e) => setCourseText(e.target.value)} placeholder="Detailed description of the course content. You can also upload a PDF below." required className="flex-1" />
              <div className="flex flex-col gap-2">
                <input type="file" accept=".pdf" onChange={handlePDFUpload} ref={fileInputRef} className="hidden" id="pdfUpload" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPDF} className="whitespace-nowrap">
                  {uploadingPDF ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  {uploadingPDF ? "Extracting..." : "Upload PDF"}
                </Button>
                <p className="text-xs text-muted-foreground max-w-[120px]">PDF text will be appended to the description.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ----- Advanced Fields ----- */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><ListChecks className="h-5 w-5" /> Learning & Prerequisites</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learning Outcomes */}
            <div className="space-y-2">
              <Label>Learning outcomes (one per line)</Label>
              {learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input value={outcome} onChange={(e) => updateOutcome(idx, e.target.value)} placeholder={`Outcome ${idx+1}`} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOutcome(idx)} disabled={learningOutcomes.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOutcome}><Plus className="h-3 w-3 mr-1" /> Add outcome</Button>
            </div>
            {/* Prerequisites */}
            <div className="space-y-2">
              <Label>Prerequisites (one per line)</Label>
              {prerequisites.map((prereq, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input value={prereq} onChange={(e) => updatePrereq(idx, e.target.value)} placeholder={`Prerequisite ${idx+1}`} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePrereq(idx)} disabled={prerequisites.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPrereq}><Plus className="h-3 w-3 mr-1" /> Add prerequisite</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Tags (comma separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sofa, recliner, comfort" /></div>
            <div><Label>Difficulty</Label><Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}><SelectTrigger /><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select></div>
            <div><Label>Est. time per day (min)</Label><Input type="number" value={estimatedTimePerDay} onChange={(e) => setEstimatedTimePerDay(Number(e.target.value))} min={5} /></div>
            <div className="md:col-span-3"><Label>Supporting materials URL (optional)</Label><Input value={supportingMaterials} onChange={(e) => setSupportingMaterials(e.target.value)} placeholder="https://..." /></div>
          </div>
        </div>

        {/* ----- Badge & Certificate ----- */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Award className="h-5 w-5" /> Reward & Recognition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Badge name (optional)</Label><Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. Recliner Expert" /></div>
            <div className="flex items-center justify-between"><Label>Issue certificate on completion</Label><Switch checked={certificate} onCheckedChange={setCertificate} /></div>
            <div><Label>Cover style</Label><div className="flex gap-2">{COVERS.map((g, i) => <button type="button" key={i} onClick={() => setCoverIdx(i)} className={`h-9 w-14 rounded-md ${coverIdx===i?"ring-2 ring-brand":""}`} style={{background:g}} />)}</div></div>
          </div>
        </div>

        {/* ----- Questions Builder ----- */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5" /> Questions</h3>
            <Button type="button" size="sm" onClick={addQuestion}><Plus className="h-4 w-4 mr-1" /> Add question</Button>
          </div>
          {questions.map((q, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-muted/30 relative">
              <div className="flex justify-between items-center">
                <span className="font-medium">Question {idx + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(idx, "up")} disabled={idx === 0}><ChevronUp className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(idx, "down")} disabled={idx === questions.length-1}><ChevronDown className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => duplicateQuestion(idx)}><Copy className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1"><Label>Type</Label><Select value={q.type} onValueChange={(v) => updateQuestion(idx, "type", v)}><SelectTrigger /><SelectContent><SelectItem value="MCQ">MCQ</SelectItem><SelectItem value="TRUE_FALSE">True/False</SelectItem><SelectItem value="DESCRIPTIVE">Descriptive</SelectItem></SelectContent></Select></div>
                <div className="md:col-span-2"><Label>Points</Label><Input type="number" value={q.points} onChange={(e) => updateQuestion(idx, "points", Number(e.target.value))} min={1} /></div>
              </div>
              <div><Label>Question text</Label><Input value={q.question} onChange={(e) => updateQuestion(idx, "question", e.target.value)} placeholder="Enter the question" /></div>
              {q.type === "MCQ" && (
                <div className="space-y-2">
                  <Label>Options (4 options required)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[0,1,2,3].map(optIdx => (
                      <Input key={optIdx} value={q.options?.[optIdx] || ""} onChange={(e) => updateOption(idx, optIdx, e.target.value)} placeholder={`Option ${optIdx+1}`} />
                    ))}
                  </div>
                  <Label>Correct answer</Label>
                  <Input value={q.correctAnswer as string || ""} onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)} placeholder="Exactly one of the option texts" />
                </div>
              )}
              {q.type === "TRUE_FALSE" && (
                <div><Label>Correct answer</Label><Select value={q.correctAnswer === true ? "true" : q.correctAnswer === false ? "false" : ""} onValueChange={(v) => updateQuestion(idx, "correctAnswer", v === "true")}><SelectTrigger /><SelectContent><SelectItem value="true">True</SelectItem><SelectItem value="false">False</SelectItem></SelectContent></Select></div>
              )}
              {q.type === "DESCRIPTIVE" && (
                <div><Label>Sample answer / keywords (optional)</Label><Input value={q.sampleAnswer || ""} onChange={(e) => updateQuestion(idx, "sampleAnswer", e.target.value)} placeholder="Suggested answer for reference" /></div>
              )}
              <div><Label>Explanation (optional)</Label><Input value={q.explanation || ""} onChange={(e) => updateQuestion(idx, "explanation", e.target.value)} placeholder="Why this answer is correct" /></div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {}}>Cancel</Button>
          <Button type="submit" className="bg-brand">Create course</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}