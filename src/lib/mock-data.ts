export type Role = "admin" | "manager" | "staff";

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeId: string;
  joinedAt: string;
  avatarColor: string;
  monthlyTarget: number;
  achieved: number;
  attendanceRate: number;
  coursesCompleted: number;
  badges: string[];
};

export type Manager = {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeId: string;
  joinedAt: string;
  avatarColor: string;
};

export type Store = {
  id: string;
  name: string;
  city: string;
  address: string;
  managerId: string;
  monthlyTarget: number;
  achieved: number;
  lat: number;
  lng: number;
};

export const stores: Store[] = [
  { id: "s1", name: "HT Downtown", city: "Mumbai", address: "12 Marine Lines", managerId: "m1", monthlyTarget: 850000, achieved: 612000, lat: 19.0760, lng: 72.8777 },
  { id: "s2", name: "HT Riverside", city: "Pune", address: "5 MG Road", managerId: "m2", monthlyTarget: 620000, achieved: 498000, lat: 18.5204, lng: 73.8567 },
  { id: "s3", name: "HT Highland", city: "Bengaluru", address: "88 Indiranagar", managerId: "m3", monthlyTarget: 740000, achieved: 720000, lat: 12.9716, lng: 77.5946 },
  { id: "s4", name: "HT Crossing", city: "Delhi", address: "21 Connaught Pl", managerId: "m4", monthlyTarget: 910000, achieved: 305000, lat: 28.6139, lng: 77.2090 },
];

export const managers: Manager[] = [
  { id: "m1", name: "Aarav Mehta", email: "aarav@hometown.app", phone: "+91 98000 10001", storeId: "s1", joinedAt: "2024-03-12", avatarColor: "#c2410c" },
  { id: "m2", name: "Priya Nair", email: "priya@hometown.app", phone: "+91 98000 10002", storeId: "s2", joinedAt: "2023-11-04", avatarColor: "#92400e" },
  { id: "m3", name: "Rohan Shah", email: "rohan@hometown.app", phone: "+91 98000 10003", storeId: "s3", joinedAt: "2024-01-22", avatarColor: "#a16207" },
  { id: "m4", name: "Neha Kapoor", email: "neha@hometown.app", phone: "+91 98000 10004", storeId: "s4", joinedAt: "2024-06-09", avatarColor: "#7c2d12" },
];

const mk = (id: string, name: string, storeId: string, target: number, achieved: number, att: number, courses: number, badges: string[], color: string): Staff => ({
  id, name,
  email: name.toLowerCase().replace(/\s+/g, ".") + "@hometown.app",
  phone: "+91 98000 " + (20000 + parseInt(id.slice(1))).toString(),
  storeId, joinedAt: "2024-05-01", avatarColor: color,
  monthlyTarget: target, achieved, attendanceRate: att, coursesCompleted: courses, badges,
});

export const staff: Staff[] = [
  mk("st1", "Ishaan Verma", "s1", 80000, 64000, 96, 4, ["Onboarding", "Sales Pro"], "#ea580c"),
  mk("st2", "Sara Khan", "s1", 80000, 71000, 92, 5, ["Onboarding", "Sales Pro", "Customer Care"], "#b45309"),
  mk("st3", "Devansh Rao", "s1", 80000, 38000, 81, 2, ["Onboarding"], "#a16207"),
  mk("st4", "Anaya Singh", "s2", 70000, 59000, 94, 3, ["Onboarding", "Sales Pro"], "#c2410c"),
  mk("st5", "Karan Patel", "s2", 70000, 49000, 88, 2, ["Onboarding"], "#92400e"),
  mk("st6", "Meera Joshi", "s3", 75000, 73000, 98, 6, ["Onboarding", "Sales Pro", "Customer Care", "Leadership"], "#b45309"),
  mk("st7", "Vihaan Gupta", "s3", 75000, 60000, 90, 4, ["Onboarding", "Sales Pro"], "#ea580c"),
  mk("st8", "Tara Iyer", "s4", 85000, 22000, 76, 1, ["Onboarding"], "#a16207"),
  mk("st9", "Arjun Das", "s4", 85000, 41000, 84, 2, ["Onboarding"], "#7c2d12"),
];

export const getStore = (id: string) => stores.find(s => s.id === id);
export const getManager = (id: string) => managers.find(m => m.id === id);
export const getManagerByStore = (storeId: string) => managers.find(m => m.storeId === storeId);
export const getStaffByStore = (storeId: string) => staff.filter(s => s.storeId === storeId);
export const getStaff = (id: string) => staff.find(s => s.id === id);

export const incentive = (achieved: number) => achieved * 0.10;
export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const initials = (name: string) =>
  name.split(" ").map((p: string) => p[0]).join("").slice(0, 2);

export type CourseLesson = {
  id: string;
  title: string;
  type: "video" | "pdf" | "text";
  duration: string;
  preview?: string;
};

export type QuizQuestion = {
  id: string;
  q: string;
  options: string[];
  answerIndex: number;
};

export type Course = {
  id: string;
  title: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  cover: string;
  summary: string;
  description: string;
  outcomes: string[];
  instructor: string;
  assignedTo: string[]; // staff ids
  badge: string;
  certificate: boolean;
  lessons: CourseLesson[];
  quiz: QuizQuestion[];
  enrolled: number;
  completionRate: number;
};

export const courses: Course[] = [
  {
    id: "c1",
    title: "Sales Pro Foundations",
    category: "Sales",
    level: "Beginner",
    duration: "2h 15m",
    cover: "linear-gradient(135deg, var(--brand), var(--golden))",
    summary: "Master the floor: greet, qualify, recommend, and close with confidence.",
    description:
      "A practical sales playbook for retail staff. Learn to read customers, build rapport in seconds, present the right product, and convert browsers into buyers.",
    outcomes: [
      "Open every conversation with a high-converting greeting",
      "Qualify customer intent in under 60 seconds",
      "Recommend the right product using the FAB framework",
      "Close confidently and handle the top 5 objections",
    ],
    instructor: "Priya Nair",
    assignedTo: ["st1", "st2", "st4", "st6", "st7"],
    badge: "Sales Pro",
    certificate: true,
    lessons: [
      { id: "l1", title: "Welcome & the floor mindset", type: "video", duration: "8m" },
      { id: "l2", title: "Greeting & rapport in 30 seconds", type: "video", duration: "14m" },
      { id: "l3", title: "Qualifying customer intent", type: "pdf", duration: "12m" },
      { id: "l4", title: "Product knowledge — FAB framework", type: "text", duration: "18m" },
      { id: "l5", title: "Handling objections", type: "video", duration: "22m" },
      { id: "l6", title: "The confident close", type: "video", duration: "16m" },
      { id: "l7", title: "Practice scenarios", type: "pdf", duration: "25m" },
    ],
    quiz: [
      { id: "q1", q: "What is the first goal of a customer greeting?", options: ["Pitch the offer", "Build rapport", "Show inventory", "Ask for ID"], answerIndex: 1 },
      { id: "q2", q: "FAB stands for…", options: ["Fast, Affordable, Best", "Features, Advantages, Benefits", "Find, Ask, Buy", "Focus, Act, Believe"], answerIndex: 1 },
      { id: "q3", q: "When a customer says 'It's too expensive', the best first response is to…", options: ["Offer a discount", "Acknowledge & explore the concern", "Walk away", "Show a cheaper item"], answerIndex: 1 },
      { id: "q4", q: "A good qualifying question is…", options: ["Do you have money?", "What are you shopping for today?", "Why are you here?", "Can I help you?"], answerIndex: 1 },
    ],
    enrolled: 18,
    completionRate: 72,
  },
  {
    id: "c2",
    title: "Customer Care Excellence",
    category: "Service",
    level: "Intermediate",
    duration: "1h 45m",
    cover: "linear-gradient(135deg, var(--info), var(--brand))",
    summary: "Turn complaints into loyalty with calm, scripted, human service.",
    description:
      "Customer care is the difference between a one-time visit and a lifetime fan. This course covers active listening, de-escalation, recovery offers, and follow-up.",
    outcomes: [
      "Use the LAST framework (Listen, Apologize, Solve, Thank)",
      "De-escalate angry customers in under 2 minutes",
      "Issue recovery offers within policy",
      "Follow up to convert complaints into 5-star reviews",
    ],
    instructor: "Aarav Mehta",
    assignedTo: ["st2", "st6"],
    badge: "Customer Care",
    certificate: true,
    lessons: [
      { id: "l1", title: "Why care wins", type: "video", duration: "10m" },
      { id: "l2", title: "Active listening drills", type: "video", duration: "18m" },
      { id: "l3", title: "The LAST framework", type: "pdf", duration: "15m" },
      { id: "l4", title: "De-escalation language", type: "text", duration: "20m" },
      { id: "l5", title: "Recovery & follow-up", type: "video", duration: "22m" },
    ],
    quiz: [
      { id: "q1", q: "L in LAST stands for…", options: ["Lead", "Listen", "Leave", "Learn"], answerIndex: 1 },
      { id: "q2", q: "First step with an angry customer is…", options: ["Argue back", "Walk away", "Listen fully", "Call security"], answerIndex: 2 },
      { id: "q3", q: "Recovery offers should be…", options: ["Always free", "Within policy", "Negotiated loudly", "Refused"], answerIndex: 1 },
    ],
    enrolled: 9,
    completionRate: 55,
  },
  {
    id: "c3",
    title: "Onboarding @ HT",
    category: "Onboarding",
    level: "Beginner",
    duration: "55m",
    cover: "linear-gradient(135deg, var(--brown), var(--golden))",
    summary: "Everything new joiners need: brand, dress code, POS, and safety.",
    description:
      "A welcome track for everyone who joins HT. Learn the brand story, daily routines, POS basics, attendance app, and the safety code.",
    outcomes: [
      "Live the HT brand promise on the floor",
      "Run the opening and closing checklist",
      "Process a basic POS transaction",
      "Mark attendance from the field",
    ],
    instructor: "Neha Kapoor",
    assignedTo: ["st1", "st2", "st3", "st4", "st5", "st6", "st7", "st8", "st9"],
    badge: "Onboarding",
    certificate: true,
    lessons: [
      { id: "l1", title: "The HT story", type: "video", duration: "9m" },
      { id: "l2", title: "Dress code & grooming", type: "pdf", duration: "6m" },
      { id: "l3", title: "Open & close checklist", type: "pdf", duration: "10m" },
      { id: "l4", title: "POS basics", type: "video", duration: "18m" },
      { id: "l5", title: "Attendance app walkthrough", type: "video", duration: "12m" },
    ],
    quiz: [
      { id: "q1", q: "Attendance check-in works within how many meters of the store?", options: ["50m", "200m", "1km", "Anywhere"], answerIndex: 1 },
      { id: "q2", q: "Closing checklist starts with…", options: ["Counting cash", "Greeting last customer", "Locking the door", "Cleaning fitting rooms"], answerIndex: 0 },
    ],
    enrolled: 24,
    completionRate: 88,
  },
  {
    id: "c4",
    title: "Leadership for Store Managers",
    category: "Leadership",
    level: "Advanced",
    duration: "3h 10m",
    cover: "linear-gradient(135deg, var(--golden), var(--brand))",
    summary: "Coach a high-performing store team and run targets like a pro.",
    description:
      "For managers ready to lead. Daily huddles, target cascading, coaching conversations, performance reviews, and incentive design.",
    outcomes: [
      "Run a 7-minute daily huddle",
      "Cascade monthly targets into daily numbers",
      "Hold a coaching conversation using GROW",
      "Design an incentive that lifts achievement",
    ],
    instructor: "Rohan Shah",
    assignedTo: [],
    badge: "Leadership",
    certificate: true,
    lessons: [
      { id: "l1", title: "From doer to leader", type: "video", duration: "16m" },
      { id: "l2", title: "Daily huddles that work", type: "video", duration: "20m" },
      { id: "l3", title: "Target cascading", type: "pdf", duration: "25m" },
      { id: "l4", title: "GROW coaching model", type: "text", duration: "30m" },
      { id: "l5", title: "Designing incentives", type: "video", duration: "28m" },
      { id: "l6", title: "Performance reviews", type: "video", duration: "31m" },
    ],
    quiz: [
      { id: "q1", q: "GROW stands for…", options: ["Goal, Reality, Options, Will", "Grow, Rise, Own, Win", "Good, Right, OK, Wow", "Give, Receive, Own, Work"], answerIndex: 0 },
      { id: "q2", q: "Daily huddles should last…", options: ["1 hour", "30 minutes", "5-10 minutes", "Until everyone agrees"], answerIndex: 2 },
      { id: "q3", q: "Incentive at HT is what % of achieved target?", options: ["5%", "10%", "15%", "20%"], answerIndex: 1 },
    ],
    enrolled: 4,
    completionRate: 50,
  },
];

export const getCourse = (id: string) => courses.find((c) => c.id === id);
